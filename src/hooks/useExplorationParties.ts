import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExplorationPartie, ExplorationPartieWithMarches } from '@/types/exploration';

// Types pour les réponses de la base de données
interface PartieRow {
  id: string;
  exploration_id: string;
  titre: string;
  sous_titre: string | null;
  numero_romain: string;
  ordre: number;
  couleur: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface MarcheWithPartie {
  id: string;
  marche_id: string;
  ordre: number | null;
  publication_status: string;
  partie_id: string | null;
  marches: {
    id: string;
    nom_marche: string | null;
    ville: string;
  } | null;
}

// Fetch all parties for an exploration
export function useExplorationParties(explorationId: string) {
  return useQuery({
    queryKey: ['exploration-parties', explorationId],
    queryFn: async (): Promise<ExplorationPartie[]> => {
      if (!explorationId) return [];

      const { data, error } = await supabase
        .from('exploration_parties')
        .select('*')
        .eq('exploration_id', explorationId)
        .order('ordre', { ascending: true });

      if (error) throw error;
      
      return (data || []).map((row: PartieRow) => ({
        ...row,
        sous_titre: row.sous_titre ?? undefined,
        couleur: row.couleur ?? undefined,
        description: row.description ?? undefined,
      }));
    },
    enabled: !!explorationId,
  });
}

// Fetch parties with their assigned marches
export function useExplorationPartiesWithMarches(explorationId: string) {
  return useQuery({
    queryKey: ['exploration-parties-with-marches', explorationId],
    queryFn: async (): Promise<ExplorationPartieWithMarches[]> => {
      if (!explorationId) return [];

      // Fetch parties
      const { data: parties, error: partiesError } = await supabase
        .from('exploration_parties')
        .select('*')
        .eq('exploration_id', explorationId)
        .order('ordre', { ascending: true });

      if (partiesError) throw partiesError;

      // Fetch marches with their partie_id
      const { data: marches, error: marchesError } = await supabase
        .from('exploration_marches')
        .select(`
          id,
          marche_id,
          ordre,
          publication_status,
          partie_id,
          marches (
            id,
            nom_marche,
            ville
          )
        `)
        .eq('exploration_id', explorationId)
        .order('ordre', { ascending: true });

      if (marchesError) throw marchesError;

      // Combine parties with their marches
      const typedMarches = (marches || []) as unknown as MarcheWithPartie[];
      
      return (parties || []).map((partie: PartieRow) => ({
        ...partie,
        sous_titre: partie.sous_titre ?? undefined,
        couleur: partie.couleur ?? undefined,
        description: partie.description ?? undefined,
        marches: typedMarches
          .filter(m => m.partie_id === partie.id)
          .map(m => ({
            id: m.id,
            marche_id: m.marche_id,
            ordre: m.ordre ?? 0,
            publication_status: m.publication_status,
            marche: m.marches ? {
              id: m.marches.id,
              nom_marche: m.marches.nom_marche ?? undefined,
              ville: m.marches.ville,
            } : undefined,
          })),
      }));
    },
    enabled: !!explorationId,
  });
}

// Get unassigned marches (not in any partie)
export function useUnassignedMarches(explorationId: string) {
  return useQuery({
    queryKey: ['exploration-unassigned-marches', explorationId],
    queryFn: async () => {
      if (!explorationId) return [];

      const { data, error } = await supabase
        .from('exploration_marches')
        .select(`
          id,
          marche_id,
          ordre,
          publication_status,
          partie_id,
          marches (
            id,
            nom_marche,
            ville
          )
        `)
        .eq('exploration_id', explorationId)
        .is('partie_id', null)
        .order('ordre', { ascending: true });

      if (error) throw error;

      const typedData = (data || []) as unknown as MarcheWithPartie[];
      
      return typedData.map(m => ({
        id: m.id,
        marche_id: m.marche_id,
        ordre: m.ordre ?? 0,
        publication_status: m.publication_status,
        marche: m.marches ? {
          id: m.marches.id,
          nom_marche: m.marches.nom_marche ?? undefined,
          ville: m.marches.ville,
        } : undefined,
      }));
    },
    enabled: !!explorationId,
  });
}

// Create a new partie
export function useCreateExplorationPartie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      explorationId: string;
      titre: string;
      sousTitre?: string;
      numeroRomain?: string;
      couleur?: string;
      description?: string;
    }) => {
      // Get current max order
      const { data: existing } = await supabase
        .from('exploration_parties')
        .select('ordre')
        .eq('exploration_id', params.explorationId)
        .order('ordre', { ascending: false })
        .limit(1);

      const maxOrder = existing?.[0]?.ordre ?? 0;

      const { data, error } = await supabase
        .from('exploration_parties')
        .insert({
          exploration_id: params.explorationId,
          titre: params.titre,
          sous_titre: params.sousTitre,
          numero_romain: params.numeroRomain || 'I',
          couleur: params.couleur || '#6366f1',
          description: params.description,
          ordre: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exploration-parties', variables.explorationId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-parties-with-marches', variables.explorationId] });
    },
  });
}

// Update a partie
export function useUpdateExplorationPartie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      partieId: string;
      explorationId: string;
      titre?: string;
      sousTitre?: string;
      numeroRomain?: string;
      couleur?: string;
      description?: string;
    }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      
      if (params.titre !== undefined) updates.titre = params.titre;
      if (params.sousTitre !== undefined) updates.sous_titre = params.sousTitre;
      if (params.numeroRomain !== undefined) updates.numero_romain = params.numeroRomain;
      if (params.couleur !== undefined) updates.couleur = params.couleur;
      if (params.description !== undefined) updates.description = params.description;

      const { data, error } = await supabase
        .from('exploration_parties')
        .update(updates)
        .eq('id', params.partieId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exploration-parties', variables.explorationId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-parties-with-marches', variables.explorationId] });
    },
  });
}

// Delete a partie
export function useDeleteExplorationPartie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { partieId: string; explorationId: string }) => {
      const { error } = await supabase
        .from('exploration_parties')
        .delete()
        .eq('id', params.partieId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exploration-parties', variables.explorationId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-parties-with-marches', variables.explorationId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-unassigned-marches', variables.explorationId] });
    },
  });
}

// Reorder parties
export function useReorderParties() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      explorationId: string;
      partieOrders: Array<{ partieId: string; ordre: number }>;
    }) => {
      const promises = params.partieOrders.map(({ partieId, ordre }) =>
        supabase
          .from('exploration_parties')
          .update({ ordre, updated_at: new Date().toISOString() })
          .eq('id', partieId)
      );

      await Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exploration-parties', variables.explorationId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-parties-with-marches', variables.explorationId] });
    },
  });
}

// Assign a marche to a partie
export function useAssignMarcheToPartie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      explorationMarcheId: string;
      partieId: string | null;
      explorationId: string;
    }) => {
      const { error } = await supabase
        .from('exploration_marches')
        .update({ partie_id: params.partieId })
        .eq('id', params.explorationMarcheId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exploration-parties-with-marches', variables.explorationId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-unassigned-marches', variables.explorationId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marches', variables.explorationId] });
    },
  });
}

// Batch assign marches to a partie
export function useBatchAssignMarchesToPartie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      explorationMarcheIds: string[];
      partieId: string | null;
      explorationId: string;
    }) => {
      const promises = params.explorationMarcheIds.map(id =>
        supabase
          .from('exploration_marches')
          .update({ partie_id: params.partieId })
          .eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exploration-parties-with-marches', variables.explorationId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-unassigned-marches', variables.explorationId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marches', variables.explorationId] });
    },
  });
}

// Roman numerals helper
export const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
