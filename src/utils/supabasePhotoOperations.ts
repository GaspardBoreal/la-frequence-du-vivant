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

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
}

// Fonction utilitaire pour valider l'existence d'une marche
const validateMarcheExists = async (marcheId: string): Promise<boolean> => {
  console.log(`🔍 [validateMarcheExists] Vérification de l'existence de la marche ${marcheId}`);
  
  try {
    const { data, error } = await supabase
      .from('marches')
      .select('id')
      .eq('id', marcheId)
      .single();

    if (error) {
      console.error('❌ [validateMarcheExists] Erreur lors de la vérification:', error);
      return false;
    }

    const exists = !!data;
    console.log(`${exists ? '✅' : '❌'} [validateMarcheExists] Marche ${marcheId} ${exists ? 'trouvée' : 'non trouvée'}`);
    return exists;
  } catch (error) {
    console.error('💥 [validateMarcheExists] Erreur complète:', error);
    return false;
  }
};

// Fonction utilitaire pour valider et nettoyer les métadonnées
const validateMetadata = (metadata: any): any => {
  if (!metadata) return null;
  
  try {
    // Créer une copie propre des métadonnées
    const cleanMetadata = {
      width: metadata.width || null,
      height: metadata.height || null,
      format: metadata.format || null,
      size: metadata.size || null,
      isConverted: metadata.isConverted || false,
      originalFormat: metadata.originalFormat || null,
      exif: metadata.exif || null,
      timestamp: new Date().toISOString()
    };

    // Tester la sérialisation JSON
    const serialized = JSON.stringify(cleanMetadata);
    JSON.parse(serialized); // Vérifier que c'est valide
    
    console.log('✅ [validateMetadata] Métadonnées validées:', cleanMetadata);
    return cleanMetadata;
  } catch (error) {
    console.warn('⚠️ [validateMetadata] Erreur validation métadonnées:', error);
    return {
      error: 'Métadonnées invalides',
      timestamp: new Date().toISOString()
    };
  }
};

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
    return photos || [];
  } catch (error) {
    console.error('💥 [fetchExistingPhotos] Erreur lors de la récupération:', error);
    throw error;
  }
};

// Sauvegarder une photo en base avec diagnostic détaillé
export const savePhoto = async (
  marcheId: string, 
  photoData: PhotoToUpload,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const fileName = photoData.file.name;
  
  console.log('🚀 [savePhoto] DÉBUT - Sauvegarde photo:', {
    fileName,
    fileSize: photoData.file.size,
    fileType: photoData.file.type,
    marcheId: marcheId,
    hasMetadata: !!photoData.metadata
  });

  // Callback de progression
  const updateProgress = (progress: number, status: UploadProgress['status'], error?: string) => {
    onProgress?.({
      fileName,
      progress,
      status,
      error
    });
  };

  updateProgress(0, 'pending');

  // 1. Validations préliminaires
  if (!marcheId) {
    const error = 'ID de marche manquant';
    console.error('❌ [savePhoto] Erreur:', error);
    updateProgress(0, 'error', error);
    throw new Error(error);
  }

  if (!photoData.file) {
    const error = 'Fichier manquant';
    console.error('❌ [savePhoto] Erreur:', error);
    updateProgress(0, 'error', error);
    throw new Error(error);
  }

  try {
    updateProgress(10, 'uploading');

    // 2. Vérifier l'existence de la marche
    console.log('🔍 [savePhoto] Vérification de l\'existence de la marche...');
    const marcheExists = await validateMarcheExists(marcheId);
    if (!marcheExists) {
      const error = `Marche ${marcheId} introuvable`;
      console.error('❌ [savePhoto] Erreur:', error);
      updateProgress(10, 'error', error);
      throw new Error(error);
    }

    updateProgress(20, 'uploading');

    // 3. Upload vers Supabase Storage
    console.log('📤 [savePhoto] Upload vers Storage...');
    const uploadResult = await uploadPhoto(photoData.file, marcheId);
    console.log('✅ [savePhoto] Upload Storage réussi:', uploadResult);
    
    updateProgress(60, 'processing');

    // 4. Préparer les métadonnées
    console.log('📋 [savePhoto] Préparation des métadonnées...');
    const validatedMetadata = validateMetadata(photoData.metadata);
    
    // 5. Préparer les données pour l'insertion
    const insertData = {
      marche_id: marcheId,
      nom_fichier: fileName,
      url_supabase: uploadResult.url,
      titre: photoData.titre || fileName,
      description: photoData.description || null,
      ordre: 0,
      metadata: validatedMetadata
    };

    console.log('📝 [savePhoto] Données préparées pour insertion:', {
      ...insertData,
      metadata: validatedMetadata ? 'présent' : 'absent'
    });
    
    updateProgress(80, 'processing');

    // 6. Insertion en base de données avec diagnostic détaillé
    console.log('💾 [savePhoto] Insertion en base de données...');
    const { data: insertedData, error: insertError } = await supabase
      .from('marche_photos')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ [savePhoto] ERREUR INSERTION DÉTAILLÉE:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        insertData: insertData
      });
      
      updateProgress(80, 'error', `Erreur base de données: ${insertError.message}`);
      throw new Error(`Erreur insertion base de données: ${insertError.message}`);
    }

    updateProgress(100, 'success');
    console.log('🎉 [savePhoto] Photo sauvegardée avec succès:', insertedData);
    return insertedData.id;
    
  } catch (error) {
    console.error('💥 [savePhoto] ERREUR COMPLÈTE:', {
      error,
      fileName,
      marcheId,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    
    updateProgress(0, 'error', error instanceof Error ? error.message : 'Erreur inconnue');
    throw error;
  }
};

// Sauvegarder plusieurs photos avec progression
export const savePhotos = async (
  marcheId: string, 
  photos: PhotoToUpload[],
  onProgress?: (fileName: string, progress: UploadProgress) => void
): Promise<string[]> => {
  console.log(`💾 [savePhotos] Sauvegarde de ${photos.length} photos pour marche ${marcheId}`);
  
  const savedIds: string[] = [];
  const errors: Error[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    try {
      console.log(`📤 [savePhotos] Sauvegarde photo ${i + 1}/${photos.length}: ${photo.file.name}`);
      
      const photoId = await savePhoto(marcheId, photo, (progress) => {
        onProgress?.(photo.file.name, progress);
      });
      
      savedIds.push(photoId);
      console.log(`✅ [savePhotos] Photo ${i + 1} sauvegardée avec ID: ${photoId}`);
    } catch (error) {
      console.error(`❌ [savePhotos] Erreur photo ${i + 1}:`, error);
      errors.push(error as Error);
      
      onProgress?.(photo.file.name, {
        fileName: photo.file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
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
