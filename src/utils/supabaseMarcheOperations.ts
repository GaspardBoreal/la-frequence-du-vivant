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

// Créer une nouvelle marche
export const createMarche = async (formData: MarcheFormData): Promise<string> => {
  console.log('🔄 Création de la marche:', formData);

  // Créer le point PostGIS directement avec ST_Point
  let coordonnees = null;
  if (formData.latitude && formData.longitude && !isNaN(formData.latitude) && !isNaN(formData.longitude)) {
    // Utiliser la fonction ST_Point directement dans la requête
    coordonnees = `POINT(${formData.longitude} ${formData.latitude})`;
  }

  // Préparer les sous-thèmes
  const sousThemes = formData.sousThemes 
    ? formData.sousThemes.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : [];

  // Nettoyer la température pour éviter NaN
  const temperature = formData.temperature && !isNaN(formData.temperature) ? formData.temperature : null;

  const { data: marche, error: marcheError } = await supabase
    .from('marches')
    .insert({
      ville: formData.ville,
      region: formData.region || null,
      nom_marche: formData.nomMarche || null,
      theme_principal: formData.theme || null,
      descriptif_court: formData.descriptifCourt || null,
      descriptif_long: formData.poeme || null,
      date: formData.date || null,
      temperature: temperature,
      coordonnees: coordonnees,
      lien_google_drive: formData.lienGoogleDrive || null,
      sous_themes: sousThemes.length > 0 ? sousThemes : null
    })
    .select()
    .single();

  if (marcheError) {
    console.error('❌ Erreur lors de la création de la marche:', marcheError);
    throw marcheError;
  }

  console.log('✅ Marche créée avec succès:', marche.id);

  // Ajouter les tags si fournis
  if (formData.tags) {
    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
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

  // Créer le point PostGIS directement avec ST_Point
  let coordonnees = null;
  if (formData.latitude && formData.longitude && !isNaN(formData.latitude) && !isNaN(formData.longitude)) {
    // Utiliser la fonction ST_Point directement dans la requête
    coordonnees = `POINT(${formData.longitude} ${formData.latitude})`;
  }

  const sousThemes = formData.sousThemes 
    ? formData.sousThemes.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : [];

  // Nettoyer la température pour éviter NaN
  const temperature = formData.temperature && !isNaN(formData.temperature) ? formData.temperature : null;

  const { error: marcheError } = await supabase
    .from('marches')
    .update({
      ville: formData.ville,
      region: formData.region || null,
      nom_marche: formData.nomMarche || null,
      theme_principal: formData.theme || null,
      descriptif_court: formData.descriptifCourt || null,
      descriptif_long: formData.poeme || null,
      date: formData.date || null,
      temperature: temperature,
      coordonnees: coordonnees,
      lien_google_drive: formData.lienGoogleDrive || null,
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

  if (formData.tags) {
    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
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
