
import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  url: string;
  path: string;
}

// Upload d'une photo vers Supabase Storage
export const uploadPhoto = async (file: File, marcheId: string): Promise<UploadResult> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${marcheId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('marche-photos')
    .upload(fileName, file);

  if (error) {
    console.error('Erreur upload photo:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('marche-photos')
    .getPublicUrl(fileName);

  return {
    url: publicUrl,
    path: fileName
  };
};

// Upload d'une vidéo vers Supabase Storage
export const uploadVideo = async (file: File, marcheId: string): Promise<UploadResult> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${marcheId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('marche-videos')
    .upload(fileName, file);

  if (error) {
    console.error('Erreur upload vidéo:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('marche-videos')
    .getPublicUrl(fileName);

  return {
    url: publicUrl,
    path: fileName
  };
};

// Upload d'un fichier audio vers Supabase Storage
export const uploadAudio = async (file: File, marcheId: string): Promise<UploadResult> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${marcheId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('marche-audio')
    .upload(fileName, file);

  if (error) {
    console.error('Erreur upload audio:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('marche-audio')
    .getPublicUrl(fileName);

  return {
    url: publicUrl,
    path: fileName
  };
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
