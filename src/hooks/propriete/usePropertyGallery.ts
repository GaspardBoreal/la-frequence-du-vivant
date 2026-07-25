import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GalleryCandidate {
  source_table: string;
  source_id: string;
  url: string;
  author_name: string | null;
  photo_date: string | null;
  lat: number | null;
  lng: number | null;
  event_title: string | null;
  event_id: string | null;
  is_selected: boolean;
  order_index: number | null;
}

export interface GalleryPhoto {
  id: string;
  source_table: string;
  source_id: string;
  url: string;
  author_name: string | null;
  photo_date: string | null;
  lat: number | null;
  lng: number | null;
  caption: string | null;
  order_index: number;
}

export const GALLERY_MAX = 12;

export function usePropertyGallery(proprieteId?: string) {
  return useQuery({
    queryKey: ['propriete-gallery', proprieteId],
    enabled: !!proprieteId,
    staleTime: 30_000,
    queryFn: async (): Promise<GalleryPhoto[]> => {
      const { data, error } = await (supabase as any).rpc('get_propriete_gallery', {
        _propriete_id: proprieteId,
      });
      if (error) throw error;
      return (data ?? []) as GalleryPhoto[];
    },
  });
}

export function usePropertyGalleryCandidates(proprieteId?: string, enabled = true) {
  return useQuery({
    queryKey: ['propriete-gallery-candidates', proprieteId],
    enabled: !!proprieteId && enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<GalleryCandidate[]> => {
      const { data, error } = await (supabase as any).rpc('get_propriete_gallery_candidates', {
        _propriete_id: proprieteId,
      });
      if (error) throw error;
      return (data ?? []) as GalleryCandidate[];
    },
  });
}

export function useCanCurateGallery(proprieteId?: string) {
  return useQuery({
    queryKey: ['propriete-gallery-can-curate', proprieteId],
    enabled: !!proprieteId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await (supabase as any).rpc('can_curate_propriete_gallery', {
        _propriete_id: proprieteId,
      });
      if (error) return false;
      return !!data;
    },
  });
}

export function useSavePropertyGallery(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<Omit<GalleryPhoto, 'id' | 'order_index'>>) => {
      if (!proprieteId) throw new Error('propriete_id_missing');
      if (items.length > GALLERY_MAX) throw new Error(`gallery_max_${GALLERY_MAX}_photos`);
      const payload = items.map((it) => ({
        source_table: it.source_table,
        source_id: it.source_id,
        url: it.url,
        author_name: it.author_name ?? null,
        photo_date: it.photo_date ?? null,
        lat: it.lat ?? null,
        lng: it.lng ?? null,
        caption: it.caption ?? null,
      }));
      const { error } = await (supabase as any).rpc('set_propriete_gallery', {
        _propriete_id: proprieteId,
        _items: payload,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propriete-gallery', proprieteId] });
      qc.invalidateQueries({ queryKey: ['propriete-gallery-candidates', proprieteId] });
      toast.success('Portrait du site enregistré');
    },
    onError: (e: any) => {
      const msg = e?.message ?? 'Erreur enregistrement';
      if (msg.includes('gallery_max')) toast.error(`Maximum ${GALLERY_MAX} photos`);
      else if (msg.includes('not_authorized')) toast.error("Vous n'avez pas les droits pour curater cette galerie.");
      else toast.error(msg);
    },
  });
}
