import { supabase } from '@/integrations/supabase/client';
import { MarcheTechnoSensible } from './googleSheetsApi';
import { ExportOptions } from '@/components/admin/ExportPanel';

export interface ExportedMarche {
  id: string;
  nom_marche?: string;
  ville?: string;
  departement?: string;
  region?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  textes?: Array<{
    id: string;
    titre: string;
    contenu: string;
    type_texte: string;
    ordre?: number;
  }>;
  photos?: Array<{
    id: string;
    titre?: string;
    description?: string;
    url_supabase: string;
    tags: string[];
    ordre?: number;
  }>;
  audios?: Array<{
    id: string;
    titre?: string;
    description?: string;
    url_supabase: string;
    duree_secondes?: number;
    ordre?: number;
  }>;
  biodiversite?: {
    dernier_snapshot: string;
    total_especes: number;
    repartition: {
      oiseaux: number;
      plantes: number;
      champignons: number;
      autres: number;
    };
    indice_biodiversite?: number;
    observations_recentes: number;
    especes_details?: Array<{
      nom_commun?: string;
      nom_scientifique?: string;
      source: string;
      date_observation?: string;
    }>;
  };
  meteo?: {
    dernier_snapshot: string;
    temperature: {
      moyenne?: number;
      minimale?: number;
      maximale?: number;
    };
    humidite: {
      moyenne?: number;
      minimale?: number;
      maximale?: number;
    };
    precipitations: {
      total?: number;
      jours_pluvieux?: number;
    };
    vent_moyen?: number;
    heures_soleil?: number;
    source: string;
  };
  immobilier?: {
    dernier_snapshot: string;
    prix_moyen_m2?: number;
    prix_median_m2?: number;
    nombre_transactions: number;
    volume_total?: number;
    source: string;
  };
}

export interface ExportResult {
  metadata: {
    exportDate: string;
    type: 'marches' | 'explorations';
    totalItems: number;
    exportOptions: string[];
    version: string;
  };
  items: ExportedMarche[] | any[];
}

// Récupérer les textes d'une marche
async function fetchMarcheTexts(marcheId: string) {
  const { data, error } = await supabase
    .from('marche_textes')
    .select('id, titre, contenu, type_texte, ordre')
    .eq('marche_id', marcheId)
    .order('ordre', { ascending: true });

  if (error) {
    console.warn(`Erreur lors de la récupération des textes pour ${marcheId}:`, error);
    return [];
  }

  return data || [];
}

// Récupérer les photos avec leurs tags
async function fetchMarchePhotos(marcheId: string) {
  const { data: photos, error } = await supabase
    .from('marche_photos')
    .select(`
      id, 
      titre, 
      description, 
      url_supabase, 
      ordre,
      marche_photo_tags!inner(tag)
    `)
    .eq('marche_id', marcheId)
    .order('ordre', { ascending: true });

  if (error) {
    console.warn(`Erreur lors de la récupération des photos pour ${marcheId}:`, error);
    return [];
  }

  return (photos || []).map(photo => ({
    id: photo.id,
    titre: photo.titre,
    description: photo.description,
    url_supabase: photo.url_supabase,
    ordre: photo.ordre,
    tags: Array.isArray(photo.marche_photo_tags) 
      ? photo.marche_photo_tags.map((tag: any) => tag.tag)
      : []
  }));
}

// Récupérer les fichiers audio
async function fetchMarcheAudio(marcheId: string) {
  const { data, error } = await supabase
    .from('marche_audio')
    .select('id, titre, description, url_supabase, duree_secondes, ordre')
    .eq('marche_id', marcheId)
    .order('ordre', { ascending: true });

  if (error) {
    console.warn(`Erreur lors de la récupération des audios pour ${marcheId}:`, error);
    return [];
  }

  return data || [];
}

// Récupérer les données de biodiversité
async function fetchMarcheBiodiversity(marcheId: string) {
  const { data, error } = await supabase
    .from('biodiversity_snapshots')
    .select('*')
    .eq('marche_id', marcheId)
    .order('snapshot_date', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const snapshot = data[0];
  const speciesData = snapshot.species_data || [];
  
  const especes_details = Array.isArray(speciesData) 
    ? speciesData.map((species: any) => ({
        nom_commun: species.commonName || species.nom_commun,
        nom_scientifique: species.scientificName || species.nom_scientifique,
        source: species.source || 'Unknown',
        date_observation: species.observationDate || species.date_observation
      }))
    : [];

  return {
    dernier_snapshot: snapshot.snapshot_date,
    total_especes: snapshot.total_species || 0,
    repartition: {
      oiseaux: snapshot.birds_count || 0,
      plantes: snapshot.plants_count || 0,
      champignons: snapshot.fungi_count || 0,
      autres: snapshot.others_count || 0,
    },
    indice_biodiversite: snapshot.biodiversity_index,
    observations_recentes: snapshot.recent_observations || 0,
    especes_details
  };
}

// Récupérer les données météorologiques
async function fetchMarcheWeather(marcheId: string) {
  const { data, error } = await supabase
    .from('weather_snapshots')
    .select('*')
    .eq('marche_id', marcheId)
    .order('snapshot_date', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const snapshot = data[0];

  return {
    dernier_snapshot: snapshot.snapshot_date,
    temperature: {
      moyenne: snapshot.temperature_avg,
      minimale: snapshot.temperature_min,
      maximale: snapshot.temperature_max,
    },
    humidite: {
      moyenne: snapshot.humidity_avg,
      minimale: snapshot.humidity_min,
      maximale: snapshot.humidity_max,
    },
    precipitations: {
      total: snapshot.precipitation_total,
      jours_pluvieux: snapshot.precipitation_days,
    },
    vent_moyen: snapshot.wind_speed_avg,
    heures_soleil: snapshot.sunshine_hours,
    source: snapshot.source || 'open-meteo'
  };
}

// Récupérer les données immobilières
async function fetchMarcheRealEstate(marcheId: string) {
  const { data, error } = await supabase
    .from('real_estate_snapshots')
    .select('*')
    .eq('marche_id', marcheId)
    .order('snapshot_date', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const snapshot = data[0];

  return {
    dernier_snapshot: snapshot.snapshot_date,
    prix_moyen_m2: snapshot.avg_price_m2,
    prix_median_m2: snapshot.median_price_m2,
    nombre_transactions: snapshot.transactions_count || 0,
    volume_total: snapshot.total_volume,
    source: snapshot.source || 'lexicon'
  };
}

// Export des marches
export async function exportMarchesToJSON(
  marches: MarcheTechnoSensible[], 
  options: ExportOptions
): Promise<ExportResult> {
  const exportedMarches: ExportedMarche[] = [];
  
  console.log(`🚀 Début export de ${marches.length} marches...`);
  
  for (let i = 0; i < marches.length; i++) {
    const marche = marches[i];
    console.log(`📍 Export marche ${i + 1}/${marches.length}: ${marche.ville}`);
    
    const exportedMarche: ExportedMarche = {
      id: marche.id
    };

    // Données de base
    if (options.includeBasicInfo) {
      exportedMarche.nom_marche = marche.nomMarche;
      exportedMarche.ville = marche.ville;
      exportedMarche.departement = marche.departement;
      exportedMarche.region = marche.region;
    }

    // Coordonnées
    if (options.includeCoordinates && marche.latitude && marche.longitude) {
      exportedMarche.coordinates = {
        latitude: parseFloat(marche.latitude.toString()),
        longitude: parseFloat(marche.longitude.toString())
      };
    }

    // Récupération des données supplémentaires en parallèle
    const dataPromises = [];
    
    if (options.includeTexts) {
      dataPromises.push(fetchMarcheTexts(marche.id));
    }
    if (options.includePhotos) {
      dataPromises.push(fetchMarchePhotos(marche.id));
    }
    if (options.includeAudio) {
      dataPromises.push(fetchMarcheAudio(marche.id));
    }
    if (options.includeBiodiversity) {
      dataPromises.push(fetchMarcheBiodiversity(marche.id));
    }
    if (options.includeWeather) {
      dataPromises.push(fetchMarcheWeather(marche.id));
    }
    if (options.includeRealEstate) {
      dataPromises.push(fetchMarcheRealEstate(marche.id));
    }

    try {
      const results = await Promise.all(dataPromises);
      let resultIndex = 0;

      if (options.includeTexts) {
        exportedMarche.textes = results[resultIndex++];
      }
      if (options.includePhotos) {
        exportedMarche.photos = results[resultIndex++];
      }
      if (options.includeAudio) {
        exportedMarche.audios = results[resultIndex++];
      }
      if (options.includeBiodiversity) {
        const bioData = results[resultIndex++];
        if (bioData) exportedMarche.biodiversite = bioData;
      }
      if (options.includeWeather) {
        const weatherData = results[resultIndex++];
        if (weatherData) exportedMarche.meteo = weatherData;
      }
      if (options.includeRealEstate) {
        const realEstateData = results[resultIndex++];
        if (realEstateData) exportedMarche.immobilier = realEstateData;
      }
    } catch (error) {
      console.error(`Erreur lors de l'export de la marche ${marche.ville}:`, error);
    }

    exportedMarches.push(exportedMarche);
  }

  const selectedOptions = Object.entries(options)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  return {
    metadata: {
      exportDate: new Date().toISOString(),
      type: 'marches',
      totalItems: exportedMarches.length,
      exportOptions: selectedOptions,
      version: '1.0.0'
    },
    items: exportedMarches
  };
}

// Export des explorations (simplifié pour le moment)
export async function exportExplorationsToJSON(
  explorations: any[], 
  options: ExportOptions
): Promise<ExportResult> {
  const exportedExplorations = [];
  
  for (const exploration of explorations) {
    const exported: any = {
      id: exploration.id,
      name: exploration.name,
      slug: exploration.slug,
      description: exploration.description,
      published: exploration.published,
      created_at: exploration.created_at
    };

    // TODO: Ajouter la logique pour récupérer les marches associées et leurs données
    // selon les options sélectionnées
    
    exportedExplorations.push(exported);
  }

  const selectedOptions = Object.entries(options)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  return {
    metadata: {
      exportDate: new Date().toISOString(),
      type: 'explorations',
      totalItems: exportedExplorations.length,
      exportOptions: selectedOptions,
      version: '1.0.0'
    },
    items: exportedExplorations
  };
}