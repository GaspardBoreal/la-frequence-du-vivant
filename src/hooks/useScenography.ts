import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScenographyData {
  event: {
    id: string;
    title: string;
    slug: string;
    date: string;
    lieu: string | null;
    latitude: number | null;
    longitude: number | null;
    event_type: string;
    cover_image_url: string | null;
    description: string | null;
    scenography_title: string | null;
  };
  species: Array<{
    scientific_name: string;
    common_name: string | null;
    iconic_taxon: string | null;
    photo_url: string | null;
    observations_count: number;
  }>;
  photos: Array<{
    url: string;
    thumbnail_url: string | null;
    caption: string | null;
    latitude: number | null;
    longitude: number | null;
    taken_at: string | null;
    author: string;
  }>;
  waypoints: Array<{
    latitude: number;
    longitude: number;
    ordre: number;
    title: string | null;
  }>;
  testimonies: Array<{
    text: string;
    author: string;
    created_at: string;
  }>;
}

/** Fetch published scenography code by slug (anon-safe). */
export const useEventScenography = (slug: string | undefined) =>
  useQuery({
    queryKey: ['scenography', 'code', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_event_scenography' as any, { _slug: slug! });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row ?? null;
    },
  });

/** Fetch full scenography data (species, photos, waypoints, testimonies). */
export const useEventScenographyData = (slug: string | undefined, enabled = true) =>
  useQuery({
    queryKey: ['scenography', 'data', slug],
    enabled: !!slug && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_event_scenography_data' as any, { _slug: slug! });
      if (error) throw error;
      return (data ?? {}) as Partial<ScenographyData>;
    },
  });

/** Admin: fetch event raw row for editing scenography. */
export const useAdminEventScenography = (eventId: string | undefined) =>
  useQuery({
    queryKey: ['scenography', 'admin', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_events')
        .select('id, title, public_slug, is_public, scenography_code, scenography_enabled, scenography_title, scenography_updated_at')
        .eq('id', eventId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export interface SaveScenographyInput {
  eventId: string;
  code: string | null;
  enabled?: boolean;
  title?: string | null;
}

export const useSaveScenography = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, code, enabled, title }: SaveScenographyInput) => {
      const { data: u } = await supabase.auth.getUser();
      const update: Record<string, any> = {
        scenography_code: code,
        scenography_updated_at: new Date().toISOString(),
        scenography_updated_by: u.user?.id ?? null,
      };
      if (typeof enabled === 'boolean') update.scenography_enabled = enabled;
      if (typeof title !== 'undefined') update.scenography_title = title;

      const { error } = await supabase
        .from('marche_events')
        .update(update)
        .eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['scenography', 'admin', vars.eventId] });
      toast.success('Scénographie enregistrée');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur'),
  });
};

export const useScenographyVersions = (eventId: string | undefined) =>
  useQuery({
    queryKey: ['scenography', 'versions', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_event_scenography_versions' as any)
        .select('id, code, created_at, author, note')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
