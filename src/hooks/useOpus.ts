import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  OpusExploration, 
  MarcheContexteHybrid, 
  FableNarrative, 
  PrefigurationInteractive 
} from '@/types/opus';

// Hooks pour OPUS Explorations
export const useOpusExplorations = () => {
  return useQuery({
    queryKey: ['opus-explorations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opus_explorations')
        .select('*')
        .eq('published', true)
        .order('ordre');
      
      if (error) throw error;
      return data as OpusExploration[];
    }
  });
};

export const useOpusExploration = (slug: string) => {
  return useQuery({
    queryKey: ['opus-exploration', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opus_explorations')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      
      if (error) throw error;
      return data as OpusExploration;
    },
    enabled: !!slug
  });
};

// Hooks pour Contextes Hybrides
export const useMarcheContextes = (marcheId: string) => {
  return useQuery({
    queryKey: ['marche-contextes', marcheId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_contextes_hybrids')
        .select('*')
        .eq('marche_id', marcheId)
        .single();
      
      if (error) throw error;
      return data as MarcheContexteHybrid;
    },
    enabled: !!marcheId
  });
};

export const useOpusContextes = (opusId: string) => {
  return useQuery({
    queryKey: ['opus-contextes', opusId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_contextes_hybrids')
        .select(`
          *,
          marches (
            id,
            nom_marche,
            ville,
            latitude,
            longitude
          )
        `)
        .eq('opus_id', opusId)
        .order('created_at');
      
      if (error) throw error;
      return data;
    },
    enabled: !!opusId
  });
};

// Hooks pour Fables Narratives
export const useFablesMarche = (marcheId: string) => {
  return useQuery({
    queryKey: ['fables-marche', marcheId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fables_narratives')
        .select('*')
        .eq('marche_id', marcheId)
        .eq('statut', 'published')
        .order('ordre');
      
      if (error) throw error;
      return data as FableNarrative[];
    },
    enabled: !!marcheId
  });
};

export const useFablesOpus = (opusId: string, version: string = 'V1') => {
  return useQuery({
    queryKey: ['fables-opus', opusId, version],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fables_narratives')
        .select(`
          *,
          marches (
            id,
            nom_marche,
            ville
          )
        `)
        .eq('opus_id', opusId)
        .eq('version', version)
        .eq('statut', 'published')
        .order('ordre');
      
      if (error) throw error;
      return data;
    },
    enabled: !!opusId
  });
};

// Hooks pour Préfigurations
export const usePrefigurations = (opusId: string) => {
  return useQuery({
    queryKey: ['prefigurations', opusId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('préfigurations_interactives')
        .select('*')
        .eq('opus_id', opusId)
        .eq('published', true)
        .order('ordre');
      
      if (error) throw error;
      return data as PrefigurationInteractive[];
    },
    enabled: !!opusId
  });
};

// Mutations pour administration
export const useCreateMarcheContexte = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contexte: Omit<MarcheContexteHybrid, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('marche_contextes_hybrids')
        .insert(contexte)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marche-contextes'] });
      queryClient.invalidateQueries({ queryKey: ['opus-contextes'] });
    }
  });
};

export const useUpdateMarcheContexte = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarcheContexteHybrid> & { id: string }) => {
      const { data, error } = await supabase
        .from('marche_contextes_hybrids')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marche-contextes', variables.marche_id] });
      queryClient.invalidateQueries({ queryKey: ['opus-contextes'] });
    }
  });
};

export const useCreateFable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fable: Omit<FableNarrative, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('fables_narratives')
        .insert(fable)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fables-marche'] });
      queryClient.invalidateQueries({ queryKey: ['fables-opus'] });
    }
  });
};

export const useUpdateFable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FableNarrative> & { id: string }) => {
      const { data, error } = await supabase
        .from('fables_narratives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fables-marche'] });
      queryClient.invalidateQueries({ queryKey: ['fables-opus'] });
    }
  });
};

export const useCreatePrefiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (prefiguration: Omit<PrefigurationInteractive, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('préfigurations_interactives')
        .insert(prefiguration)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prefigurations'] });
    }
  });
};

// Hook pour calculer la complétude d'un contexte
export const useContexteCompletude = (contexte: MarcheContexteHybrid | undefined) => {
  const calculateCompletude = (contexte: MarcheContexteHybrid) => {
    const dimensions = [
      'contexte_hydrologique',
      'especes_caracteristiques', 
      'vocabulaire_local',
      'empreintes_humaines',
      'projection_2035_2045',
      'leviers_agroecologiques',
      'nouvelles_activites',
      'technodiversite'
    ];
    
    const completed = dimensions.filter(dim => 
      contexte[dim as keyof MarcheContexteHybrid] !== null && 
      contexte[dim as keyof MarcheContexteHybrid] !== undefined
    ).length;
    
    return Math.round((completed / dimensions.length) * 100);
  };
  
  return contexte ? calculateCompletude(contexte) : 0;
};