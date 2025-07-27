
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
  console.log(`🔍 [fetchExistingPhotos] Récupération des photos pour la marche ${marcheId}`);
  
  try {
    const { data: photos, error } = await supabase
      .from('marche_photos')
      .select('*')
      .eq('marche_id', marcheId)
      .order('ordre', { ascending: true });

    if (error) {
      console.error('❌ [fetchExistingPhotos] Erreur Supabase:', error);
      throw error;
    }

    console.log(`✅ [fetchExistingPhotos] ${photos?.length || 0} photos récupérées`);
    console.log('📋 [fetchExistingPhotos] Photos détail:', photos);
    return photos || [];
  } catch (error) {
    console.error('💥 [fetchExistingPhotos] Erreur lors de la récupération:', error);
    throw error;
  }
};

// Sauvegarder une photo en base
export const savePhoto = async (marcheId: string, photoData: PhotoToUpload): Promise<string> => {
  console.log('💾 [savePhoto] Début sauvegarde photo:', {
    fileName: photoData.file.name,
    fileSize: photoData.file.size,
    fileType: photoData.file.type,
    marcheId: marcheId,
    hasMetadata: !!photoData.metadata
  });
  
  if (!marcheId) {
    const error = new Error('ID de marche manquant');
    console.error('❌ [savePhoto] Erreur:', error.message);
    throw error;
  }

  if (!photoData.file) {
    const error = new Error('Fichier manquant');
    console.error('❌ [savePhoto] Erreur:', error.message);
    throw error;
  }

  try {
    // 1. Upload vers Supabase Storage
    console.log('📤 [savePhoto] Upload vers Storage...');
    const uploadResult = await uploadPhoto(photoData.file, marcheId);
    console.log('✅ [savePhoto] Upload Storage réussi:', uploadResult);
    
    // 2. Préparer les métadonnées pour la base
    let metadataForDb = null;
    if (photoData.metadata) {
      try {
        // S'assurer que les métadonnées sont sérialisables
        metadataForDb = JSON.parse(JSON.stringify(photoData.metadata));
        console.log('📋 [savePhoto] Métadonnées préparées:', metadataForDb);
      } catch (metadataError) {
        console.warn('⚠️ [savePhoto] Erreur sérialisation métadonnées:', metadataError);
        metadataForDb = {
          format: photoData.file.type,
          size: photoData.file.size,
          error: 'Erreur sérialisation métadonnées'
        };
      }
    }

    // 3. Préparer les données pour l'insertion
    const insertData = {
      marche_id: marcheId,
      nom_fichier: photoData.file.name,
      url_supabase: uploadResult.url,
      titre: photoData.titre || photoData.file.name,
      description: photoData.description || null,
      ordre: 0,
      metadata: metadataForDb
    };

    console.log('📝 [savePhoto] Données à insérer:', insertData);
    
    // 4. Sauvegarder en base de données
    const { data: insertedData, error: insertError } = await supabase
      .from('marche_photos')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ [savePhoto] Erreur insertion base:', insertError);
      throw insertError;
    }

    console.log('✅ [savePhoto] Photo sauvegardée avec succès:', insertedData);
    return insertedData.id;
  } catch (error) {
    console.error('💥 [savePhoto] Erreur complète:', error);
    throw error;
  }
};

// Sauvegarder plusieurs photos
export const savePhotos = async (marcheId: string, photos: PhotoToUpload[]): Promise<string[]> => {
  console.log(`💾 [savePhotos] Sauvegarde de ${photos.length} photos pour marche ${marcheId}`);
  
  const savedIds: string[] = [];
  const errors: Error[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    try {
      console.log(`📤 [savePhotos] Sauvegarde photo ${i + 1}/${photos.length}: ${photo.file.name}`);
      const photoId = await savePhoto(marcheId, photo);
      savedIds.push(photoId);
      console.log(`✅ [savePhotos] Photo ${i + 1} sauvegardée avec ID: ${photoId}`);
    } catch (error) {
      console.error(`❌ [savePhotos] Erreur photo ${i + 1}:`, error);
      errors.push(error as Error);
    }
  }

  console.log(`📊 [savePhotos] Résultat: ${savedIds.length} réussies, ${errors.length} erreurs`);
  
  if (errors.length > 0) {
    console.error('💥 [savePhotos] Erreurs rencontrées:', errors);
    throw new Error(`${errors.length} photo(s) ont échoué lors de la sauvegarde`);
  }

  return savedIds;
};

// Supprimer une photo
export const deletePhoto = async (photoId: string): Promise<void> => {
  console.log('🗑️ [deletePhoto] Suppression photo:', photoId);
  
  try {
    // Récupérer d'abord les infos de la photo
    const { data: photo, error: fetchError } = await supabase
      .from('marche_photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      console.error('❌ [deletePhoto] Erreur récupération photo:', fetchError);
      throw fetchError;
    }

    console.log('📋 [deletePhoto] Photo trouvée:', photo);

    // Supprimer le fichier du storage si possible
    if (photo.url_supabase) {
      try {
        // Extraire le chemin du fichier depuis l'URL
        const urlParts = photo.url_supabase.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const folderName = urlParts[urlParts.length - 2];
        const filePath = `${folderName}/${fileName}`;

        console.log('🗑️ [deletePhoto] Suppression fichier Storage:', filePath);
        
        const { error: storageError } = await supabase.storage
          .from('marche-photos')
          .remove([filePath]);

        if (storageError) {
          console.warn('⚠️ [deletePhoto] Erreur suppression Storage:', storageError);
        } else {
          console.log('✅ [deletePhoto] Fichier Storage supprimé');
        }
      } catch (storageError) {
        console.warn('⚠️ [deletePhoto] Erreur lors de la suppression Storage:', storageError);
      }
    }

    // Supprimer l'enregistrement en base
    const { error: deleteError } = await supabase
      .from('marche_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      console.error('❌ [deletePhoto] Erreur suppression base:', deleteError);
      throw deleteError;
    }

    console.log('✅ [deletePhoto] Photo supprimée avec succès');
  } catch (error) {
    console.error('💥 [deletePhoto] Erreur complète:', error);
    throw error;
  }
};

// Mettre à jour les métadonnées d'une photo
export const updatePhotoMetadata = async (
  photoId: string, 
  updates: { titre?: string; description?: string; ordre?: number }
): Promise<void> => {
  console.log('📝 [updatePhotoMetadata] Mise à jour photo:', photoId, updates);
  
  try {
    const { data, error } = await supabase
      .from('marche_photos')
      .update(updates)
      .eq('id', photoId)
      .select()
      .single();

    if (error) {
      console.error('❌ [updatePhotoMetadata] Erreur mise à jour:', error);
      throw error;
    }

    console.log('✅ [updatePhotoMetadata] Métadonnées mises à jour:', data);
  } catch (error) {
    console.error('💥 [updatePhotoMetadata] Erreur complète:', error);
    throw error;
  }
};
