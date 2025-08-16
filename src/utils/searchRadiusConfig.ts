/**
 * Configuration centralisée pour les rayons de recherche de données
 */

export interface SearchRadiusConfig {
  biodiversity: {
    default: number;
    min: number;
    max: number;
    description: string;
    sources: string[];
  };
  weather: {
    type: 'point-based';
    description: string;
    sources: string[];
  };
  realEstate: {
    type: 'point-based';
    description: string;
    sources: string[];
    stored_radius_legacy: number; // Pour compatibilité avec les anciennes données
  };
}

export const SEARCH_RADIUS_CONFIG: SearchRadiusConfig = {
  biodiversity: {
    default: 500, // 500 mètres par défaut
    min: 100,     // Minimum 100m pour avoir des données significatives
    max: 50000,   // Maximum 50km (limite eBird API)
    description: "Rayon de recherche autour du point GPS pour les observations d'espèces",
    sources: ['eBird', 'iNaturalist', 'GBIF']
  },
  weather: {
    type: 'point-based',
    description: "Données météorologiques ponctuelles (station météo la plus proche)",
    sources: ['Open-Meteo']
  },
  realEstate: {
    type: 'point-based', 
    description: "Données immobilières ponctuelles (parcelle exacte)",
    sources: ['LEXICON'],
    stored_radius_legacy: 1000 // Ancienne valeur stockée pour compatibilité
  }
};

/**
 * Valide un rayon de recherche pour la biodiversité
 */
export const validateBiodiversityRadius = (radius: number): { valid: boolean; error?: string } => {
  const config = SEARCH_RADIUS_CONFIG.biodiversity;
  
  if (radius < config.min) {
    return {
      valid: false,
      error: `Le rayon doit être d'au moins ${config.min}m pour obtenir des données significatives`
    };
  }
  
  if (radius > config.max) {
    return {
      valid: false,
      error: `Le rayon ne peut pas dépasser ${config.max}m (limite API eBird)`
    };
  }
  
  return { valid: true };
};

/**
 * Obtient la configuration d'un type de données
 */
export const getDataTypeConfig = (dataType: keyof SearchRadiusConfig) => {
  return SEARCH_RADIUS_CONFIG[dataType];
};

/**
 * Obtient une description lisible du rayon utilisé
 */
export const getRadiusDescription = (dataType: keyof SearchRadiusConfig, customRadius?: number): string => {
  const config = SEARCH_RADIUS_CONFIG[dataType];
  
  switch (dataType) {
    case 'biodiversity':
      if ('default' in config) {
        const radius = customRadius || config.default;
        return `Rayon de ${radius}m autour du point GPS`;
      }
      return 'Rayon de recherche biodiversité';
    case 'weather':
      return 'Point GPS exact (station météo la plus proche)';
    case 'realEstate':
      return 'Point GPS exact (parcelle cadastrale)';
    default:
      return 'Configuration inconnue';
  }
};

/**
 * Calcule la superficie couverte par un rayon (en km²)
 */
export const calculateCoverageArea = (radius: number): number => {
  return Math.PI * Math.pow(radius / 1000, 2);
};