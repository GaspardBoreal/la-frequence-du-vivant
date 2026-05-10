/**
 * Classification robuste de fichiers media côté upload.
 *
 * Pourquoi : sur Windows + Chrome/Edge, un fichier .HEIC arrive avec
 * `file.type === ""`. Un filtre naïf `f.type.startsWith('image/')` le drop
 * silencieusement. Cette fonction utilise MIME + extension + détection HEIC
 * (magic bytes via isHeic) pour décider.
 */
import { isHeic } from './heicConverter';

export type MediaKind = 'photo' | 'video' | 'unknown';

const PHOTO_EXT = /\.(jpe?g|png|webp|gif|bmp|tiff?|heic|heif|avif)$/i;
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv|avi|3gp|3g2|hevc)$/i;

/** Synchronous best-effort classifier (used by UI filters). */
export function classifyMediaFile(file: File): MediaKind {
  const mime = (file.type || '').toLowerCase();
  const name = file.name || '';

  if (mime.startsWith('image/')) return 'photo';
  if (mime.startsWith('video/')) return 'video';

  // MIME vide ou inconnu : se rabattre sur l'extension
  if (PHOTO_EXT.test(name)) return 'photo';
  if (VIDEO_EXT.test(name)) return 'video';

  return 'unknown';
}

/** Async deep-check (magic bytes) — utile pour les cas vraiment ambigus. */
export async function classifyMediaFileDeep(file: File): Promise<MediaKind> {
  const quick = classifyMediaFile(file);
  if (quick !== 'unknown') return quick;
  try {
    if (await isHeic(file)) return 'photo';
  } catch {
    /* ignore */
  }
  return 'unknown';
}

export interface ClassifiedBatch {
  photos: File[];
  videos: File[];
  unknown: File[];
}

export function classifyBatch(files: File[]): ClassifiedBatch {
  const out: ClassifiedBatch = { photos: [], videos: [], unknown: [] };
  for (const f of files) {
    const k = classifyMediaFile(f);
    if (k === 'photo') out.photos.push(f);
    else if (k === 'video') out.videos.push(f);
    else out.unknown.push(f);
  }
  return out;
}
