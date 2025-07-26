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

  const transformed: MarcheTechnoSensible = {
    id: marche.id,
    ville: marche.ville,
    departement: extractDepartmentFromRegion(marche.region || ''),
    region: marche.region || '',
    theme: marche.theme_principal || marche.nom_marche || marche.ville,
    nomMarche: marche.nom_marche || undefined,
    descriptifCourt: marche.descriptif_court || undefined,
    date: marche.date || undefined,
    temperature: marche.temperature ? Number(marche.temperature) : undefined,
    latitude: marche.latitude || 0,
    longitude: marche.longitude || 0,
    lien: marche.lien_google_drive || undefined, // Garder pour compatibilité migration
    photos: photos.length > 0 ? photos : undefined,
    videos: videos.length > 0 ? videos : undefined,
    audioFiles: audioFiles.length > 0 ? audioFiles : undefined,
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
    supabaseTags: marche.tags.map(tag => tag.tag), // Utiliser supabaseTags pour éviter le conflit
    sousThemes: marche.sous_themes || undefined
  };

  console.log(`🔄 Transformation de la marche ${marche.ville}:`, {
    photos: photos.length,
    videos: videos.length,
    audio: audioFiles.length,
    etudes: marche.etudes.length,
    documents: marche.documents.length,
    tags: marche.tags.length
  });

  return transformed;
};

// Extraire le département de la région (fonction utilitaire)
const extractDepartmentFromRegion = (region: string): string => {
  // Mapping basique région -> département
  const regionToDepartment: { [key: string]: string } = {
    'Nouvelle-Aquitaine': 'Gironde',
    'Bretagne': 'Finistère',
    'Occitanie': 'Haute-Garonne',
    'Auvergne-Rhône-Alpes': 'Rhône',
    'Provence-Alpes-Côte d\'Azur': 'Bouches-du-Rhône',
    'Île-de-France': 'Paris',
    'Grand Est': 'Bas-Rhin',
    'Hauts-de-France': 'Nord',
    'Normandie': 'Calvados',
    'Centre-Val de Loire': 'Loiret',
    'Bourgogne-Franche-Comté': 'Côte-d\'Or',
    'Pays de la Loire': 'Loire-Atlantique',
    'Corse': 'Corse-du-Sud'
  };

  return regionToDepartment[region] || region;
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
