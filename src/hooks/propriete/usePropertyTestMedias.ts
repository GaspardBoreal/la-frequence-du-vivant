/**
 * Médias de terrain (photos / vidéos courtes) attachés à un couple
 * prélèvement × test de sol, pour une propriété.
 *
 * Lecture : une seule requête par propriété + signature d'URL en lot.
 * Écriture : upload Storage (bucket privé `propriete-tests`) puis insert DB
 * avec rollback storage en cas d'échec.
 */
import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { preparePhotoForUpload, insertWithStorageRollback } from '@/utils/uploadWithMetadata';
import type { SoilBlockId, SoilTestId } from '@/components/propriete/analyze/media/soilTestCatalog';

export const TEST_MEDIA_BUCKET = 'propriete-tests';
/** Limite réelle du serveur Storage (plafond global du projet) : 50 Mo. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;

export const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`;

export const isVideoFile = (file: File) =>
  (file.type || '').startsWith('video/') || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(file.name);

/** Vérifie qu'un fichier est acceptable AVANT tout envoi. Renvoie un message si refusé. */
export function checkTestMediaFile(file: File): string | null {
  const video = isVideoFile(file);
  const max = video ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
  if (file.size > max) {
    return video
      ? `Vidéo de ${formatBytes(file.size)} — le serveur accepte ${formatBytes(MAX_VIDEO_BYTES)} au maximum. Filmez 20 s en 1080p plutôt qu'en 4K, ou compressez la séquence.`
      : `Photo de ${formatBytes(file.size)} — ${formatBytes(MAX_PHOTO_BYTES)} au maximum.`;
  }
  return null;
}

/** Traduit une erreur d'envoi en phrase lisible. */
function humanUploadError(status: number, raw: string): string {
  if (status === 413 || /exceeded the maximum allowed size|payload too large/i.test(raw))
    return `Fichier refusé par le serveur : il dépasse ${formatBytes(MAX_VIDEO_BYTES)}.`;
  if (status === 400 && /mime|content type/i.test(raw)) return 'Format de fichier refusé par le serveur.';
  if (status === 400) return `Fichier refusé par le serveur (trop lourd ou format non accepté).`;
  if (status === 401 || status === 403) return 'Session expirée : reconnectez-vous puis réessayez.';
  if (status === 0) return 'Connexion interrompue pendant l’envoi.';
  return raw || `Erreur serveur (${status}).`;
}

export interface TestMedia {
  id: string;
  propriete_id: string;
  sample_id: string;
  sample_label: string | null;
  sample_location: string | null;
  block: SoilBlockId;
  test_id: SoilTestId;
  media_type: 'photo' | 'video';
  storage_path: string;
  mime: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_s: number | null;
  caption: string | null;
  taken_at: string | null;
  uploaded_by: string;
  order_index: number;
  created_at: string;
  /** URL signée résolue côté client (1 h). */
  url?: string;
}

const KEY = (id?: string) => ['propriete-test-medias', id];

export function usePropertyTestMedias(proprieteId?: string) {
  return useQuery({
    queryKey: KEY(proprieteId),
    enabled: !!proprieteId,
    staleTime: 30_000,
    queryFn: async (): Promise<TestMedia[]> => {
      const { data, error } = await (supabase as any)
        .from('propriete_test_medias')
        .select('*')
        .eq('propriete_id', proprieteId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as TestMedia[];
      if (rows.length === 0) return [];
      const { data: signed } = await supabase.storage
        .from(TEST_MEDIA_BUCKET)
        .createSignedUrls(rows.map((r) => r.storage_path), 3600);
      const byPath = new Map<string, string>();
      (signed ?? []).forEach((s: any) => {
        if (s?.path && s?.signedUrl) byPath.set(s.path, s.signedUrl);
      });
      return rows.map((r) => ({ ...r, url: byPath.get(r.storage_path) }));
    },
  });
}

export interface UploadTarget {
  proprieteId: string;
  sampleId: string;
  sampleLabel?: string | null;
  sampleLocation?: string | null;
  block: SoilBlockId;
  testId: SoilTestId;
}

const extOf = (name: string) => (name.split('.').pop() || 'bin').toLowerCase();

const videoDimensions = (file: File) =>
  new Promise<{ width: number; height: number; duration: number } | null>((resolve) => {
    try {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        resolve({ width: v.videoWidth, height: v.videoHeight, duration: v.duration });
        URL.revokeObjectURL(v.src);
      };
      v.onerror = () => resolve(null);
      v.src = URL.createObjectURL(file);
    } catch {
      resolve(null);
    }
  });

export type UploadItemStatus = 'pending' | 'preparing' | 'uploading' | 'saving' | 'done' | 'error';

export interface UploadItem {
  key: string;
  name: string;
  size: number;
  sent: number;
  isVideo: boolean;
  status: UploadItemStatus;
  error?: string;
}

/** Envoi instrumenté (progression octet par octet) vers une URL signée Storage. */
function putSigned(signedUrl: string, file: File, onProgress: (sent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl, true);
    if (file.type) xhr.setRequestHeader('content-type', file.type);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(file.size);
        resolve();
      } else {
        reject(new Error(humanUploadError(xhr.status, xhr.responseText || '')));
      }
    };
    xhr.onerror = () => reject(new Error(humanUploadError(0, '')));
    xhr.onabort = () => reject(new Error('Envoi annulé.'));
    xhr.send(file);
  });
}

export function useTestMediaUpload(target?: UploadTarget) {
  const qc = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);

  const patchItem = useCallback((key: string, next: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...next } : it)));
  }, []);

  const upload = useCallback(
    async (files: File[]) => {
      if (!target) return;
      const list = Array.from(files);
      if (list.length === 0) return;

      const queued: { item: UploadItem; file: File }[] = list.map((file, i) => ({
        file,
        item: {
          key: `${Date.now()}-${i}-${file.name}`,
          name: file.name,
          size: file.size,
          sent: 0,
          isVideo: isVideoFile(file),
          status: 'pending' as UploadItemStatus,
        },
      }));

      // Refus immédiat des fichiers hors limite : l'utilisateur voit pourquoi avant tout transfert.
      queued.forEach((q) => {
        const refus = checkTestMediaFile(q.file);
        if (refus) {
          q.item.status = 'error';
          q.item.error = refus;
        }
      });

      setItems((prev) => [...prev, ...queued.map((q) => q.item)]);
      let ok = 0;

      // Rang de départ : à la suite des médias déjà classés dans ce groupe.
      let nextOrder = 1;
      try {
        const { data: last } = await (supabase as any)
          .from('propriete_test_medias')
          .select('order_index')
          .eq('propriete_id', target.proprieteId)
          .eq('sample_id', target.sampleId)
          .eq('test_id', target.testId)
          .order('order_index', { ascending: false })
          .limit(1);
        nextOrder = ((last?.[0]?.order_index as number) ?? 0) + 1;
      } catch {
        /* fallback : 1 */
      }

      for (const { file, item } of queued) {
        if (item.status === 'error') continue;
        const key = item.key;
        try {
          const isVideo = item.isVideo;
          patchItem(key, { status: 'preparing' });

          let processed = file;
          let takenAt: string | null = null;
          let width: number | null = null;
          let height: number | null = null;
          let duration: number | null = null;

          if (isVideo) {
            const dim = await videoDimensions(file);
            width = dim?.width ?? null;
            height = dim?.height ?? null;
            duration = dim?.duration ?? null;
          } else {
            const prepared = await preparePhotoForUpload(file);
            processed = prepared.processedFile;
            takenAt = prepared.metadata.date_taken;
            width = prepared.metadata.dimensions?.width ?? null;
            height = prepared.metadata.dimensions?.height ?? null;
          }

          const path = `${target.proprieteId}/${target.testId}/${target.sampleId}/${crypto.randomUUID()}.${extOf(
            processed.name
          )}`;

          const { data: signed, error: signErr } = await supabase.storage
            .from(TEST_MEDIA_BUCKET)
            .createSignedUploadUrl(path);
          if (signErr || !signed?.signedUrl) throw signErr ?? new Error('URL d’envoi indisponible.');

          patchItem(key, { status: 'uploading', size: processed.size, sent: 0 });
          await putSigned(signed.signedUrl, processed, (sent) => patchItem(key, { sent }));

          patchItem(key, { status: 'saving' });
          await insertWithStorageRollback({
            bucket: TEST_MEDIA_BUCKET,
            storagePath: path,
            insertFn: async () => {
              const { data: auth } = await supabase.auth.getUser();
              const { error } = await (supabase as any).from('propriete_test_medias').insert({
                propriete_id: target.proprieteId,
                sample_id: target.sampleId,
                sample_label: target.sampleLabel ?? null,
                sample_location: target.sampleLocation ?? null,
                block: target.block,
                test_id: target.testId,
                media_type: isVideo ? 'video' : 'photo',
                storage_path: path,
                mime: processed.type || null,
                size_bytes: processed.size,
                width,
                height,
                duration_s: duration,
                taken_at: takenAt,
                uploaded_by: auth.user?.id,
                order_index: nextOrder++,
              });
              if (error) throw error;
              return true;
            },
          });
          patchItem(key, { status: 'done', sent: processed.size });
          ok += 1;
        } catch (e: any) {
          patchItem(key, { status: 'error', error: e?.message ?? 'Envoi impossible.' });
        }
      }

      if (ok > 0) {
        toast.success(`${ok} preuve${ok > 1 ? 's' : ''} ajoutée${ok > 1 ? 's' : ''}`);
        qc.invalidateQueries({ queryKey: KEY(target.proprieteId) });
        // Les lignes réussies s'effacent d'elles-mêmes ; les erreurs restent lisibles.
        setTimeout(() => setItems((prev) => prev.filter((it) => it.status !== 'done')), 2200);
      }
    },
    [target, qc, patchItem]
  );

  const dismiss = useCallback((key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const clearDone = useCallback(() => {
    setItems((prev) => prev.filter((it) => it.status !== 'done'));
  }, []);

  const active = items.some((it) => it.status !== 'done' && it.status !== 'error');

  /** Compat historique : compteur agrégé pour les vues qui l'utilisent encore. */
  const progress = items.length
    ? { done: items.filter((it) => it.status === 'done' || it.status === 'error').length, total: items.length }
    : null;

  return { upload, items, dismiss, clearDone, busy: active, progress };
}

export function useTestMediaMutations(proprieteId?: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY(proprieteId) });

  const remove = useMutation({
    mutationFn: async (media: TestMedia) => {
      const { error } = await (supabase as any)
        .from('propriete_test_medias')
        .delete()
        .eq('id', media.id);
      if (error) throw error;
      await supabase.storage.from(TEST_MEDIA_BUCKET).remove([media.storage_path]);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Média supprimé');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Suppression impossible'),
  });

  const patch = useMutation({
    mutationFn: async ({ id, caption }: { id: string; caption: string | null }) => {
      const { error } = await (supabase as any)
        .from('propriete_test_medias')
        .update({ caption })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Enregistrement impossible'),
  });

  /** Réordonne les preuves d'un couple prélèvement × test (ordre = index du tableau). */
  const reorder = useMutation({
    mutationFn: async ({
      sampleId,
      testId,
      ids,
    }: {
      sampleId: string;
      testId: SoilTestId;
      ids: string[];
    }) => {
      // Optimiste : le cache reflète immédiatement le nouvel ordre.
      qc.setQueryData(KEY(proprieteId), (prev: TestMedia[] | undefined) => {
        if (!prev) return prev;
        const rank = new Map(ids.map((id, i) => [id, i + 1]));
        return [...prev]
          .map((m) => (rank.has(m.id) ? { ...m, order_index: rank.get(m.id)! } : m))
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      });
      const { error } = await (supabase as any).rpc('reorder_propriete_test_medias', {
        _propriete_id: proprieteId,
        _sample_id: sampleId,
        _test_id: testId,
        _ids: ids,
      });
      if (error) throw error;
    },
    onSettled: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Réordonnancement impossible'),
  });


  return { remove, patch, reorder };
}

/** Tri canonique des preuves de terrain : ordre choisi par l'utilisateur, puis date. */
export const sortTestMedias = <T extends { order_index?: number | null; created_at: string }>(
  list: T[],
): T[] =>
  [...list].sort((a, b) => {
    const d = (a.order_index ?? 0) - (b.order_index ?? 0);
    if (d !== 0) return d;
    return String(a.created_at).localeCompare(String(b.created_at));
  });

/** Index rapide : combien de médias par couple test × prélèvement. */
export function useTestMediaIndex(medias: TestMedia[] | undefined) {
  return useMemo(() => {
    const map = new Map<string, TestMedia[]>();
    (medias ?? []).forEach((m) => {
      const k = `${m.test_id}::${m.sample_id}`;
      const arr = map.get(k) ?? [];
      arr.push(m);
      map.set(k, arr);
    });
    return map;
  }, [medias]);
}
