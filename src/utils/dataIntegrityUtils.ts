import { supabase } from '@/integrations/supabase/client';

export interface ValidatedMarcheData {
  id: string;
  region: string;
  nom_marche?: string;
  ville?: string;
  descriptif_court?: string;
  descriptif_long?: string;
  adresse?: string;
  departement?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
  theme_principal?: string;
  sous_themes?: string[];
  temperature?: number;
  coordonnees?: any;
  lien_google_drive?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BiodiversitySnapshot {
  marche_id: string;
  total_species: number;
  snapshot_date: string;
}

export interface WeatherSnapshot {
  marche_id: string;
  snapshot_date: string;
}

/**
 * Fetches valid marche IDs from the database
 */
export const getValidMarcheIds = async (): Promise<ValidatedMarcheData[]> => {
  const { data, error } = await supabase
    .from('marches')
    .select('*');
  
  if (error) throw error;
  return data || [];
};

/**
 * Filters snapshots to only include those with valid marche_ids
 */
export const filterValidSnapshots = <T extends { marche_id: string }>(
  snapshots: T[],
  validMarcheIds: Set<string>
): T[] => {
  return snapshots.filter(snapshot => validMarcheIds.has(snapshot.marche_id));
};

/**
 * Applies region filter to snapshots based on marche regions
 */
export const applyRegionFilter = <T extends { marche_id: string }>(
  snapshots: T[],
  marches: ValidatedMarcheData[],
  regions: string[]
): T[] => {
  if (regions.length === 0) return snapshots;
  
  const allowedMarcheIds = new Set(
    marches
      .filter(marche => regions.includes(marche.region))
      .map(marche => marche.id)
  );
  
  return snapshots.filter(snapshot => allowedMarcheIds.has(snapshot.marche_id));
};

/**
 * Calculates comprehensive metrics from filtered data
 */
export const calculateDataMetrics = (
  biodiversitySnapshots: BiodiversitySnapshot[],
  weatherSnapshots: WeatherSnapshot[],
  totalMarches: number
) => {
  // Calculate unique covered marches
  const uniqueCoveredMarches = new Set([
    ...biodiversitySnapshots.map(s => s.marche_id),
    ...weatherSnapshots.map(s => s.marche_id)
  ]);

  // Calculate total species collected
  const totalSpeciesCollected = biodiversitySnapshots.reduce(
    (sum, item) => sum + (item.total_species || 0), 
    0
  );

  // Calculate total weather points
  const totalWeatherPoints = weatherSnapshots.length;

  return {
    totalMarches,
    marchesCouvertes: uniqueCoveredMarches.size,
    totalSpeciesCollected,
    totalWeatherPoints,
    orphanBiodiversity: 0, // Already filtered out
    orphanWeather: 0, // Already filtered out
  };
};

/**
 * Applies date filter to snapshots
 */
export const applyDateFilter = <T extends { snapshot_date: string }>(
  snapshots: T[],
  dateRange: string
): T[] => {
  if (dateRange === 'all') return snapshots;
  
  const days = parseInt(dateRange.replace('d', ''));
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffDateString = cutoffDate.toISOString().split('T')[0];
  
  return snapshots.filter(snapshot => snapshot.snapshot_date >= cutoffDateString);
};