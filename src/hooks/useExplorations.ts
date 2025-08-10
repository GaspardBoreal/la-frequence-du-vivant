import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Exploration {
  id: string;
  slug: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  language: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface NarrativeLandscape {
  id: string;
  exploration_id: string;
  slug: string;
  name: string;
  description?: string;
  ai_prompt?: string;
  ordre: number;
  cover_image_url?: string;
  language: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface ExplorationMarche {
  id: string;
  exploration_id: string;
  marche_id: string;
  ordre?: number;
  marche?: {
    id: string;
    ville: string;
    nom_marche?: string;
    date?: string;
    descriptif_court?: string;
    descriptif_long?: string;
    latitude?: number;
    longitude?: number;
    region?: string;
    departement?: string;
    theme_principal?: string;
    sous_themes?: string[];
  };
}

export interface ExplorationMarcheComplete extends ExplorationMarche {
  marche?: ExplorationMarche['marche'] & {
    photos: Array<{
      id: string;
      url_supabase: string;
      titre?: string;
      description?: string;
      ordre?: number;
    }>;
    audio: Array<{
      id: string;
      url_supabase: string;
      titre?: string;
      description?: string;
      duree_secondes?: number;
      ordre?: number;
    }>;
    videos: Array<{
      id: string;
      url_supabase: string;
      titre?: string;
      description?: string;
      ordre?: number;
    }>;
    documents: Array<{
      id: string;
      url_supabase: string;
      titre?: string;
      description?: string;
      ordre?: number;
    }>;
    etudes: Array<{
      id: string;
      titre: string;
      contenu: string;
      resume?: string;
      ordre: number;
    }>;
    tags: Array<{
      id: string;
      tag: string;
      categorie?: string;
    }>;
  };
}

// Hook pour récupérer toutes les explorations publiques
export const useExplorations = () => {
  return useQuery({
    queryKey: ['explorations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explorations')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Exploration[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour récupérer toutes les explorations (admin)
export const useAdminExplorations = () => {
  return useQuery({
    queryKey: ['admin-explorations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explorations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Exploration[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour récupérer une exploration par ID (admin)
export const useExplorationById = (id: string) => {
  return useQuery({
    queryKey: ['exploration-by-id', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explorations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Exploration;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};

// Hook pour récupérer une exploration par slug
export const useExploration = (slug: string) => {
  return useQuery({
    queryKey: ['exploration', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explorations')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      
      if (error) throw error;
      return data as Exploration;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });
};

// Hook pour récupérer les marches d'une exploration avec toutes leurs données
export const useExplorationMarches = (explorationId: string) => {
  return useQuery({
    queryKey: ['exploration-marches', explorationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exploration_marches')
        .select(`
          *,
          marche:marches(
            id,
            ville,
            nom_marche,
            date,
            descriptif_court,
            descriptif_long,
            latitude,
            longitude,
            region,
            departement,
            theme_principal,
            sous_themes
          )
        `)
        .eq('exploration_id', explorationId)
        .order('ordre', { ascending: true });
      
      if (error) throw error;
      
      // Pour chaque marche, récupérer tous ses médias
      const marchesWithMedia = await Promise.all(
        (data || []).map(async (explorationMarche) => {
          if (!explorationMarche.marche) return explorationMarche;
          
          const marcheId = explorationMarche.marche.id;
          
          // Récupérer tous les médias en parallèle
          const [photosResult, audioResult, videosResult, documentsResult, etudesResult, tagsResult] = await Promise.all([
            supabase.from('marche_photos').select('*').eq('marche_id', marcheId).order('ordre'),
            supabase.from('marche_audio').select('*').eq('marche_id', marcheId).order('ordre'),
            supabase.from('marche_videos').select('*').eq('marche_id', marcheId).order('ordre'),
            supabase.from('marche_documents').select('*').eq('marche_id', marcheId).order('ordre'),
            supabase.from('marche_etudes').select('*').eq('marche_id', marcheId).order('ordre'),
            supabase.from('marche_tags').select('*').eq('marche_id', marcheId)
          ]);
          
          return {
            ...explorationMarche,
            marche: {
              ...explorationMarche.marche,
              photos: photosResult.data || [],
              audio: audioResult.data || [],
              videos: videosResult.data || [],
              documents: documentsResult.data || [],
              etudes: etudesResult.data || [],
              tags: tagsResult.data || []
            }
          };
        })
      );
      
      return marchesWithMedia as ExplorationMarcheComplete[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!explorationId,
  });
};

// Hook pour récupérer les paysages narratifs d'une exploration
export const useNarrativeLandscapes = (explorationId: string) => {
  return useQuery({
    queryKey: ['narrative-landscapes', explorationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('narrative_landscapes')
        .select('*')
        .eq('exploration_id', explorationId)
        .order('ordre', { ascending: true });
      
      if (error) throw error;
      return data as NarrativeLandscape[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!explorationId,
  });
};

// Hook pour récupérer un paysage narratif par slug
export const useNarrativeLandscape = (explorationSlug: string, narrativeSlug: string) => {
  return useQuery({
    queryKey: ['narrative-landscape', explorationSlug, narrativeSlug],
    queryFn: async () => {
      const { data: exploration, error: expError } = await supabase
        .from('explorations')
        .select('id')
        .eq('slug', explorationSlug)
        .single();
      
      if (expError) throw expError;
      
      const { data, error } = await supabase
        .from('narrative_landscapes')
        .select('*')
        .eq('exploration_id', exploration.id)
        .eq('slug', narrativeSlug)
        .single();
      
      if (error) throw error;
      return data as NarrativeLandscape;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!explorationSlug && !!narrativeSlug,
  });
};

// Hook pour enregistrer les clics
export const useTrackClick = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      exploration_id?: string;
      narrative_id?: string;
      marche_id?: string;
      action: string;
    }) => {
      const { data, error } = await supabase
        .from('exploration_clicks')
        .insert({
          ...params,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
        });
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook pour récupérer le nombre de marches d'une exploration
export const useExplorationMarchesCount = (explorationId: string) => {
  return useQuery({
    queryKey: ['exploration-marches-count', explorationId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('exploration_marches')
        .select('*', { count: 'exact', head: true })
        .eq('exploration_id', explorationId);
      
      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!explorationId,
  });
};

// Hook pour soumettre du feedback
export const useSubmitFeedback = () => {
  return useMutation({
    mutationFn: async (params: {
      exploration_id?: string;
      narrative_id?: string;
      marche_id?: string;
      language: string;
      rating?: number;
      comment: string;
    }) => {
      const { data, error } = await supabase
        .from('exploration_feedbacks')
        .insert(params);
      
      if (error) throw error;
      return data;
    },
  });
};