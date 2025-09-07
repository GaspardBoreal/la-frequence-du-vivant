// Phase 1.3: Central Exploration Context for unified state management

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { 
  ExplorationSession, 
  ExplorationViewMode, 
  ExplorationAudioTrack,
  ExplorationTextContent,
  ExplorationStats,
  ExplorationRouteParams 
} from '@/types/exploration';

interface ExplorationState {
  currentSession: ExplorationSession | null;
  viewModes: ExplorationViewMode[];
  audioPlaylist: ExplorationAudioTrack[];
  textContent: ExplorationTextContent[];
  stats: ExplorationStats | null;
  isLoading: boolean;
  error: string | null;
  preferences: {
    autoplay: boolean;
    volume: number;
    playbackRate: number;
    theme: string;
  };
}

type ExplorationAction =
  | { type: 'SET_SESSION'; payload: ExplorationSession }
  | { type: 'UPDATE_PROGRESS'; payload: { visited: string[]; timeSpent: number } }
  | { type: 'SET_MODE'; payload: 'voir' | 'suivre' | 'ecouter' | 'lire' }
  | { type: 'SET_MARCHE_INDEX'; payload: number }
  | { type: 'SET_AUDIO_PLAYLIST'; payload: ExplorationAudioTrack[] }
  | { type: 'SET_TEXT_CONTENT'; payload: ExplorationTextContent[] }
  | { type: 'SET_STATS'; payload: ExplorationStats }
  | { type: 'SET_PREFERENCES'; payload: Partial<ExplorationState['preferences']> }
  | { type: 'SET_VIEW_MODES'; payload: ExplorationViewMode[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: ExplorationState = {
  currentSession: null,
  viewModes: [
    {
      key: 'voir',
      title: 'Voir',
      icon: 'Eye',
      description: 'Parcourir visuellement les marches',
      component: 'GalerieFleuve',
      route: '',
      enabled: true
    },
    {
      key: 'suivre',
      title: 'Suivre',
      icon: 'MapPin',
      description: 'Timeline et carte GPS des marches',
      component: 'FleuveTemporel',
      route: '/suivre',
      enabled: true
    },
    {
      key: 'ecouter',
      title: 'Écouter',
      icon: 'Headphones',
      description: 'Podcast en continu des marches',
      component: 'ExperienceAudioContinue',
      route: '/ecouter',
      enabled: false,
      requirements: {
        pages: ['audio'],
        marches: { requiredMedia: ['audio'] }
      }
    },
    {
      key: 'lire',
      title: 'Lire',
      icon: 'BookOpen',
      description: 'Navigation textuelle par tags et types',
      component: 'ExperienceLecture',
      route: '/lire',
      enabled: false,
      requirements: {
        marches: { requiredMedia: ['etudes'] }
      }
    }
  ],
  audioPlaylist: [],
  textContent: [],
  stats: null,
  isLoading: false,
  error: null,
  preferences: {
    autoplay: true,
    volume: 0.8,
    playbackRate: 1.0,
    theme: 'default'
  }
};

function explorationReducer(state: ExplorationState, action: ExplorationAction): ExplorationState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, currentSession: action.payload };
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        currentSession: state.currentSession ? {
          ...state.currentSession,
          progress: {
            ...state.currentSession.progress,
            ...action.payload
          }
        } : null
      };
    case 'SET_MODE':
      return {
        ...state,
        currentSession: state.currentSession ? {
          ...state.currentSession,
          currentMode: action.payload
        } : null
      };
    case 'SET_MARCHE_INDEX':
      return {
        ...state,
        currentSession: state.currentSession ? {
          ...state.currentSession,
          currentMarcheIndex: action.payload
        } : null
      };
    case 'SET_AUDIO_PLAYLIST':
      return { ...state, audioPlaylist: action.payload };
    case 'SET_TEXT_CONTENT':
      return { ...state, textContent: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_PREFERENCES':
      return { 
        ...state, 
        preferences: { ...state.preferences, ...action.payload },
        currentSession: state.currentSession ? {
          ...state.currentSession,
          preferences: { ...state.currentSession.preferences, ...action.payload }
        } : null
      };
    case 'SET_VIEW_MODES':
      return { ...state, viewModes: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface ExplorationContextType {
  state: ExplorationState;
  // Session management
  initializeSession: (explorationId: string) => Promise<string>;
  updateProgress: (visited: string[], timeSpent: number) => void;
  setCurrentMode: (mode: 'voir' | 'suivre' | 'ecouter' | 'lire') => void;
  setMarcheIndex: (index: number) => void;
  // Data management
  setAudioPlaylist: (playlist: ExplorationAudioTrack[]) => void;
  setTextContent: (content: ExplorationTextContent[]) => void;
  setStats: (stats: ExplorationStats) => void;
  setViewModes: (modes: ExplorationViewMode[]) => void;
  // Navigation
  navigateToMode: (mode: 'voir' | 'suivre' | 'ecouter' | 'lire') => void;
  // Preferences
  updatePreferences: (preferences: Partial<ExplorationState['preferences']>) => void;
  // Route helpers
  buildRoute: (mode?: 'voir' | 'suivre' | 'ecouter' | 'lire') => string;
}

const ExplorationContext = createContext<ExplorationContextType | null>(null);

export const ExplorationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(explorationReducer, initialState);
  const navigate = useNavigate();
  const { slug } = useParams<ExplorationRouteParams>();

  const initializeSession = useCallback(async (explorationId: string): Promise<string> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Create new session
      const sessionId = crypto.randomUUID();
      const session: ExplorationSession = {
        id: sessionId,
        explorationId,
        currentMode: 'voir',
        currentMarcheIndex: 0,
        progress: {
          visited: [],
          completed: false,
          timeSpent: 0
        },
        preferences: state.preferences,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return sessionId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to initialize session' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  }, [state.preferences]);

  const updateProgress = useCallback((visited: string[], timeSpent: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { visited, timeSpent } });
  }, []);

  const setCurrentMode = useCallback((mode: 'voir' | 'suivre' | 'ecouter' | 'lire') => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setMarcheIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_MARCHE_INDEX', payload: index });
  }, []);

  const setAudioPlaylist = useCallback((playlist: ExplorationAudioTrack[]) => {
    dispatch({ type: 'SET_AUDIO_PLAYLIST', payload: playlist });
  }, []);

  const setTextContent = useCallback((content: ExplorationTextContent[]) => {
    dispatch({ type: 'SET_TEXT_CONTENT', payload: content });
  }, []);

  const setStats = useCallback((stats: ExplorationStats) => {
    dispatch({ type: 'SET_STATS', payload: stats });
  }, []);

  const setViewModes = useCallback((modes: ExplorationViewMode[]) => {
    dispatch({ type: 'SET_VIEW_MODES', payload: modes });
  }, []);

  const updatePreferences = useCallback((preferences: Partial<ExplorationState['preferences']>) => {
    dispatch({ type: 'SET_PREFERENCES', payload: preferences });
  }, []);

  const buildRoute = useCallback((mode?: 'voir' | 'suivre' | 'ecouter' | 'lire') => {
    if (!slug) return '/';
    
    const baseRoute = `/galerie-fleuve`;
    
    if (!mode || mode === 'voir') {
      return baseRoute;
    }
    
    return `${baseRoute}/${mode}`;
  }, [slug]);

  const navigateToMode = useCallback((mode: 'voir' | 'suivre' | 'ecouter' | 'lire') => {
    const route = buildRoute(mode);
    setCurrentMode(mode);
    navigate(route);
  }, [navigate, buildRoute, setCurrentMode]);

  const contextValue: ExplorationContextType = {
    state,
    initializeSession,
    updateProgress,
    setCurrentMode,
    setMarcheIndex,
    setAudioPlaylist,
    setTextContent,
    setStats,
    setViewModes,
    navigateToMode,
    updatePreferences,
    buildRoute
  };

  return (
    <ExplorationContext.Provider value={contextValue}>
      {children}
    </ExplorationContext.Provider>
  );
};

export const useExplorationContext = () => {
  const context = useContext(ExplorationContext);
  if (!context) {
    throw new Error('useExplorationContext must be used within ExplorationProvider');
  }
  return context;
};