/**
 * Pipeline atomique : EXIF → conversion HEIC → upload Storage → insert DB → rollback si KO.
 *
 * Garantit que :
 *  1. Les métadonnées EXIF sont extraites du File ORIGINAL (avant conversion).
 *  2. Si l'insert DB échoue, le fichier Storage est supprimé pour éviter les orphelins.
 *
 * Chaque flow (marcheur_medias, marche_photos, etc.) fournit ses propres callbacks
 * d'upload Storage et d'insert DB — le helper ne connaît pas la table cible.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  convertHeicToJpeg,
  isHeic,
  HeicConversionError,
  HEIC_USER_MESSAGE,
} from '@/utils/heicConverter';
import {
  extractMediaMetadata,
  type MediaMetadata,
} from '@/utils/mediaMetadata';

export interface PreparedUpload {
  /** Fichier prêt à être uploadé (HEIC déjà converti si applicable). */
  processedFile: File;
  /** Metadata extraite du File ORIGINAL (avant conversion). */
  metadata: MediaMetadata;
}

/**
 * Étape 1 : extraction EXIF + conversion HEIC.
 * À appeler AVANT toute interaction avec le storage.
 */
export async function preparePhotoForUpload(file: File): Promise<PreparedUpload> {
  // Étape A : extraction EXIF sur le fichier ORIGINAL (sinon HEIC perd ses tags après conversion).
  const looksImage =
    (file.type || '').startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|bmp|tiff|heic|heif)$/i.test(file.name);

  let metadata: MediaMetadata;
  if (looksImage) {
    metadata = await extractMediaMetadata(file);
  } else {
    metadata = {
      schema_version: 1,
      gps: null,
      date_taken: null,
      dimensions: null,
      file: {
        original_name: file.name,
        size_bytes: file.size,
        mime: file.type || 'application/octet-stream',
        was_heic_converted: false,
      },
      extracted_at: new Date().toISOString(),
      extraction_status: 'partial',
      extraction_warnings: ['not_an_image'],
    };
  }

  // Étape B : conversion HEIC si nécessaire.
  let processedFile = file;
  if (looksImage && (await isHeic(file))) {
    try {
      processedFile = await convertHeicToJpeg(file);
      metadata.file.was_heic_converted = true;
    } catch (err) {
      if (err instanceof HeicConversionError) {
        throw new Error(HEIC_USER_MESSAGE);
      }
      throw err;
    }
  }

  console.log('[uploadWithMetadata] prepared', {
    name: file.name,
    extraction_status: metadata.extraction_status,
    has_gps: !!metadata.gps,
    has_date: !!metadata.date_taken,
    converted: metadata.file.was_heic_converted,
  });

  return { processedFile, metadata };
}

export interface AtomicInsertOptions<T> {
  /** Bucket Storage (ex : "marcheur-uploads"). */
  bucket: string;
  /** Path Storage du fichier déjà uploadé (ex : "userId/photos/abc.jpg"). */
  storagePath: string;
  /** Fonction d'insertion DB (lance si erreur, retourne le row inséré). */
  insertFn: () => Promise<T>;
}

/**
 * Étape 3 : exécute l'insert DB, et en cas d'échec supprime le fichier Storage
 * pour éviter les orphelins. Renvoie le row inséré.
 */
export async function insertWithStorageRollback<T>(
  opts: AtomicInsertOptions<T>
): Promise<T> {
  try {
    const row = await opts.insertFn();
    return row;
  } catch (err) {
    console.warn(
      '[uploadWithMetadata] DB insert failed, rolling back storage',
      { bucket: opts.bucket, path: opts.storagePath, err }
    );
    try {
      await supabase.storage.from(opts.bucket).remove([opts.storagePath]);
    } catch (rollbackErr) {
      console.warn('[uploadWithMetadata] rollback storage failed', rollbackErr);
    }
    throw err;
  }
}
