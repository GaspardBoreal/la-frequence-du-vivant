// Extended text types for the revolutionary reading experience
// Supports the strategic vision of "La Comédie des Mondes Hybrides"

export type TextType = 
  // Literary forms for marches and explorations
  | 'haiku'                   // Haïku → Concentration extrême, condensation de l'instant sensible
  | 'senryu'                  // Senryū → Poésie de la nature humaine, observation ironique ou humoristique
  | 'haibun'                  // Haïbun → Prose poétique + haïku : récit de marche, introspection
  | 'poeme'                   // Poème → Élan sensible, souffle, intensité émotionnelle
  | 'texte-libre'             // Texte libre → Exploration narrative libre, sans contrainte
  | 'essai-bref'              // Essai bref → Réflexion conceptuelle et poétique
  | 'dialogue-polyphonique'   // Dialogue polyphonique → Mise en scène de voix multiples
  | 'fable'                   // Fable → Narration universelle avec morale implicite
  | 'fragment'                // Fragment → Phrase choc, mémorable
  | 'carte-poetique'          // Carte poétique → Hybridation texte + spectrogrammes + dessins
  
  // Legacy types (keeping for compatibility)
  | 'prose'           // Prose
  | 'carnet'          // Carnet de terrain
  | 'correspondance'  // Correspondance
  | 'manifeste'       // Manifeste
  | 'glossaire'       // Glossaire poétique
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
  // Primary literary forms
  haiku: {
    id: 'haiku',
    label: 'Haïku',
    description: 'Concentration extrême, condensation de l\'instant sensible',
    icon: '🎋',
    family: 'poetique',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-xl',
      lineHeight: 'leading-loose',
      spacing: 'space-y-3',
    },
  },
  senryu: {
    id: 'senryu',
    label: 'Senryū',
    description: 'Poésie de la nature humaine, observation ironique ou humoristique',
    icon: '😊',
    family: 'poetique',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-lg',
      lineHeight: 'leading-relaxed',
      spacing: 'space-y-3',
    },
  },
  haibun: {
    id: 'haibun',
    label: 'Haïbun',
    description: 'Prose poétique + haïku : récit de marche, introspection',
    icon: '🌸',
    family: 'poetique',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-base',
      lineHeight: 'leading-relaxed',
      spacing: 'space-y-3',
    },
  },
  poeme: {
    id: 'poeme',
    label: 'Poème',
    description: 'Élan sensible, souffle, intensité émotionnelle',
    icon: '📝',
    family: 'poetique',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-lg',
      lineHeight: 'leading-relaxed',
      spacing: 'space-y-4',
    },
  },
  'texte-libre': {
    id: 'texte-libre',
    label: 'Texte libre',
    description: 'Exploration narrative libre, sans contrainte',
    icon: '✍️',
    family: 'narrative',
    adaptiveStyle: {
      fontFamily: 'sans-serif',
      fontSize: 'text-base',
      lineHeight: 'leading-relaxed',
      spacing: 'space-y-4',
    },
  },
  'essai-bref': {
    id: 'essai-bref',
    label: 'Essai bref',
    description: 'Réflexion conceptuelle et poétique (bioacoustique, syntonisation)',
    icon: '🧠',
    family: 'terrain',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-base',
      lineHeight: 'leading-relaxed',
      spacing: 'space-y-3',
    },
  },
  'dialogue-polyphonique': {
    id: 'dialogue-polyphonique',
    label: 'Dialogue polyphonique',
    description: 'Mise en scène de voix multiples (vivant–humain–machine)',
    icon: '🎭',
    family: 'hybride',
    adaptiveStyle: {
      fontFamily: 'sans-serif',
      fontSize: 'text-sm',
      lineHeight: 'leading-normal',
      spacing: 'space-y-2',
    },
  },
  fable: {
    id: 'fable',
    label: 'Fable',
    description: 'Narration universelle avec morale implicite',
    icon: '🐺',
    family: 'narrative',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-base',
      lineHeight: 'leading-relaxed',
      spacing: 'space-y-4',
    },
  },
  'carte-poetique': {
    id: 'carte-poetique',
    label: 'Carte poétique',
    description: 'Hybridation texte + spectrogrammes + dessins',
    icon: '🗺️',
    family: 'hybride',
    adaptiveStyle: {
      fontFamily: 'sans-serif',
      fontSize: 'text-sm',
      lineHeight: 'leading-normal',
      spacing: 'space-y-3',
    },
  },
  fragment: {
    id: 'fragment',
    label: 'Fragment',
    description: 'Phrase choc, mémorable',
    icon: '✨',
    family: 'poetique',
    adaptiveStyle: {
      fontFamily: 'serif',
      fontSize: 'text-lg',
      lineHeight: 'leading-loose',
      spacing: 'space-y-2',
    },
  },

  // Legacy types for compatibility
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