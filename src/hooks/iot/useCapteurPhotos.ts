import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { preparePhotoForUpload, insertWithStorageRollback } from '@/utils/uploadWithMetadata';

/** Bucket privé déjà en place pour les médias de propriété. */
export const IOT_PHOTO_BUCKET = 'propriete-tests';

export interface CapteurPhoto {
  id: string;
  capteur_id: string;
  propriete_id: string;
  storage_path: string;
  mime: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  caption: string | null;
  taken_at: string | null;
  lat: number | null;
  lng: number | null;
  order_index: number;
  uploaded_by: string | null;
  created_at: string;
  /** URL signée résolue côté client (1 h). */
  url?: string;
}

const db = supabase as any;
const KEY = (capteurId?: string) => ['iot-capteur-photos', capteurId];
const COVERS_KEY = (ids: string[]) => ['iot-capteur-covers', [...ids].sort().join(',')];

const signAll = async (rows: CapteurPhoto[]): Promise<CapteurPhoto[]> => {
  if (rows.length === 0) return [];
  const { data: signed } = await supabase.storage
    .from(IOT_PHOTO_BUCKET)
    .createSignedUrls(rows.map((r) => r.storage_path), 3600);
  const byPath = new Map<string, string>();
  (signed ?? []).forEach((s: any) => {
    if (s?.path && s?.signedUrl) byPath.set(s.path, s.signedUrl);
  });
  return rows.map((r) => ({ ...r, url: byPath.get(r.storage_path) }));
};

/** Le reportage photo d'un capteur, dans l'ordre voulu. */
export function useCapteurPhotos(capteurId?: string) {
  return useQuery<CapteurPhoto[]>({
    queryKey: KEY(capteurId),
    enabled: !!capteurId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await db
        .from('iot_capteur_photos')
        .select('*')
        .eq('capteur_id', capteurId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return signAll((data ?? []) as CapteurPhoto[]);
    },
  });
}

/** Photo de couverture par capteur — pour les pastilles du plan et les cartes. */
export function useCapteurCovers(capteurIds: string[]) {
  return useQuery<Record<string, { url?: string; count: number }>>({
    queryKey: COVERS_KEY(capteurIds),
    enabled: capteurIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await db
        .from('iot_capteur_photos')
        .select('id,capteur_id,storage_path,order_index,created_at')
        .in('capteur_id', capteurIds)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as CapteurPhoto[];
      const first = new Map<string, CapteurPhoto>();
      const counts: Record<string, number> = {};
      rows.forEach((r) => {
        counts[r.capteur_id] = (counts[r.capteur_id] ?? 0) + 1;
        if (!first.has(r.capteur_id)) first.set(r.capteur_id, r);
      });
      const signedRows = await signAll([...first.values()]);
      const out: Record<string, { url?: string; count: number }> = {};
      Object.keys(counts).forEach((id) => {
        out[id] = { count: counts[id], url: signedRows.find((r) => r.capteur_id === id)?.url };
      });
      return out;
    },
  });
}

export interface PhotoUploadItem {
  key: string;
  name: string;
  size: number;
  sent: number;
  status: 'pending' | 'preparing' | 'uploading' | 'saving' | 'done' | 'error';
  error?: string;
}

const extOf = (name: string) => (name.split('.').pop() || 'jpg').toLowerCase();

function putSigned(signedUrl: string, file: File, onProgress: (sent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Envoi refusé (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Réseau indisponible.'));
    xhr.send(file);
  });
}

/** Envoi multiple avec progression, EXIF (date + GPS) conservé. */
export function useCapteurPhotoUpload(capteurId?: string, proprieteId?: string) {
  const qc = useQueryClient();
  const [items, setItems] = React.useState<PhotoUploadItem[]>([]);

  const patch = React.useCallback((key: string, p: Partial<PhotoUploadItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it)));
  }, []);

  const upload = React.useCallback(
    async (files: File[], startOrder: number) => {
      if (!capteurId || !proprieteId || files.length === 0) return;
      const queued: PhotoUploadItem[] = files.map((f, i) => ({
        key: `${Date.now()}-${i}-${f.name}`,
        name: f.name,
        size: f.size,
        sent: 0,
        status: 'pending',
      }));
      setItems((prev) => [...prev, ...queued]);

      let order = startOrder;
      let ok = 0;
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const key = queued[i].key;
        try {
          patch(key, { status: 'preparing' });
          const prepared = await preparePhotoForUpload(file);
          const processed = prepared.processedFile;
          const path = `${proprieteId}/iot/${capteurId}/${crypto.randomUUID()}.${extOf(processed.name)}`;

          const { data: signed, error: signErr } = await supabase.storage
            .from(IOT_PHOTO_BUCKET)
            .createSignedUploadUrl(path);
          if (signErr || !signed?.signedUrl) throw signErr ?? new Error('URL d’envoi indisponible.');

          patch(key, { status: 'uploading', size: processed.size, sent: 0 });
          await putSigned(signed.signedUrl, processed, (sent) => patch(key, { sent }));

          patch(key, { status: 'saving' });
          await insertWithStorageRollback({
            bucket: IOT_PHOTO_BUCKET,
            storagePath: path,
            insertFn: async () => {
              const { data: auth } = await supabase.auth.getUser();
              const { error } = await db.from('iot_capteur_photos').insert({
                capteur_id: capteurId,
                propriete_id: proprieteId,
                storage_path: path,
                mime: processed.type || null,
                size_bytes: processed.size,
                width: prepared.metadata.dimensions?.width ?? null,
                height: prepared.metadata.dimensions?.height ?? null,
                taken_at: prepared.metadata.date_taken ?? null,
                lat: (prepared.metadata as any).gps?.latitude ?? null,
                lng: (prepared.metadata as any).gps?.longitude ?? null,
                uploaded_by: auth.user?.id,
                order_index: order++,
              });
              if (error) throw error;
              return true;
            },
          });
          patch(key, { status: 'done', sent: processed.size });
          ok += 1;
        } catch (e: any) {
          patch(key, { status: 'error', error: e?.message ?? 'Envoi impossible.' });
        }
      }

      if (ok > 0) {
        toast.success(`${ok} photo${ok > 1 ? 's' : ''} ajoutée${ok > 1 ? 's' : ''}`);
        qc.invalidateQueries({ queryKey: KEY(capteurId) });
        qc.invalidateQueries({ queryKey: ['iot-capteur-covers'] });
        setTimeout(() => setItems((prev) => prev.filter((it) => it.status !== 'done')), 2000);
      }
    },
    [capteurId, proprieteId, patch, qc],
  );

  const busy = items.some((it) => it.status !== 'done' && it.status !== 'error');
  return { items, upload, busy, dismiss: (key: string) => setItems((p) => p.filter((i) => i.key !== key)) };
}

/** Légende, couverture, ordre, suppression. */
export function useCapteurPhotoMutations(capteurId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY(capteurId) });
    qc.invalidateQueries({ queryKey: ['iot-capteur-covers'] });
  };

  const caption = useMutation({
    mutationFn: async ({ id, caption }: { id: string; caption: string | null }) => {
      const { error } = await db.from('iot_capteur_photos').update({ caption }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Légende non enregistrée.'),
  });

  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await db.rpc('reorder_iot_capteur_photos', { _capteur_id: capteurId, _ids: ids });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Ordre non enregistré.'),
  });

  const remove = useMutation({
    mutationFn: async (photo: CapteurPhoto) => {
      const { error } = await db.from('iot_capteur_photos').delete().eq('id', photo.id);
      if (error) throw error;
      await supabase.storage.from(IOT_PHOTO_BUCKET).remove([photo.storage_path]);
    },
    onSuccess: () => {
      toast.success('Photo retirée');
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? 'Suppression impossible.'),
  });

  return { caption, reorder, remove };
}
