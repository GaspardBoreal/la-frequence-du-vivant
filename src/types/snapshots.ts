export interface BiodiversitySnapshot {
  id: string;
  marche_id: string;
  latitude: number;
  longitude: number;
  snapshot_date: string;
  radius_meters: number;
  
  // Species counts
  total_species: number;
  birds_count: number;
  plants_count: number;
  fungi_count: number;
  others_count: number;
  
  // Biodiversity metrics
  biodiversity_index?: number;
  species_richness?: number;
  recent_observations: number;
  
  // Raw data storage
  species_data?: any;
  sources_data?: any;
  methodology?: any;
  
  created_at: string;
  updated_at: string;
}

export interface WeatherSnapshot {
  id: string;
  marche_id: string;
  latitude: number;
  longitude: number;
  snapshot_date: string;
  
  // Temperature data
  temperature_avg?: number;
  temperature_min?: number;
  temperature_max?: number;
  
  // Humidity data
  humidity_avg?: number;
  humidity_min?: number;
  humidity_max?: number;
  
  // Precipitation
  precipitation_total?: number;
  precipitation_days?: number;
  
  // Additional weather metrics
  wind_speed_avg?: number;
  sunshine_hours?: number;
  
  // Data sources
  source: string;
  raw_data?: any;
  
  created_at: string;
  updated_at: string;
}

export interface RealEstateSnapshot {
  id: string;
  marche_id: string;
  latitude: number;
  longitude: number;
  snapshot_date: string;
  radius_meters: number;
  
  // Transaction summary
  transactions_count: number;
  avg_price_m2?: number;
  median_price_m2?: number;
  total_volume?: number;
  
  // Transaction details
  transactions_data?: Array<{
    id?: string;
    date?: string;
    adresse?: string;
    type?: string;
    montant?: number;
    prix_m2?: number;
  }>;
  
  // Data source
  source: string;
  raw_data?: any;
  
  created_at: string;
  updated_at: string;
}

export interface DataCollectionLog {
  id: string;
  collection_type: string;
  collection_mode: 'scheduled' | 'manual';
  status: 'running' | 'completed' | 'failed';
  
  // Collection metrics
  marches_processed: number;
  marches_total: number;
  errors_count: number;
  
  // Timing
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  
  // Details
  error_details?: any;
  summary_stats?: {
    results?: any;
    total_marches?: number;
    processed?: number;
    errors?: number;
    success_rate?: number;
  };
  
  created_at: string;
}

export interface BatchCollectionRequest {
  collectionTypes: ('biodiversity' | 'weather' | 'real_estate')[];
  mode: 'scheduled' | 'manual';
  marchesFilter?: {
    ids?: string[];
    region?: string;
    departement?: string;
  };
}

export interface OpenMeteoQuery {
  latitude: number;
  longitude: number;
  days?: number;
  includeClimate?: boolean;
}

export interface OpenMeteoAggregatedData {
  period: {
    start: string;
    end: string;
    days: number;
  };
  temperature: {
    avg: number | null;
    min: number | null;
    max: number | null;
  };
  humidity: {
    avg: number | null;
    min: number | null;
    max: number | null;
  };
  precipitation: {
    total: number;
    days: number;
  };
  wind: {
    avg: number | null;
  };
  sunshine: {
    total: number | null;
  };
}