export interface BiodiversityObservation {
  observerName?: string;
  observerInstitution?: string;
  observationMethod?: string;
  originalUrl?: string;
  exactLatitude?: number;
  exactLongitude?: number;
  locationName?: string;
  date: string;
  source: 'gbif' | 'inaturalist' | 'ebird';
}

export interface XenoCantoRecording {
  id: string;
  file: string;
  fileName: string;
  sono: {
    small: string;
    med: string;
    large: string;
    full: string;
  };
  osci: {
    small: string;
    med: string;
    large: string;
  };
  quality: string;
  length: string;
  type: string;
  sex: string;
  stage: string;
  method: string;
  recordist: string;
  date: string;
  time: string;
  location: string;
  latitude: string;
  longitude: string;
  altitude: string;
  temperature?: string;
  device?: string;
  microphone?: string;
  sampleRate?: string;
  license: string;
  remarks?: string;
  animalSeen?: string;
  playbackUsed?: string;
  backgroundSpecies?: string[];
  url: string;
}

export interface BiodiversitySpecies {
  id: string;
  scientificName: string;
  commonName: string;
  family: string;
  kingdom: 'Plantae' | 'Animalia' | 'Fungi' | 'Other';
  observations: number;
  lastSeen: string;
  photos?: string[];
  audioUrl?: string;
  sonogramUrl?: string;
  source: 'gbif' | 'inaturalist' | 'ebird';
  conservationStatus?: string;
  confidence?: 'high' | 'medium' | 'low';
  confirmedSources?: number;
  attributions: BiodiversityObservation[];
  // Nouvelles données Xeno-Canto
  xenoCantoRecordings?: XenoCantoRecording[];
  recordingQuality?: string;
  soundType?: string;
  recordingContext?: {
    method: string;
    equipment?: string;
    conditions?: string;
  };
  behavioralInfo?: {
    sex?: string;
    stage?: string;
    animalSeen?: boolean;
    playbackUsed?: boolean;
  };
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