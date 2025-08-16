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
  birds_count?: number;
  plants_count?: number;
  fungi_count?: number;
  others_count?: number;
  recent_observations?: number;
  created_at?: string;
  species_data?: any;
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

/**
 * Fetches biodiversity snapshots with filtering for valid marches
 */
export const getFilteredBiodiversitySnapshots = async (filters?: {
  dateRange?: string;
  regions?: string[];
}): Promise<BiodiversitySnapshot[]> => {
  // Get valid marches
  const validMarches = await getValidMarcheIds();
  const validMarcheIds = new Set(validMarches.map(m => m.id));

  // Build query
  let query = supabase
    .from('biodiversity_snapshots')
    .select(`
      marche_id,
      total_species,
      birds_count,
      plants_count,
      fungi_count,
      others_count,
      recent_observations,
      snapshot_date,
      created_at,
      species_data
    `);

  // Apply date filter at SQL level if specified
  if (filters?.dateRange && filters.dateRange !== 'all') {
    const days = parseInt(filters.dateRange.replace('d', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];
    query = query.gte('snapshot_date', cutoffDateString);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Filter out orphan snapshots and cast types properly
  let filtered = filterValidSnapshots(data || [], validMarcheIds) as BiodiversitySnapshot[];

  // Apply region filter if specified
  if (filters?.regions && filters.regions.length > 0) {
    filtered = applyRegionFilter(filtered, validMarches, filters.regions);
  }

  return filtered;
};

/**
 * Calculates comprehensive biodiversity statistics
 */
export const calculateBiodiversityStats = (snapshots: BiodiversitySnapshot[]) => {
  if (!snapshots || snapshots.length === 0) {
    return {
      totalSnapshots: 0,
      totalSpecies: 0,
      averageSpecies: 0,
      totalBirds: 0,
      totalPlants: 0,
      totalFungi: 0,
      totalOthers: 0,
      recentCollections: 0,
      hotspots: 0
    };
  }

  const totalSnapshots = snapshots.length;
  const totalSpecies = snapshots.reduce((sum, item) => sum + (item.total_species || 0), 0);
  const totalBirds = snapshots.reduce((sum, item) => sum + (item.birds_count || 0), 0);
  const totalPlants = snapshots.reduce((sum, item) => sum + (item.plants_count || 0), 0);
  const totalFungi = snapshots.reduce((sum, item) => sum + (item.fungi_count || 0), 0);
  const totalOthers = snapshots.reduce((sum, item) => sum + (item.others_count || 0), 0);
  
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCollections = snapshots.filter(d => 
    d.created_at && new Date(d.created_at) > lastWeek
  ).length;
  
  const hotspots = snapshots.filter(d => (d.total_species || 0) > 100).length;

  return {
    totalSnapshots,
    totalSpecies,
    averageSpecies: totalSnapshots > 0 ? Math.round(totalSpecies / totalSnapshots) : 0,
    totalBirds,
    totalPlants,
    totalFungi,
    totalOthers,
    recentCollections,
    hotspots
  };
};

/**
 * Groups biodiversity data by date for timeline visualization
 */
export const groupBiodiversityByDate = (snapshots: BiodiversitySnapshot[], days: number = 14) => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const filtered = snapshots.filter(snapshot => 
    new Date(snapshot.snapshot_date) >= cutoffDate
  );
  
  const grouped = filtered.reduce((acc: Record<string, { date: string; species: number; count: number }>, item) => {
    const date = new Date(item.snapshot_date).toLocaleDateString('fr-FR', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (!acc[date]) {
      acc[date] = { date, species: 0, count: 0 };
    }
    
    acc[date].species += item.total_species || 0;
    acc[date].count += 1;
    
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

/**
 * Groups biodiversity data by region
 */
export const groupBiodiversityByRegion = async (snapshots: BiodiversitySnapshot[]) => {
  const validMarches = await getValidMarcheIds();
  
  const grouped = snapshots.reduce((acc: Record<string, { region: string; species: number; marches: number; observations: number }>, item) => {
    const marche = validMarches.find(m => m.id === item.marche_id);
    const region = marche?.region || 'Non défini';
    
    if (!acc[region]) {
      acc[region] = { region, species: 0, marches: 0, observations: 0 };
    }
    
    acc[region].species += item.total_species || 0;
    acc[region].marches += 1;
    acc[region].observations += item.recent_observations || 0;
    
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => b.species - a.species);
};