import { supabase } from '@/integrations/supabase/client';
import { convertHeicToJpeg, isHeic } from '@/utils/heicConverter';

export const GALLERY_BUCKET = 'onboarding-gallery';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_EDGE = 1600;
export const QUALITY = 0.8;

const loadBitmap = async (blob: Blob): Promise<ImageBitmap | HTMLImageElement> => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob);
    } catch {
      /* fallback <img> */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image illisible'));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
};

/** Redimensionne à 1600 px max sur le côté long, sortie WebP (repli JPEG). */
export async function compressImage(file: File): Promise<{ blob: Blob; ext: string; contentType: string }> {
  const source: Blob = (await isHeic(file)) ? await convertHeicToJpeg(file, { quality: QUALITY }) : file;

  try {
    const bitmap = await loadBitmap(source);
    const w = (bitmap as ImageBitmap).width;
    const h = (bitmap as ImageBitmap).height;
    if (!w || !h) throw new Error('Dimensions inconnues');

    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponible');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, tw, th);
    if ('close' in bitmap && typeof (bitmap as ImageBitmap).close === 'function') {
      (bitmap as ImageBitmap).close();
    }

    const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY));
    if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp', contentType: 'image/webp' };

    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (jpeg) return { blob: jpeg, ext: 'jpg', contentType: 'image/jpeg' };
  } catch {
    /* on retombe sur l'original */
  }

  const type = source.type || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  return { blob: source, ext, contentType: type };
}

/**
 * Téléverse une image dans le bucket public `onboarding-gallery`
 * et renvoie l'URL publique absolue (jamais un simple chemin de stockage).
 */
export async function uploadGalleryImage(file: File, pathBuilder: (ext: string) => string): Promise<string> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
    throw new Error('Format non supporté. Utilisez JPG, PNG, WebP ou HEIC.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Fichier trop lourd. Limite : 5 Mo.');
  }

  const { blob, ext, contentType } = await compressImage(file);
  const path = pathBuilder(ext);

  const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(path, blob, {
    upsert: true,
    contentType,
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message || 'Téléversement impossible');

  const { data } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('URL publique introuvable');
  return data.publicUrl;
}

export const slugifyForPath = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'sans-titre';
