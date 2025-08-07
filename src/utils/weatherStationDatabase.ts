/**
 * Base de données des stations météorologiques françaises
 * avec leurs coordonnées précises pour corriger les incohérences de géolocalisation
 */

export interface WeatherStation {
  code: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  elevation?: number;
  region?: string;
  department?: string;
}

// Base de données des principales stations météorologiques
export const WEATHER_STATIONS: Record<string, WeatherStation> = {
  // Gironde
  '33415001': {
    code: '33415001',
    name: 'ST GERVAIS',
    coordinates: { lat: 44.8167, lng: -0.7833 },
    elevation: 42,
    region: 'Nouvelle-Aquitaine',
    department: 'Gironde'
  },
  '33063001': {
    code: '33063001', 
    name: 'BORDEAUX-MERIGNAC',
    coordinates: { lat: 44.8333, lng: -0.6833 },
    elevation: 47,
    region: 'Nouvelle-Aquitaine',
    department: 'Gironde'
  },
  '33394002': {
    code: '33394002',
    name: 'ST EMILION',
    coordinates: { lat: 44.9000, lng: -0.2333 },
    elevation: 35,
    region: 'Nouvelle-Aquitaine',
    department: 'Gironde'
  },
  '33273001': {
    code: '33273001',
    name: 'MARTIGNAS-SUR-JALLE',
    coordinates: { lat: 44.8439, lng: -0.7803 },
    elevation: 15,
    region: 'Nouvelle-Aquitaine',
    department: 'Gironde'
  },
  // Nouvelle-Aquitaine - Autres stations
  '33522001': {
    code: '33522001',
    name: 'LA TESTE-DE-BUCH',
    coordinates: { lat: 44.6333, lng: -1.1333 },
    elevation: 4,
    region: 'Nouvelle-Aquitaine',
    department: 'Gironde'
  },
  '33056001': {
    code: '33056001',
    name: 'BLAYE',
    coordinates: { lat: 45.1333, lng: -0.6667 },
    elevation: 18,
    region: 'Nouvelle-Aquitaine',
    department: 'Gironde'
  },
  '24037001': {
    code: '24037001',
    name: 'BERGERAC',
    coordinates: { lat: 44.8333, lng: 0.4833 },
    elevation: 66,
    region: 'Nouvelle-Aquitaine',
    department: 'Dordogne'
  },
  '47001001': {
    code: '47001001',
    name: 'AGEN',
    coordinates: { lat: 44.1833, lng: 0.6167 },
    elevation: 66,
    region: 'Nouvelle-Aquitaine',
    department: 'Lot-et-Garonne'
  },
  '40192001': {
    code: '40192001',
    name: 'MONT-DE-MARSAN',
    coordinates: { lat: 43.9167, lng: -0.5000 },
    elevation: 59,
    region: 'Nouvelle-Aquitaine',
    department: 'Landes'
  },
  '64024001': {
    code: '64024001',
    name: 'BIARRITZ-ANGLET',
    coordinates: { lat: 43.4683, lng: -1.5317 },
    elevation: 69,
    region: 'Nouvelle-Aquitaine',
    department: 'Pyrénées-Atlantiques'
  }
};

/**
 * Trouve la station météorologique la plus proche d'un point donné
 */
export const findNearestWeatherStation = (
  targetCoordinates: { lat: number; lng: number },
  maxDistance: number = 100 // km
): WeatherStation | null => {
  let nearestStation: WeatherStation | null = null;
  let minDistance = Infinity;

  for (const station of Object.values(WEATHER_STATIONS)) {
    const distance = calculateDistance(targetCoordinates, station.coordinates);
    
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  }

  return nearestStation;
};

/**
 * Calcule la distance entre deux points géographiques (formule de Haversine)
 */
const calculateDistance = (
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Récupère les informations d'une station par son code
 */
export const getStationByCode = (code: string): WeatherStation | null => {
  return WEATHER_STATIONS[code] || null;
};

/**
 * Valide et corrige les coordonnées d'une station météorologique
 */
export const getCorrectStationCoordinates = (
  stationCode: string,
  stationName: string,
  fallbackCoordinates?: { lat: number; lng: number }
): { lat: number; lng: number } => {
  // D'abord essayer de trouver par code
  const stationByCode = getStationByCode(stationCode);
  if (stationByCode) {
    console.log(`✅ [WEATHER DB] Station trouvée par code: ${stationCode} -> ${stationByCode.name}`);
    return stationByCode.coordinates;
  }

  // Ensuite essayer de trouver par nom
  const stationByName = Object.values(WEATHER_STATIONS).find(
    station => station.name.toLowerCase().includes(stationName.toLowerCase()) ||
              stationName.toLowerCase().includes(station.name.toLowerCase())
  );
  
  if (stationByName) {
    console.log(`✅ [WEATHER DB] Station trouvée par nom: ${stationName} -> ${stationByName.name}`);
    return stationByName.coordinates;
  }

  // Fallback sur les coordonnées fournies
  if (fallbackCoordinates) {
    console.warn(`⚠️ [WEATHER DB] Station inconnue: ${stationCode}/${stationName}, utilisation du fallback`);
    return fallbackCoordinates;
  }

  // Dernier recours: coordonnées par défaut
  console.warn(`❌ [WEATHER DB] Station inconnue et aucun fallback: ${stationCode}/${stationName}`);
  return { lat: 44.8167, lng: -0.7833 }; // ST GERVAIS par défaut
};

/**
 * Récupère toutes les stations triées par distance depuis un point donné
 */
export const getAllStationsSortedByDistance = (
  targetCoordinates: { lat: number; lng: number }
): Array<WeatherStation & { distance: number }> => {
  const stationsWithDistance = Object.values(WEATHER_STATIONS).map(station => ({
    ...station,
    distance: calculateDistance(targetCoordinates, station.coordinates)
  }));

  return stationsWithDistance.sort((a, b) => a.distance - b.distance);
};