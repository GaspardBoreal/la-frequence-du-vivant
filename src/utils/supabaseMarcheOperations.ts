import { supabase } from '@/integrations/supabase/client';
import { uploadPhoto, uploadVideo, uploadAudio, getAudioDuration, getVideoDuration } from './supabaseUpload';
import { queryClient } from '../lib/queryClient';

export interface MarcheFormData {
  ville: string;
  region: string;
  nomMarche: string;
  theme: string;
  descriptifCourt: string;
  poeme: string;
  date: string;
  temperature: number | null;
  latitude: number;
  longitude: number;
  lienGoogleDrive: string;
  sousThemes: string;
  tags: string;
  adresse: string;
}

export interface MediaFile {
  id: string;
  file: File;
  name: string;
  uploaded: boolean;
}

// Fonction utilitaire pour nettoyer les données du formulaire
const cleanFormData = (formData: MarcheFormData) => {
  console.log('🔄 Nettoyage des données du formulaire:', formData);
  
  // Nettoyer la température
  let temperature = null;
  if (formData.temperature !== null && formData.temperature !== undefined) {
    if (typeof formData.temperature === 'object' && formData.temperature !== null && 'value' in formData.temperature) {
      const tempValue = parseFloat((formData.temperature as any).value);
      temperature = !isNaN(tempValue) ? tempValue : null;
    } else if (typeof formData.temperature === 'number' && !isNaN(formData.temperature)) {
      temperature = formData.temperature;
    }
  }

  // Nettoyer le poème
  let poeme = '';
  if (formData.poeme !== null && formData.poeme !== undefined) {
    if (typeof formData.poeme === 'object' && formData.poeme !== null && 'value' in formData.poeme) {
      const poemeValue = (formData.poeme as any).value;
      poeme = poemeValue === 'undefined' ? '' : poemeValue;
    } else if (typeof formData.poeme === 'string') {
      poeme = formData.poeme;
    }
  }

  const cleaned = {
    ...formData,
    temperature,
    poeme
  };

  console.log('✅ Données nettoyées:', cleaned);
  return cleaned;
};

// Créer une nouvelle marche
export const createMarche = async (formData: MarcheFormData): Promise<string> => {
  console.log('🔄 Création de la marche:', formData);

  const cleanedData = cleanFormData(formData);

  // Préparer les coordonnées PostGIS correctement
  let coordonnees = null;
  if (cleanedData.latitude && cleanedData.longitude && 
      !isNaN(cleanedData.latitude) && !isNaN(cleanedData.longitude)) {
    // Utiliser la fonction ST_GeomFromText pour créer le point correctement
    console.log(`📍 Coordonnées: latitude=${cleanedData.latitude}, longitude=${cleanedData.longitude}`);
  }

  // Préparer les sous-thèmes
  const sousThemes = cleanedData.sousThemes 
    ? cleanedData.sousThemes.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : [];

  const insertData: any = {
    ville: cleanedData.ville,
    region: cleanedData.region || null,
    nom_marche: cleanedData.nomMarche || null,
    theme_principal: cleanedData.theme || null,
    descriptif_court: cleanedData.descriptifCourt || null,
    descriptif_long: cleanedData.poeme || null,
    date: cleanedData.date || null,
    temperature: cleanedData.temperature,
    lien_google_drive: cleanedData.lienGoogleDrive || null,
    sous_themes: sousThemes.length > 0 ? sousThemes : null
  };

  // Ajouter les coordonnées seulement si elles sont valides
  if (cleanedData.latitude && cleanedData.longitude && 
      !isNaN(cleanedData.latitude) && !isNaN(cleanedData.longitude)) {
    // Utiliser la fonction ST_GeomFromText de PostGIS
    insertData.coordonnees = `POINT(${cleanedData.longitude} ${cleanedData.latitude})`;
  }

  console.log('📦 Données à insérer:', insertData);

  const { data: marche, error: marcheError } = await supabase
    .from('marches')
    .insert(insertData)
    .select()
    .single();

  if (marcheError) {
    console.error('❌ Erreur lors de la création de la marche:', marcheError);
    throw marcheError;
  }

  console.log('✅ Marche créée avec succès:', marche.id);

  // Ajouter les tags si fournis
  if (cleanedData.tags) {
    const tags = cleanedData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (tags.length > 0) {
      const tagsData = tags.map(tag => ({
        marche_id: marche.id,
        tag: tag
      }));

      const { error: tagsError } = await supabase
        .from('marche_tags')
        .insert(tagsData);

      if (tagsError) {
        console.error('❌ Erreur lors de l\'ajout des tags:', tagsError);
      } else {
        console.log('✅ Tags ajoutés avec succès');
      }
    }
  }

  // Invalider le cache React Query pour actualiser la liste
  queryClient.invalidateQueries({ queryKey: ['marches-supabase'] });
  queryClient.invalidateQueries({ queryKey: ['supabase-status'] });

  return marche.id;
};

// Mettre à jour une marche existante
export const updateMarche = async (marcheId: string, formData: MarcheFormData): Promise<void> => {
  console.log('🔄 Mise à jour de la marche:', marcheId);

  const cleanedData = cleanFormData(formData);

  // Préparer les coordonnées PostGIS correctement
  let coordonnees = null;
  if (cleanedData.latitude && cleanedData.longitude && 
      !isNaN(cleanedData.latitude) && !isNaN(cleanedData.longitude)) {
    coordonnees = `POINT(${cleanedData.longitude} ${cleanedData.latitude})`;
  }

  const sousThemes = cleanedData.sousThemes 
    ? cleanedData.sousThemes.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : [];

  const { error: marcheError } = await supabase
    .from('marches')
    .update({
      ville: cleanedData.ville,
      region: cleanedData.region || null,
      nom_marche: cleanedData.nomMarche || null,
      theme_principal: cleanedData.theme || null,
      descriptif_court: cleanedData.descriptifCourt || null,
      descriptif_long: cleanedData.poeme || null,
      date: cleanedData.date || null,
      temperature: cleanedData.temperature,
      coordonnees: coordonnees,
      lien_google_drive: cleanedData.lienGoogleDrive || null,
      sous_themes: sousThemes.length > 0 ? sousThemes : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', marcheId);

  if (marcheError) {
    console.error('❌ Erreur lors de la mise à jour de la marche:', marcheError);
    throw marcheError;
  }

  // Mettre à jour les tags (supprimer les anciens et ajouter les nouveaux)
  await supabase.from('marche_tags').delete().eq('marche_id', marcheId);

  if (cleanedData.tags) {
    const tags = cleanedData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (tags.length > 0) {
      const tagsData = tags.map(tag => ({
        marche_id: marcheId,
        tag: tag
      }));

      const { error: tagsError } = await supabase
        .from('marche_tags')
        .insert(tagsData);

      if (tagsError) {
        console.error('❌ Erreur lors de la mise à jour des tags:', tagsError);
      }
    }
  }

  // Invalider TOUS les caches React Query pour actualiser la liste et les détails
  await queryClient.invalidateQueries({ queryKey: ['marches-supabase'] });
  await queryClient.invalidateQueries({ queryKey: ['marche-supabase', marcheId] });
  await queryClient.invalidateQueries({ queryKey: ['marches-search-supabase'] });
  await queryClient.invalidateQueries({ queryKey: ['supabase-status'] });

  // Forcer un refetch immédiat de la liste des marches
  await queryClient.refetchQueries({ queryKey: ['marches-supabase'] });

  console.log('✅ Marche mise à jour avec succès et cache invalidé');
};

// Supprimer une marche et tous ses médias associés
export const deleteMarche = async (marcheId: string): Promise<void> => {
  console.log(`🔄 Suppression de la marche ${marcheId}`);

  try {
    // D'abord vérifier que la marche existe
    const { data: existingMarche, error: checkError } = await supabase
      .from('marches')
      .select('id, ville')
      .eq('id', marcheId)
      .single();

    if (checkError || !existingMarche) {
      console.error('❌ Marche introuvable:', checkError);
      throw new Error('Marche introuvable');
    }

    console.log(`📍 Suppression de la marche "${existingMarche.ville}"`);

    // Supprimer d'abord tous les médias associés en parallèle
    const deletePromises = [
      supabase.from('marche_photos').delete().eq('marche_id', marcheId),
      supabase.from('marche_audio').delete().eq('marche_id', marcheId),
      supabase.from('marche_videos').delete().eq('marche_id', marcheId),
      supabase.from('marche_documents').delete().eq('marche_id', marcheId),
      supabase.from('marche_etudes').delete().eq('marche_id', marcheId),
      supabase.from('marche_tags').delete().eq('marche_id', marcheId)
    ];

    const results = await Promise.allSettled(deletePromises);
    
    // Log les erreurs mais ne pas arrêter le processus
    results.forEach((result, index) => {
      const tables = ['marche_photos', 'marche_audio', 'marche_videos', 'marche_documents', 'marche_etudes', 'marche_tags'];
      if (result.status === 'rejected') {
        console.error(`❌ Erreur suppression ${tables[index]}:`, result.reason);
      } else if (result.value.error) {
        console.error(`❌ Erreur suppression ${tables[index]}:`, result.value.error);
      } else {
        console.log(`✅ ${tables[index]} supprimés`);
      }
    });

    // Supprimer enfin la marche elle-même
    const { error: marcheError } = await supabase
      .from('marches')
      .delete()
      .eq('id', marcheId);

    if (marcheError) {
      console.error('❌ Erreur lors de la suppression de la marche:', marcheError);
      throw new Error(`Erreur lors de la suppression: ${marcheError.message}`);
    }

    console.log('✅ Marche supprimée avec succès');

    // Invalider le cache React Query pour actualiser la liste
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['marches-supabase'] }),
      queryClient.invalidateQueries({ queryKey: ['supabase-status'] }),
      queryClient.refetchQueries({ queryKey: ['marches-supabase'] })
    ]);

  } catch (error) {
    console.error('❌ Erreur générale lors de la suppression:', error);
    throw error;
  }
};

// Upload et sauvegarde des photos
export const savePhotos = async (marcheId: string, photos: MediaFile[]): Promise<void> => {
  console.log(`🔄 Sauvegarde de ${photos.length} photos pour la marche ${marcheId}`);

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (photo.uploaded) continue;

    try {
      const uploadResult = await uploadPhoto(photo.file, marcheId);
      
      const { error } = await supabase
        .from('marche_photos')
        .insert({
          marche_id: marcheId,
          nom_fichier: photo.name,
          url_supabase: uploadResult.url,
          ordre: i + 1
        });

      if (error) {
        console.error('❌ Erreur sauvegarde photo:', error);
      } else {
        console.log(`✅ Photo ${photo.name} sauvegardée`);
      }
    } catch (error) {
      console.error(`❌ Erreur upload photo ${photo.name}:`, error);
    }
  }
};

export const saveVideos = async (marcheId: string, videos: MediaFile[]): Promise<void> => {
  console.log(`🔄 Sauvegarde de ${videos.length} vidéos pour la marche ${marcheId}`);

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    if (video.uploaded) continue;

    try {
      const uploadResult = await uploadVideo(video.file, marcheId);
      const duration = await getVideoDuration(video.file);
      
      const { error } = await supabase
        .from('marche_videos')
        .insert({
          marche_id: marcheId,
          nom_fichier: video.name,
          url_supabase: uploadResult.url,
          duree_secondes: Math.round(duration),
          taille_octets: video.file.size,
          ordre: i + 1
        });

      if (error) {
        console.error('❌ Erreur sauvegarde vidéo:', error);
      } else {
        console.log(`✅ Vidéo ${video.name} sauvegardée`);
      }
    } catch (error) {
      console.error(`❌ Erreur upload vidéo ${video.name}:`, error);
    }
  }
};

export const saveAudioFiles = async (marcheId: string, audioFiles: MediaFile[]): Promise<void> => {
  console.log(`🔄 Sauvegarde de ${audioFiles.length} fichiers audio pour la marche ${marcheId}`);

  for (let i = 0; i < audioFiles.length; i++) {
    const audio = audioFiles[i];
    if (audio.uploaded) continue;

    try {
      const uploadResult = await uploadAudio(audio.file, marcheId);
      const duration = await getAudioDuration(audio.file);
      
      const { error } = await supabase
        .from('marche_audio')
        .insert({
          marche_id: marcheId,
          nom_fichier: audio.name,
          url_supabase: uploadResult.url,
          duree_secondes: Math.round(duration),
          taille_octets: audio.file.size,
          ordre: i + 1
        });

      if (error) {
        console.error('❌ Erreur sauvegarde audio:', error);
      } else {
        console.log(`✅ Audio ${audio.name} sauvegardé`);
      }
    } catch (error) {
      console.error(`❌ Erreur upload audio ${audio.name}:`, error);
    }
  }
};
