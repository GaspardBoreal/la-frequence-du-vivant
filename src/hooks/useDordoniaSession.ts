import { useState, useCallback, useEffect } from 'react';

export type DordoniaScenario = 'marche' | 'revers' | 'atlas' | 'parlement' | 'choeur';

export interface DordoniaThresholdAnswers {
  ouEsTu: 'dehors' | 'ferme' | 'immobile' | null;
  queCherches: 'ecouter' | 'marcher' | 'decider' | 'cartographier' | 'imaginer2050' | null;
  quelRisque: 'renoncer' | 'ressentir' | 'trancher' | null;
}

export interface DordoniaSessionState {
  sessionKey: string;
  thresholdAnswers: DordoniaThresholdAnswers;
  scenarioActif: DordoniaScenario | null;
  isInSilenceMode: boolean;
  hasCompletedThreshold: boolean;
}

const STORAGE_KEY = 'dordonia_session_state';

const getOrCreateSessionKey = (): string => {
  let sessionKey = localStorage.getItem('dordonia_unique_session');
  if (!sessionKey) {
    sessionKey = `dord_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('dordonia_unique_session', sessionKey);
  }
  return sessionKey;
};

const getInitialState = (): DordoniaSessionState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  
  return {
    sessionKey: getOrCreateSessionKey(),
    thresholdAnswers: {
      ouEsTu: null,
      queCherches: null,
      quelRisque: null,
    },
    scenarioActif: null,
    isInSilenceMode: false,
    hasCompletedThreshold: false,
  };
};

export const useDordoniaSession = () => {
  const [state, setState] = useState<DordoniaSessionState>(getInitialState);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setThresholdAnswer = useCallback((
    key: keyof DordoniaThresholdAnswers,
    value: DordoniaThresholdAnswers[typeof key]
  ) => {
    setState(prev => ({
      ...prev,
      thresholdAnswers: {
        ...prev.thresholdAnswers,
        [key]: value,
      },
    }));
  }, []);

  const completeThreshold = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasCompletedThreshold: true,
    }));
  }, []);

  const setScenario = useCallback((scenario: DordoniaScenario) => {
    setState(prev => ({
      ...prev,
      scenarioActif: scenario,
      isInSilenceMode: false,
    }));
  }, []);

  const enterSilenceMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isInSilenceMode: true,
      scenarioActif: null,
    }));
  }, []);

  const exitSilenceMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isInSilenceMode: false,
    }));
  }, []);

  const resetSession = useCallback(() => {
    localStorage.removeItem('dordonia_unique_session');
    localStorage.removeItem(STORAGE_KEY);
    setState({
      sessionKey: getOrCreateSessionKey(),
      thresholdAnswers: {
        ouEsTu: null,
        queCherches: null,
        quelRisque: null,
      },
      scenarioActif: null,
      isInSilenceMode: false,
      hasCompletedThreshold: false,
    });
  }, []);

  // Recommend scenario based on threshold answers
  const getRecommendedScenario = useCallback((): DordoniaScenario | null => {
    const { ouEsTu, queCherches, quelRisque } = state.thresholdAnswers;
    
    if (!queCherches) return null;
    
    // Primary mapping based on "Que cherches-tu?"
    switch (queCherches) {
      case 'ecouter':
        return 'choeur';
      case 'marcher':
        return 'marche';
      case 'decider':
        return quelRisque === 'trancher' ? 'parlement' : 'revers';
      case 'cartographier':
        return 'atlas';
      case 'imaginer2050':
        return 'parlement';
      default:
        return 'marche';
    }
  }, [state.thresholdAnswers]);

  return {
    ...state,
    setThresholdAnswer,
    completeThreshold,
    setScenario,
    enterSilenceMode,
    exitSilenceMode,
    resetSession,
    getRecommendedScenario,
  };
};
