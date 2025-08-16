import React, { createContext, useContext, useState, ReactNode } from 'react';

interface InsightsFilters {
  dateRange: string;
  regions: string[];
  dataTypes: string[];
  marches: string[];
  explorations: string[];
}

interface InsightsFiltersContextType {
  filters: InsightsFilters;
  setFilters: (filters: InsightsFilters) => void;
  updateFilter: (key: keyof InsightsFilters, value: any) => void;
}

const InsightsFiltersContext = createContext<InsightsFiltersContextType | undefined>(undefined);

interface InsightsFiltersProviderProps {
  children: ReactNode;
}

export const InsightsFiltersProvider: React.FC<InsightsFiltersProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<InsightsFilters>({
    dateRange: 'all', // Default to all data to show everything
    regions: [],
    dataTypes: ['biodiversity', 'weather', 'real_estate'],
    marches: [],
    explorations: []
  });

  const updateFilter = (key: keyof InsightsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <InsightsFiltersContext.Provider value={{ filters, setFilters, updateFilter }}>
      {children}
    </InsightsFiltersContext.Provider>
  );
};

export const useInsightsFilters = () => {
  const context = useContext(InsightsFiltersContext);
  if (context === undefined) {
    throw new Error('useInsightsFilters must be used within a InsightsFiltersProvider');
  }
  return context;
};