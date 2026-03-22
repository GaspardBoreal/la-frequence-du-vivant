
import { MarcheComplete, MarchePhoto, MarcheAudio, MarcheVideo } from './supabaseApi';
import { MarcheTechnoSensible } from './googleSheetsApi';

// Transformer les données Supabase vers le format actuel de l'application
export const transformSupabaseToLegacyFormat = (marche: MarcheComplete): MarcheTechnoSensible => {
  // Construire les URLs des photos depuis Supabase Storage
  const photos = marche.photos.map(photo => photo.url_supabase);
  
  // Construire les URLs des vidéos depuis Supabase Storage
  const videos = marche.videos.map(video => video.url_supabase);
  
  // Construire les URLs audio depuis Supabase Storage  
  const audioFiles = marche.audio.map(audio => audio.url_supabase);
  
  // Préparer les données audio complètes avec métadonnées
  const audioData = marche.audio.map(audio => ({
    id: audio.id,
    url: audio.url_supabase,
    nom_fichier: audio.nom_fichier,
    titre: audio.titre,
    description: audio.description,
    duree_secondes: audio.duree_secondes,
    ordre: audio.ordre
  }));

  const transformed: MarcheTechnoSensible = {
    id: marche.id,
    ville: marche.ville,
    departement: marche.departement || marche.region || '', // Utiliser departement d'abord, puis region en fallback
    region: marche.region || '',
    theme: marche.theme_principal || marche.nom_marche || marche.ville, // Utiliser theme_principal en priorité, puis nom_marche, puis ville
    nomMarche: marche.nom_marche || undefined,
    descriptifCourt: marche.descriptif_court || undefined, // Mapping direct et simple
    descriptifLong: marche.descriptif_long || undefined,
    date: marche.date || undefined,
    temperature: marche.temperature ? Number(marche.temperature) : undefined,
    latitude: marche.latitude != null ? Number(marche.latitude) : 0,
    longitude: marche.longitude != null ? Number(marche.longitude) : 0,
    lien: marche.lien_google_drive || undefined,
    photos: photos.length > 0 ? photos : undefined,
    videos: videos.length > 0 ? videos : undefined,
    audioFiles: audioFiles.length > 0 ? audioFiles : undefined,
    audioData: audioData.length > 0 ? audioData : undefined,
    // Nouveaux champs spécifiques à Supabase
    supabaseId: marche.id,
    etudes: marche.etudes.map(etude => ({
      id: etude.id,
      titre: etude.titre,
      contenu: etude.contenu,
      resume: etude.resume,
      chapitres: etude.chapitres,
      ordre: etude.ordre,
      type: etude.type_etude
    })),
    documents: marche.documents.map(doc => ({
      id: doc.id,
      nom: doc.nom_fichier,
      url: doc.url_supabase,
      titre: doc.titre,
      description: doc.description,
      type: doc.type_document
    })),
    supabaseTags: marche.tags.map(tag => tag.tag),
    sousThemes: marche.sous_themes || undefined,
    adresse: marche.adresse || undefined,
    organisateur_id: marche.organisateur_id || undefined,
    textes: marche.textes.map(texte => ({
      id: texte.id,
      titre: texte.titre,
      contenu: texte.contenu,
      type_texte: texte.type_texte,
      ordre: texte.ordre
    })),
    // Propriétés legacy pour compatibilité
    tags: marche.tags.map(tag => tag.tag).join(', '),
    sequencesSonores: audioFiles.length > 0 ? audioFiles : undefined,
    poeme: marche.descriptif_long || marche.descriptif_court || undefined, // Utiliser descriptif_long en priorité pour le poème
    tagsThematiques: marche.tags.map(tag => tag.tag),
    temoignages: [],
    liensInternes: [],
    liensExternes: []
  };

  console.log(`🔄 Transformation de la marche ${marche.ville}:`, {
    marcheId: marche.id,
    photos: photos.length,
    videos: videos.length,
    audio: audioFiles.length,
    etudes: marche.etudes.length,
    documents: marche.documents.length,
    textes: marche.textes.length,
    tags: marche.tags.length,
    latitude: transformed.latitude,
    longitude: transformed.longitude,
    theme: transformed.theme,
    descriptifCourt: transformed.descriptifCourt,
    descriptifLong: transformed.descriptifLong,
    poeme: transformed.poeme,
    rawLatitude: marche.latitude,
    rawLongitude: marche.longitude,
    photosUrls: photos,
    audioUrls: audioFiles,
    videosUrls: videos,
    rawPhotosData: marche.photos,
    rawAudioData: marche.audio,
    rawVideosData: marche.videos
  });

  return transformed;
};

// Fonction utilitaire pour créer les URLs Supabase Storage
export const getSupabaseStorageUrl = (bucket: string, path: string): string => {
  return `https://xzbunrtgbfbhinkzkzhf.supabase.co/storage/v1/object/public/${bucket}/${path}`;
};

// Transformer une photo Supabase en URL complète
export const getPhotoUrl = (photo: MarchePhoto): string => {
  return photo.url_supabase.startsWith('http') 
    ? photo.url_supabase 
    : getSupabaseStorageUrl('marche-photos', photo.url_supabase);
};

// Transformer une vidéo Supabase en URL complète
export const getVideoUrl = (video: MarcheVideo): string => {
  return video.url_supabase.startsWith('http')
    ? video.url_supabase
    : getSupabaseStorageUrl('marche-videos', video.url_supabase);
};

// Transformer un audio Supabase en URL complète
export const getAudioUrl = (audio: MarcheAudio): string => {
  return audio.url_supabase.startsWith('http')
    ? audio.url_supabase
    : getSupabaseStorageUrl('marche-audio', audio.url_supabase);
};
