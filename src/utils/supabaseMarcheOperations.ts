import { supabase } from '../integrations/supabase/client';
import { MarcheTechnoSensible } from './googleSheetsApi';
import { uploadPhoto, uploadVideo, uploadAudio } from './supabaseUpload';

export interface MarcheFormData {
  ville: string;
  region: string;
  departement?: string;
  nomMarche?: string;
  descriptifCourt?: string;
  descriptifLong?: string;
  date?: string;
  temperature?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  themesPrincipaux?: string[];
  sousThemes?: string[];
  tags?: string[];
  photos?: File[];
  videos?: File[];
  audioFiles?: File[];
  documents?: File[];
  etudes?: Array<{
    titre: string;
    contenu: string;
    resume?: string;
    type: 'principale' | 'complementaire' | 'annexe';
    ordre: number;
  }>;
  theme?: string;
  adresse?: string;
  lienGoogleDrive?: string;
}

// Fonction pour nettoyer les données du formulaire et les mapper aux champs de la base de données
const cleanFormData = (formData: MarcheFormData) => {
  const cleanedData = {
    ville: formData.ville || '',
    region: formData.region || null,
    departement: formData.departement || null,
    nom_marche: formData.nomMarche || null,
    descriptif_court: formData.descriptifCourt || null,
    descriptif_long: formData.descriptifLong || null,
    date: formData.date || null,
    temperature: formData.temperature !== null && formData.temperature !== undefined ? Number(formData.temperature) : null,
    latitude: formData.latitude !== null && formData.latitude !== undefined ? Number(formData.latitude) : null,
    longitude: formData.longitude !== null && formData.longitude !== undefined ? Number(formData.longitude) : null,
    adresse: formData.adresse || null,
    theme_principal: formData.themesPrincipaux?.[0] || formData.theme || null,
    sous_themes: formData.sousThemes && formData.sousThemes.length > 0 ? formData.sousThemes : null,
    lien_google_drive: formData.lienGoogleDrive || null,
    coordonnees: formData.latitude && formData.longitude 
      ? `(${formData.longitude},${formData.latitude})` 
      : null
  };

  console.log('🔧 Données nettoyées pour Supabase:', cleanedData);
  return cleanedData;
};

// Fonction pour créer une nouvelle marche dans Supabase
export const createMarche = async (formData: MarcheFormData): Promise<string | null> => {
  try {
    const cleanedData = cleanFormData(formData);
    
    console.log('🚀 Création d\'une nouvelle marche avec les données:', cleanedData);

    const { data, error } = await supabase
      .from('marches')
      .insert([cleanedData])
      .select()

    if (error) {
      console.error("❌ Erreur lors de la création de la marche:", error);
      throw error;
    }

    const newMarche = data[0];
    const marcheId = newMarche.id;

    console.log(`✨ Nouvelle marche créée avec l'ID: ${marcheId}`);
    
    // Sauvegarder les tags si présents
    if (formData.tags && formData.tags.length > 0) {
      await saveTags(marcheId, formData.tags);
    }

    return marcheId;

  } catch (error) {
    console.error("💥 Erreur lors de la création de la marche:", error);
    return null;
  }
};

// Fonction pour mettre à jour une marche existante dans Supabase
export const updateMarche = async (marcheId: string, formData: MarcheFormData): Promise<boolean> => {
  try {
    const cleanedData = cleanFormData(formData);
    
    console.log(`🔄 Mise à jour de la marche ${marcheId} avec les données:`, cleanedData);

    const { error } = await supabase
      .from('marches')
      .update(cleanedData)
      .eq('id', marcheId);

    if (error) {
      console.error(`❌ Erreur lors de la mise à jour de la marche ${marcheId}:`, error);
      return false;
    }

    // Mettre à jour les tags
    if (formData.tags) {
      // Supprimer les anciens tags
      await supabase.from('marche_tags').delete().eq('marche_id', marcheId);
      // Ajouter les nouveaux tags
      if (formData.tags.length > 0) {
        await saveTags(marcheId, formData.tags);
      }
    }

    console.log(`✅ Marche ${marcheId} mise à jour avec succès.`);
    return true;

  } catch (error) {
    console.error(`💥 Erreur lors de la mise à jour de la marche ${marcheId}:`, error);
    return false;
  }
};

// Fonction pour sauvegarder les tags
const saveTags = async (marcheId: string, tags: string[]): Promise<void> => {
  try {
    const tagData = tags.map(tag => ({
      marche_id: marcheId,
      tag: tag.trim(),
      categorie: null
    }));

    const { error } = await supabase
      .from('marche_tags')
      .insert(tagData);

    if (error) {
      console.error('❌ Erreur lors de la sauvegarde des tags:', error);
      throw error;
    }

    console.log(`✅ ${tags.length} tags sauvegardés pour la marche ${marcheId}`);
  } catch (error) {
    console.error('💥 Erreur lors de la sauvegarde des tags:', error);
    throw error;
  }
};

// Fonction pour supprimer une marche de Supabase
export const deleteMarche = async (marcheId: string): Promise<boolean> => {
  try {
    // Supprimer les enregistrements liés dans les tables photos, videos, audio, etudes, documents
    await supabase.from('marche_photos').delete().eq('marche_id', marcheId);
    await supabase.from('marche_videos').delete().eq('marche_id', marcheId);
    await supabase.from('marche_audio').delete().eq('marche_id', marcheId);
    await supabase.from('marche_etudes').delete().eq('marche_id', marcheId);
    await supabase.from('marche_documents').delete().eq('marche_id', marcheId);
    await supabase.from('marche_tags').delete().eq('marche_id', marcheId);

    // Supprimer la marche elle-même
    const { error } = await supabase
      .from('marches')
      .delete()
      .eq('id', marcheId);

    if (error) {
      console.error(`Erreur lors de la suppression de la marche ${marcheId}:`, error);
      throw error;
    }

    console.log(`🔥 Marche ${marcheId} supprimée avec succès.`);
    return true;

  } catch (error) {
    console.error(`Erreur lors de la suppression de la marche ${marcheId}:`, error);
    return false;
  }
};

// Interface pour les éléments média
interface MediaItem {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  uploaded: boolean;
  duration?: number;
}

// Fonction pour sauvegarder des photos
export const savePhotos = async (marcheId: string, photos: MediaItem[]): Promise<void> => {
  for (const photo of photos) {
    try {
      const uploadResult = await uploadPhoto(photo.file, marcheId);
      
      await supabase
        .from('marche_photos')
        .insert({
          marche_id: marcheId,
          nom_fichier: photo.name,
          url_supabase: uploadResult.url,
          titre: photo.name,
          description: null,
          ordre: null,
          metadata: null
        });
        
      console.log(`✅ Photo ${photo.name} sauvegardée`);
    } catch (error) {
      console.error(`❌ Erreur sauvegarde photo ${photo.name}:`, error);
      throw error;
    }
  }
};

// Fonction pour sauvegarder des vidéos
export const saveVideos = async (marcheId: string, videos: MediaItem[]): Promise<void> => {
  for (const video of videos) {
    try {
      const uploadResult = await uploadVideo(video.file, marcheId);
      
      await supabase
        .from('marche_videos')
        .insert({
          marche_id: marcheId,
          nom_fichier: video.name,
          url_supabase: uploadResult.url,
          titre: video.name,
          description: null,
          duree_secondes: video.duration || null,
          format_video: video.file.type,
          resolution: null,
          thumbnail_url: null,
          ordre: null,
          taille_octets: video.size,
          metadata: null
        });
        
      console.log(`✅ Vidéo ${video.name} sauvegardée`);
    } catch (error) {
      console.error(`❌ Erreur sauvegarde vidéo ${video.name}:`, error);
      throw error;
    }
  }
};

// Fonction pour sauvegarder des fichiers audio
export const saveAudioFiles = async (marcheId: string, audioFiles: MediaItem[]): Promise<void> => {
  for (const audio of audioFiles) {
    try {
      const uploadResult = await uploadAudio(audio.file, marcheId);
      
      await supabase
        .from('marche_audio')
        .insert({
          marche_id: marcheId,
          nom_fichier: audio.name,
          url_supabase: uploadResult.url,
          titre: audio.name,
          description: null,
          duree_secondes: audio.duration || null,
          format_audio: audio.file.type,
          ordre: null,
          taille_octets: audio.size,
          metadata: null
        });
        
      console.log(`✅ Audio ${audio.name} sauvegardé`);
    } catch (error) {
      console.error(`❌ Erreur sauvegarde audio ${audio.name}:`, error);
      throw error;
    }
  }
};

// Fonction pour uploader plusieurs fichiers et retourner leurs URLs
export const uploadFiles = async (files: File[], folder: string): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    try {
      let uploadResult;
      
      if (file.type.startsWith('image/')) {
        uploadResult = await uploadPhoto(file, folder);
      } else if (file.type.startsWith('video/')) {
        uploadResult = await uploadVideo(file, folder);
      } else if (file.type.startsWith('audio/')) {
        uploadResult = await uploadAudio(file, folder);
      } else {
        console.warn(`Type de fichier non supporté: ${file.type}`);
        continue;
      }
      
      if (uploadResult?.url) {
        urls.push(uploadResult.url);
      }
    } catch (error) {
      console.error(`Erreur lors de l'upload du fichier ${file.name}:`, error);
    }
  }
  return urls;
};
