import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BiodiversitySpecies } from '@/types/biodiversity';

export interface LocalBiodiversityData {
  species: BiodiversitySpecies[];
  location: { lat: number; lon: number; radius: number } | null;
  summary: { total: number; birds: number; plants: number; fungi: number };
  timestamp: number;
}

interface BiodiversityContextType {
  localData: LocalBiodiversityData | null;
  setLocalBiodiversity: (data: Omit<LocalBiodiversityData, 'timestamp'>) => void;
  clearLocalBiodiversity: () => void;
}

const BiodiversityContext = createContext<BiodiversityContextType | undefined>(undefined);

export const BiodiversityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [localData, setLocalData] = useState<LocalBiodiversityData | null>(null);

  const setLocalBiodiversity = useCallback((data: Omit<LocalBiodiversityData, 'timestamp'>) => {
    setLocalData({
      ...data,
      timestamp: Date.now(),
    });
  }, []);

  const clearLocalBiodiversity = useCallback(() => {
    setLocalData(null);
  }, []);

  return (
    <BiodiversityContext.Provider value={{ localData, setLocalBiodiversity, clearLocalBiodiversity }}>
      {children}
    </BiodiversityContext.Provider>
  );
};

export const useBiodiversityContext = () => {
  const context = useContext(BiodiversityContext);
  if (context === undefined) {
    throw new Error('useBiodiversityContext must be used within a BiodiversityProvider');
  }
  return context;
};

// Optional hook that returns null if outside provider (for components that may or may not have context)
export const useBiodiversityContextSafe = () => {
  return useContext(BiodiversityContext);
};
