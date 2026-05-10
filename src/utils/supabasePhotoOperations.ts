import { supabase } from '@/integrations/supabase/client';
import { uploadPhoto } from './supabaseUpload';
import { ProcessedPhoto } from './photoUtils';
import { extractMediaMetadata } from './mediaMetadata';
import { runSupabaseDiagnostic, validatePhotoData } from './supabaseDiagnostic';

export interface ExistingPhoto {
  id: string;
  nom_fichier: string;
  url_supabase: string;
  titre?: string;
  description?: string;
  ordre?: number;
  metadata?: any;
  created_at: string;
  tags?: PhotoTag[];
}

export interface PhotoTag {
  id: string;
  tag: string;
  categorie?: string;
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
      .select(`
        *,
        marche_photo_tags (
          id,
          tag,
          categorie,
          created_at
        )
      `)
      .eq('marche_id', marcheId)
      .order('ordre', { ascending: true });

    if (error) {
      console.error('❌ [fetchExistingPhotos] Erreur Supabase:', error);
      throw error;
    }

    const photosWithTags = photos?.map(photo => ({
      ...photo,
      tags: photo.marche_photo_tags || []
    })) || [];

    console.log(`✅ [fetchExistingPhotos] ${photosWithTags.length} photos récupérées avec tags`);
    return photosWithTags;
  } catch (error) {
    console.error('💥 [fetchExistingPhotos] Erreur lors de la récupération:', error);
    throw error;
  }
};

// Sauvegarder une photo en base avec diagnostic détaillé - VERSION ROBUSTE
export const savePhoto = async (
  marcheId: string, 
  photoData: PhotoToUpload,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const fileName = photoData.file.name;
  
  console.log('🚀 [savePhoto] ========== DÉBUT UPLOAD ==========');
  console.log('📋 [savePhoto] Paramètres:', {
    fileName,
    fileSize: photoData.file.size,
    fileType: photoData.file.type,
    marcheId: marcheId,
    hasMetadata: !!photoData.metadata,
    metadataKeys: photoData.metadata ? Object.keys(photoData.metadata) : [],
    titre: photoData.titre || 'Sans titre',
    description: photoData.description || 'Sans description'
  });

  // Callback de progression avec logs détaillés et protection contre les erreurs
  const updateProgress = (progress: number, status: UploadProgress['status'], error?: string) => {
    console.log(`📊 [savePhoto] Progression: ${progress}% - Status: ${status}${error ? ` - Erreur: ${error}` : ''}`);
    
    try {
      onProgress?.({
        fileName,
        progress: Math.min(Math.max(progress, 0), 100), // Assurer que le progress est entre 0 et 100
        status,
        error
      });
    } catch (progressError) {
      console.warn('⚠️ [savePhoto] Erreur lors du callback de progression:', progressError);
    }
  };

  updateProgress(0, 'pending');

  try {
    // ÉTAPE 1: Diagnostic Supabase complet
    console.log('🔍 [savePhoto] ÉTAPE 1 - Diagnostic Supabase');
    updateProgress(5, 'uploading');
    
    const diagnosticResult = await runSupabaseDiagnostic(marcheId);
    if (!diagnosticResult.success) {
      const errorMsg = `Diagnostic échoué: ${diagnosticResult.error}`;
      console.error('❌ [savePhoto] Diagnostic échoué:', diagnosticResult);
      updateProgress(5, 'error', errorMsg);
      throw new Error(errorMsg);
    }
    console.log('✅ [savePhoto] Diagnostic réussi');

    // ÉTAPE 2: Validation des données
    console.log('🔍 [savePhoto] ÉTAPE 2 - Validation des données');
    updateProgress(10, 'uploading');
    
    const validationResult = validatePhotoData(photoData, marcheId);
    if (!validationResult.valid) {
      const errorMsg = `Données invalides: ${validationResult.errors.join(', ')}`;
      console.error('❌ [savePhoto] Validation échouée:', validationResult.errors);
      updateProgress(10, 'error', errorMsg);
      throw new Error(errorMsg);
    }
    console.log('✅ [savePhoto] Données validées');

    // ÉTAPE 3: Validation marche
    console.log('🔍 [savePhoto] ÉTAPE 3 - Vérification marche');
    updateProgress(15, 'uploading');
    
    const marcheExists = await validateMarcheExists(marcheId);
    if (!marcheExists) {
      const errorMsg = `Marche ${marcheId} introuvable`;
      console.error('❌ [savePhoto] Marche introuvable');
      updateProgress(15, 'error', errorMsg);
      throw new Error(errorMsg);
    }
    console.log('✅ [savePhoto] Marche confirmée');

    // ÉTAPE 4: Upload vers Supabase Storage
    console.log('🔍 [savePhoto] ÉTAPE 4 - Upload Storage');
    updateProgress(20, 'uploading');
    
    console.log('📤 [savePhoto] Début upload Storage...');
    const uploadResult = await uploadPhoto(photoData.file, marcheId);
    
    if (!uploadResult || !uploadResult.url) {
      const errorMsg = 'Upload Storage échoué - pas d\'URL retournée';
      console.error('❌ [savePhoto] Upload Storage échoué');
      updateProgress(20, 'error', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('✅ [savePhoto] Upload Storage terminé:', {
      url: uploadResult.url,
      path: uploadResult.path,
      urlLength: uploadResult.url.length
    });
    
    updateProgress(60, 'processing');

    // ÉTAPE 5: Préparation métadonnées
    console.log('🔍 [savePhoto] ÉTAPE 5 - Préparation métadonnées');
    updateProgress(70, 'processing');
    
    const validatedMetadata = validateMetadata(photoData.metadata);
    console.log('📋 [savePhoto] Métadonnées préparées:', validatedMetadata ? 'OK' : 'NULL');
    
    // ÉTAPE 6: Préparation données insertion
    console.log('🔍 [savePhoto] ÉTAPE 6 - Préparation insertion');
    updateProgress(80, 'processing');
    
    const insertData = {
      marche_id: marcheId,
      nom_fichier: fileName,
      url_supabase: uploadResult.url,
      titre: photoData.titre || fileName,
      description: photoData.description || '',
      ordre: 0,
      metadata: validatedMetadata
    };

    console.log('📝 [savePhoto] Données insertion préparées:', {
      marche_id: insertData.marche_id,
      nom_fichier: insertData.nom_fichier,
      url_supabase: insertData.url_supabase.substring(0, 50) + '...',
      titre: insertData.titre,
      description: insertData.description,
      ordre: insertData.ordre,
      hasMetadata: !!insertData.metadata
    });
    
    // ÉTAPE 7: Insertion en base de données
    console.log('🔍 [savePhoto] ÉTAPE 7 - Insertion base de données');
    updateProgress(90, 'processing');
    
    console.log('💾 [savePhoto] Exécution requête INSERT...');
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
        insertData: {
          ...insertData,
          metadata: insertData.metadata ? 'présent' : 'absent'
        }
      });
      
      const errorMsg = `Erreur insertion: ${insertError.message} (Code: ${insertError.code})`;
      updateProgress(90, 'error', errorMsg);
      throw new Error(errorMsg);
    }

    if (!insertedData) {
      const errorMsg = 'Insertion réussie mais aucune donnée retournée';
      console.error('❌ [savePhoto] Pas de données retournées');
      updateProgress(90, 'error', errorMsg);
      throw new Error(errorMsg);
    }

    updateProgress(100, 'success');
    console.log('🎉 [savePhoto] ========== UPLOAD TERMINÉ ==========');
    console.log('✅ [savePhoto] Photo sauvegardée avec succès:', {
      id: insertedData.id,
      titre: insertedData.titre,
      url: insertedData.url_supabase.substring(0, 50) + '...'
    });
    
    return insertedData.id;
    
  } catch (error) {
    console.error('💥 [savePhoto] ========== ERREUR CRITIQUE ==========');
    console.error('💥 [savePhoto] Détails erreur:', {
      error,
      fileName,
      marcheId,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'upload';
    updateProgress(0, 'error', errorMessage);
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

// Fonction utilitaire pour extraire le chemin du fichier depuis l'URL Supabase
const extractFilePathFromUrl = (url: string): string | null => {
  try {
    console.log('🔍 [extractFilePathFromUrl] Analyse de l\'URL:', url);
    
    // Format typique: https://xzbunrtgbfbhinkzkzhf.supabase.co/storage/v1/object/public/marche-photos/MARCHE_ID/filename.jpg
    const urlParts = url.split('/');
    const publicIndex = urlParts.indexOf('public');
    
    if (publicIndex === -1 || publicIndex >= urlParts.length - 2) {
      console.error('❌ [extractFilePathFromUrl] Format d\'URL invalide');
      return null;
    }
    
    // Récupérer tout ce qui suit "public/" comme chemin
    const pathParts = urlParts.slice(publicIndex + 2); // Skip "public" et "marche-photos"
    const filePath = pathParts.join('/');
    
    console.log('✅ [extractFilePathFromUrl] Chemin extrait:', filePath);
    return filePath;
  } catch (error) {
    console.error('💥 [extractFilePathFromUrl] Erreur extraction:', error);
    return null;
  }
};

// Supprimer une photo (améliorée)
export const deletePhoto = async (photoId: string): Promise<void> => {
  console.log('🗑️ [deletePhoto] ========== DÉBUT SUPPRESSION ==========');
  console.log('📋 [deletePhoto] ID photo à supprimer:', photoId);
  
  try {
    // ÉTAPE 1: Récupérer les infos de la photo
    console.log('🔍 [deletePhoto] ÉTAPE 1 - Récupération des infos photo');
    const { data: photo, error: fetchError } = await supabase
      .from('marche_photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      console.error('❌ [deletePhoto] Erreur récupération photo:', fetchError);
      throw new Error(`Impossible de récupérer les infos de la photo: ${fetchError.message}`);
    }

    if (!photo) {
      console.error('❌ [deletePhoto] Photo introuvable avec ID:', photoId);
      throw new Error('Photo introuvable');
    }

    console.log('✅ [deletePhoto] Photo trouvée:', {
      id: photo.id,
      nom_fichier: photo.nom_fichier,
      url_supabase: photo.url_supabase.substring(0, 50) + '...',
      marche_id: photo.marche_id
    });

    // ÉTAPE 2: Supprimer le fichier du Storage
    console.log('🔍 [deletePhoto] ÉTAPE 2 - Suppression Storage');
    if (photo.url_supabase) {
      try {
        const filePath = extractFilePathFromUrl(photo.url_supabase);
        
        if (filePath) {
          console.log('🗑️ [deletePhoto] Suppression fichier Storage:', filePath);
          
          const { error: storageError } = await supabase.storage
            .from('marche-photos')
            .remove([filePath]);

          if (storageError) {
            console.warn('⚠️ [deletePhoto] Erreur suppression Storage (non bloquante):', storageError);
          } else {
            console.log('✅ [deletePhoto] Fichier Storage supprimé avec succès');
          }
        } else {
          console.warn('⚠️ [deletePhoto] Impossible d\'extraire le chemin du fichier, skip Storage');
        }
      } catch (storageError) {
        console.warn('⚠️ [deletePhoto] Erreur lors de la suppression Storage (non bloquante):', storageError);
      }
    }

    // ÉTAPE 3: Supprimer l'enregistrement en base
    console.log('🔍 [deletePhoto] ÉTAPE 3 - Suppression base de données');
    const { error: deleteError } = await supabase
      .from('marche_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      console.error('❌ [deletePhoto] Erreur suppression base:', deleteError);
      throw new Error(`Erreur lors de la suppression en base: ${deleteError.message}`);
    }

    console.log('🎉 [deletePhoto] ========== SUPPRESSION TERMINÉE ==========');
    console.log('✅ [deletePhoto] Photo supprimée avec succès');
    
  } catch (error) {
    console.error('💥 [deletePhoto] ========== ERREUR CRITIQUE ==========');
    console.error('💥 [deletePhoto] Détails erreur:', {
      photoId,
      error,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
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

// Fonction pour mettre à jour l'ordre des photos en masse
export const updatePhotosOrder = async (photoIds: string[]): Promise<void> => {
  console.log('📋 [supabasePhotoOperations] Mise à jour ordre photos:', photoIds);
  
  try {
    // Mettre à jour chaque photo avec son nouvel ordre
    const updates = photoIds.map((id, index) => 
      supabase
        .from('marche_photos')
        .update({ ordre: index + 1 })
        .eq('id', id)
    );

    // Exécuter toutes les mises à jour en parallèle
    const results = await Promise.all(updates);
    
    // Vérifier les erreurs
    for (const result of results) {
      if (result.error) {
        throw result.error;
      }
    }
    
    console.log('✅ [supabasePhotoOperations] Ordre des photos mis à jour');
  } catch (error) {
    console.error('❌ [supabasePhotoOperations] Erreur mise à jour ordre:', error);
    throw error;
  }
};

// ========== GESTION DES TAGS ==========

// Sauvegarder les tags d'une photo
export const savePhotoTags = async (
  photoId: string,
  tags: string[],
  categorie?: string
): Promise<void> => {
  console.log('🏷️ [savePhotoTags] Sauvegarde des tags pour photo:', photoId, tags);
  
  try {
    // Normaliser et dédupliquer les tags
    const normalized = Array.from(
      new Set(
        (tags || [])
          .map((t) => (t || '').trim().toLowerCase())
          .filter((t) => t.length > 0)
      )
    );

    if (normalized.length === 0) {
      console.log('ℹ️ [savePhotoTags] Aucun tag à insérer');
      return;
    }

    // Préparer les données d'insertion
    const tagsToInsert = normalized.map(tag => ({
      photo_id: photoId,
      tag,
      categorie: categorie || null
    }));

    const { error } = await supabase
      .from('marche_photo_tags')
      .insert(tagsToInsert);

    if (error) {
      console.error('❌ [savePhotoTags] Erreur insertion tags:', error);
      throw error;
    }

    console.log('✅ [savePhotoTags] Tags sauvegardés avec succès');
  } catch (error) {
    console.error('💥 [savePhotoTags] Erreur complète:', error);
    throw error;
  }
};

// Mettre à jour les tags d'une photo (suppression + réinsertion)
export const updatePhotoTags = async (
  photoId: string,
  newTags: string[],
  categorie?: string
): Promise<void> => {
  console.log('🏷️ [updatePhotoTags] Mise à jour tags pour photo:', photoId, newTags);
  
  try {
    // Supprimer les anciens tags
    const { error: deleteError } = await supabase
      .from('marche_photo_tags')
      .delete()
      .eq('photo_id', photoId);

    if (deleteError) {
      console.error('❌ [updatePhotoTags] Erreur suppression anciens tags:', deleteError);
      throw deleteError;
    }

    // Insérer les nouveaux tags si il y en a
    const normalized = Array.from(
      new Set(
        (newTags || [])
          .map((t) => (t || '').trim().toLowerCase())
          .filter((t) => t.length > 0)
      )
    );

    if (normalized.length > 0) {
      await savePhotoTags(photoId, normalized, categorie);
    }

    console.log('✅ [updatePhotoTags] Tags mis à jour avec succès');
  } catch (error) {
    console.error('💥 [updatePhotoTags] Erreur complète:', error);
    throw error;
  }
};

// Supprimer les tags d'une photo
export const deletePhotoTags = async (photoId: string): Promise<void> => {
  console.log('🏷️ [deletePhotoTags] Suppression tags pour photo:', photoId);
  
  try {
    const { error } = await supabase
      .from('marche_photo_tags')
      .delete()
      .eq('photo_id', photoId);

    if (error) {
      console.error('❌ [deletePhotoTags] Erreur suppression tags:', error);
      throw error;
    }

    console.log('✅ [deletePhotoTags] Tags supprimés avec succès');
  } catch (error) {
    console.error('💥 [deletePhotoTags] Erreur complète:', error);
    throw error;
  }
};

// Récupérer tous les tags avec compteurs pour les filtres
export const getTagsWithCounts = async (): Promise<Array<{ tag: string; count: number; categorie?: string }>> => {
  console.log('📊 [getTagsWithCounts] Récupération des tags avec compteurs');
  
  try {
    const { data, error } = await supabase
      .from('marche_photo_tags')
      .select('tag, categorie')
      .order('tag');

    if (error) {
      console.error('❌ [getTagsWithCounts] Erreur récupération tags:', error);
      throw error;
    }

    // Compter les occurrences de chaque tag
    const tagCounts = new Map<string, { count: number; categorie?: string }>();
    
    data?.forEach(item => {
      const existing = tagCounts.get(item.tag);
      if (existing) {
        existing.count++;
      } else {
        tagCounts.set(item.tag, { count: 1, categorie: item.categorie || undefined });
      }
    });

    // Convertir en array et trier par ordre alphabétique, puis par count décroissant
    const result = Array.from(tagCounts.entries())
      .map(([tag, { count, categorie }]) => ({ tag, count, categorie }))
      .sort((a, b) => a.tag.localeCompare(b.tag)); // Tri alphabétique

    console.log(`✅ [getTagsWithCounts] ${result.length} tags récupérés avec compteurs (ordre alphabétique)`);
    return result;
  } catch (error) {
    console.error('💥 [getTagsWithCounts] Erreur complète:', error);
    throw error;
  }
};

// Récupérer les tags suggérés (les plus populaires)
export const getSuggestedTags = async (limit: number = 20): Promise<string[]> => {
  console.log('💡 [getSuggestedTags] Récupération des tags suggérés');
  
  try {
    const tagsWithCounts = await getTagsWithCounts();
    const suggested = tagsWithCounts
      .sort((a, b) => a.tag.localeCompare(b.tag)) // Tri alphabétique
      .slice(0, limit)
      .map(item => item.tag);

    console.log(`✅ [getSuggestedTags] ${suggested.length} tags suggérés récupérés (ordre alphabétique)`);
    return suggested;
  } catch (error) {
    console.error('💥 [getSuggestedTags] Erreur complète:', error);
    return [];
  }
};

// Force module refresh
console.log('🔄 supabasePhotoOperations module loaded with tag functions');
