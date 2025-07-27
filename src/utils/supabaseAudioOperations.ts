import { supabase } from '@/integrations/supabase/client';
import { uploadAudio } from './supabaseUpload';

export interface ExistingAudio {
  id: string;
  nom_fichier: string;
  url_supabase: string;
  titre?: string;
  description?: string;
  duree_secondes?: number;
  format_audio?: string;
  taille_octets?: number;
  ordre?: number;
  metadata?: any;
  created_at: string;
}

export interface AudioToUpload {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  duration: number | null;
  uploaded: boolean;
  titre?: string;
  description?: string;
}

export interface AudioUploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
}

// Fonction utilitaire pour valider un fichier audio (améliorée)
export const validateAudioFile = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  console.log('🔍 [validateAudioFile] Validation du fichier:', {
    name: file.name,
    size: file.size,
    type: file.type
  });

  // Vérifier le type MIME avec plus de formats supportés
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

  if (!file.type.startsWith('audio/') && !supportedMimeTypes.includes(file.type)) {
    errors.push(`Type MIME non supporté: ${file.type}. Types acceptés: ${supportedMimeTypes.join(', ')}`);
  }

  // Vérifier la taille (limite à 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    errors.push(`Le fichier est trop volumineux (${(file.size / (1024 * 1024)).toFixed(2)}MB, max: ${maxSize / (1024 * 1024)}MB)`);
  }

  // Vérifier l'extension avec plus de formats
  const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push(`Extension non supportée: ${fileExtension}. Extensions autorisées: ${allowedExtensions.join(', ')}`);
  }

  // Vérifier que le fichier n'est pas vide
  if (file.size === 0) {
    errors.push('Le fichier est vide');
  }

  const valid = errors.length === 0;
  console.log(`${valid ? '✅' : '❌'} [validateAudioFile] Validation: ${valid ? 'OK' : 'ERREURS'}`);
  
  if (!valid) {
    console.error('❌ [validateAudioFile] Erreurs détectées:', errors);
  }

  return { valid, errors };
};

// Fonction utilitaire pour obtenir la durée d'un fichier audio
export const getAudioDuration = (file: File): Promise<number | null> => {
  return new Promise((resolve) => {
    console.log('🎵 [getAudioDuration] Calcul de la durée pour:', file.name);
    
    const audio = new Audio();
    
    const cleanup = () => {
      URL.revokeObjectURL(audio.src);
    };

    audio.addEventListener('loadedmetadata', () => {
      console.log('✅ [getAudioDuration] Durée calculée:', audio.duration, 'secondes');
      cleanup();
      resolve(audio.duration);
    });

    audio.addEventListener('error', (e) => {
      console.error('❌ [getAudioDuration] Erreur lors du calcul de la durée:', e);
      cleanup();
      resolve(null);
    });

    audio.src = URL.createObjectURL(file);
  });
};

// Fonction utilitaire pour valider et nettoyer les métadonnées audio
const validateAudioMetadata = (metadata: any): any => {
  if (!metadata) return null;
  
  try {
    const cleanMetadata = {
      duration: metadata.duration || null,
      format: metadata.format || null,
      bitrate: metadata.bitrate || null,
      sampleRate: metadata.sampleRate || null,
      channels: metadata.channels || null,
      size: metadata.size || null,
      isConverted: metadata.isConverted || false,
      originalFormat: metadata.originalFormat || null,
      timestamp: new Date().toISOString()
    };

    // Tester la sérialisation JSON
    const serialized = JSON.stringify(cleanMetadata);
    JSON.parse(serialized);
    
    console.log('✅ [validateAudioMetadata] Métadonnées validées:', cleanMetadata);
    return cleanMetadata;
  } catch (error) {
    console.warn('⚠️ [validateAudioMetadata] Erreur validation métadonnées:', error);
    return {
      error: 'Métadonnées invalides',
      timestamp: new Date().toISOString()
    };
  }
};

// Récupérer les fichiers audio existants pour une marche
export const fetchExistingAudio = async (marcheId: string): Promise<ExistingAudio[]> => {
  console.log(`🔍 [fetchExistingAudio] Récupération des fichiers audio pour la marche ${marcheId}`);
  
  try {
    const { data: audioFiles, error } = await supabase
      .from('marche_audio')
      .select('*')
      .eq('marche_id', marcheId)
      .order('ordre', { ascending: true });

    if (error) {
      console.error('❌ [fetchExistingAudio] Erreur Supabase:', error);
      throw error;
    }

    console.log(`✅ [fetchExistingAudio] ${audioFiles?.length || 0} fichiers audio récupérés`);
    return audioFiles || [];
  } catch (error) {
    console.error('💥 [fetchExistingAudio] Erreur lors de la récupération:', error);
    throw error;
  }
};

// Sauvegarder un fichier audio en base avec gestion d'erreurs améliorée
export const saveAudio = async (
  marcheId: string, 
  audioData: AudioToUpload,
  onProgress?: (progress: AudioUploadProgress) => void
): Promise<string> => {
  const fileName = audioData.file.name;
  
  console.log('🚀 [saveAudio] ========== DÉBUT UPLOAD AUDIO ==========');
  console.log('📋 [saveAudio] Paramètres:', {
    fileName,
    fileSize: audioData.file.size,
    fileType: audioData.file.type,
    marcheId: marcheId,
    duration: audioData.duration,
    titre: audioData.titre || 'Sans titre',
    description: audioData.description || 'Sans description'
  });

  // Callback de progression avec protection contre les erreurs
  const updateProgress = (progress: number, status: AudioUploadProgress['status'], error?: string) => {
    console.log(`📊 [saveAudio] Progression: ${progress}% - Status: ${status}${error ? ` - Erreur: ${error}` : ''}`);
    
    try {
      onProgress?.({
        fileName,
        progress: Math.min(Math.max(progress, 0), 100),
        status,
        error
      });
    } catch (progressError) {
      console.warn('⚠️ [saveAudio] Erreur lors du callback de progression:', progressError);
    }
  };

  updateProgress(0, 'pending');

  try {
    // ÉTAPE 1: Validation du fichier audio renforcée
    console.log('🔍 [saveAudio] ÉTAPE 1 - Validation du fichier audio');
    updateProgress(10, 'uploading');
    
    const validationResult = validateAudioFile(audioData.file);
    if (!validationResult.valid) {
      const errorMsg = `Fichier invalide: ${validationResult.errors.join(', ')}`;
      console.error('❌ [saveAudio] Validation échouée:', validationResult.errors);
      updateProgress(10, 'error', errorMsg);
      throw new Error(errorMsg);
    }
    console.log('✅ [saveAudio] Fichier audio validé');

    // ÉTAPE 2: Validation marche
    console.log('🔍 [saveAudio] ÉTAPE 2 - Vérification marche');
    updateProgress(15, 'uploading');
    
    if (!marcheId) {
      const errorMsg = 'ID de marche manquant';
      console.error('❌ [saveAudio] ID marche manquant');
      updateProgress(15, 'error', errorMsg);
      throw new Error(errorMsg);
    }
    console.log('✅ [saveAudio] ID marche présent');

    // ÉTAPE 3: Upload vers Supabase Storage avec progression
    console.log('🔍 [saveAudio] ÉTAPE 3 - Upload Storage');
    updateProgress(20, 'uploading');
    
    console.log('📤 [saveAudio] Début upload Storage...');
    const uploadResult = await uploadAudio(audioData.file, marcheId, (progress) => {
      // Transmettre la progression de l'upload (20% à 70%)
      const mappedProgress = 20 + (progress * 0.5); // Map 0-100 to 20-70
      updateProgress(mappedProgress, 'uploading');
    });
    
    if (!uploadResult || !uploadResult.url) {
      const errorMsg = 'Upload Storage échoué - pas d\'URL retournée';
      console.error('❌ [saveAudio] Upload Storage échoué');
      updateProgress(20, 'error', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('✅ [saveAudio] Upload Storage terminé:', {
      url: uploadResult.url,
      path: uploadResult.path,
      urlLength: uploadResult.url.length
    });
    
    updateProgress(80, 'processing');

    // ÉTAPE 4: Préparation métadonnées
    console.log('🔍 [saveAudio] ÉTAPE 4 - Préparation métadonnées');
    updateProgress(85, 'processing');
    
    const validatedMetadata = validateAudioMetadata({
      duration: audioData.duration,
      format: audioData.file.type,
      size: audioData.file.size,
      originalName: audioData.file.name
    });
    console.log('📋 [saveAudio] Métadonnées préparées:', validatedMetadata ? 'OK' : 'NULL');
    
    // ÉTAPE 5: Préparation données insertion avec conversion correcte de la durée
    console.log('🔍 [saveAudio] ÉTAPE 5 - Préparation insertion');
    updateProgress(90, 'processing');
    
    // Convertir la durée en entier (arrondi à l'entier le plus proche)
    const dureeSecondes = audioData.duration ? Math.round(audioData.duration) : null;
    
    const insertData = {
      marche_id: marcheId,
      nom_fichier: fileName,
      url_supabase: uploadResult.url,
      titre: audioData.titre || fileName,
      description: audioData.description || '',
      duree_secondes: dureeSecondes,
      format_audio: audioData.file.type,
      taille_octets: audioData.file.size,
      ordre: 0,
      metadata: validatedMetadata
    };

    console.log('📝 [saveAudio] Données insertion préparées:', {
      marche_id: insertData.marche_id,
      nom_fichier: insertData.nom_fichier,
      url_supabase: insertData.url_supabase.substring(0, 50) + '...',
      titre: insertData.titre,
      description: insertData.description,
      duree_secondes: insertData.duree_secondes,
      format_audio: insertData.format_audio,
      taille_octets: insertData.taille_octets,
      ordre: insertData.ordre,
      hasMetadata: !!insertData.metadata
    });
    
    // ÉTAPE 6: Insertion en base de données avec retry si nécessaire
    console.log('🔍 [saveAudio] ÉTAPE 6 - Insertion base de données');
    updateProgress(95, 'processing');
    
    console.log('💾 [saveAudio] Exécution requête INSERT...');
    const { data: insertedData, error: insertError } = await supabase
      .from('marche_audio')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ [saveAudio] ERREUR INSERTION DÉTAILLÉE:', {
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
      
      const errorMsg = `Erreur insertion: ${insertError.message}${insertError.code ? ` (Code: ${insertError.code})` : ''}`;
      updateProgress(95, 'error', errorMsg);
      throw new Error(errorMsg);
    }

    if (!insertedData) {
      const errorMsg = 'Insertion réussie mais aucune donnée retournée';
      console.error('❌ [saveAudio] Pas de données retournées');
      updateProgress(95, 'error', errorMsg);
      throw new Error(errorMsg);
    }

    updateProgress(100, 'success');
    console.log('🎉 [saveAudio] ========== UPLOAD AUDIO TERMINÉ ==========');
    console.log('✅ [saveAudio] Fichier audio sauvegardé avec succès:', {
      id: insertedData.id,
      titre: insertedData.titre,
      url: insertedData.url_supabase.substring(0, 50) + '...',
      duree: insertedData.duree_secondes
    });
    
    return insertedData.id;
    
  } catch (error) {
    console.error('💥 [saveAudio] ========== ERREUR CRITIQUE ==========');
    console.error('💥 [saveAudio] Détails erreur:', {
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

// Sauvegarder plusieurs fichiers audio avec progression
export const saveAudioFiles = async (
  marcheId: string, 
  audioFiles: AudioToUpload[],
  onProgress?: (fileName: string, progress: AudioUploadProgress) => void
): Promise<string[]> => {
  console.log(`💾 [saveAudioFiles] Sauvegarde de ${audioFiles.length} fichiers audio pour marche ${marcheId}`);
  
  const savedIds: string[] = [];
  const errors: Array<{ fileName: string; error: Error }> = [];

  for (let i = 0; i < audioFiles.length; i++) {
    const audio = audioFiles[i];
    try {
      console.log(`📤 [saveAudioFiles] Sauvegarde audio ${i + 1}/${audioFiles.length}: ${audio.file.name}`);
      
      const audioId = await saveAudio(marcheId, audio, (progress) => {
        onProgress?.(audio.file.name, progress);
      });
      
      savedIds.push(audioId);
      console.log(`✅ [saveAudioFiles] Audio ${i + 1} sauvegardé avec ID: ${audioId}`);
    } catch (error) {
      console.error(`❌ [saveAudioFiles] Erreur audio ${i + 1} (${audio.file.name}):`, error);
      errors.push({ fileName: audio.file.name, error: error as Error });
      
      onProgress?.(audio.file.name, {
        fileName: audio.file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  console.log(`📊 [saveAudioFiles] Résultat: ${savedIds.length} réussies, ${errors.length} erreurs`);
  
  if (errors.length > 0) {
    console.error('💥 [saveAudioFiles] Erreurs détaillées:', errors);
    const errorMessage = `${errors.length} fichier(s) audio ont échoué lors de la sauvegarde:\n` + 
                        errors.map(e => `- ${e.fileName}: ${e.error.message}`).join('\n');
    throw new Error(errorMessage);
  }

  return savedIds;
};

// Fonction utilitaire pour extraire le chemin du fichier depuis l'URL Supabase
const extractFilePathFromUrl = (url: string): string | null => {
  try {
    console.log('🔍 [extractFilePathFromUrl] Analyse de l\'URL:', url);
    
    const urlParts = url.split('/');
    const publicIndex = urlParts.indexOf('public');
    
    if (publicIndex === -1 || publicIndex >= urlParts.length - 2) {
      console.error('❌ [extractFilePathFromUrl] Format d\'URL invalide');
      return null;
    }
    
    const pathParts = urlParts.slice(publicIndex + 2);
    const filePath = pathParts.join('/');
    
    console.log('✅ [extractFilePathFromUrl] Chemin extrait:', filePath);
    return filePath;
  } catch (error) {
    console.error('💥 [extractFilePathFromUrl] Erreur extraction:', error);
    return null;
  }
};

// Supprimer un fichier audio
export const deleteAudio = async (audioId: string): Promise<void> => {
  console.log('🗑️ [deleteAudio] ========== DÉBUT SUPPRESSION AUDIO ==========');
  console.log('📋 [deleteAudio] ID audio à supprimer:', audioId);
  
  try {
    // ÉTAPE 1: Récupérer les infos du fichier audio
    console.log('🔍 [deleteAudio] ÉTAPE 1 - Récupération des infos audio');
    const { data: audio, error: fetchError } = await supabase
      .from('marche_audio')
      .select('*')
      .eq('id', audioId)
      .single();

    if (fetchError) {
      console.error('❌ [deleteAudio] Erreur récupération audio:', fetchError);
      throw new Error(`Impossible de récupérer les infos du fichier audio: ${fetchError.message}`);
    }

    if (!audio) {
      console.error('❌ [deleteAudio] Fichier audio introuvable avec ID:', audioId);
      throw new Error('Fichier audio introuvable');
    }

    console.log('✅ [deleteAudio] Fichier audio trouvé:', {
      id: audio.id,
      nom_fichier: audio.nom_fichier,
      url_supabase: audio.url_supabase.substring(0, 50) + '...',
      marche_id: audio.marche_id,
      duree_secondes: audio.duree_secondes
    });

    // ÉTAPE 2: Supprimer le fichier du Storage
    console.log('🔍 [deleteAudio] ÉTAPE 2 - Suppression Storage');
    if (audio.url_supabase) {
      try {
        const filePath = extractFilePathFromUrl(audio.url_supabase);
        
        if (filePath) {
          console.log('🗑️ [deleteAudio] Suppression fichier Storage:', filePath);
          
          const { error: storageError } = await supabase.storage
            .from('marche-audio')
            .remove([filePath]);

          if (storageError) {
            console.warn('⚠️ [deleteAudio] Erreur suppression Storage (non bloquante):', storageError);
          } else {
            console.log('✅ [deleteAudio] Fichier Storage supprimé avec succès');
          }
        } else {
          console.warn('⚠️ [deleteAudio] Impossible d\'extraire le chemin du fichier, skip Storage');
        }
      } catch (storageError) {
        console.warn('⚠️ [deleteAudio] Erreur lors de la suppression Storage (non bloquante):', storageError);
      }
    }

    // ÉTAPE 3: Supprimer l'enregistrement en base
    console.log('🔍 [deleteAudio] ÉTAPE 3 - Suppression base de données');
    const { error: deleteError } = await supabase
      .from('marche_audio')
      .delete()
      .eq('id', audioId);

    if (deleteError) {
      console.error('❌ [deleteAudio] Erreur suppression base:', deleteError);
      throw new Error(`Erreur lors de la suppression en base: ${deleteError.message}`);
    }

    console.log('🎉 [deleteAudio] ========== SUPPRESSION AUDIO TERMINÉE ==========');
    console.log('✅ [deleteAudio] Fichier audio supprimé avec succès');
    
  } catch (error) {
    console.error('💥 [deleteAudio] ========== ERREUR CRITIQUE ==========');
    console.error('💥 [deleteAudio] Détails erreur:', {
      audioId,
      error,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

// Mettre à jour les métadonnées d'un fichier audio
export const updateAudioMetadata = async (
  audioId: string, 
  updates: { titre?: string; description?: string; ordre?: number }
): Promise<void> => {
  console.log('📝 [updateAudioMetadata] Mise à jour audio:', audioId, updates);
  
  try {
    const { data, error } = await supabase
      .from('marche_audio')
      .update(updates)
      .eq('id', audioId)
      .select()
      .single();

    if (error) {
      console.error('❌ [updateAudioMetadata] Erreur mise à jour:', error);
      throw error;
    }

    console.log('✅ [updateAudioMetadata] Métadonnées mises à jour:', data);
  } catch (error) {
    console.error('💥 [updateAudioMetadata] Erreur complète:', error);
    throw error;
  }
};
