import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpeciesMarcheData {
  marcheId: string;
  marcheName: string;
  ville: string;
  order: number;
  observationCount: number;
  latitude?: number;
  longitude?: number;
  observationDate?: string;
}

/**
 * Hook to fetch all marches where a species was observed
 * Searches both biodiversity_snapshots and marcheur_observations
 */
export const useSpeciesMarches = (
  scientificName: string | undefined,
  explorationId: string | undefined
) => {
  return useQuery({
    queryKey: ['species-marches', scientificName, explorationId],
    queryFn: async (): Promise<SpeciesMarcheData[]> => {
      if (!scientificName || !explorationId) return [];

      const marcheMap = new Map<string, SpeciesMarcheData>();

      // 1. Get exploration marches to have the order and march details
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

      if (!explorationMarches || explorationMarches.length === 0) {
        return [];
      }

      // Build marche info map
      const marcheInfoMap = new Map<string, { 
        name: string; 
        ville: string;
        order: number; 
        lat?: number; 
        lng?: number;
      }>();
      
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

      // 2. Search in biodiversity_snapshots for this species
      // ONLY use the latest snapshot per marche to avoid counting duplicates
      const { data: snapshots } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, species_data, snapshot_date')
        .in('marche_id', marcheIds);

      if (snapshots) {
        // Filter to keep only the latest snapshot per marche
        const latestSnapshotsByMarche = new Map<string, typeof snapshots[0]>();
        snapshots.forEach((snapshot) => {
          const existing = latestSnapshotsByMarche.get(snapshot.marche_id);
          if (!existing || new Date(snapshot.snapshot_date) > new Date(existing.snapshot_date)) {
            latestSnapshotsByMarche.set(snapshot.marche_id, snapshot);
          }
        });

        // Now process only the latest snapshots
        Array.from(latestSnapshotsByMarche.values()).forEach((snapshot: any) => {
          const speciesData = snapshot.species_data as any[];
          if (!speciesData) return;

          // Count how many times this species appears
          const matchingSpecies = speciesData.filter(
            (sp: any) => sp.scientificName?.toLowerCase() === scientificName.toLowerCase()
          );

          if (matchingSpecies.length > 0) {
            const info = marcheInfoMap.get(snapshot.marche_id);
            if (info) {
              marcheMap.set(snapshot.marche_id, {
                marcheId: snapshot.marche_id,
                marcheName: info.name,
                ville: info.ville,
                order: info.order,
                observationCount: matchingSpecies.length,
                latitude: info.lat,
                longitude: info.lng,
                observationDate: snapshot.snapshot_date,
              });
            }
          }
        });
      }

      // 3. Search in marcheur_observations for this species
      const { data: marcheurObs } = await supabase
        .from('marcheur_observations')
        .select('marche_id, observation_date')
        .in('marche_id', marcheIds)
        .ilike('species_scientific_name', scientificName);

      if (marcheurObs) {
        marcheurObs.forEach((obs: any) => {
          const info = marcheInfoMap.get(obs.marche_id);
          if (info) {
            const existing = marcheMap.get(obs.marche_id);
            if (existing) {
              existing.observationCount += 1;
            } else {
              marcheMap.set(obs.marche_id, {
                marcheId: obs.marche_id,
                marcheName: info.name,
                ville: info.ville,
                order: info.order,
                observationCount: 1,
                latitude: info.lat,
                longitude: info.lng,
                observationDate: obs.observation_date,
              });
            }
          }
        });
      }

      // Sort by order and return
      return Array.from(marcheMap.values()).sort((a, b) => a.order - b.order);
    },
    enabled: !!scientificName && !!explorationId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
};
