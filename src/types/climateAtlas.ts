export interface ClimateCity {
  name: string;
  department: string;
  region: string;
  latitude: number;
  longitude: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  riskScore: number;
  category: 'most-exposed' | 'least-exposed';
  projections: {
    temperature: {
      current: number;
      projection2035: number;
      projection2045: number;
    };
    heatDays: {
      current: number;
      projection2035: number;
      projection2045: number;
    };
    submersionRisk: boolean;
    droughtRisk: 'low' | 'medium' | 'high';
  };
  story?: string;
}

export interface ClimateRegion {
  name: string;
  cities: ClimateCity[];
  averageRisk: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface ThermoState {
  activeLevel: number; // 0-100 (froid -> chaud)
  selectedCity?: ClimateCity;
  viewMode: 'thermometer' | 'map' | 'timeline' | 'battle' | 'carousel';
  year: 2025 | 2035 | 2045;
}

export interface ClimateVisualization {
  type: 'temperature' | 'heatwave' | 'drought' | 'submersion';
  intensity: number;
  color: string;
  animation: string;
}