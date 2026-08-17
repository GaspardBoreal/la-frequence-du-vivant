/**
 * Vignettes de photos de capteurs.
 *
 * Les photos d'appareil (4032 × 3024, 2 à 6 Mo) sont affichées dans des pastilles
 * de 36 px : on fabrique une miniature WebP côté navigateur pour que l'affichage
 * soit immédiat, l'original restant intact pour le plein écran et l'impression.
 */

export const THUMB_MAX_EDGE = 480;
export const THUMB_QUALITY = 0.72;

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

/**
 * Réduit une image à `maxEdge` px sur son côté long, en WebP.
 * Renvoie `null` si le navigateur n'y arrive pas — l'appelant retombe alors
 * silencieusement sur l'original.
 */
export async function makeThumbnail(
  source: Blob,
  maxEdge = THUMB_MAX_EDGE,
): Promise<Blob | null> {
  try {
    const bitmap = await loadBitmap(source);
    const w = (bitmap as ImageBitmap).width;
    const h = (bitmap as ImageBitmap).height;
    if (!w || !h) return null;

    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, tw, th);
    if ('close' in bitmap && typeof (bitmap as ImageBitmap).close === 'function') {
      (bitmap as ImageBitmap).close();
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', THUMB_QUALITY),
    );
    // Certains navigateurs anciens ignorent le WebP : on retente en JPEG.
    if (blob) return blob;
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.75),
    );
  } catch {
    return null;
  }
}

/** Chemin de la vignette associée à un original. */
export const thumbPathFor = (storagePath: string, ext = 'webp') =>
  `${storagePath.replace(/\.[^./]+$/, '')}-thumb.${ext}`;
