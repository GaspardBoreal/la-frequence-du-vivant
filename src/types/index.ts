
export interface SearchResult {
  coordinates: [number, number];
  address: string;
  region: string;
  properties?: {
    place_id: string;
    display_name: string;
  };
}

export interface LayerConfig {
  marchesTechnoSensibles: boolean;
}

export interface SelectedParcel {
  id: string;
  type: 'marche' | 'parcel' | 'other';
  coordinates: [number, number];
  data: any;
  name?: string;
  description?: string;
  location?: string;
  date?: string;
  temperature?: number;
  imageUrls?: string[];
}

// Extensions pour Supabase
export interface EtudeData {
  id: string;
  titre: string;
  contenu: string;
  resume?: string;
  chapitres?: any;
  ordre: number;
  type: 'principale' | 'complementaire' | 'annexe';
}

export interface DocumentData {
  id: string;
  nom: string;
  url: string;
  titre?: string;
  description?: string;
  type?: string;
}

// Réexporter les types LEXICON enrichis depuis leur module dédié
export type { 
  LexiconParcelData, 
  LexiconApiResponse, 
  WeatherData, 
  TransactionData 
} from './lexicon';
