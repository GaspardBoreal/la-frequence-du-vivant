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

      // Fetch observations for each marcheur
      const marcheurIds = marcheurs.map(m => m.id);
      const { data: observations, error: obsError } = await supabase
        .from('marcheur_observations')
        .select('marcheur_id, species_scientific_name')
        .in('marcheur_id', marcheurIds);

      if (obsError) {
        console.error('Error fetching observations:', obsError);
      }

      // Group observations by marcheur
      const observationsByMarcheur = new Map<string, string[]>();
      (observations || []).forEach(obs => {
        const existing = observationsByMarcheur.get(obs.marcheur_id) || [];
        if (!existing.includes(obs.species_scientific_name)) {
          existing.push(obs.species_scientific_name);
        }
        observationsByMarcheur.set(obs.marcheur_id, existing);
      });

      // Map to our interface
      return marcheurs.map(m => {
        const speciesObserved = observationsByMarcheur.get(m.id) || [];
        return {
          id: m.id,
          nom: m.nom,
          prenom: m.prenom,
          fullName: `${m.prenom} ${m.nom}`,
          role: (m.role || 'marcheur') as ExplorationMarcheur['role'],
          bioCoute: m.bio_courte || undefined,
          avatarUrl: m.avatar_url || undefined,
          couleur: m.couleur || '#10b981',
          isPrincipal: m.is_principal || false,
          ordre: m.ordre || 1,
          observationsCount: speciesObserved.length,
          speciesObserved,
        };
      });
    },
    enabled: !!explorationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
