
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
