
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
      primary: '#2d5016',
      secondary: '#7d8471',
      accent: '#b8860b',
      background: '#f5f5dc'
    }
  },
  'occitanie': {
    name: 'Occitanie',
    colors: {
      primary: '#8b4513',
      secondary: '#daa520',
      accent: '#cd853f',
      background: '#fff8dc'
    }
  },
  'auvergne-rhone-alpes': {
    name: 'Auvergne-Rhône-Alpes',
    colors: {
      primary: '#2f4f4f',
      secondary: '#708090',
      accent: '#4682b4',
      background: '#f0f8ff'
    }
  },
  'grand-est': {
    name: 'Grand Est',
    colors: {
      primary: '#556b2f',
      secondary: '#9acd32',
      accent: '#ffd700',
      background: '#f0fff0'
    }
  },
  'hauts-de-france': {
    name: 'Hauts-de-France',
    colors: {
      primary: '#191970',
      secondary: '#4169e1',
      accent: '#87ceeb',
      background: '#f0f8ff'
    }
  },
  'normandie': {
    name: 'Normandie',
    colors: {
      primary: '#2f4f4f',
      secondary: '#5f9ea0',
      accent: '#20b2aa',
      background: '#f0ffff'
    }
  },
  'bretagne': {
    name: 'Bretagne',
    colors: {
      primary: '#008080',
      secondary: '#48d1cc',
      accent: '#ffd700',
      background: '#f0ffff'
    }
  },
  'pays-de-la-loire': {
    name: 'Pays de la Loire',
    colors: {
      primary: '#228b22',
      secondary: '#32cd32',
      accent: '#ffff00',
      background: '#f0fff0'
    }
  },
  'centre-val-de-loire': {
    name: 'Centre-Val de Loire',
    colors: {
      primary: '#8b4513',
      secondary: '#daa520',
      accent: '#ffd700',
      background: '#fff8dc'
    }
  },
  'bourgogne-franche-comte': {
    name: 'Bourgogne-Franche-Comté',
    colors: {
      primary: '#8b0000',
      secondary: '#dc143c',
      accent: '#ffd700',
      background: '#fff0f5'
    }
  },
  'ile-de-france': {
    name: 'Île-de-France',
    colors: {
      primary: '#2f2f2f',
      secondary: '#696969',
      accent: '#4169e1',
      background: '#f5f5f5'
    }
  },
  'provence-alpes-cote-dazur': {
    name: 'Provence-Alpes-Côte d\'Azur',
    colors: {
      primary: '#9370db',
      secondary: '#dda0dd',
      accent: '#ffd700',
      background: '#f8f8ff'
    }
  },
  'corse': {
    name: 'Corse',
    colors: {
      primary: '#8b4513',
      secondary: '#d2691e',
      accent: '#ff6347',
      background: '#fff8dc'
    }
  },
  'guadeloupe': {
    name: 'Guadeloupe',
    colors: {
      primary: '#008080',
      secondary: '#20b2aa',
      accent: '#ffd700',
      background: '#f0ffff'
    }
  },
  'martinique': {
    name: 'Martinique',
    colors: {
      primary: '#ff6347',
      secondary: '#ff7f50',
      accent: '#ffd700',
      background: '#fff8dc'
    }
  },
  'guyane': {
    name: 'Guyane',
    colors: {
      primary: '#228b22',
      secondary: '#32cd32',
      accent: '#ffd700',
      background: '#f0fff0'
    }
  }
};
