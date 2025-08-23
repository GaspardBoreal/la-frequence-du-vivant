export interface ExplorationTheme {
  slug: string;
  title: {
    main: string;
    subtitle?: string;
  };
  description: string;
  particles: {
    type: 'water' | 'leaves' | 'stars';
    count: number;
  };
  colors: {
    gradient: {
      from: string;
      via?: string;
      to: string;
    };
    text: string;
    badge: string;
  };
  immersionModes: Array<{
    icon: string;
    label: string;
    desc: string;
  }>;
  signature: {
    author: string;
    title: string;
  };
  badge: {
    icon: string;
    text: string;
  };
}

export const EXPLORATION_THEMES: Record<string, ExplorationTheme> = {
  'frequences-de-la-riviere-dordogne-atlas-des-vivants': {
    slug: 'frequences-de-la-riviere-dordogne-atlas-des-vivants',
    title: {
      main: 'Fréquences de la rivière Dordogne',
      subtitle: 'Atlas des vivants',
    },
    description: 'Une marche poétique de 480 kilomètres à travers 6 départements, où l\'écoute révèle les fréquences secrètes du vivant le long des eaux de la Dordogne.',
    particles: {
      type: 'water',
      count: 25,
    },
    colors: {
      gradient: {
        from: 'from-primary/90',
        via: 'via-accent/80',
        to: 'to-secondary/70',
      },
      text: 'text-primary-foreground',
      badge: 'bg-white/20 text-primary-foreground border-white/30',
    },
    immersionModes: [
      { icon: 'Eye', label: 'Voir', desc: 'Navigation spatiale des souvenirs' },
      { icon: 'Waves', label: 'Suivre', desc: 'Chronologie du périple' },
      { icon: 'Heart', label: 'Ecouter', desc: 'Paysages sonores' },
      { icon: 'Stars', label: 'Lire', desc: 'Récits poétiques' }
    ],
    signature: {
      author: 'Gaspard Boréal',
      title: 'Poète des Mondes Hybrides',
    },
    badge: {
      icon: 'Palette',
      text: 'Galerie Fleuve',
    },
  },

  'bonzac-en-intimite-partagee': {
    slug: 'bonzac-en-intimite-partagee',
    title: {
      main: 'Bonzac en intimité partagée',
    },
    description: 'Une exploration sensible du territoire de Bonzac, entre vignes ancestrales, orchidées sauvages et méandres de l\'Isle. Un voyage au cœur des liens intimes qui unissent terre et habitants.',
    particles: {
      type: 'leaves',
      count: 30,
    },
    colors: {
      gradient: {
        from: 'from-emerald-800/90',
        via: 'via-amber-700/70',
        to: 'to-green-600/80',
      },
      text: 'text-amber-50',
      badge: 'bg-amber-100/20 text-amber-50 border-amber-200/30',
    },
    immersionModes: [
      { icon: 'Eye', label: 'Voir', desc: 'Entre les rangs de vignes' },
      { icon: 'Waves', label: 'Suivre', desc: 'Méandres aquatiques' },
      { icon: 'Heart', label: 'Ecouter', desc: 'Sons du terroir' },
      { icon: 'Flower', label: 'Lire', desc: 'Récits d\'intimité' }
    ],
    signature: {
      author: 'Gaspard Boréal',
      title: 'Poète des Mondes Hybrides',
    },
    badge: {
      icon: 'Leaf',
      text: 'Galerie Terroir',
    },
  },
};

export function getExplorationTheme(slug: string): ExplorationTheme | null {
  return EXPLORATION_THEMES[slug] || null;
}