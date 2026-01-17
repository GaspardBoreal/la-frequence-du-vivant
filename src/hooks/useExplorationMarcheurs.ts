import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  speciesObserved: string[]; // Liste des noms scientifiques observés
  isInheritedFromExploration?: boolean; // True si observations héritées des snapshots
}

// Extract unique species from biodiversity snapshot species_data JSONB
function extractSpeciesFromSnapshot(speciesData: unknown): string[] {
  if (!speciesData || typeof speciesData !== 'object') return [];
  
  const species: string[] = [];
  const data = speciesData as Record<string, unknown>;
  
  // species_data structure: { kingdom: { species_name: count, ... }, ... }
  for (const kingdom of Object.values(data)) {
    if (kingdom && typeof kingdom === 'object') {
      const kingdomData = kingdom as Record<string, unknown>;
      for (const speciesName of Object.keys(kingdomData)) {
        if (speciesName && !species.includes(speciesName)) {
          species.push(speciesName);
        }
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
      let principalSpecies: string[] = [];
      
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
            // Get only latest snapshot per marche
            const latestByMarche = new Map<string, typeof snapshots[0]>();
            for (const snapshot of snapshots) {
              if (!latestByMarche.has(snapshot.marche_id)) {
                latestByMarche.set(snapshot.marche_id, snapshot);
              }
            }

            // Extract unique species from all latest snapshots
            const allSpecies = new Set<string>();
            for (const snapshot of latestByMarche.values()) {
              const species = extractSpeciesFromSnapshot(snapshot.species_data);
              species.forEach(s => allSpecies.add(s));
            }
            principalSpecies = Array.from(allSpecies);
          }
        }
      }

      // Map to our interface
      return marcheurs.map(m => {
        const isPrincipal = m.is_principal || false;
        const speciesObserved = isPrincipal 
          ? principalSpecies 
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
          isInheritedFromExploration: isPrincipal && principalSpecies.length > 0,
        };
      });
    },
    enabled: !!explorationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
