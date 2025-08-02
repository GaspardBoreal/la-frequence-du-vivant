
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
