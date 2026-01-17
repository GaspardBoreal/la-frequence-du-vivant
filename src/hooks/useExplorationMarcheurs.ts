import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Species information from biodiversity snapshots
export interface SpeciesInfo {
  scientificName: string;
  commonName: string | null;
  kingdom: string;
  photos: string[];
}

export interface ExplorationMarcheur {
  id: string;
  nom: string;
  prenom: string;
  fullName: string;
  role: 'principal' | 'invité' | 'scientifique' | 'marcheur';
  bioCoute?: string;
  avatarUrl?: string;
  couleur: string;
  isPrincipal: boolean;
  ordre: number;
  observationsCount: number;
  speciesObserved: string[]; // Liste des noms scientifiques observés (compatibilité)
  speciesDetails?: SpeciesInfo[]; // Détails complets avec noms communs et règnes
  isInheritedFromExploration?: boolean; // True si observations héritées des snapshots
}

// Extract species from biodiversity snapshot species_data JSONB
// Structure réelle: array of { scientificName, commonName, kingdom, photos, ... }
function extractSpeciesFromSnapshot(speciesData: unknown): SpeciesInfo[] {
  // Parse si c'est une string JSON (cas Supabase JSONB parfois sérialisé)
  let data = speciesData;
  if (typeof speciesData === 'string') {
    try {
      data = JSON.parse(speciesData);
    } catch (e) {
      console.error('[extractSpeciesFromSnapshot] Failed to parse JSON string:', e);
      return [];
    }
  }
  
  if (!data || !Array.isArray(data)) {
    console.log('[extractSpeciesFromSnapshot] Data is not an array:', typeof data, data);
    return [];
  }
  
  const seenNames = new Set<string>();
  const species: SpeciesInfo[] = [];
  
  for (const item of data) {
    if (item && typeof item === 'object') {
      const s = item as Record<string, unknown>;
      const scientificName = (s.scientificName || s.scientific_name || s.name) as string | undefined;
      
      if (scientificName && !seenNames.has(scientificName)) {
        seenNames.add(scientificName);
        species.push({
          scientificName,
          commonName: (s.commonName || s.common_name || null) as string | null,
          kingdom: (s.kingdom || 'Unknown') as string,
          photos: Array.isArray(s.photos) ? s.photos as string[] : [],
        });
      }
    }
  }
  
  return species;
}

export function useExplorationMarcheurs(explorationId?: string) {
  return useQuery({
    queryKey: ['exploration-marcheurs', explorationId],
    queryFn: async (): Promise<ExplorationMarcheur[]> => {
      if (!explorationId) return [];

      // Fetch marcheurs for this exploration
      const { data: marcheurs, error: marcheursError } = await supabase
        .from('exploration_marcheurs')
        .select('*')
        .eq('exploration_id', explorationId)
        .order('ordre', { ascending: true });

      if (marcheursError) {
        console.error('Error fetching marcheurs:', marcheursError);
        return [];
      }

      if (!marcheurs || marcheurs.length === 0) return [];

      // Check if there's a principal marcheur
      const principalMarcheur = marcheurs.find(m => m.is_principal);
      
      // For non-principal marcheurs, fetch from marcheur_observations
      const nonPrincipalIds = marcheurs.filter(m => !m.is_principal).map(m => m.id);
      let observationsByMarcheur = new Map<string, string[]>();
      
      if (nonPrincipalIds.length > 0) {
        const { data: observations, error: obsError } = await supabase
          .from('marcheur_observations')
          .select('marcheur_id, species_scientific_name')
          .in('marcheur_id', nonPrincipalIds);

        if (obsError) {
          console.error('Error fetching observations:', obsError);
        }

        (observations || []).forEach(obs => {
          const existing = observationsByMarcheur.get(obs.marcheur_id) || [];
          if (!existing.includes(obs.species_scientific_name)) {
            existing.push(obs.species_scientific_name);
          }
          observationsByMarcheur.set(obs.marcheur_id, existing);
        });
      }

      // For principal marcheur, get species from biodiversity_snapshots
      let principalSpeciesDetails: SpeciesInfo[] = [];
      
      if (principalMarcheur) {
        // Get marche_ids linked to this exploration
        const { data: explorationMarches, error: emError } = await supabase
          .from('exploration_marches')
          .select('marche_id')
          .eq('exploration_id', explorationId);

        if (emError) {
          console.error('Error fetching exploration marches:', emError);
        }

        if (explorationMarches && explorationMarches.length > 0) {
          const marcheIds = explorationMarches.map(em => em.marche_id);
          
          // Get biodiversity snapshots for these marches (latest per marche)
          const { data: snapshots, error: snapError } = await supabase
            .from('biodiversity_snapshots')
            .select('marche_id, species_data, snapshot_date')
            .in('marche_id', marcheIds)
            .order('snapshot_date', { ascending: false });

          if (snapError) {
            console.error('Error fetching biodiversity snapshots:', snapError);
          }

          if (snapshots && snapshots.length > 0) {
            console.log('[Marcheurs] Snapshots récupérés:', snapshots.length);
            console.log('[Marcheurs] Premier snapshot species_data type:', typeof snapshots[0]?.species_data);
            console.log('[Marcheurs] Premier snapshot species_data sample:', 
              Array.isArray(snapshots[0]?.species_data) 
                ? `Array de ${(snapshots[0]?.species_data as unknown[]).length} éléments`
                : snapshots[0]?.species_data
            );
            
            // Get only latest snapshot per marche
            const latestByMarche = new Map<string, typeof snapshots[0]>();
            for (const snapshot of snapshots) {
              if (!latestByMarche.has(snapshot.marche_id)) {
                latestByMarche.set(snapshot.marche_id, snapshot);
              }
            }

            console.log('[Marcheurs] Marches avec snapshot:', latestByMarche.size);

            // Extract unique species from all latest snapshots
            const seenNames = new Set<string>();
            for (const snapshot of latestByMarche.values()) {
              const species = extractSpeciesFromSnapshot(snapshot.species_data);
              console.log('[Marcheurs] Espèces extraites du snapshot', snapshot.marche_id, ':', species.length);
              for (const s of species) {
                if (!seenNames.has(s.scientificName)) {
                  seenNames.add(s.scientificName);
                  principalSpeciesDetails.push(s);
                }
              }
            }
            
            console.log('[Marcheurs] Total espèces uniques extraites:', principalSpeciesDetails.length);
          }
        }
      }

      // Map to our interface
      return marcheurs.map(m => {
        const isPrincipal = m.is_principal || false;
        const speciesDetails = isPrincipal ? principalSpeciesDetails : undefined;
        const speciesObserved = isPrincipal 
          ? principalSpeciesDetails.map(s => s.scientificName)
          : (observationsByMarcheur.get(m.id) || []);
        
        return {
          id: m.id,
          nom: m.nom,
          prenom: m.prenom,
          fullName: `${m.prenom} ${m.nom}`,
          role: (m.role || 'marcheur') as ExplorationMarcheur['role'],
          bioCoute: m.bio_courte || undefined,
          avatarUrl: m.avatar_url || undefined,
          couleur: m.couleur || '#10b981',
          isPrincipal,
          ordre: m.ordre || 1,
          observationsCount: speciesObserved.length,
          speciesObserved,
          speciesDetails,
          isInheritedFromExploration: isPrincipal && principalSpeciesDetails.length > 0,
        };
      });
    },
    enabled: !!explorationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
