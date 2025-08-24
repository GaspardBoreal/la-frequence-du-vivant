// Extended text types for the revolutionary reading experience
// Supports the strategic vision of "La Comédie des Mondes Hybrides"

export type TextType = 
  // Core existing types
  | 'poeme'           // Poème en prose
  | 'haiku'           // Haïku
  | 'haibun'          // Haïbun
  | 'prose'           // Prose
  
  // New strategic types (Phase 1)
  | 'fragment'        // Fragment
  | 'carnet'          // Carnet de terrain
  | 'correspondance'  // Correspondance
  | 'manifeste'       // Manifeste
  | 'glossaire'       // Glossaire poétique
  
  // Future hybrid types (Phase 2)
  | 'protocole'       // Protocole hybride
  | 'synthese'        // Synthèse IA-Humain
  | 'recit-donnees';  // Récit-données

export interface TextTypeInfo {
  id: TextType;
  label: string;
  description: string;
  icon: string;
  family: 'poetique' | 'narrative' | 'terrain' | 'hybride';
  adaptiveStyle: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    spacing: string;
  };
}

export const TEXT_TYPES_REGISTRY: Record<TextType, TextTypeInfo> = {
  // Core poetic types
  poeme: {
    id: 'poeme',
    label: 'Poème en prose',
    description: 'Texte poétique en forme libre',
    icon: '📝',
    family: 'poetique',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-lg',
      lineHeight: 'leading-relaxed',
      spacing: 'space-y-4',
    },
  },
  haiku: {
    id: 'haiku',
    label: 'Haïku',
    description: 'Forme poétique traditionnelle japonaise',
    icon: '🎋',
    family: 'poetique',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-xl',
      lineHeight: 'leading-loose',
      spacing: 'space-y-2',
    },
  },
  haibun: {
    id: 'haibun',
    label: 'Haïbun',
    description: 'Prose poétique accompagnée d\'un haïku',
    icon: '🌸',
    family: 'poetique',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-base',
      lineHeight: 'leading-relaxed',
      spacing: 'space-y-3',
    },
  },
  prose: {
    id: 'prose',
    label: 'Prose',
    description: 'Texte narratif en prose',
    icon: '📖',
    family: 'narrative',
    adaptiveStyle: {
      fontFamily: 'sans-serif',
      fontSize: 'text-base',
      lineHeight: 'leading-normal',
      spacing: 'space-y-4',
    },
  },

  // New strategic types
  fragment: {
    id: 'fragment',
    label: 'Fragment',
    description: 'Éclat de perception, instantané poétique',
    icon: '✨',
    family: 'poetique',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-lg',
      lineHeight: 'leading-loose',
      spacing: 'space-y-2',
    },
  },
  carnet: {
    id: 'carnet',
    label: 'Carnet de terrain',
    description: 'Observations et notes de marche',
    icon: '🗒️',
    family: 'terrain',
    adaptiveStyle: {
      fontFamily: 'monospace',
      fontSize: 'text-sm',
      lineHeight: 'leading-normal',
      spacing: 'space-y-2',
    },
  },
  correspondance: {
    id: 'correspondance',
    label: 'Correspondance',
    description: 'Dialogue entre Laurent TRIPIED et Gaspard Boréal',
    icon: '💌',
    family: 'narrative',
    adaptiveStyle: {
      fontFamily: 'sans-serif',
      fontSize: 'text-base',
      lineHeight: 'leading-normal',
      spacing: 'space-y-3',
    },
  },
  manifeste: {
    id: 'manifeste',
    label: 'Manifeste',
    description: 'Déclaration poétique et territoriale',
    icon: '📜',
    family: 'narrative',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-lg',
      lineHeight: 'leading-relaxed',
      spacing: 'space-y-4',
    },
  },
  glossaire: {
    id: 'glossaire',
    label: 'Glossaire poétique',
    description: 'Définitions sensibles et territorialisées',
    icon: '📚',
    family: 'terrain',
    adaptiveStyle: {
      fontFamily: 'sans-serif',
      fontSize: 'text-sm',
      lineHeight: 'leading-normal',
      spacing: 'space-y-2',
    },
  },

  // Future hybrid types
  protocole: {
    id: 'protocole',
    label: 'Protocole hybride',
    description: 'Méthode de captation poétique des données',
    icon: '🔬',
    family: 'hybride',
    adaptiveStyle: {
      fontFamily: 'monospace',
      fontSize: 'text-sm',
      lineHeight: 'leading-tight',
      spacing: 'space-y-3',
    },
  },
  synthese: {
    id: 'synthese',
    label: 'Synthèse IA-Humain',
    description: 'Co-création entre intelligence artificielle et sensibilité humaine',
    icon: '🤖',
    family: 'hybride',
    adaptiveStyle: {
      fontFamily: 'sans-serif',
      fontSize: 'text-base',
      lineHeight: 'leading-normal',
      spacing: 'space-y-4',
    },
  },
  'recit-donnees': {
    id: 'recit-donnees',
    label: 'Récit-données',
    description: 'Narration générée à partir de données territorialisées',
    icon: '📊',
    family: 'hybride',
    adaptiveStyle: {
      fontFamily: 'sans-serif',
      fontSize: 'text-base',
      lineHeight: 'leading-normal',
      spacing: 'space-y-3',
    },
  },
};

export function getTextTypeInfo(type: TextType): TextTypeInfo {
  return TEXT_TYPES_REGISTRY[type];
}

export function getTextTypesByFamily(family: TextTypeInfo['family']): TextTypeInfo[] {
  return Object.values(TEXT_TYPES_REGISTRY).filter(info => info.family === family);
}