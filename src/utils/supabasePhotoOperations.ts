
import { supabase } from '@/integrations/supabase/client';
import { uploadPhoto } from './supabaseUpload';
import { ProcessedPhoto } from './photoUtils';

export interface ExistingPhoto {
  id: string;
  nom_fichier: string;
  url_supabase: string;
  titre?: string;
  description?: string;
  ordre?: number;
  metadata?: any;
  created_at: string;
}

export interface PhotoToUpload extends ProcessedPhoto {
  id: string;
  uploaded: boolean;
  titre?: string;
  description?: string;
}

// Récupérer les photos existantes pour une marche
export const fetchExistingPhotos = async (marcheId: string): Promise<ExistingPhoto[]> => {
  console.log(`🔍 Récupération des photos existantes pour la marche ${marcheId}`);
  
  try {
    const { data: photos, error } = await supabase
      .from('marche_photos')
      .select('*')
      .eq('marche_id', marcheId)
      .order('ordre', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération photos:', error);
      throw error;
    }

    console.log(`✅ ${photos?.length || 0} photos récupérées`);
    return photos || [];
  } catch (error) {
    console.error('💥 Erreur lors de la récupération des photos:', error);
    throw error;
  }
};

// Sauvegarder une photo en base
export const savePhoto = async (marcheId: string, photoData: PhotoToUpload): Promise<void> => {
  console.log('💾 Sauvegarde photo:', photoData.file.name);
  
  try {
    // Upload vers Supabase Storage
    const uploadResult = await uploadPhoto(photoData.file, marcheId);
    
    // Convertir metadata en JSON pour Supabase
    const metadataJson = photoData.metadata ? JSON.parse(JSON.stringify(photoData.metadata)) : null;
    
    // Sauvegarder en base de données
    const { error } = await supabase
      .from('marche_photos')
      .insert({
        marche_id: marcheId,
        nom_fichier: photoData.file.name,
        url_supabase: uploadResult.url,
        titre: photoData.titre || photoData.file.name,
        description: photoData.description,
        ordre: 0,
        metadata: metadataJson
      });

    if (error) {
      console.error('❌ Erreur sauvegarde photo:', error);
      throw error;
    }

    console.log('✅ Photo sauvegardée:', photoData.file.name);
  } catch (error) {
    console.error('💥 Erreur lors de la sauvegarde:', error);
    throw error;
  }
};

// Sauvegarder plusieurs photos
export const savePhotos = async (marcheId: string, photos: PhotoToUpload[]): Promise<void> => {
  console.log(`💾 Sauvegarde de ${photos.length} photos`);
  
  try {
    for (const photo of photos) {
      await savePhoto(marcheId, photo);
    }
    console.log('✅ Toutes les photos sauvegardées');
  } catch (error) {
    console.error('💥 Erreur lors de la sauvegarde en masse:', error);
    throw error;
  }
};

// Supprimer une photo
export const deletePhoto = async (photoId: string): Promise<void> => {
  console.log('🗑️ Suppression photo:', photoId);
  
  try {
    // Récupérer d'abord les infos de la photo
    const { data: photo, error: fetchError } = await supabase
      .from('marche_photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      console.error('❌ Erreur récupération photo:', fetchError);
      throw fetchError;
    }

    // Supprimer le fichier du storage
    const fileName = photo.url_supabase.split('/').pop();
    if (fileName) {
      const { error: storageError } = await supabase.storage
        .from('marche-photos')
        .remove([fileName]);

      if (storageError) {
        console.warn('⚠️ Erreur suppression fichier storage:', storageError);
      }
    }

    // Supprimer l'enregistrement en base
    const { error: deleteError } = await supabase
      .from('marche_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      console.error('❌ Erreur suppression photo:', deleteError);
      throw deleteError;
    }

    console.log('✅ Photo supprimée:', photoId);
  } catch (error) {
    console.error('💥 Erreur lors de la suppression:', error);
    throw error;
  }
};

// Mettre à jour les métadonnées d'une photo
export const updatePhotoMetadata = async (
  photoId: string, 
  updates: { titre?: string; description?: string; ordre?: number }
): Promise<void> => {
  console.log('📝 Mise à jour métadonnées photo:', photoId);
  
  try {
    const { error } = await supabase
      .from('marche_photos')
      .update(updates)
      .eq('id', photoId);

    if (error) {
      console.error('❌ Erreur mise à jour photo:', error);
      throw error;
    }

    console.log('✅ Métadonnées mises à jour:', photoId);
  } catch (error) {
    console.error('💥 Erreur lors de la mise à jour:', error);
    throw error;
  }
};
