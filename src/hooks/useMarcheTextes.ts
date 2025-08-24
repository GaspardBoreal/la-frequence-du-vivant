// Hook for managing literary texts associated with marches
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TextType } from '@/types/textTypes';
import { useToast } from '@/hooks/use-toast';

export interface MarcheTexte {
  id: string;
  marche_id: string;
  titre: string;
  contenu: string;
  type_texte: TextType;
  ordre: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MarcheTexteInput {
  marche_id: string;
  titre: string;
  contenu: string;
  type_texte: TextType;
  ordre?: number;
  metadata?: Record<string, any>;
}

// Get all texts for a marche
export function useMarcheTextes(marcheId: string) {
  return useQuery({
    queryKey: ['marche-textes', marcheId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_textes')
        .select('*')
        .eq('marche_id', marcheId)
        .order('ordre', { ascending: true });

      if (error) throw error;
      return data as MarcheTexte[];
    },
    enabled: !!marcheId,
  });
}

// Get texts by type for a marche
export function useMarcheTextesByType(marcheId: string, type?: TextType) {
  return useQuery({
    queryKey: ['marche-textes', marcheId, type],
    queryFn: async () => {
      let query = supabase
        .from('marche_textes')
        .select('*')
        .eq('marche_id', marcheId);

      if (type) {
        query = query.eq('type_texte', type);
      }

      const { data, error } = await query.order('ordre', { ascending: true });

      if (error) throw error;
      return data as MarcheTexte[];
    },
    enabled: !!marcheId,
  });
}

// Create a new text
export function useCreateMarcheTexte() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: MarcheTexteInput) => {
      const { data, error } = await supabase
        .from('marche_textes')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as MarcheTexte;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marche-textes', data.marche_id] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marches'] });
      toast({
        title: 'Texte créé',
        description: `Le texte "${data.titre}" a été ajouté avec succès.`,
      });
    },
  });
}

// Update a text
export function useUpdateMarcheTexte() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarcheTexteInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('marche_textes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as MarcheTexte;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marche-textes', data.marche_id] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marches'] });
      toast({
        title: 'Texte modifié',
        description: `Le texte "${data.titre}" a été mis à jour.`,
      });
    },
  });
}

// Delete a text
export function useDeleteMarcheTexte() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marche_textes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marche-textes'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marches'] });
      toast({
        title: 'Texte supprimé',
        description: 'Le texte a été supprimé avec succès.',
      });
    },
  });
}

// Reorder texts
export function useReorderMarcheTextes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ marcheId, textIds }: { marcheId: string; textIds: string[] }) => {
      // Update each text's order
      for (let i = 0; i < textIds.length; i++) {
        const { error } = await supabase
          .from('marche_textes')
          .update({ ordre: i + 1 })
          .eq('id', textIds[i]);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marche-textes', variables.marcheId] });
      toast({
        title: 'Ordre mis à jour',
        description: 'L\'ordre des textes a été modifié.',
      });
    },
  });
}

// Get text statistics for an exploration
export function useExplorationTextStats(explorationId: string) {
  return useQuery({
    queryKey: ['exploration-text-stats', explorationId],
    queryFn: async () => {
      // Get marches for this exploration
      const { data: marchesData, error: marchesError } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', explorationId);

      if (marchesError) throw marchesError;

      const marcheIds = marchesData.map(em => em.marche_id);

      if (marcheIds.length === 0) {
        return {
          totalTexts: 0,
          textsByType: {},
          totalTypes: 0,
        };
      }

      // Get all texts for these marches
      const { data: textsData, error: textsError } = await supabase
        .from('marche_textes')
        .select('type_texte')
        .in('marche_id', marcheIds);

      if (textsError) throw textsError;

      // Calculate statistics
      const textsByType = textsData.reduce((acc, text) => {
        acc[text.type_texte] = (acc[text.type_texte] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalTexts: textsData.length,
        textsByType,
        totalTypes: Object.keys(textsByType).length,
      };
    },
    enabled: !!explorationId,
  });
}