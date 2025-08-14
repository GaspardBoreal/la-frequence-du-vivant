export interface SpeciesClimateThreshold {
  species: string;
  scientificName: string;
  commonName: string;
  kingdom: 'Plantae' | 'Animalia' | 'Fungi';
  climateEnvelope: {
    tempMin: number;
    tempMax: number;
    tempOptimal: number;
    precipitationMin: number;
    precipitationMax: number;
    precipitationOptimal: number;
  };
  migrationCapacity: number; // km/year average migration distance
  adaptability: 'low' | 'medium' | 'high';
  conservationPriority: 'low' | 'medium' | 'high' | 'critical';
  phenologyShift: number; // days shift per degree of warming
}

export interface BiodiversitySignal {
  species: string;
  signalType: 'new_arrival' | 'population_decline' | 'range_shift' | 'phenology_change' | 'abundance_increase';
  strength: number; // 0-1 confidence
  firstDetected: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  observations: Array<{
    date: string;
    latitude: number;
    longitude: number;
    count: number;
    source: 'gbif' | 'inaturalist' | 'ebird';
    quality: 'high' | 'medium' | 'low';
  }>;
  prediction: {
    likelihood2035: number;
    likelihood2045: number;
    migrationDirection?: 'north' | 'south' | 'east' | 'west' | 'higher_altitude';
    estimatedDistance?: number;
  };
}

export interface EcosystemTransition {
  currentType: string;
  futureType2035: string;
  futureType2045: string;
  transitionProbability: number;
  keySpeciesChanges: Array<{
    species: string;
    role: 'keystone' | 'indicator' | 'dominant' | 'rare';
    change: 'arrival' | 'departure' | 'increase' | 'decrease';
    impact: 'critical' | 'moderate' | 'minimal';
  }>;
  conservationActions: Array<{
    action: string;
    priority: 'immediate' | 'short_term' | 'long_term';
    stakeholders: string[];
    expectedOutcome: string;
  }>;
}

export interface TerritorialAlert {
  id: string;
  type: 'species_arrival' | 'species_departure' | 'ecosystem_shift' | 'conservation_opportunity';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
    municipality?: string;
    region?: string;
  };
  species?: string[];
  timeline: '0-2years' | '2-5years' | '5-10years' | '10-20years';
  actionRequired: boolean;
  stakeholders: Array<{
    type: 'municipality' | 'farmer' | 'forester' | 'conservation_group' | 'researcher';
    urgency: 'immediate' | 'short_term' | 'medium_term';
    recommendedActions: string[];
  }>;
  createdAt: string;
  validUntil: string;
}

export interface BiodiversityIntelligenceData {
  location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  signals: BiodiversitySignal[];
  climateThresholds: SpeciesClimateThreshold[];
  ecosystemTransition: EcosystemTransition;
  territorialAlerts: TerritorialAlert[];
  gaspardNarratives: GaspardBorealNarrative[];
  predictionModel: {
    version: string;
    accuracy: number;
    lastUpdated: string;
    dataSourcesCount: number;
  };
  citizenContributions: {
    totalObservations: number;
    validatedObservations: number;
    topContributors: Array<{
      username: string;
      observations: number;
      validationScore: number;
    }>;
    needsValidation: Array<{
      observationId: string;
      species: string;
      confidence: number;
      location: { latitude: number; longitude: number };
      date: string;
    }>;
  };
}

export interface GaspardBorealNarrative {
  id: string;
  type: 'species_portrait' | 'ecosystem_story' | 'future_chronicle' | 'citizen_spotlight';
  title: string;
  story: string;
  species?: string;
  location: string;
  futureYear?: 2035 | 2045;
  mood: 'hopeful' | 'concerning' | 'inspiring' | 'urgent';
  callToAction?: {
    message: string;
    actionType: 'observe' | 'protect' | 'advocate' | 'adapt' | 'research';
    link?: string;
  };
  generatedAt: string;
  readingTime: number; // minutes
}