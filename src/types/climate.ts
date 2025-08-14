export interface ClimateProjection {
  year: number;
  scenario: 'present' | '2035' | '2045';
  temperature: {
    avg: number;
    min: number;
    max: number;
    change: number; // Change from present
  };
  precipitation: {
    total: number;
    change: number; // % change from present
  };
  extremeEvents: {
    heatDays: number; // Days > 30°C
    frostDays: number; // Days < 0°C
    droughtRisk: 'low' | 'medium' | 'high';
  };
}

export interface BiodiversityProjection {
  species: string;
  commonName: string;
  status: 'stable' | 'at-risk' | 'emerging' | 'migrating';
  confidence: number; // 0-1
  climateThreshold: {
    tempMin: number;
    tempMax: number;
    precipitationMin: number;
  };
  projection: {
    present: boolean;
    year2035: boolean;
    year2045: boolean;
  };
  migrationDistance?: number; // km north if migrating
  story?: string; // Micro-narrative
}

export interface FutureSoundscape {
  year: number;
  scenario: 'present' | '2035' | '2045';
  species: Array<{
    name: string;
    frequency: number; // 0-1 presence probability
    newSpecies: boolean;
  }>;
  soundCharacteristics: {
    diversity: number; // 0-1
    activity: 'dawn' | 'day' | 'dusk' | 'night';
    dominantGroups: string[];
  };
}

export interface TemporalVisualization {
  activeYear: number;
  transitionState: 'idle' | 'transitioning' | 'complete';
  morphingElements: Array<{
    element: string;
    fromValue: number;
    toValue: number;
    progress: number; // 0-1
  }>;
}