
import imageCompression from 'browser-image-compression';
import exifr from 'exifr';
import {
  convertHeicToJpeg as convertHeicToJpegRobust,
  isHeic,
  hasHeicExtension,
  HeicConversionError,
} from './heicConverter';

export { HeicConversionError, HEIC_USER_MESSAGE } from './heicConverter';

export interface PhotoMetadata {
  width?: number;
  height?: number;
  format: string;
  size: number;
  isConverted: boolean;
  originalFormat?: string;
  exif?: Record<string, any>;
}

export interface ProcessedPhoto {
  file: File;
  metadata: PhotoMetadata;
  thumbnail: string;
  preview: string;
}

// Formats supportés
export const SUPPORTED_PHOTO_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
  'image/tiff',
  'image/bmp',
];

// Vérifier si le format est supporté (détection large)
export const isSupportedPhotoFormat = (file: File): boolean => {
  if (SUPPORTED_PHOTO_FORMATS.includes(file.type)) return true;
  if (file.type?.startsWith('image/')) return true;
  const ext = file.name.toLowerCase();
  return ext.endsWith('.heic') || ext.endsWith('.heif') ||
         ext.endsWith('.jpg') || ext.endsWith('.jpeg') ||
         ext.endsWith('.png') || ext.endsWith('.webp') ||
         ext.endsWith('.gif') || ext.endsWith('.tiff') || ext.endsWith('.bmp');
};

// Convertir HEIC/HEIF en JPEG — délégué au module robuste
// (cascade de stratégies + fail-fast si conversion impossible)
export const convertHeicToJpeg = (file: File): Promise<File> => convertHeicToJpegRobust(file);


// Extraire les métadonnées EXIF
export const extractPhotoMetadata = async (file: File): Promise<PhotoMetadata> => {
  const originalFormat = file.type || 'unknown';
  const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
  
  try {
    const exifData = await exifr.parse(file);
    
    return {
      width: exifData?.ImageWidth || exifData?.ExifImageWidth,
      height: exifData?.ImageHeight || exifData?.ExifImageHeight,
      format: file.type,
      size: file.size,
      isConverted: isHeic,
      originalFormat: isHeic ? 'image/heic' : originalFormat,
      exif: exifData || {}
    };
  } catch (error) {
    console.warn('⚠️ Impossible d\'extraire les métadonnées EXIF:', error);
    return {
      format: file.type,
      size: file.size,
      isConverted: isHeic,
      originalFormat: isHeic ? 'image/heic' : originalFormat,
      exif: {}
    };
  }
};

// Générer une miniature
export const generateThumbnail = async (file: File, maxWidth: number = 150): Promise<string> => {
  try {
    const options = {
      maxWidthOrHeight: maxWidth,
      useWebWorker: true,
      fileType: 'image/jpeg',
      quality: 0.8
    };
    
    const compressedFile = await imageCompression(file, options);
    return URL.createObjectURL(compressedFile);
  } catch (error) {
    console.warn('⚠️ Erreur génération miniature:', error);
    return URL.createObjectURL(file);
  }
};

// Traiter une photo complètement
export const processPhoto = async (file: File): Promise<ProcessedPhoto> => {
  console.log('🔄 Traitement photo:', file.name);
  
  // Accepter tous les formats image courants + HEIC/HEIF sans bloquer
  if (!isSupportedPhotoFormat(file)) {
    console.warn(`⚠️ Format non standard détecté: ${file.type || 'inconnu'} (${file.name}), tentative de traitement...`);
  }

  // Convertir HEIC si nécessaire (fallback silencieux si échec)
  const processedFile = await convertHeicToJpeg(file);
  
  // Extraire métadonnées
  const metadata = await extractPhotoMetadata(file);
  
  // Générer miniature et aperçu
  const thumbnail = await generateThumbnail(processedFile, 150);
  const preview = URL.createObjectURL(processedFile);

  console.log('✅ Photo traitée:', {
    original: file.name,
    processed: processedFile.name,
    converted: metadata.isConverted
  });

  return {
    file: processedFile,
    metadata,
    thumbnail,
    preview
  };
};

// Formater la taille des fichiers
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Formater les dimensions
export const formatDimensions = (width?: number, height?: number): string => {
  if (!width || !height) return 'Dimensions inconnues';
  return `${width} × ${height}`;
};
