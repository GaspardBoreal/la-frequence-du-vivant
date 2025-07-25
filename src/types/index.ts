
export interface SearchResult {
  coordinates: [number, number];
  address: string;
  region: string;
}

export interface LayerConfig {
  marchesTechnoSensibles: boolean;
  openData: boolean;
}

export interface SelectedParcel {
  id: string;
  coordinates: [number, number];
  data: any;
}
