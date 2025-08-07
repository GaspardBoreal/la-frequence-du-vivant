// Service de géolocalisation pour les stations météorologiques
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface WeatherStation {
  name: string;
  code: string;
  coordinates: Coordinates;
  distance?: number;
  country?: string;
  commune?: string;
  elevation?: string;
  originalData?: any;
}

/**
 * Calcule la distance entre deux points GPS en utilisant la formule de Haversine
 * @param coords1 Coordonnées du premier point
 * @param coords2 Coordonnées du second point
 * @returns Distance en kilomètres
 */
export const calculateDistance = (coords1: Coordinates, coords2: Coordinates): number => {
  const R = 6371; // Rayon de la Terre en kilomètres
  
  const dLat = toRadians(coords2.lat - coords1.lat);
  const dLon = toRadians(coords2.lng - coords1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coords1.lat)) * Math.cos(toRadians(coords2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Convertit des degrés en radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Trie les stations météorologiques par distance croissante
 * @param targetCoords Coordonnées de référence
 * @param stations Liste des stations à trier
 * @returns Stations triées par distance
 */
export const sortStationsByDistance = (
  targetCoords: Coordinates, 
  stations: WeatherStation[]
): WeatherStation[] => {
  return stations
    .map(station => ({
      ...station,
      distance: calculateDistance(targetCoords, station.coordinates)
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

/**
 * Obtient les N stations les plus proches
 * @param targetCoords Coordonnées de référence
 * @param stations Liste des stations disponibles
 * @param count Nombre de stations à retourner (défaut: 3)
 * @returns Les N stations les plus proches
 */
export const getNearestStations = (
  targetCoords: Coordinates,
  stations: WeatherStation[],
  count: number = 3
): WeatherStation[] => {
  const sortedStations = sortStationsByDistance(targetCoords, stations);
  return sortedStations.slice(0, count);
};

/**
 * Formate la distance pour l'affichage
 * @param distance Distance en kilomètres
 * @returns Distance formatée
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

/**
 * Obtient une estimation de qualité de données basée sur la distance
 * @param distance Distance en kilomètres
 * @returns Niveau de qualité (excellent, bon, moyen, faible)
 */
export const getDataQuality = (distance: number): { 
  level: 'excellent' | 'bon' | 'moyen' | 'faible',
  color: string,
  description: string 
} => {
  if (distance < 5) {
    return {
      level: 'excellent',
      color: '#10b981',
      description: 'Données très représentatives de votre zone'
    };
  } else if (distance < 15) {
    return {
      level: 'bon',
      color: '#84cc16',
      description: 'Données représentatives de votre zone'
    };
  } else if (distance < 30) {
    return {
      level: 'moyen',
      color: '#f59e0b',
      description: 'Données approximatives pour votre zone'
    };
  } else {
    return {
      level: 'faible',
      color: '#ef4444',
      description: 'Données peu représentatives de votre zone'
    };
  }
};