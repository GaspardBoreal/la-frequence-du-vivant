// Phase 1.2: Strengthen TypeScript types for explorations

export interface ExplorationTheme {
  slug: string;
  title: string;
  description: string;
  particles?: {
    type: 'leaves' | 'stars' | 'bubbles';
    count: number;
    colors: string[];
    animations: string[];
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  immersionModes: Array<{
    key: 'voir' | 'suivre' | 'ecouter' | 'lire';
    title: string;
    icon: string;
    description: string;
    route: string;
    enabled: boolean;
  }>;
  signature?: string;
  badge?: string;
}

export type ExplorationPageType = 
  | 'auteur' 
  | 'audio' 
  | 'marches' 
  | 'feedback' 
  | 'precommande';

export interface ExplorationPageConfig {
  // Configuration spécifique selon le type de page
  audio?: {
    introText?: string;
    showPlaylist?: boolean;
    continuousPlay?: boolean;
  };
  auteur?: {
    authorName?: string;
    authorBio?: string;
    authorImage?: string;
    socialLinks?: Array<{
      platform: string;
      url: string;
    }>;
  };
  marches?: {
    viewMode?: 'grid' | 'list' | 'timeline';
    showFilters?: boolean;
    sortBy?: 'order' | 'date' | 'region';
  };
  feedback?: {
    allowAnonymous?: boolean;
    showRating?: boolean;
    maxLength?: number;
  };
  precommande?: {
    product?: {
      title: string;
      description: string;
      price?: number;
      image?: string;
    };
    formFields?: string[];
  };
}

export interface ExplorationPage {
  id: string;
  exploration_id: string;
  type: ExplorationPageType;
  ordre: number;
  nom: string;
  description?: string;
  config?: ExplorationPageConfig;
  created_at: string;
  updated_at: string;
}

export interface ExplorationNavigationMode {
  key: 'interactive' | 'galerie-fleuve';
  title: string;
  description: string;
  route: string;
  features: string[];
  target: 'general' | 'immersive' | 'scholarly';
}

export interface ExplorationViewMode {
  key: 'voir' | 'suivre' | 'ecouter' | 'lire';
  title: string;
  icon: string;
  description: string;
  component: string;
  route: string;
  enabled: boolean;
  requirements?: {
    pages?: ExplorationPageType[];
    marches?: {
      minCount?: number;
      requiredMedia?: ('audio' | 'photos' | 'etudes')[];
    };
  };
}

export interface ExplorationMarcheModel {
  key: 'classique' | 'bioacoustique';
  title: string;
  description: string;
  template: string;
  features: string[];
  mediaRequirements: string[];
}

export interface ExplorationAudioTrack {
  id: string;
  title: string;
  description?: string;
  url: string;
  duration?: number;
  marcheId?: string;
  marcheName?: string;
  order: number;
}

export interface ExplorationTextContent {
  id: string;
  title: string;
  content: string;
  type: import('@/types/textTypes').TextType;
  tags: string[];
  marcheId?: string;
  marcheName?: string;
  order: number;
}

export interface ExplorationStats {
  marches: number;
  photos: number;
  regions: number;
  audio?: number;
  texts?: number;
  totalDuration?: number;
}

export interface ExplorationSession {
  id: string;
  explorationId: string;
  currentMode: 'voir' | 'suivre' | 'ecouter' | 'lire';
  currentMarcheIndex: number;
  progress: {
    visited: string[];
    completed: boolean;
    timeSpent: number;
  };
  preferences: {
    autoplay: boolean;
    volume: number;
    playbackRate: number;
    theme: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ExplorationRouteParams extends Record<string, string> {
  slug: string;
  mode?: 'voir' | 'suivre' | 'ecouter' | 'lire';
  sessionId?: string;
  narrativeSlug?: string;
}