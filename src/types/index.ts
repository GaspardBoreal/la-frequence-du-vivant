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

// Extensions pour LEXICON
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
}

export interface LexiconApiResponse {
  success: boolean;
  data?: LexiconParcelData;
  message?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
