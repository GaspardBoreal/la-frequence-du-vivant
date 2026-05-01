import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ImageOptimizer, type OptimizationStage } from '@/utils/imageOptimizer';
import { HeicConversionError, HEIC_USER_MESSAGE } from '@/utils/heicConverter';
import { toast } from 'sonner';

export interface ConvivialitePhoto {
  id: string;
  exploration_id: string;
  user_id: string;
  storage_path: string;
  url: string;
  width: number | null;
  height: number | null;
  taille_octets: number | null;
  is_hidden: boolean;
  created_at: string;
  // Enriched
  author_prenom?: string | null;
  author_nom?: string | null;
  author_avatar?: string | null;
}

const BUCKET = 'exploration-convivialite';

export function useConvivialitePhotos(explorationId: string | undefined) {
  return useQuery({
    queryKey: ['convivialite-photos', explorationId],
    queryFn: async (): Promise<ConvivialitePhoto[]> => {
      if (!explorationId) return [];
      const { data, error } = await (supabase as any)
        .from('exploration_convivialite_photos')
        .select('*')
        .eq('exploration_id', explorationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const photos = (data || []) as ConvivialitePhoto[];
      // Enrich with author profiles
      const userIds = Array.from(new Set(photos.map(p => p.user_id)));
      if (userIds.length === 0) return photos;
      const { data: profiles } = await supabase
        .from('community_profiles')
        .select('user_id, prenom, nom, avatar_url')
        .in('user_id', userIds);
      const map = new Map((profiles || []).map(p => [p.user_id, p]));
      return photos.map(p => {
        const prof = map.get(p.user_id);
        return {
          ...p,
          author_prenom: prof?.prenom || null,
          author_nom: prof?.nom || null,
          author_avatar: prof?.avatar_url || null,
        };
      });
    },
    enabled: !!explorationId,
  });
}

export function useCanUploadConvivialite(
  userId: string | undefined,
  explorationId: string | undefined,
  userRole?: string | null,
  isAdmin?: boolean,
) {
  const query = useQuery({
    queryKey: ['can-upload-convivialite', userId, explorationId, userRole, isAdmin],
    queryFn: async (): Promise<boolean> => {
      if (!userId || !explorationId) return false;
      // Fast positive paths (also enforced server-side by RLS)
      if (isAdmin) return true;
      if (['ambassadeur', 'sentinelle'].includes(userRole || '')) return true;
      // Server check for organizer status
      const { data, error } = await (supabase as any).rpc('can_upload_convivialite', {
        _user_id: userId,
        _exploration_id: explorationId,
      });
      if (error) return false;
      return !!data;
    },
    enabled: !!userId && !!explorationId,
    staleTime: 5 * 60 * 1000,
  });
  return { canUpload: !!query.data };
}

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function useUploadConvivialitePhotos(explorationId: string | undefined, userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      if (!explorationId || !userId) throw new Error('Contexte manquant');
      const optimizer = new ImageOptimizer({ maxSizeMB: 1.5, maxWidthOrHeight: 1920, quality: 0.85 });
      const results: ConvivialitePhoto[] = [];

      for (const file of files) {
        const optimized = await optimizer.optimizeImage(file);
        const finalFile = optimized.file;
        const { width, height } = await readImageDimensions(finalFile);
        const ext = (finalFile.name.split('.').pop() || 'jpg').toLowerCase();
        const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
        const fileName = `${crypto.randomUUID()}.${safeExt}`;
        const path = `${explorationId}/${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, finalFile, { contentType: finalFile.type, upsert: false });
        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const publicUrl = pub.publicUrl;

        const { data: inserted, error: insertError } = await (supabase as any)
          .from('exploration_convivialite_photos')
          .insert({
            exploration_id: explorationId,
            user_id: userId,
            storage_path: path,
            url: publicUrl,
            width,
            height,
            taille_octets: finalFile.size,
          })
          .select()
          .single();
        if (insertError) {
          // best-effort cleanup
          await supabase.storage.from(BUCKET).remove([path]);
          throw insertError;
        }
        results.push(inserted as ConvivialitePhoto);
      }
      return results;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['convivialite-photos', explorationId] });
      toast.success('Photos ajoutées au mur de convivialité');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erreur lors de l\'envoi');
    },
  });
}

export function useDeleteConvivialitePhoto(explorationId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: ConvivialitePhoto) => {
      const { error } = await (supabase as any)
        .from('exploration_convivialite_photos')
        .delete()
        .eq('id', photo.id);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([photo.storage_path]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['convivialite-photos', explorationId] });
      toast.success('Photo retirée');
    },
    onError: (err: any) => toast.error(err?.message || 'Suppression impossible'),
  });
}

export function useReportConvivialitePhoto() {
  return useMutation({
    mutationFn: async ({ photoId, reporterUserId, raison }: { photoId: string; reporterUserId: string; raison: string }) => {
      const { error } = await (supabase as any)
        .from('exploration_convivialite_signalements')
        .insert({ photo_id: photoId, reporter_user_id: reporterUserId, raison });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Signalement transmis aux modérateurs'),
    onError: (err: any) => toast.error(err?.message || 'Signalement impossible'),
  });
}
