import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SpeciesObservationPointSource = 'marcheur' | 'citizen';

export interface SpeciesObservationPoint {
  latitude: number;
  longitude: number;
  inaturalistId?: number | null;
  observationDate?: string | null;
  source: SpeciesObservationPointSource;
  observerName?: string;
  originalUrl?: string;
}

export interface SpeciesMarcheData {
  marcheId: string;
  marcheName: string;
  ville: string;
  order: number;
  observationCount: number;
  latitude?: number;
  longitude?: number;
  observationDate?: string;
  /**
   * Points GPS exacts des observations de cette espèce sur cette marche.
   * Source 'marcheur' = matérialisé dans `marcheur_observations` (badge vert).
   * Source 'citizen' = attribution iNat brute (badge cyan) en attendant le backfill.
   */
  observationPoints?: SpeciesObservationPoint[];
}

/**
 * Marches d'une exploration où une espèce a été observée. Source unifiée :
 *  - TOUS les snapshots `biodiversity_snapshots` (pas le « latest only » : iNat
 *    livre des snapshots delta, certaines espèces ne réapparaissent que dans
 *    des snapshots intermédiaires)
 *  - `marcheur_observations` (terrain marcheurs éditoriaux)
 *
 * Déduplication stricte : (marche_id × inaturalist_observation_id) ou
 * (marche_id × photo_url) côté snapshot ; ligne unique côté marcheur_observations.
 */
export const useSpeciesMarches = (
  scientificName: string | undefined,
  explorationId: string | undefined,
) => {
  return useQuery({
    queryKey: ['species-marches', scientificName, explorationId],
    queryFn: async (): Promise<SpeciesMarcheData[]> => {
      if (!scientificName || !explorationId) return [];

      const target = scientificName.toLowerCase().trim();

      // 1. Marches publiées de l'exploration
      const { data: explorationMarches } = await supabase
        .from('exploration_marches')
        .select(`
          ordre,
          marche_id,
          marches (
            id,
            nom_marche,
            ville,
            latitude,
            longitude
          )
        `)
        .eq('exploration_id', explorationId)
        .in('publication_status', ['published', 'published_public']);

      if (!explorationMarches || explorationMarches.length === 0) return [];

      const marcheInfoMap = new Map<
        string,
        { name: string; ville: string; order: number; lat?: number; lng?: number }
      >();
      explorationMarches.forEach((em: any) => {
        if (em.marches) {
          marcheInfoMap.set(em.marche_id, {
            name: em.marches.nom_marche || em.marches.ville,
            ville: em.marches.ville || '',
            order: em.ordre ?? 0,
            lat: em.marches.latitude,
            lng: em.marches.longitude,
          });
        }
      });

      const marcheIds = explorationMarches.map((em: any) => em.marche_id);

      // 2. TOUS les snapshots, agrégés par marche avec dédup (inatId | photo URL)
      const { data: snapshots } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, species_data, snapshot_date')
        .in('marche_id', marcheIds);

      type Bucket = {
        marcheId: string;
        observationKeys: Set<string>; // dédup (inatId ou photo URL ou observerName+date)
        points: SpeciesObservationPoint[];
        latestDate?: string;
      };
      const bucketByMarche = new Map<string, Bucket>();
      const getBucket = (marcheId: string): Bucket => {
        let b = bucketByMarche.get(marcheId);
        if (!b) {
          b = { marcheId, observationKeys: new Set(), points: [] };
          bucketByMarche.set(marcheId, b);
        }
        return b;
      };

      (snapshots || []).forEach((snap: any) => {
        const arr: any[] = Array.isArray(snap.species_data) ? snap.species_data : [];
        const matches = arr.filter(
          (sp: any) => (sp?.scientificName || '').toString().toLowerCase().trim() === target,
        );
        if (matches.length === 0) return;
        const b = getBucket(snap.marche_id);
        if (!b.latestDate || new Date(snap.snapshot_date) > new Date(b.latestDate)) {
          b.latestDate = snap.snapshot_date;
        }
        matches.forEach((sp: any) => {
          const attribs: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
          const photos: any[] = Array.isArray(sp.photos) ? sp.photos : [];
          if (attribs.length === 0) {
            // Cas snapshot sans attributions (rare) : compter 1
            const key = `${snap.marche_id}|fallback|${snap.snapshot_date}`;
            if (!b.observationKeys.has(key)) {
              b.observationKeys.add(key);
            }
            return;
          }
          attribs.forEach((attr: any, i: number) => {
            const url = (attr?.originalUrl || '').toString();
            const idMatch = url.match(/observations\/(\d+)/);
            const inatId = idMatch ? idMatch[1] : null;
            const photo = photos[i] || photos[0] || null;
            const key =
              inatId ||
              (photo ? `photo:${photo}` : `obs:${attr?.observerName || ''}|${attr?.date || ''}`);
            if (b.observationKeys.has(key)) return;
            b.observationKeys.add(key);
            const lat = typeof attr?.exactLatitude === 'number' ? attr.exactLatitude : null;
            const lng = typeof attr?.exactLongitude === 'number' ? attr.exactLongitude : null;
            if (lat != null && lng != null) {
              b.points.push({
                latitude: lat,
                longitude: lng,
                inaturalistId: inatId ? parseInt(inatId, 10) : null,
                observationDate: attr?.date || snap.snapshot_date || null,
                source: 'citizen',
                observerName: attr?.observerName || undefined,
                originalUrl: url || undefined,
              });
            }
          });
        });
      });

      // 3. marcheur_observations (terrain) — dédup par inat_id si présent
      const { data: marcheurObs } = await supabase
        .from('marcheur_observations')
        .select('marche_id, observation_date, latitude, longitude, inaturalist_observation_id')
        .in('marche_id', marcheIds)
        .ilike('species_scientific_name', scientificName);

      (marcheurObs || []).forEach((obs: any) => {
        const b = getBucket(obs.marche_id);
        const key = obs.inaturalist_observation_id
          ? String(obs.inaturalist_observation_id)
          : `mobs:${obs.marche_id}:${obs.observation_date || ''}:${obs.latitude || ''}:${obs.longitude || ''}`;
        // Si déjà présent côté snapshot (même inat_id), on UPGRADE le point en source 'marcheur'
        if (obs.inaturalist_observation_id) {
          const existingPoint = b.points.find(
            (p) => p.inaturalistId === obs.inaturalist_observation_id,
          );
          if (existingPoint) existingPoint.source = 'marcheur';
        }
        if (b.observationKeys.has(key)) return;
        b.observationKeys.add(key);
        if (typeof obs.latitude === 'number' && typeof obs.longitude === 'number') {
          b.points.push({
            latitude: obs.latitude,
            longitude: obs.longitude,
            inaturalistId: obs.inaturalist_observation_id ?? null,
            observationDate: obs.observation_date ?? null,
            source: 'marcheur',
          });
        }
        if (
          obs.observation_date &&
          (!b.latestDate || new Date(obs.observation_date) > new Date(b.latestDate))
        ) {
          b.latestDate = obs.observation_date;
        }
      });

      // 4. Construire le résultat trié par ordre
      const result: SpeciesMarcheData[] = [];
      bucketByMarche.forEach((b) => {
        const info = marcheInfoMap.get(b.marcheId);
        if (!info) return;
        result.push({
          marcheId: b.marcheId,
          marcheName: info.name,
          ville: info.ville,
          order: info.order,
          observationCount: b.observationKeys.size,
          latitude: info.lat,
          longitude: info.lng,
          observationDate: b.latestDate,
          observationPoints: b.points.length > 0 ? b.points : undefined,
        });
      });
      return result.sort((a, b) => a.order - b.order);
    },
    enabled: !!scientificName && !!explorationId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};
