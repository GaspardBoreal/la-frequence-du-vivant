/**
 * Carnet photo des ouvrages de l'Atelier.
 *
 * Une photo est rattachée à un objet (`propriete_objets`) : mare, massif,
 * potager, pas japonais… Chaque photo porte sa date de prise de vue (EXIF)
 * ET sa date d'ajout — ce qui permet de filtrer par saison / année.
 *
 * Lecture : une requête par propriété + signature des URLs en lot (1 h).
 * Écriture : upload Storage (bucket privé `propriete-ouvrages`) puis insert DB
 * avec rollback storage en cas d'échec.
 */
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { preparePhotoForUpload, insertWithStorageRollback } from '@/utils/uploadWithMetadata';

export const OUVRAGE_PHOTO_BUCKET = 'propriete-ouvrages';
export const MAX_OUVRAGE_PHOTO_BYTES = 25 * 1024 * 1024;
export const MAX_OUVRAGE_VIDEO_BYTES = 50 * 1024 * 1024;

export interface ObjetPhoto {
  id: string;
  propriete_id: string;
  objet_id: string;
  storage_path: string;
  mime: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  media_type?: 'photo' | 'video';
  duration_s?: number | null;
  caption: string | null;
  order_index: number;
  taken_at: string | null;
  uploaded_at: string;
  lat: number | null;
  lng: number | null;
  uploaded_by: string | null;
  created_at: string;
  /** URL signée résolue côté client (1 h). */
  url?: string;
}

const KEY = (id?: string) => ['propriete-objet-photos', id];

const extOf = (name: string) => (name.split('.').pop() || 'jpg').toLowerCase();

export type UploadItemStatus = 'pending' | 'reading' | 'uploading' | 'saving' | 'done' | 'error';

export interface UploadItem {
  key: string;
  name: string;
  sizeBytes: number;
  sentBytes: number;
  isVideo: boolean;
  status: UploadItemStatus;
  error?: string;
}

const isVideoFile = (file: File) =>
  (file.type || '').startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(file.name);

const videoDimensions = (file: File) =>
  new Promise<{ width: number; height: number; duration: number } | null>((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    video.src = url;
  });

const putSigned = (signedUrl: string, file: File, onProgress: (sent: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl, true);
    if (file.type) xhr.setRequestHeader('content-type', file.type);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(file.size);
        resolve();
        return;
      }
      reject(new Error(xhr.status === 413 ? 'Vidéo trop lourde (50 Mo max)' : 'Fichier refusé par le serveur'));
    };
    xhr.onerror = () => reject(new Error('Connexion interrompue pendant l’envoi'));
    xhr.send(file);
  });

export function useObjetPhotos(proprieteId?: string) {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const query = useQuery({
    queryKey: KEY(proprieteId),
    enabled: !!proprieteId,
    staleTime: 30_000,
    queryFn: async (): Promise<ObjetPhoto[]> => {
      const { data, error } = await (supabase as any)
        .from('propriete_objet_photos')
        .select('*')
        .eq('propriete_id', proprieteId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as ObjetPhoto[];
      if (rows.length === 0) return [];
      const { data: signed } = await supabase.storage
        .from(OUVRAGE_PHOTO_BUCKET)
        .createSignedUrls(rows.map((r) => r.storage_path), 3600);
      const byPath = new Map<string, string>();
      (signed ?? []).forEach((s: any) => {
        if (s?.path && s?.signedUrl) byPath.set(s.path, s.signedUrl);
      });
      return rows.map((r) => ({ ...r, url: byPath.get(r.storage_path) }));
    },
  });

  const photos = query.data ?? [];

  /** Regroupement par ouvrage, déjà trié. */
  const byObjet = useMemo(() => {
    const m = new Map<string, ObjetPhoto[]>();
    photos.forEach((p) => {
      const list = m.get(p.objet_id) ?? [];
      list.push(p);
      m.set(p.objet_id, list);
    });
    return m;
  }, [photos]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    byObjet.forEach((list, id) => {
      m[id] = list.length;
    });
    return m;
  }, [byObjet]);

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: KEY(proprieteId) }),
    [qc, proprieteId],
  );

  const upload = useCallback(
    async (objetId: string, files: File[]) => {
      if (!proprieteId) return;
      const list = Array.from(files).filter((f) =>
        (f.type || '').startsWith('image/') ||
        (f.type || '').startsWith('video/') ||
        /\.(jpe?g|png|webp|gif|heic|heif|bmp|tiff|mp4|mov|m4v|webm)$/i.test(f.name),
      );
      if (list.length === 0) {
        toast.error('Aucune photo ou vidéo reconnue dans la sélection');
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        toast.error('Session expirée — reconnectez-vous');
        return;
      }

      setProgress({ done: 0, total: list.length });
      setUploads(
        list.map((f, i) => ({
          key: `${f.name}-${f.size}-${i}`,
          name: f.name,
          sizeBytes: f.size,
          sentBytes: 0,
          isVideo: isVideoFile(f),
          status: 'pending' as UploadItemStatus,
        })),
      );
      const mark = (i: number, patch: Partial<UploadItem>) =>
        setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, ...patch } : u)));
      const base = (byObjet.get(objetId) ?? []).length;
      let ok = 0;

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        try {
          const isVideo = isVideoFile(file);
          const maxBytes = isVideo ? MAX_OUVRAGE_VIDEO_BYTES : MAX_OUVRAGE_PHOTO_BYTES;
          if (file.size > maxBytes) {
            throw new Error(isVideo
              ? 'Vidéo trop lourde (50 Mo max). Filmez 20 s en 1080p ou compressez la séquence.'
              : 'Photo trop lourde (25 Mo max)');
          }
          mark(i, { status: 'reading' });
          const prepared = isVideo ? null : await preparePhotoForUpload(file);
          const processedFile = prepared?.processedFile ?? file;
          const metadata = prepared?.metadata ?? null;
          const videoMeta = isVideo ? await videoDimensions(file) : null;
          const path = `${proprieteId}/${objetId}/${crypto.randomUUID()}.${extOf(processedFile.name)}`;

          const { data: signed, error: upErr } = await supabase.storage
            .from(OUVRAGE_PHOTO_BUCKET)
            .createSignedUploadUrl(path);
          if (upErr || !signed?.signedUrl) throw upErr ?? new Error('Envoi indisponible');
          mark(i, { status: 'uploading', sizeBytes: processedFile.size, sentBytes: 0 });
          await putSigned(signed.signedUrl, processedFile, (sentBytes) => mark(i, { sentBytes }));

          mark(i, { status: 'saving' });
          await insertWithStorageRollback({
            bucket: OUVRAGE_PHOTO_BUCKET,
            storagePath: path,
            insertFn: async () => {
              const { data, error } = await (supabase as any)
                .from('propriete_objet_photos')
                .insert({
                  propriete_id: proprieteId,
                  objet_id: objetId,
                  storage_path: path,
                  mime: processedFile.type || null,
                  media_type: isVideo ? 'video' : 'photo',
                  size_bytes: processedFile.size,
                  width: videoMeta?.width ?? metadata?.dimensions?.width ?? null,
                  height: videoMeta?.height ?? metadata?.dimensions?.height ?? null,
                  duration_s: videoMeta?.duration ?? null,
                  taken_at: metadata?.date_taken ?? null,
                  lat: metadata?.gps?.latitude ?? null,
                  lng: metadata?.gps?.longitude ?? null,
                  uploaded_by: uid,
                  order_index: base + i,
                })
                .select()
                .single();
              if (error) throw error;
              return data;
            },
          });
          ok++;
          mark(i, { status: 'done' });
        } catch (err: any) {
          console.error('[useObjetPhotos] upload failed', file.name, err);
          mark(i, { status: 'error', error: err?.message || 'échec de l’envoi' });
          toast.error(`${file.name} : ${err?.message || 'échec de l’envoi'}`);
        } finally {
          setProgress({ done: i + 1, total: list.length });
        }
      }

      setProgress(null);
      await invalidate();
      if (ok > 0) toast.success(`${ok} média${ok > 1 ? 's' : ''} ajouté${ok > 1 ? 's' : ''}`);
      return { ok, total: list.length };
    },
    [proprieteId, byObjet, invalidate],
  );

  const clearUploads = useCallback(() => setUploads([]), []);


  const remove = useCallback(
    async (photo: ObjetPhoto) => {
      try {
        const { error } = await (supabase as any)
          .from('propriete_objet_photos')
          .delete()
          .eq('id', photo.id);
        if (error) throw error;
        await supabase.storage.from(OUVRAGE_PHOTO_BUCKET).remove([photo.storage_path]);
        await invalidate();
        toast.success('Photo retirée du carnet');
      } catch (err: any) {
        toast.error(err?.message || 'Suppression impossible');
      }
    },
    [invalidate],
  );

  const setCaption = useCallback(
    async (photoId: string, caption: string) => {
      const { error } = await (supabase as any)
        .from('propriete_objet_photos')
        .update({ caption: caption.trim() || null })
        .eq('id', photoId);
      if (error) {
        toast.error(error.message);
        return;
      }
      await invalidate();
    },
    [invalidate],
  );

  const reorder = useCallback(
    async (objetId: string, orderedIds: string[]) => {
      // Optimiste : on réordonne le cache immédiatement.
      qc.setQueryData(KEY(proprieteId), (prev: ObjetPhoto[] | undefined) => {
        if (!prev) return prev;
        const rank = new Map(orderedIds.map((id, i) => [id, i]));
        return [...prev]
          .map((p) => (rank.has(p.id) ? { ...p, order_index: rank.get(p.id)! } : p))
          .sort((a, b) => a.order_index - b.order_index);
      });
      const { error } = await supabase.rpc('reorder_propriete_objet_photos' as any, {
        _objet_id: objetId,
        _ids: orderedIds,
      });
      if (error) {
        toast.error(error.message);
      }
      await invalidate();
    },
    [qc, proprieteId, invalidate],
  );

  return {
    photos,
    byObjet,
    counts,
    loading: query.isLoading,
    progress,
    uploads,
    clearUploads,

    upload,
    remove,
    setCaption,
    reorder,
    refetch: query.refetch,
  };
}

export default useObjetPhotos;
