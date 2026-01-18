import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BiodiversitySummary {
  totalSpecies: number;
  totalMarches: number;
  speciesByMarche: Array<{
    marcheId: string;
    marcheName: string;
    ville: string;
    departement: string;
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
          marche:marches(id, nom_marche, ville, departement, latitude, longitude)
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

          // Process species data for top species - count ACTUAL occurrences per species
          const speciesData = snapshot.species_data as any[];
          if (speciesData && Array.isArray(speciesData)) {
            // First, count occurrences per species in this snapshot
            const speciesCountInSnapshot = new Map<string, { count: number; species: any }>();
            
            speciesData.forEach((species: any) => {
              const sciName = species.scientificName?.toLowerCase();
              if (sciName) {
                const existing = speciesCountInSnapshot.get(sciName);
                if (existing) {
                  existing.count += 1;
                } else {
                  speciesCountInSnapshot.set(sciName, { count: 1, species });
                }
              }
            });
            
            // Then update uniqueSpeciesMap with actual occurrence counts
            speciesCountInSnapshot.forEach(({ count: occurrenceCount, species }) => {
              const name = species.commonName || species.scientificName;
              if (name) {
                const existing = uniqueSpeciesMap.get(name);
                if (existing) {
                  existing.count += occurrenceCount; // ✅ Add actual number of occurrences
                } else {
                  uniqueSpeciesMap.set(name, {
                    count: occurrenceCount,
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
          ville: marche?.ville || '',
          departement: marche?.departement || '',
          speciesCount,
          order: em.ordre || 0,
          latitude: marche?.latitude,
          longitude: marche?.longitude,
      };
      }) || [];

      // Fetch marcheur observations to enrich allSpecies with validated observations
      // This ensures species observed by marcheurs appear in the gallery even if not in snapshots
      // Include photo_url to display marcheur photos in the gallery
      const { data: marcheurObservations } = await supabase
        .from('marcheur_observations')
        .select('species_scientific_name, photo_url')
        .in('marche_id', marcheIds);

      // Add marcheur observations to species counts
      // Each marcheur observation increments the count (they are validated sightings)
      // Priority: marcheur photo > snapshot photo
      (marcheurObservations || []).forEach(obs => {
        const scientificName = obs.species_scientific_name;
        const marcheurPhotoUrl = obs.photo_url;
        
        // Search for existing entry by scientificName (case-insensitive) in snapshot species
        let foundEntry: { count: number; scientificName: string; kingdom: string; photos: string[] } | undefined;
        let foundKey: string | undefined;
        
        for (const [key, value] of uniqueSpeciesMap.entries()) {
          if (value.scientificName.toLowerCase() === scientificName.toLowerCase()) {
            foundEntry = value;
            foundKey = key;
            break;
          }
        }
        
        if (foundEntry && foundKey) {
          // ✅ FIX: Increment count for each marcheur observation
          foundEntry.count += 1;
          
          // If marcheur has a photo, prepend it to the photos array (priority)
          if (marcheurPhotoUrl && !foundEntry.photos.includes(marcheurPhotoUrl)) {
            foundEntry.photos = [marcheurPhotoUrl, ...foundEntry.photos];
          }
        } else {
          // Species not found in snapshot species - check if already added by previous marcheur observation
          const existingMarcheurEntry = uniqueSpeciesMap.get(scientificName);
          
          if (existingMarcheurEntry) {
            // ✅ FIX: Increment count for duplicate marcheur observations of same species
            existingMarcheurEntry.count += 1;
            if (marcheurPhotoUrl && !existingMarcheurEntry.photos.includes(marcheurPhotoUrl)) {
              existingMarcheurEntry.photos = [marcheurPhotoUrl, ...existingMarcheurEntry.photos];
            }
          } else {
            // New species observed by marcheur - try to find metadata in snapshots
            let kingdom = 'Unknown';
            let photos: string[] = marcheurPhotoUrl ? [marcheurPhotoUrl] : [];
            
            // Search through all snapshots to find this species data
            const snapshotsToSearch = Array.from(latestSnapshotsByMarche.values());
            for (const snapshot of snapshotsToSearch) {
              if (!snapshot.species_data) continue;
              
              let speciesArray: any[] = [];
              try {
                if (Array.isArray(snapshot.species_data)) {
                  speciesArray = snapshot.species_data;
                } else if (typeof snapshot.species_data === 'string') {
                  speciesArray = JSON.parse(snapshot.species_data);
                }
              } catch {
                continue;
              }
              
              const found = speciesArray.find((sp: any) => 
                sp?.scientificName?.toLowerCase() === scientificName.toLowerCase()
              );
              
              if (found) {
                kingdom = found.kingdom || 'Unknown';
                if (found.photos && Array.isArray(found.photos)) {
                  photos = marcheurPhotoUrl 
                    ? [marcheurPhotoUrl, ...found.photos]
                    : found.photos;
                }
                break;
              }
            }
            
            uniqueSpeciesMap.set(scientificName, {
              count: 1,
              scientificName: scientificName,
              kingdom: kingdom,
              photos: photos,
            });
          }
        }
      });

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
