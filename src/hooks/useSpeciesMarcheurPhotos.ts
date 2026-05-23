import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FieldPhotoSource = 'marcheur' | 'citizen';

export interface MarcheurSpeciesPhoto {
  id: string;
  url: string;
  source: FieldPhotoSource;
  observerName: string;
  observationDate?: string;
  marcheId?: string;
  marcheName?: string;
  ville?: string;
  marcheurId?: string;
  originalUrl?: string;
  locationName?: string;
}

/**
 * Récupère les photos "terrain" d'une espèce dans le périmètre d'une exploration.
 *
 * Sources fusionnées :
 *  1. `marcheur_observations` — photos liées aux marcheurs éditoriaux (badge vert "Marcheur")
 *  2. `biodiversity_snapshots.species_data[].photos[]` croisé avec `attributions[]`
 *      → toutes les observations citoyennes iNat dans le périmètre (badge cyan "Observation citoyenne")
 *
 * Tri : date desc.
 */
export function useSpeciesMarcheurPhotos(
  scientificName: string | undefined,
  explorationId: string | undefined,
) {
  return useQuery({
    queryKey: ['species-field-photos', scientificName, explorationId],
    queryFn: async (): Promise<MarcheurSpeciesPhoto[]> => {
      if (!scientificName || !explorationId) return [];

      // 1. marches de l'exploration
      const { data: em } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches (id, nom_marche, ville)')
        .eq('exploration_id', explorationId);
      const marcheIds = (em || []).map((x: any) => x.marche_id).filter(Boolean);
      if (marcheIds.length === 0) return [];

      const marcheInfo = new Map<string, { name: string; ville: string }>();
      (em || []).forEach((row: any) => {
        if (row.marches) {
          marcheInfo.set(row.marche_id, {
            name: row.marches.nom_marche || row.marches.ville || '',
            ville: row.marches.ville || '',
          });
        }
      });

      // 2. marcheurs éditoriaux (pour le nom)
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

      const out: MarcheurSpeciesPhoto[] = [];

      // 3a. observations marcheurs éditoriaux
      if (crewIds.length > 0) {
        const { data: obs } = await supabase
          .from('marcheur_observations')
          .select('id, marcheur_id, marche_id, photo_url, observation_date')
          .in('marcheur_id', crewIds)
          .in('marche_id', marcheIds)
          .ilike('species_scientific_name', scientificName)
          .not('photo_url', 'is', null);

        (obs || []).forEach((o: any) => {
          if (!o.photo_url) return;
          const info = marcheInfo.get(o.marche_id);
          out.push({
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

      // 3b. observations citoyennes iNat extraites de TOUS les snapshots
      // (iNat livre des snapshots delta : ne pas filtrer "latest only" sinon
      // certaines espèces disparaissent — bug identique au compteur unifié)
      const { data: snapshots } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, species_data, snapshot_date')
        .in('marche_id', marcheIds);

      const lowerSci = scientificName.toLowerCase();
      const seenCitizenUrls = new Set<string>();

      (snapshots || []).forEach((snap: any) => {
        const list = snap.species_data as any[] | null;
        if (!Array.isArray(list)) return;
        const matches = list.filter((sp) => sp?.scientificName?.toLowerCase() === lowerSci);
        if (matches.length === 0) return;
        const info = marcheInfo.get(snap.marche_id);
        matches.forEach((sp: any) => {
          const photos: string[] = Array.isArray(sp.photos) ? sp.photos : [];
          const attrs: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
          // Apparier photo[i] ↔ attribution[i] quand possible
          photos.forEach((rawUrl, i) => {
            if (!rawUrl) return;
            const url = rawUrl.replace('/square.', '/medium.').replace('/square.jpg', '/medium.jpg');
            if (seenCitizenUrls.has(url)) return;
            seenCitizenUrls.add(url);
            const attr = attrs[i] || attrs[0];
            out.push({
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

      // Tri date desc, marcheur prioritaire à date égale
      out.sort((a, b) => {
        const da = a.observationDate ? new Date(a.observationDate).getTime() : 0;
        const db = b.observationDate ? new Date(b.observationDate).getTime() : 0;
        if (db !== da) return db - da;
        if (a.source === 'marcheur' && b.source !== 'marcheur') return -1;
        if (b.source === 'marcheur' && a.source !== 'marcheur') return 1;
        return 0;
      });

      return out;
    },
    enabled: !!scientificName && !!explorationId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
}
