import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpeciesObserver {
  marcheurId: string;
  prenom: string;
  nom: string;
  fullName: string;
  avatarUrl?: string;
  role?: string;
  marcheId: string;
  marcheName: string;
  ville: string;
  observationDate?: string;
  photoUrl?: string;
}

/**
 * Liste des marcheurs ayant observé une espèce sur l'ensemble des marches d'une
 * exploration. Une entrée par couple (marcheur × marche) — un même marcheur peut
 * apparaître plusieurs fois s'il a vu l'espèce sur plusieurs marches.
 *
 * Sécurité : `marcheur_observations` et `exploration_marcheurs` sont déjà
 * protégées par RLS visible aux co-participants. Aucun accès direct à `profiles`
 * (PII) — on lit uniquement les champs de présentation publics depuis
 * `exploration_marcheurs` (prenom, nom, avatar_url, role).
 */
export function useSpeciesObservers(
  scientificName: string | undefined,
  explorationId: string | undefined,
) {
  return useQuery({
    queryKey: ['species-observers', scientificName, explorationId],
    queryFn: async (): Promise<SpeciesObserver[]> => {
      if (!scientificName || !explorationId) return [];

      // 1. Marcheurs de l'exploration (présentation safe : pas de PII profiles)
      const { data: marcheurs } = await supabase
        .from('exploration_marcheurs')
        .select('id, prenom, nom, avatar_url, role')
        .eq('exploration_id', explorationId);
      if (!marcheurs || marcheurs.length === 0) return [];
      const marcheurMap = new Map(marcheurs.map((m: any) => [m.id, m]));
      const marcheurIds = marcheurs.map((m: any) => m.id);

      // 2. Marches publiées de l'exploration
      const { data: explorationMarches } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches (id, nom_marche, ville)')
        .eq('exploration_id', explorationId)
        .in('publication_status', ['published', 'published_public']);
      const marcheInfoMap = new Map<string, { name: string; ville: string }>();
      (explorationMarches || []).forEach((em: any) => {
        if (em.marches) {
          marcheInfoMap.set(em.marche_id, {
            name: em.marches.nom_marche || em.marches.ville || '',
            ville: em.marches.ville || '',
          });
        }
      });

      // 3. Observations de l'espèce par ces marcheurs
      const { data: observations } = await supabase
        .from('marcheur_observations')
        .select('marcheur_id, marche_id, observation_date, photo_url')
        .in('marcheur_id', marcheurIds)
        .ilike('species_scientific_name', scientificName);

      const out: SpeciesObserver[] = [];
      (observations || []).forEach((obs: any) => {
        const m = marcheurMap.get(obs.marcheur_id);
        const mi = marcheInfoMap.get(obs.marche_id);
        if (!m || !mi) return;
        out.push({
          marcheurId: m.id,
          prenom: m.prenom || '',
          nom: m.nom || '',
          fullName: `${m.prenom || ''} ${m.nom || ''}`.trim() || 'Marcheur',
          avatarUrl: m.avatar_url || undefined,
          role: m.role || undefined,
          marcheId: obs.marche_id,
          marcheName: mi.name,
          ville: mi.ville,
          observationDate: obs.observation_date,
          photoUrl: obs.photo_url || undefined,
        });
      });

      // Tri : date desc, puis nom
      out.sort((a, b) => {
        const da = a.observationDate ? new Date(a.observationDate).getTime() : 0;
        const db = b.observationDate ? new Date(b.observationDate).getTime() : 0;
        if (db !== da) return db - da;
        return a.fullName.localeCompare(b.fullName);
      });
      return out;
    },
    enabled: !!scientificName && !!explorationId,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}
