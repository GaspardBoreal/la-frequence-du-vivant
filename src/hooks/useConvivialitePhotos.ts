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
  position: number;
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

export interface ConvivialiteUploadProgress {
  fileIndex: number;
  total: number;
  fileName: string;
  stage: OptimizationStage | 'uploading';
}

export function useUploadConvivialitePhotos(
  explorationId: string | undefined,
  userId: string | undefined,
  onProgress?: (p: ConvivialiteUploadProgress) => void,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      if (!explorationId || !userId) throw new Error('Contexte manquant');
      const results: ConvivialitePhoto[] = [];
      const errors: { file: string; error: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const optimizer = new ImageOptimizer({
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1920,
          quality: 0.85,
          onProgress: (_f, stage) => onProgress?.({ fileIndex: i, total: files.length, fileName: file.name, stage }),
        });

        let finalFile: File;
        try {
          const optimized = await optimizer.optimizeImage(file);
          finalFile = optimized.file;
        } catch (err) {
          if (err instanceof HeicConversionError) {
            errors.push({ file: file.name, error: HEIC_USER_MESSAGE });
            continue;
          }
          errors.push({ file: file.name, error: (err as any)?.message || 'Erreur de traitement' });
          continue;
        }

        onProgress?.({ fileIndex: i, total: files.length, fileName: file.name, stage: 'uploading' });

        const { width, height } = await readImageDimensions(finalFile);
        const ext = (finalFile.name.split('.').pop() || 'jpg').toLowerCase();
        const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
        const fileName = `${crypto.randomUUID()}.${safeExt}`;
        const path = `${explorationId}/${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, finalFile, { contentType: finalFile.type, upsert: false });
        if (uploadError) {
          errors.push({ file: file.name, error: uploadError.message });
          continue;
        }

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
          await supabase.storage.from(BUCKET).remove([path]);
          errors.push({ file: file.name, error: insertError.message });
          continue;
        }
        results.push(inserted as ConvivialitePhoto);
      }
      return { results, errors };
    },
    onSuccess: ({ results, errors }) => {
      qc.invalidateQueries({ queryKey: ['convivialite-photos', explorationId] });
      if (results.length > 0) {
        toast.success(
          `${results.length} photo${results.length > 1 ? 's' : ''} ajoutée${results.length > 1 ? 's' : ''} au mur`,
        );
      }
      if (errors.length > 0) {
        // Affiche un toast par erreur (HEIC notamment) — message explicite pour l'utilisateur
        errors.slice(0, 3).forEach((e) =>
          toast.error(`${e.file} : ${e.error}`, { duration: 8000 }),
        );
        if (errors.length > 3) {
          toast.error(`${errors.length - 3} autre(s) photo(s) non importée(s)`);
        }
      }
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
