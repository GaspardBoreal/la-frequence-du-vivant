
import imageCompression from 'browser-image-compression';
import exifr from 'exifr';

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
  'image/tiff',
  'image/bmp'
];

// Vérifier si le format est supporté
export const isSupportedPhotoFormat = (file: File): boolean => {
  return SUPPORTED_PHOTO_FORMATS.includes(file.type) || 
         file.name.toLowerCase().endsWith('.heic') ||
         file.name.toLowerCase().endsWith('.heif');
};

// Convertir HEIC/HEIF en JPEG
export const convertHeicToJpeg = async (file: File): Promise<File> => {
  if (!file.type.includes('heic') && !file.type.includes('heif') && 
      !file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
    return file;
  }

  try {
    console.log('🔄 Conversion HEIC vers JPEG...', file.name);
    
    const { default: heic2any } = await import('heic2any');
    const convertPromise = heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Conversion HEIC timeout (30s)')), 30000)
    );
    const convertedBlob = await Promise.race([convertPromise, timeoutPromise]);

    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    const convertedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg'
    });

    console.log('✅ Conversion HEIC terminée:', convertedFile.name);
    return convertedFile;
  } catch (error) {
    console.error('❌ Erreur conversion HEIC:', error);
    throw new Error('Impossible de convertir le fichier HEIC');
  }
};

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
  
  // Vérifier le format
  if (!isSupportedPhotoFormat(file)) {
    throw new Error(`Format non supporté: ${file.type}`);
  }

  // Convertir HEIC si nécessaire
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
