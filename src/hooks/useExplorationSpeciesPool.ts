import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFrenchSpeciesNames } from './useFrenchSpeciesNames';


export interface ExplorationSpecies {
  /** Stable key used as curation entity_id (scientific name preferred, fallback common name) */
  key: string;
  scientificName: string | null;
  commonName: string | null;
  /** French translation if available in species_translations, else null */
  commonNameFr: string | null;
  /** Best display name: FR translation > original commonName > scientificName */
  displayName: string;
  group: string | null;
  family: string | null;
  count: number;
  imageUrl: string | null;
}

interface RawExplorationSpecies {
  key: string;
  scientificName: string | null;
  commonName: string | null;
  group: string | null;
  family: string | null;
  count: number;
  imageUrl: string | null;
}

const normName = (s: string | null | undefined): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const toMediumInat = (url: string): string =>
  url ? url.replace('/square.', '/medium.').replace('/square.jpg', '/medium.jpg') : url;

/**
 * Aggregates all species observed across the marche_events of an exploration,
 * deduplicated by scientific name (case-insensitive).
 *
 * Priorité photo vignette (cohérent avec useSpeciesMarcheurPhotos) :
 *  1. Upload direct marcheur (marcheur_observations.photo_url) — plus récent
 *  2. Photo iNat dont observerName matche un marcheur éditorial — plus récente
 *  3. 1re photo du snapshot (vraie observation dans le rayon de l'event)
 *  4. null → fallback iNat live côté composant
 */
export const useExplorationSpeciesPool = (explorationId: string | null | undefined) => {
  const rawQuery = useQuery({
    queryKey: ['exploration-species-pool-raw', explorationId, 'v3-field-photo-priority'],
    queryFn: async (): Promise<RawExplorationSpecies[]> => {
      if (!explorationId) return [];

      const { data: em, error: emErr } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', explorationId);
      if (emErr) throw emErr;
      const marcheIds = (em || []).map((x: any) => x.marche_id).filter(Boolean);
      if (marcheIds.length === 0) return [];

      const { data: snaps, error: snapsErr } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, snapshot_date, species_data')
        .in('marche_id', marcheIds);
      if (snapsErr) throw snapsErr;

      // Garder seulement le snapshot le plus récent par marche
      // (parité avec useSpeciesMarcheurPhotos).
      const latestByMarche = new Map<string, any>();
      (snaps || []).forEach((s: any) => {
        const ex = latestByMarche.get(s.marche_id);
        if (!ex || new Date(s.snapshot_date) > new Date(ex.snapshot_date)) {
          latestByMarche.set(s.marche_id, s);
        }
      });

      // Marcheurs éditoriaux de l'exploration → noms normalisés (NFD)
      const { data: crew } = await supabase
        .from('exploration_marcheurs')
        .select('prenom, nom')
        .eq('exploration_id', explorationId);
      const crewNameSet = new Set<string>();
      (crew || []).forEach((c: any) => {
        const full = normName(`${c.prenom || ''} ${c.nom || ''}`);
        if (full) crewNameSet.add(full);
      });

      // Index : photos sourcées du snapshot
      const viaMarcheurInat = new Map<string, { url: string; date: string }>();
      const fromSnapshot = new Map<string, string>();

      const map = new Map<string, RawExplorationSpecies>();

      Array.from(latestByMarche.values()).forEach((s: any) => {
        const arr: any[] = Array.isArray(s.species_data) ? s.species_data : [];
        arr.forEach(sp => {
          const sci = (sp.scientificName || sp.scientific_name || '').toString().trim();
          const com = (sp.commonName || sp.common_name || sp.vernacularName || '').toString().trim();
          const key = (sci || com).toLowerCase();
          if (!key) return;

          // family iNat = parfois un nom alphabétique propre, parfois un ID
          // numérique de taxon (ex. "58321" = Sapindaceae). On ne garde que les
          // noms exploitables — le classifier filtre déjà les IDs numériques
          // mais autant économiser le coup.
          const rawFamily = (sp.family || sp.familyName || '').toString().trim();
          const family = rawFamily && !/^\d+$/.test(rawFamily) ? rawFamily : null;

          const existing = map.get(key);
          if (existing) {
            existing.count += 1;
            if (!existing.family && family) existing.family = family;
          } else {
            map.set(key, {
              key: sci || com,
              scientificName: sci || null,
              commonName: com || null,
              group: sp.group || sp.kingdom || sp.taxonGroup || null,
              family,
              count: 1,
              imageUrl: null, // résolu en fin de pipeline
            });
          }

          // Collecte photos snapshot + attributions
          const photos: string[] = Array.isArray(sp.photos) ? sp.photos : [];
          const attrs: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];

          // 1re photo snapshot (toujours dans le rayon)
          if (photos[0] && !fromSnapshot.has(key)) {
            fromSnapshot.set(key, toMediumInat(photos[0]));
          }

          // Match observerName ↔ marcheur éditorial
          photos.forEach((rawUrl, i) => {
            if (!rawUrl) return;
            const attr = attrs[i];
            const observer = normName(attr?.observerName);
            if (observer && crewNameSet.has(observer)) {
              const d = attr?.date || s.snapshot_date || '';
              const ex = viaMarcheurInat.get(key);
              if (!ex || d > ex.date) {
                viaMarcheurInat.set(key, { url: toMediumInat(rawUrl), date: d });
              }
            }
          });

          // Fallback : imageUrl explicite dans species_data si pas de photos[]
          if (!photos[0] && !fromSnapshot.has(key) && (sp.imageUrl || sp.image_url)) {
            fromSnapshot.set(key, sp.imageUrl || sp.image_url);
          }
        });
      });

      // ── Marcheur observations (upload direct) ───────────────────────────
      const { data: marcheurObs } = await supabase
        .from('marcheur_observations')
        .select('species_scientific_name, photo_url, observation_date')
        .in('marche_id', marcheIds);

      const directMarcheur = new Map<string, { url: string; date: string }>();

      (marcheurObs || []).forEach((obs: any) => {
        const sci = (obs.species_scientific_name || '').toString().trim();
        if (!sci) return;
        const key = sci.toLowerCase();

        let found: RawExplorationSpecies | undefined;
        for (const entry of map.values()) {
          if ((entry.scientificName || '').toLowerCase() === key) {
            found = entry;
            break;
          }
        }
        if (found) {
          found.count += 1;
        } else {
          map.set(key, {
            key: sci,
            scientificName: sci,
            commonName: null,
            group: null,
            family: null,
            count: 1,
            imageUrl: null,
          });
        }

        if (obs.photo_url) {
          const d = obs.observation_date || '';
          const ex = directMarcheur.get(key);
          if (!ex || d > ex.date) {
            directMarcheur.set(key, { url: obs.photo_url, date: d });
          }
        }
      });

      // ── Résolution finale de imageUrl selon les 4 priorités ────────────
      for (const entry of map.values()) {
        const k = (entry.scientificName || '').toLowerCase();
        const p1 = directMarcheur.get(k);
        if (p1) { entry.imageUrl = p1.url; continue; }
        const p2 = viaMarcheurInat.get(k);
        if (p2) { entry.imageUrl = p2.url; continue; }
        const p3 = fromSnapshot.get(k);
        if (p3) { entry.imageUrl = p3; continue; }
        entry.imageUrl = null;
      }

      return Array.from(map.values()).sort((a, b) => b.count - a.count);
    },
    enabled: !!explorationId,
    staleTime: 5 * 60 * 1000,
  });

  const raw = rawQuery.data || [];

  // Enrich with French names — single batched DB lookup, cached 24h
  const { data: frMap } = useFrenchSpeciesNames(
    raw.map(s => ({ scientificName: s.scientificName, commonName: s.commonName }))
  );

  const enriched: ExplorationSpecies[] = raw.map(s => {
    const fr = s.scientificName ? frMap?.get(s.scientificName) : undefined;
    const displayName = fr?.displayName || s.commonName || s.scientificName || '';
    return {
      ...s,
      commonNameFr: fr?.commonNameFr ?? null,
      displayName,
    };
  });

  return {
    ...rawQuery,
    data: enriched,
  };
};
