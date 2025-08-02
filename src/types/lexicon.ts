
// Types pour les données retournées par l'API LEXICON
export interface LexiconParcelData {
  parcel_id?: string;
  commune?: string;
  surface_ha?: number;
  culture_type?: string;
  proprietaire?: string;
  exploitant?: string;
  certification_bio?: boolean;
  derniere_declaration?: string;
  geometry?: {
    type: string;
    coordinates: number[][];
  };
  properties?: {
    [key: string]: any;
  };
  
  // Données cadastrales enrichies
  code_commune?: string;
  code_postal?: string;
  identifiant_cadastral?: string;
  prefixe?: string;
  section?: string;
  numero?: string;
  superficie_m2?: number;
  
  // Données de localisation
  pays?: string;
  ville?: string;
}

export interface WeatherData {
  temperature_avg?: number;
  precipitation_mm?: number;
  humidity_percent?: number;
  wind_speed_kmh?: number;
  month?: string;
}

export interface TransactionData {
  date?: string;
  type?: string;
  montant?: number;
  superficie?: number;
  prix_m2?: number;
}

export interface LexiconApiResponse {
  success: boolean;
  data?: LexiconParcelData;
  message?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  weather?: WeatherData[];
  transactions?: TransactionData[];
}
