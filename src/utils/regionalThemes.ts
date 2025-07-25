
export interface RegionalTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export const REGIONAL_THEMES: Record<string, RegionalTheme> = {
  'nouvelle-aquitaine': {
    name: 'Nouvelle-Aquitaine',
    colors: {
      primary: '#8B4513',
      secondary: '#DEB887',
      accent: '#F4A460',
      background: '#FDF5E6'
    }
  },
  'occitanie': {
    name: 'Occitanie',
    colors: {
      primary: '#FF6B35',
      secondary: '#F7931E',
      accent: '#FFD23F',
      background: '#FFF8DC'
    }
  },
  'auvergne-rhone-alpes': {
    name: 'Auvergne-Rhône-Alpes',
    colors: {
      primary: '#2E5266',
      secondary: '#6E8898',
      accent: '#9FB1BC',
      background: '#F0F4F7'
    }
  },
  'provence-alpes-cote-dazur': {
    name: 'Provence-Alpes-Côte d\'Azur',
    colors: {
      primary: '#7B68EE',
      secondary: '#DA70D6',
      accent: '#FFB6C1',
      background: '#F8F8FF'
    }
  },
  'ile-de-france': {
    name: 'Île-de-France',
    colors: {
      primary: '#4A5568',
      secondary: '#718096',
      accent: '#A0AEC0',
      background: '#F7FAFC'
    }
  },
  'hauts-de-france': {
    name: 'Hauts-de-France',
    colors: {
      primary: '#3182CE',
      secondary: '#63B3ED',
      accent: '#BEE3F8',
      background: '#EBF8FF'
    }
  },
  'grand-est': {
    name: 'Grand Est',
    colors: {
      primary: '#38A169',
      secondary: '#68D391',
      accent: '#C6F6D5',
      background: '#F0FFF4'
    }
  },
  'normandie': {
    name: 'Normandie',
    colors: {
      primary: '#805AD5',
      secondary: '#B794F6',
      accent: '#E9D8FD',
      background: '#FAF5FF'
    }
  },
  'centre-val-de-loire': {
    name: 'Centre-Val de Loire',
    colors: {
      primary: '#D69E2E',
      secondary: '#F6E05E',
      accent: '#FAF089',
      background: '#FFFBEB'
    }
  },
  'bourgogne-franche-comte': {
    name: 'Bourgogne-Franche-Comté',
    colors: {
      primary: '#C53030',
      secondary: '#FC8181',
      accent: '#FED7D7',
      background: '#FFFAFA'
    }
  },
  'pays-de-la-loire': {
    name: 'Pays de la Loire',
    colors: {
      primary: '#319795',
      secondary: '#4FD1C7',
      accent: '#B2F5EA',
      background: '#E6FFFA'
    }
  },
  'bretagne': {
    name: 'Bretagne',
    colors: {
      primary: '#2B6CB0',
      secondary: '#4299E1',
      accent: '#90CDF4',
      background: '#EBF4FF'
    }
  },
  'corse': {
    name: 'Corse',
    colors: {
      primary: '#E53E3E',
      secondary: '#F56565',
      accent: '#FEB2B2',
      background: '#FFFAFA'
    }
  },
  'guadeloupe': {
    name: 'Guadeloupe',
    colors: {
      primary: '#DD6B20',
      secondary: '#ED8936',
      accent: '#FBD38D',
      background: '#FFFAF0'
    }
  },
  'martinique': {
    name: 'Martinique',
    colors: {
      primary: '#9F7AEA',
      secondary: '#B794F6',
      accent: '#DDD6FE',
      background: '#FAF5FF'
    }
  },
  'guyane': {
    name: 'Guyane',
    colors: {
      primary: '#38A169',
      secondary: '#68D391',
      accent: '#C6F6D5',
      background: '#F0FFF4'
    }
  }
};
