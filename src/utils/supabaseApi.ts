import { supabase } from '@/integrations/supabase/client';

export interface MarcheSupabase {
  id: string;
  nom_marche?: string;
  ville: string;
  region?: string;
  departement?: string; // Ajouter departement
  coordonnees?: any; // PostGIS Point type
  date?: string;
  temperature?: number;
  descriptif_court?: string;
  descriptif_long?: string;
  theme_principal?: string;
  sous_themes?: string[];
  lien_google_drive?: string;
  latitude?: number; // Ajouter latitude
  longitude?: number; // Ajouter longitude
  adresse?: string; // Ajouter adresse
  created_at: string;
  updated_at: string;
}

export interface MarcheEtude {
  id: string;
  marche_id: string;
  titre: string;
  contenu: string;
  resume?: string;
  chapitres?: any;
  ordre: number;
  type_etude: 'principale' | 'complementaire' | 'annexe';
  created_at: string;
  updated_at: string;
}

export interface MarchePhoto {
  id: string;
  marche_id: string;
  nom_fichier: string;
  url_supabase: string;
  url_originale?: string;
  titre?: string;
  description?: string;
  ordre?: number;
  metadata?: any;
  created_at: string;
}

export interface MarcheAudio {
  id: string;
  marche_id: string;
  nom_fichier: string;
  url_supabase: string;
  url_originale?: string;
  titre?: string;
  description?: string;
  duree_secondes?: number;
  format_audio?: string;
  taille_octets?: number;
  ordre?: number;
  metadata?: any;
  created_at: string;
}

export interface MarcheVideo {
  id: string;
  marche_id: string;
  nom_fichier: string;
  url_supabase: string;
  url_originale?: string;
  titre?: string;
  description?: string;
  duree_secondes?: number;
  format_video?: string;
  resolution?: string;
  taille_octets?: number;
  thumbnail_url?: string;
  ordre?: number;
  metadata?: any;
  created_at: string;
}

export interface MarcheDocument {
  id: string;
  marche_id: string;
  nom_fichier: string;
  url_supabase: string;
  url_originale?: string;
  titre?: string;
  description?: string;
  type_document?: string;
  taille_octets?: number;
  version: number;
  ordre?: number;
  metadata?: any;
  created_at: string;
}

export interface MarcheTag {
  id: string;
  marche_id: string;
  tag: string;
  categorie?: string;
  created_at: string;
}

export interface MarcheComplete extends MarcheSupabase {
  photos: MarchePhoto[];
  audio: MarcheAudio[];
  videos: MarcheVideo[];
  documents: MarcheDocument[];
  etudes: MarcheEtude[];
  tags: MarcheTag[];
  latitude?: number;
  longitude?: number;
}

// Fonction utilitaire pour convertir les coordonnées PostGIS (gardée comme fallback)
const parseCoordinates = (coordonnees: any): { latitude: number; longitude: number } | null => {
  if (!coordonnees) return null;
  
  try {
    // PostGIS Point format: POINT(longitude latitude)
    if (typeof coordonnees === 'string') {
      const match = coordonnees.match(/POINT\(([^)]+)\)/);
      if (match) {
        const [lng, lat] = match[1].split(' ').map(Number);
        return { latitude: lat, longitude: lng };
      }
    } else if (coordonnees.coordinates && Array.isArray(coordonnees.coordinates)) {
      // GeoJSON format
      const [lng, lat] = coordonnees.coordinates;
      return { latitude: lat, longitude: lng };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors du parsing des coordonnées:', error);
    return null;
  }
};

// Récupérer toutes les marches avec leurs médias
export const fetchMarchesFromSupabase = async (): Promise<MarcheComplete[]> => {
  console.log('🔄 Récupération des marches depuis Supabase...');
  
  try {
    // Récupérer les marches principales
    const { data: marchesData, error: marchesError } = await supabase
      .from('marches')
      .select('*')
      .order('created_at', { ascending: false });

    if (marchesError) {
      console.error('❌ Erreur lors de la récupération des marches:', marchesError);
      throw marchesError;
    }

    if (!marchesData || marchesData.length === 0) {
      console.log('📭 Aucune marche trouvée dans Supabase');
      return [];
    }

    console.log(`📊 ${marchesData.length} marches trouvées`);

    // Pour chaque marche, récupérer tous les médias associés
    const marchesCompletes = await Promise.all(
      marchesData.map(async (marche): Promise<MarcheComplete> => {
        const marcheId = marche.id;
        
        console.log(`🔍 Traitement de la marche ${marche.ville}:`, {
          rawLatitude: marche.latitude,
          rawLongitude: marche.longitude,
          coordonnees: marche.coordonnees,
          typeLatitude: typeof marche.latitude,
          typeLongitude: typeof marche.longitude
        });
        
        // Récupérer en parallèle tous les médias
        const [photosResult, audioResult, videosResult, documentsResult, etudesResult, tagsResult] = await Promise.all([
          supabase.from('marche_photos').select('*').eq('marche_id', marcheId).order('ordre'),
          supabase.from('marche_audio').select('*').eq('marche_id', marcheId).order('ordre'),
          supabase.from('marche_videos').select('*').eq('marche_id', marcheId).order('ordre'),
          supabase.from('marche_documents').select('*').eq('marche_id', marcheId).order('ordre'),
          supabase.from('marche_etudes').select('*').eq('marche_id', marcheId).order('ordre'),
          supabase.from('marche_tags').select('*').eq('marche_id', marcheId)
        ]);

        // Nouvelle logique pour les coordonnées : utiliser directement latitude/longitude
        let finalLatitude: number = 0;
        let finalLongitude: number = 0;

        // Priorité 1 : utiliser directement latitude/longitude si disponibles
        if (marche.latitude != null && marche.longitude != null) {
          finalLatitude = Number(marche.latitude);
          finalLongitude = Number(marche.longitude);
          console.log(`✅ Coordonnées directes utilisées pour ${marche.ville}:`, {
            latitude: finalLatitude,
            longitude: finalLongitude
          });
        } else {
          // Priorité 2 : fallback sur parseCoordinates si latitude/longitude sont nulles
          const coordinates = parseCoordinates(marche.coordonnees);
          if (coordinates) {
            finalLatitude = coordinates.latitude;
            finalLongitude = coordinates.longitude;
            console.log(`🔄 Coordonnées parsées depuis coordonnees pour ${marche.ville}:`, {
              latitude: finalLatitude,
              longitude: finalLongitude
            });
          } else {
            console.log(`⚠️ Aucune coordonnée disponible pour ${marche.ville}`);
          }
        }

        const marcheComplete: MarcheComplete = {
          ...marche,
          photos: photosResult.data || [],
          audio: audioResult.data || [],
          videos: videosResult.data || [],
          documents: documentsResult.data || [],
          etudes: etudesResult.data || [],
          tags: tagsResult.data || [],
          latitude: finalLatitude,
          longitude: finalLongitude
        };

        console.log(`✅ Marche ${marche.ville} chargée avec:`, {
          photos: marcheComplete.photos.length,
          audio: marcheComplete.audio.length,
          videos: marcheComplete.videos.length,
          documents: marcheComplete.documents.length,
          etudes: marcheComplete.etudes.length,
          tags: marcheComplete.tags.length,
          finalLatitude: marcheComplete.latitude,
          finalLongitude: marcheComplete.longitude
        });

        return marcheComplete;
      })
    );

    console.log(`🎉 ${marchesCompletes.length} marches complètes chargées depuis Supabase`);
    return marchesCompletes;

  } catch (error) {
    console.error('💥 Erreur générale lors du chargement des marches:', error);
    throw error;
  }
};

// Récupérer une marche spécifique par ID
export const fetchMarcheById = async (id: string): Promise<MarcheComplete | null> => {
  console.log(`🔍 Récupération de la marche ID: ${id}`);
  
  try {
    const { data: marcheData, error: marcheError } = await supabase
      .from('marches')
      .select('*')
      .eq('id', id)
      .single();

    if (marcheError) {
      console.error('❌ Erreur lors de la récupération de la marche:', marcheError);
      throw marcheError;
    }

    if (!marcheData) {
      console.log('❌ Marche non trouvée');
      return null;
    }

    console.log(`🔍 Traitement de la marche ${marcheData.ville} (ID: ${id}):`, {
      rawLatitude: marcheData.latitude,
      rawLongitude: marcheData.longitude,
      coordonnees: marcheData.coordonnees,
      typeLatitude: typeof marcheData.latitude,
      typeLongitude: typeof marcheData.longitude
    });

    // Récupérer tous les médias associés
    const [photosResult, audioResult, videosResult, documentsResult, etudesResult, tagsResult] = await Promise.all([
      supabase.from('marche_photos').select('*').eq('marche_id', id).order('ordre'),
      supabase.from('marche_audio').select('*').eq('marche_id', id).order('ordre'),
      supabase.from('marche_videos').select('*').eq('marche_id', id).order('ordre'),
      supabase.from('marche_documents').select('*').eq('marche_id', id).order('ordre'),
      supabase.from('marche_etudes').select('*').eq('marche_id', id).order('ordre'),
      supabase.from('marche_tags').select('*').eq('marche_id', id)
    ]);

    // Nouvelle logique pour les coordonnées : utiliser directement latitude/longitude
    let finalLatitude: number = 0;
    let finalLongitude: number = 0;

    // Priorité 1 : utiliser directement latitude/longitude si disponibles
    if (marcheData.latitude != null && marcheData.longitude != null) {
      finalLatitude = Number(marcheData.latitude);
      finalLongitude = Number(marcheData.longitude);
      console.log(`✅ Coordonnées directes utilisées pour ${marcheData.ville}:`, {
        latitude: finalLatitude,
        longitude: finalLongitude
      });
    } else {
      // Priorité 2 : fallback sur parseCoordinates si latitude/longitude sont nulles
      const coordinates = parseCoordinates(marcheData.coordonnees);
      if (coordinates) {
        finalLatitude = coordinates.latitude;
        finalLongitude = coordinates.longitude;
        console.log(`🔄 Coordonnées parsées depuis coordonnees pour ${marcheData.ville}:`, {
          latitude: finalLatitude,
          longitude: finalLongitude
        });
      } else {
        console.log(`⚠️ Aucune coordonnée disponible pour ${marcheData.ville}`);
      }
    }

    const marcheComplete: MarcheComplete = {
      ...marcheData,
      photos: photosResult.data || [],
      audio: audioResult.data || [],
      videos: videosResult.data || [],
      documents: documentsResult.data || [],
      etudes: etudesResult.data || [],
      tags: tagsResult.data || [],
      latitude: finalLatitude,
      longitude: finalLongitude
    };

    console.log(`✅ Marche ${marcheData.ville} chargée depuis Supabase`);
    return marcheComplete;

  } catch (error) {
    console.error('💥 Erreur lors du chargement de la marche:', error);
    throw error;
  }
};

// Rechercher des marches par ville
export const searchMarchesByVille = async (ville: string): Promise<MarcheComplete[]> => {
  console.log(`🔍 Recherche des marches pour la ville: ${ville}`);
  
  try {
    const { data: marchesData, error: marchesError } = await supabase
      .from('marches')
      .select('*')
      .ilike('ville', `%${ville}%`)
      .order('created_at', { ascending: false });

    if (marchesError) {
      console.error('❌ Erreur lors de la recherche:', marchesError);
      throw marchesError;
    }

    if (!marchesData || marchesData.length === 0) {
      console.log(`📭 Aucune marche trouvée pour "${ville}"`);
      return [];
    }

    // Charger les médias pour chaque marche trouvée
    const marchesCompletes = await Promise.all(
      marchesData.map(async (marche): Promise<MarcheComplete> => {
        console.log(`🔍 Traitement de la marche ${marche.ville} (recherche):`, {
          rawLatitude: marche.latitude,
          rawLongitude: marche.longitude,
          coordonnees: marche.coordonnees
        });

        const [photosResult, audioResult, videosResult, documentsResult, etudesResult, tagsResult] = await Promise.all([
          supabase.from('marche_photos').select('*').eq('marche_id', marche.id).order('ordre'),
          supabase.from('marche_audio').select('*').eq('marche_id', marche.id).order('ordre'),
          supabase.from('marche_videos').select('*').eq('marche_id', marche.id).order('ordre'),
          supabase.from('marche_documents').select('*').eq('marche_id', marche.id).order('ordre'),
          supabase.from('marche_etudes').select('*').eq('marche_id', marche.id).order('ordre'),
          supabase.from('marche_tags').select('*').eq('marche_id', marche.id)
        ]);

        // Nouvelle logique pour les coordonnées : utiliser directement latitude/longitude
        let finalLatitude: number = 0;
        let finalLongitude: number = 0;

        // Priorité 1 : utiliser directement latitude/longitude si disponibles
        if (marche.latitude != null && marche.longitude != null) {
          finalLatitude = Number(marche.latitude);
          finalLongitude = Number(marche.longitude);
          console.log(`✅ Coordonnées directes utilisées pour ${marche.ville}:`, {
            latitude: finalLatitude,
            longitude: finalLongitude
          });
        } else {
          // Priorité 2 : fallback sur parseCoordinates si latitude/longitude sont nulles
          const coordinates = parseCoordinates(marche.coordonnees);
          if (coordinates) {
            finalLatitude = coordinates.latitude;
            finalLongitude = coordinates.longitude;
            console.log(`🔄 Coordonnées parsées depuis coordonnees pour ${marche.ville}:`, {
              latitude: finalLatitude,
              longitude: finalLongitude
            });
          } else {
            console.log(`⚠️ Aucune coordonnée disponible pour ${marche.ville}`);
          }
        }

        return {
          ...marche,
          photos: photosResult.data || [],
          audio: audioResult.data || [],
          videos: videosResult.data || [],
          documents: documentsResult.data || [],
          etudes: etudesResult.data || [],
          tags: tagsResult.data || [],
          latitude: finalLatitude,
          longitude: finalLongitude
        };
      })
    );

    console.log(`🎉 ${marchesCompletes.length} marches trouvées pour "${ville}"`);
    return marchesCompletes;

  } catch (error) {
    console.error('💥 Erreur lors de la recherche:', error);
    throw error;
  }
};
