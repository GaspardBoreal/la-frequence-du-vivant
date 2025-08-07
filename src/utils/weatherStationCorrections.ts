// Service de correction des coordonnées des stations météorologiques
// Certaines stations ont des coordonnées incorrectes dans l'API LEXICON

interface StationCorrection {
  name: string;
  correctCoordinates: {
    lat: number;
    lng: number;
  };
  source: string;
  notes?: string;
}

// Mapping des corrections connues pour les stations météorologiques
const STATION_CORRECTIONS: Record<string, StationCorrection> = {
  'ST GERVAIS': {
    name: 'ST GERVAIS',
    correctCoordinates: {
      lat: 45.0189,
      lng: -0.4622
    },
    source: 'Coordonnées vérifiées via géolocalisation officielle',
    notes: 'L\'API LEXICON retourne parfois les coordonnées d\'une autre commune (Saint-Jean-d\'Illac)'
  },
  'ST GERVAIS 33415001': {
    name: 'ST GERVAIS 33415001',
    correctCoordinates: {
      lat: 45.0189,
      lng: -0.4622
    },
    source: 'Station météorologique FR33415001 - Gironde',
    notes: 'Coordonnées de la station météorologique officielle'
  }
};

/**
 * Corrige les coordonnées d'une station météorologique si nécessaire
 * @param stationName Nom de la station
 * @param originalCoordinates Coordonnées originales de l'API
 * @returns Coordonnées corrigées ou originales si aucune correction nécessaire
 */
export const correctStationCoordinates = (
  stationName: string,
  originalCoordinates: { lat: number; lng: number }
): { lat: number; lng: number } => {
  // Nettoyer le nom de la station pour la recherche
  const cleanStationName = stationName.trim().toUpperCase();
  
  // Chercher une correction exacte
  if (STATION_CORRECTIONS[cleanStationName]) {
    const correction = STATION_CORRECTIONS[cleanStationName];
    console.log(`🔧 Correction appliquée pour ${stationName}:`, {
      original: originalCoordinates,
      corrected: correction.correctCoordinates,
      source: correction.source
    });
    return correction.correctCoordinates;
  }
  
  // Chercher une correction partielle (pour gérer les variations de noms)
  for (const [key, correction] of Object.entries(STATION_CORRECTIONS)) {
    if (cleanStationName.includes(key) || key.includes(cleanStationName)) {
      console.log(`🔧 Correction partielle appliquée pour ${stationName} (trouvé: ${key}):`, {
        original: originalCoordinates,
        corrected: correction.correctCoordinates,
        source: correction.source
      });
      return correction.correctCoordinates;
    }
  }
  
  // Pas de correction nécessaire
  console.log(`✅ Coordonnées originales conservées pour ${stationName}:`, originalCoordinates);
  return originalCoordinates;
};

/**
 * Ajoute une nouvelle correction de station
 * @param stationName Nom de la station
 * @param coordinates Coordonnées correctes
 * @param source Source de vérification
 * @param notes Notes optionnelles
 */
export const addStationCorrection = (
  stationName: string,
  coordinates: { lat: number; lng: number },
  source: string,
  notes?: string
): void => {
  const cleanName = stationName.trim().toUpperCase();
  STATION_CORRECTIONS[cleanName] = {
    name: stationName,
    correctCoordinates: coordinates,
    source,
    notes
  };
  console.log(`➕ Nouvelle correction ajoutée pour ${stationName}:`, STATION_CORRECTIONS[cleanName]);
};

/**
 * Vérifie si une station a une correction disponible
 * @param stationName Nom de la station
 * @returns true si une correction existe
 */
export const hasStationCorrection = (stationName: string): boolean => {
  const cleanName = stationName.trim().toUpperCase();
  return Object.keys(STATION_CORRECTIONS).some(key => 
    cleanName.includes(key) || key.includes(cleanName)
  );
};

/**
 * Obtient les informations de correction pour une station
 * @param stationName Nom de la station
 * @returns Informations de correction ou null
 */
export const getStationCorrectionInfo = (stationName: string): StationCorrection | null => {
  const cleanName = stationName.trim().toUpperCase();
  
  // Recherche exacte
  if (STATION_CORRECTIONS[cleanName]) {
    return STATION_CORRECTIONS[cleanName];
  }
  
  // Recherche partielle
  for (const [key, correction] of Object.entries(STATION_CORRECTIONS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return correction;
    }
  }
  
  return null;
};