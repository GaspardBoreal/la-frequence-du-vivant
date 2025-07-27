import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

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
    const fileName = `${marcheId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    console.log('📁 [uploadPhoto] Nom fichier généré:', fileName);
    
    const { data, error } = await supabase.storage
      .from('marche-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
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
    const fileName = `${marcheId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    console.log('📁 [uploadVideo] Nom fichier généré:', fileName);
    
    const { data, error } = await supabase.storage
      .from('marche-videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
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
  console.log('📤 [uploadAudio] Début upload:', {
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

  try {
    const fileExt = file.name.split('.').pop() || 'mp3';
    const fileName = `${marcheId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    console.log('📁 [uploadAudio] Nom fichier généré:', fileName);
    
    // Démarrer la progression simulée
    let currentProgress = 20;
    const progressInterval = setInterval(() => {
      if (currentProgress < 60) {
        currentProgress += Math.random() * 8 + 2; // Progression de 2 à 10% par intervalle
        currentProgress = Math.min(currentProgress, 60);
        onProgress?.(currentProgress);
        console.log(`📊 [uploadAudio] Progression simulée: ${currentProgress.toFixed(1)}%`);
      }
    }, 200);

    const { data, error } = await supabase.storage
      .from('marche-audio')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    // Arrêter la progression simulée
    clearInterval(progressInterval);

    if (error) {
      console.error('❌ [uploadAudio] Erreur Storage:', error);
      onProgress?.(0);
      throw error;
    }

    console.log('✅ [uploadAudio] Upload Storage réussi:', data);
    
    // Progression finale pour l'upload Storage
    onProgress?.(60);

    const { data: { publicUrl } } = supabase.storage
      .from('marche-audio')
      .getPublicUrl(fileName);

    console.log('🔗 [uploadAudio] URL publique générée:', publicUrl);

    const result = {
      url: publicUrl,
      path: fileName
    };

    console.log('✅ [uploadAudio] Upload terminé avec succès:', result);
    return result;
  } catch (error) {
    console.error('💥 [uploadAudio] Erreur complète:', error);
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
