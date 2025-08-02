
// Types pour les données retournées par l'API LEXICON
export interface LexiconParcelData {
  // Identifiants de parcelle
  parcel_id?: string;
  id?: string;
  
  // Informations de localisation
  commune?: string;
  ville?: string;
  city?: string;
  
  // Surface et géométrie
  surface_ha?: number;
  area_ha?: number;
  superficie?: number;
  superficie_m2?: number;
  
  // Agriculture
  culture_type?: string;
  crop_type?: string;
  land_use?: string;
  
  // Propriétaire et exploitant
  proprietaire?: string;
  owner?: string;
  exploitant?: string;
  operator?: string;
  
  // Certification
  certification_bio?: boolean;
  organic_certified?: boolean;
  bio?: boolean;
  
  // Dates
  derniere_declaration?: string;
  last_declaration?: string;
  updated_at?: string;
  
  // Géométrie
  geometry?: {
    type: string;
    coordinates: number[][] | number[][][];
  };
  
  // Propriétés génériques pour capturer d'autres champs
  properties?: {
    [key: string]: any;
  };
  
  // Données cadastrales enrichies
  code_commune?: string;
  commune_code?: string;
  code_postal?: string;
  postal_code?: string;
  identifiant_cadastral?: string;
  cadastral_id?: string;
  prefixe?: string;
  prefix?: string;
  section?: string;
  numero?: string;
  number?: string;
  
  // Données de localisation étendues
  pays?: string;
  country?: string;
  region?: string;
  departement?: string;
  department?: string;
  
  // Champs dynamiques pour capturer toute autre donnée
  [key: string]: any;
}

export interface WeatherData {
  temperature_avg?: number;
  precipitation_mm?: number;
  humidity_percent?: number;
  wind_speed_kmh?: number;
  month?: string;
  date?: string;
}

export interface TransactionData {
  date?: string;
  type?: string;
  montant?: number;
  amount?: number;
  superficie?: number;
  area?: number;
  prix_m2?: number;
  price_per_m2?: number;
}

export interface LexiconApiResponse {
  success: boolean;
  data?: LexiconParcelData | LexiconParcelData[] | any; // Plus flexible
  message?: string;
  error?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  weather?: WeatherData[];
  transactions?: TransactionData[];
  
  // Champs additionnels possibles de l'API
  status?: string;
  results?: any;
  features?: any[];
}
