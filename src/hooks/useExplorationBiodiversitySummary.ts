import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BiodiversitySummary {
  totalSpecies: number;
  totalMarches: number;
  speciesByMarche: Array<{
    marcheId: string;
    marcheName: string;
    speciesCount: number;
    order: number;
    latitude?: number;
    longitude?: number;
  }>;
  speciesByKingdom: {
    birds: number;
    plants: number;
    fungi: number;
    others: number;
  };
  topSpecies: Array<{
    name: string;
    scientificName: string;
    count: number;
    kingdom: string;
    photos?: string[];
  }>;
  allSpecies: Array<{
    name: string;
    scientificName: string;
    count: number;
    kingdom: string;
    photos?: string[];
  }>;
  gradientData: Array<{
    marcheId: string;
    marcheName: string;
    speciesCount: number;
    order: number;
  }>;
}

export const useExplorationBiodiversitySummary = (explorationId?: string) => {
  return useQuery({
    queryKey: ['exploration-biodiversity-summary', explorationId],
    queryFn: async (): Promise<BiodiversitySummary> => {
      if (!explorationId) {
        throw new Error('Exploration ID is required');
      }

      // Fetch exploration marches
      const { data: explorationMarches, error: marchesError } = await supabase
        .from('exploration_marches')
        .select(`
          marche_id,
          ordre,
          marche:marches(id, nom_marche, latitude, longitude)
        `)
        .eq('exploration_id', explorationId)
        .order('ordre', { ascending: true });

      if (marchesError) throw marchesError;

      const marcheIds = explorationMarches?.map(em => em.marche_id) || [];

      if (marcheIds.length === 0) {
        return {
          totalSpecies: 0,
          totalMarches: 0,
          speciesByMarche: [],
          speciesByKingdom: { birds: 0, plants: 0, fungi: 0, others: 0 },
          topSpecies: [],
          allSpecies: [],
          gradientData: [],
        };
      }

      // Fetch biodiversity snapshots for these marches
      // IMPORTANT: Only take the most recent snapshot per marche to avoid counting duplicates
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('biodiversity_snapshots')
        .select('*')
        .in('marche_id', marcheIds)
        .order('created_at', { ascending: false });

      if (snapshotsError) throw snapshotsError;

      // Keep only the most recent snapshot per marche
      const latestSnapshotsByMarche = new Map<string, typeof snapshots[0]>();
      snapshots?.forEach(snapshot => {
        if (!latestSnapshotsByMarche.has(snapshot.marche_id)) {
          latestSnapshotsByMarche.set(snapshot.marche_id, snapshot);
        }
      });

      // Calculate aggregated metrics using unique species across all marches
      let birds = 0;
      let plants = 0;
      let fungi = 0;
      let others = 0;
      const uniqueSpeciesMap = new Map<string, { count: number; scientificName: string; kingdom: string; photos: string[] }>();

      const speciesByMarche = explorationMarches?.map(em => {
        const marche = em.marche as any;
        const snapshot = latestSnapshotsByMarche.get(em.marche_id);
        const speciesCount = snapshot?.total_species || 0;
        
        if (snapshot) {
          birds += snapshot.birds_count || 0;
          plants += snapshot.plants_count || 0;
          fungi += snapshot.fungi_count || 0;
          others += snapshot.others_count || 0;

          // Process species data for top species - use unique species across exploration
          const speciesData = snapshot.species_data as any[];
          if (speciesData && Array.isArray(speciesData)) {
            speciesData.forEach((species: any) => {
              const name = species.commonName || species.scientificName;
              if (name) {
                const existing = uniqueSpeciesMap.get(name);
                if (existing) {
                  existing.count += 1;
                } else {
                  uniqueSpeciesMap.set(name, {
                    count: 1,
                    scientificName: species.scientificName || name,
                    kingdom: species.kingdom || 'Unknown',
                    photos: species.photos || [],
                  });
                }
              }
            });
          }
        }

        return {
          marcheId: em.marche_id,
          marcheName: marche?.nom_marche || 'Marche sans nom',
          speciesCount,
          order: em.ordre || 0,
          latitude: marche?.latitude,
          longitude: marche?.longitude,
        };
      }) || [];

      // Calculate total unique species (sum of per-marche counts, not unique species count)
      const totalSpecies = speciesByMarche.reduce((sum, m) => sum + m.speciesCount, 0);

      // Get all species sorted by count
      const allSpecies = Array.from(uniqueSpeciesMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, data]) => ({
          name,
          scientificName: data.scientificName,
          count: data.count,
          kingdom: data.kingdom,
          photos: data.photos,
        }));

      // Top 10 for podium
      const topSpecies = allSpecies.slice(0, 10);

      // Prepare gradient data (sorted by order for river visualization)
      const gradientData = speciesByMarche
        .sort((a, b) => a.order - b.order)
        .map(m => ({
          marcheId: m.marcheId,
          marcheName: m.marcheName,
          speciesCount: m.speciesCount,
          order: m.order,
        }));

      return {
        totalSpecies,
        totalMarches: marcheIds.length,
        speciesByMarche,
        speciesByKingdom: { birds, plants, fungi, others },
        topSpecies,
        allSpecies,
        gradientData,
      };
    },
    enabled: !!explorationId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
};
