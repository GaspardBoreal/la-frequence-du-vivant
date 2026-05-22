import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MarcheurSpeciesPhoto } from './useSpeciesMarcheurPhotos';

const normalizeKey = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export interface ExplorationFieldPhotosResult {
  byScientificName: Map<string, MarcheurSpeciesPhoto[]>;
  hasAny: boolean;
  total: number;
}

/**
 * Batch loader : charge en UNE passe toutes les photos terrain (marcheurs +
 * citoyennes) d'une exploration, indexées par nom scientifique normalisé.
 *
 * Sert à alimenter le toggle global Photos marcheurs ↔ iNaturalist sans
 * provoquer N+1 requêtes sur la grille espèces.
 */
export function useExplorationFieldPhotos(explorationId: string | undefined) {
  return useQuery({
    queryKey: ['exploration-field-photos', explorationId],
    enabled: !!explorationId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    queryFn: async (): Promise<ExplorationFieldPhotosResult> => {
      if (!explorationId) {
        return { byScientificName: new Map(), hasAny: false, total: 0 };
      }

      // 1. marches de l'exploration
      const { data: em } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches (id, nom_marche, ville)')
        .eq('exploration_id', explorationId);
      const marcheIds = (em || []).map((x: any) => x.marche_id).filter(Boolean);
      if (marcheIds.length === 0) {
        return { byScientificName: new Map(), hasAny: false, total: 0 };
      }

      const marcheInfo = new Map<string, { name: string; ville: string }>();
      (em || []).forEach((row: any) => {
        if (row.marches) {
          marcheInfo.set(row.marche_id, {
            name: row.marches.nom_marche || row.marches.ville || '',
            ville: row.marches.ville || '',
          });
        }
      });

      // 2. marcheurs éditoriaux
      const { data: crew } = await supabase
        .from('exploration_marcheurs')
        .select('id, prenom, nom')
        .eq('exploration_id', explorationId);
      const nameByCrewId = new Map<string, string>();
      (crew || []).forEach((c: any) => {
        const full = `${c.prenom || ''} ${c.nom || ''}`.trim();
        nameByCrewId.set(c.id, full || 'Marcheur');
      });
      const crewIds = (crew || []).map((c: any) => c.id);

      const byName = new Map<string, MarcheurSpeciesPhoto[]>();
      const push = (sciName: string, photo: MarcheurSpeciesPhoto) => {
        const k = normalizeKey(sciName);
        if (!k) return;
        const arr = byName.get(k);
        if (arr) arr.push(photo);
        else byName.set(k, [photo]);
      };

      // 3a. observations marcheurs éditoriaux (toutes espèces)
      if (crewIds.length > 0) {
        const { data: obs } = await supabase
          .from('marcheur_observations')
          .select(
            'id, marcheur_id, marche_id, photo_url, observation_date, species_scientific_name',
          )
          .in('marcheur_id', crewIds)
          .in('marche_id', marcheIds)
          .not('photo_url', 'is', null)
          .not('species_scientific_name', 'is', null);

        (obs || []).forEach((o: any) => {
          if (!o.photo_url || !o.species_scientific_name) return;
          const info = marcheInfo.get(o.marche_id);
          push(o.species_scientific_name, {
            id: `marcheur-${o.id}`,
            url: o.photo_url,
            source: 'marcheur',
            observerName: nameByCrewId.get(o.marcheur_id) || 'Marcheur',
            observationDate: o.observation_date || undefined,
            marcheId: o.marche_id,
            marcheName: info?.name,
            ville: info?.ville,
            marcheurId: o.marcheur_id,
          });
        });
      }

      // 3b. observations citoyennes iNat extraites des snapshots les + récents
      const { data: snapshots } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, species_data, snapshot_date')
        .in('marche_id', marcheIds);

      const latestByMarche = new Map<string, any>();
      (snapshots || []).forEach((s: any) => {
        const ex = latestByMarche.get(s.marche_id);
        if (!ex || new Date(s.snapshot_date) > new Date(ex.snapshot_date)) {
          latestByMarche.set(s.marche_id, s);
        }
      });

      const seenCitizenUrls = new Set<string>();
      Array.from(latestByMarche.values()).forEach((snap: any) => {
        const list = snap.species_data as any[] | null;
        if (!Array.isArray(list)) return;
        const info = marcheInfo.get(snap.marche_id);
        list.forEach((sp: any) => {
          const sci = sp?.scientificName;
          if (!sci) return;
          const photos: string[] = Array.isArray(sp.photos) ? sp.photos : [];
          const attrs: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
          photos.forEach((rawUrl, i) => {
            if (!rawUrl) return;
            const url = rawUrl
              .replace('/square.', '/medium.')
              .replace('/square.jpg', '/medium.jpg');
            if (seenCitizenUrls.has(url)) return;
            seenCitizenUrls.add(url);
            const attr = attrs[i] || attrs[0];
            push(sci, {
              id: `citizen-${snap.marche_id}-${i}-${url.slice(-30)}`,
              url,
              source: 'citizen',
              observerName: attr?.observerName || 'Observateur citoyen',
              observationDate: attr?.date || snap.snapshot_date,
              marcheId: snap.marche_id,
              marcheName: info?.name,
              ville: info?.ville,
              originalUrl: attr?.originalUrl,
              locationName: attr?.locationName,
            });
          });
        });
      });

      // Tri interne : marcheur prioritaire, puis date desc
      let total = 0;
      byName.forEach((arr) => {
        arr.sort((a, b) => {
          if (a.source === 'marcheur' && b.source !== 'marcheur') return -1;
          if (b.source === 'marcheur' && a.source !== 'marcheur') return 1;
          const da = a.observationDate ? new Date(a.observationDate).getTime() : 0;
          const db = b.observationDate ? new Date(b.observationDate).getTime() : 0;
          return db - da;
        });
        total += arr.length;
      });

      return { byScientificName: byName, hasAny: byName.size > 0, total };
    },
  });
}

export { normalizeKey as normalizeSpeciesKey };
