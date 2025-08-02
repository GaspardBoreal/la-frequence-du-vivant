export interface BiodiversitySpecies {
  id: string;
  scientificName: string;
  commonName: string;
  family: string;
  kingdom: 'Plantae' | 'Animalia' | 'Fungi' | 'Other';
  observations: number;
  lastSeen: string;
  photos?: string[];
  source: 'gbif' | 'inaturalist' | 'ebird';
  conservationStatus?: string;
  confidence?: 'high' | 'medium' | 'low';
  confirmedSources?: number;
}

export interface BiodiversityHotspot {
  name: string;
  type: string;
  distance: number;
}

export interface BiodiversitySummary {
  totalSpecies: number;
  birds: number;
  plants: number;
  fungi: number;
  others: number;
  recentObservations: number;
}

export interface BiodiversityData {
  location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  summary: BiodiversitySummary;
  species: BiodiversitySpecies[];
  hotspots: BiodiversityHotspot[];
  methodology: {
    radius: number;
    dateFilter: string;
    excludedData: string[];
    sources: string[];
    confidence: string;
  };
}

export interface BiodiversityQuery {
  latitude: number;
  longitude: number;
  radius?: number;
  dateFilter?: 'recent' | 'medium';
}