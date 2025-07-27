
import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

// Fonction utilitaire pour nettoyer les noms de fichiers
const cleanFileName = (fileName: string): string => {
  // Remplacer les espaces par des underscores et supprimer les caractères spéciaux
  return fileName
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
};

// Fonction utilitaire pour valider les formats audio
const validateAudioFormat = (file: File): { valid: boolean; error?: string } => {
  const supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
  const supportedMimeTypes = [
    'audio/mpeg',
    'audio/wav', 
    'audio/wave',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'audio/flac'
  ];
  
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const mimeType = file.type.toLowerCase();
  
  console.log('🔍 [validateAudioFormat] Validation format:', {
    fileName: file.name,
    fileExtension,
    mimeType,
    supportedFormats,
    supportedMimeTypes
  });
  
  if (!supportedFormats.includes(fileExtension)) {
    return {
      valid: false,
      error: `Format de fichier non supporté: ${fileExtension}. Formats acceptés: ${supportedFormats.join(', ')}`
    };
  }
  
  if (!mimeType.startsWith('audio/') && !supportedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Type MIME non supporté: ${mimeType}. Types acceptés: ${supportedMimeTypes.join(', ')}`
    };
  }
  
  return { valid: true };
};

// Upload d'une photo vers Supabase Storage
export const uploadPhoto = async (file: File, marcheId: string): Promise<UploadResult> => {
  console.log('📤 [uploadPhoto] Début upload:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    marcheId
  });

  if (!file) {
    const error = new Error('Fichier manquant');
    console.error('❌ [uploadPhoto] Erreur:', error.message);
    throw error;
  }

  if (!marcheId) {
    const error = new Error('ID de marche manquant');
    console.error('❌ [uploadPhoto] Erreur:', error.message);
    throw error;
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanedFileName = cleanFileName(file.name);
    const fileName = `${marcheId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    console.log('📁 [uploadPhoto] Nom fichier généré:', fileName);
    
    const { data, error } = await supabase.storage
      .from('marche-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('❌ [uploadPhoto] Erreur Storage:', error);
      throw error;
    }

    console.log('✅ [uploadPhoto] Upload Storage réussi:', data);

    const { data: { publicUrl } } = supabase.storage
      .from('marche-photos')
      .getPublicUrl(fileName);

    console.log('🔗 [uploadPhoto] URL publique générée:', publicUrl);

    const result = {
      url: publicUrl,
      path: fileName
    };

    console.log('✅ [uploadPhoto] Upload terminé avec succès:', result);
    return result;
  } catch (error) {
    console.error('💥 [uploadPhoto] Erreur complète:', error);
    throw error;
  }
};

// Upload d'une vidéo vers Supabase Storage
export const uploadVideo = async (file: File, marcheId: string): Promise<UploadResult> => {
  console.log('📤 [uploadVideo] Début upload:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    marcheId
  });

  if (!file) {
    const error = new Error('Fichier manquant');
    console.error('❌ [uploadVideo] Erreur:', error.message);
    throw error;
  }

  if (!marcheId) {
    const error = new Error('ID de marche manquant');
    console.error('❌ [uploadVideo] Erreur:', error.message);
    throw error;
  }

  try {
    const fileExt = file.name.split('.').pop() || 'mp4';
    const cleanedFileName = cleanFileName(file.name);
    const fileName = `${marcheId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    console.log('📁 [uploadVideo] Nom fichier généré:', fileName);
    
    const { data, error } = await supabase.storage
      .from('marche-videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('❌ [uploadVideo] Erreur Storage:', error);
      throw error;
    }

    console.log('✅ [uploadVideo] Upload Storage réussi:', data);

    const { data: { publicUrl } } = supabase.storage
      .from('marche-videos')
      .getPublicUrl(fileName);

    console.log('🔗 [uploadVideo] URL publique générée:', publicUrl);

    const result = {
      url: publicUrl,
      path: fileName
    };

    console.log('✅ [uploadVideo] Upload terminé avec succès:', result);
    return result;
  } catch (error) {
    console.error('💥 [uploadVideo] Erreur complète:', error);
    throw error;
  }
};

// Upload d'un fichier audio vers Supabase Storage avec progression simulée
export const uploadAudio = async (file: File, marcheId: string, onProgress?: UploadProgressCallback): Promise<UploadResult> => {
  console.log('📤 [uploadAudio] ========== DÉBUT UPLOAD AUDIO ==========');
  console.log('📤 [uploadAudio] Paramètres:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    marcheId
  });

  if (!file) {
    const error = new Error('Fichier manquant');
    console.error('❌ [uploadAudio] Erreur:', error.message);
    throw error;
  }

  if (!marcheId) {
    const error = new Error('ID de marche manquant');
    console.error('❌ [uploadAudio] Erreur:', error.message);
    throw error;
  }

  let progressInterval: NodeJS.Timeout | null = null;

  try {
    // ÉTAPE 1: Validation du format audio
    console.log('🔍 [uploadAudio] ÉTAPE 1 - Validation format audio');
    const formatValidation = validateAudioFormat(file);
    if (!formatValidation.valid) {
      const error = new Error(formatValidation.error || 'Format audio invalide');
      console.error('❌ [uploadAudio] Format invalide:', formatValidation.error);
      onProgress?.(0);
      throw error;
    }
    console.log('✅ [uploadAudio] Format audio validé');
    onProgress?.(5);

    // ÉTAPE 2: Nettoyage du nom de fichier
    console.log('🔍 [uploadAudio] ÉTAPE 2 - Nettoyage nom fichier');
    const originalName = file.name;
    const cleanedOriginalName = cleanFileName(originalName);
    const fileExt = originalName.split('.').pop() || 'mp3';
    const fileName = `${marcheId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    console.log('📁 [uploadAudio] Noms fichiers:', {
      original: originalName,
      cleaned: cleanedOriginalName,
      final: fileName
    });
    onProgress?.(10);
    
    // ÉTAPE 3: Démarrer la progression simulée
    console.log('🔍 [uploadAudio] ÉTAPE 3 - Démarrage progression');
    let currentProgress = 20;
    progressInterval = setInterval(() => {
      if (currentProgress < 60) {
        currentProgress += Math.random() * 8 + 2;
        currentProgress = Math.min(currentProgress, 60);
        onProgress?.(currentProgress);
        console.log(`📊 [uploadAudio] Progression simulée: ${currentProgress.toFixed(1)}%`);
      }
    }, 200);

    // ÉTAPE 4: Upload vers Supabase Storage
    console.log('🔍 [uploadAudio] ÉTAPE 4 - Upload Storage');
    console.log('📤 [uploadAudio] Tentative upload vers bucket marche-audio...');
    
    const { data, error } = await supabase.storage
      .from('marche-audio')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    // Arrêter la progression simulée
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }

    if (error) {
      console.error('❌ [uploadAudio] ERREUR STORAGE DÉTAILLÉE:', {
        error,
        code: error.message,
        fileName,
        fileSize: file.size,
        fileType: file.type,
        marcheId,
        bucketName: 'marche-audio'
      });
      onProgress?.(0);
      throw new Error(`Erreur Storage: ${error.message}`);
    }

    console.log('✅ [uploadAudio] Upload Storage réussi:', data);
    onProgress?.(70);

    // ÉTAPE 5: Génération URL publique
    console.log('🔍 [uploadAudio] ÉTAPE 5 - Génération URL publique');
    const { data: { publicUrl } } = supabase.storage
      .from('marche-audio')
      .getPublicUrl(fileName);

    console.log('🔗 [uploadAudio] URL publique générée:', publicUrl);
    onProgress?.(90);

    const result = {
      url: publicUrl,
      path: fileName
    };

    onProgress?.(100);
    console.log('🎉 [uploadAudio] ========== UPLOAD AUDIO TERMINÉ ==========');
    console.log('✅ [uploadAudio] Upload terminé avec succès:', result);
    return result;
    
  } catch (error) {
    // Nettoyer l'intervalle en cas d'erreur
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    onProgress?.(0);
    console.error('💥 [uploadAudio] ========== ERREUR CRITIQUE ==========');
    console.error('💥 [uploadAudio] Détails erreur:', {
      error,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      marcheId,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

// Obtenir la durée d'un fichier audio
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.src = URL.createObjectURL(file);
  });
};

// Obtenir la durée d'un fichier vidéo
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.addEventListener('loadedmetadata', () => {
      resolve(video.duration);
    });
    video.src = URL.createObjectURL(file);
  });
};
