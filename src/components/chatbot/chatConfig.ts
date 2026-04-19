import { LayoutDashboard, CalendarHeart, Users, Map, FileDown, Wrench } from 'lucide-react';

// ─── CHAT CONFIG — La Fréquence du Vivant (Admin) ───────────────
// Tout ce qui change d'un projet à l'autre vit ici.
// Pour réutiliser ce chatbot dans un autre projet : duplique le
// dossier chatbot/ + les hooks useChat*, puis édite UNIQUEMENT
// ce fichier.
// ────────────────────────────────────────────────────────────────

export type ChatContext =
  | 'dashboard'
  | 'events'
  | 'community'
  | 'marches'
  | 'exportations'
  | 'outils';

export interface ChatConfig {
  assistantName: string;
  assistantEmoji: string;
  botEmoji: string;
  welcomeMessage: string;
  welcomeSubtitle: string;
  welcomeSubtitleVoice: string;
  placeholderInput: string;

  /** Optional clickable entity pattern (set to null to disable) */
  entityPattern: RegExp | null;
  entityValidator?: (id: number) => boolean;
  entityTooltip?: (id: number) => string;
  entityLabel?: (id: number) => string;

  contextLabels: Record<ChatContext, string>;
  contextIcons: Record<ChatContext, typeof LayoutDashboard>;
  suggestions: Record<ChatContext, { emoji: string; text: string }[]>;

  printBranding: {
    title: string;
    subtitle: string;
    program: string;
    website: string;
    copyright: string;
    emoji: string;
    colors: {
      forest: string;
      forestLight: string;
      gold: string;
      goldLight: string;
      cream: string;
      creamLight: string;
      text: string;
      textMuted: string;
    };
  };

  edgeFunctionPath: string;
}

export const chatConfig: ChatConfig = {
  assistantName: 'Compagnon Admin du Vivant',
  assistantEmoji: '🌿',
  botEmoji: '🌱',
  welcomeMessage: 'Bonjour ! 👋',
  welcomeSubtitle: 'Posez-moi vos questions sur la Fréquence du Vivant',
  welcomeSubtitleVoice: 'Parlez ou tapez votre question 🎙️',
  placeholderInput: 'Posez votre question…',

  // Entités désactivées en v1 (pas de regex de référence)
  entityPattern: null,

  contextLabels: {
    dashboard: 'Administration',
    events: 'Événements',
    community: 'Communauté',
    marches: 'Marches',
    exportations: 'Exportations',
    outils: 'Outils',
  },
  contextIcons: {
    dashboard: LayoutDashboard,
    events: CalendarHeart,
    community: Users,
    marches: Map,
    exportations: FileDown,
    outils: Wrench,
  },

  suggestions: {
    dashboard: [
      { emoji: '📅', text: 'Combien d\'événements à venir ?' },
      { emoji: '👥', text: 'Combien de marcheurs au total ?' },
      { emoji: '🗺️', text: 'Combien de marches enregistrées ?' },
      { emoji: '📚', text: 'Combien d\'explorations publiées ?' },
    ],
    events: [
      { emoji: '📅', text: 'Quels sont les 5 prochains événements ?' },
      { emoji: '📊', text: 'Quel type d\'événement est le plus représenté ?' },
      { emoji: '⏳', text: 'Combien d\'événements passés cette année ?' },
      { emoji: '👥', text: 'Quel événement à venir a la plus grande capacité ?' },
    ],
    community: [
      { emoji: '🌟', text: 'Qui sont mes Sentinelles actives ?' },
      { emoji: '🤝', text: 'Combien d\'Ambassadeurs ?' },
      { emoji: '🚶', text: 'Top 5 des marcheurs les plus engagés' },
      { emoji: '📊', text: 'Répartition des rôles dans la communauté' },
    ],
    marches: [
      { emoji: '📍', text: 'Combien de marches sans coordonnées GPS ?' },
      { emoji: '🗺️', text: 'Combien de marches géolocalisées ?' },
      { emoji: '📊', text: 'Statistiques globales des marches' },
    ],
    exportations: [
      { emoji: '📚', text: 'Combien d\'explorations publiées ?' },
      { emoji: '📝', text: 'Combien d\'explorations en cours ?' },
    ],
    outils: [
      { emoji: '🛠️', text: 'Quels outils sont disponibles ?' },
    ],
  },

  printBranding: {
    title: 'La Fréquence du Vivant',
    subtitle: 'Compagnon Admin',
    program: 'Les Marches du Vivant — Administration',
    website: 'www.la-frequence-du-vivant.com',
    copyright:
      '© 2026 La Fréquence du Vivant — Document généré automatiquement par le Compagnon Admin.',
    emoji: '🌿',
    colors: {
      forest: '#1F5F4A',
      forestLight: '#2E7D5C',
      gold: '#C9A227',
      goldLight: '#E5C158',
      cream: '#FAF8F3',
      creamLight: '#FFFDF6',
      text: '#1a1a1a',
      textMuted: '#5a5a5a',
    },
  },

  edgeFunctionPath: 'admin-chat',
};
