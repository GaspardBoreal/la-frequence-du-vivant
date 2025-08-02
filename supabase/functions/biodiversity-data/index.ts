import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BiodiversityQuery {
  latitude: number;
  longitude: number;
  radius?: number;
  dateFilter?: 'recent' | 'medium';
}

interface BiodiversitySpecies {
  id: string;
  scientificName: string;
  commonName: string;
  family: string;
  kingdom: 'Plantae' | 'Animalia' | 'Fungi' | 'Other';
  observations: number;
  lastSeen: string;
  photos?: string[];
  source: 'gbif' | 'inaturalist' | 'ebird';
  conservationStatus?: string;
  confidence?: 'high' | 'medium' | 'low';
  confirmedSources?: number;
}

interface BiodiversityData {
  location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  summary: {
    totalSpecies: number;
    birds: number;
    plants: number;
    fungi: number;
    others: number;
    recentObservations: number;
  };
  species: BiodiversitySpecies[];
  hotspots: Array<{
    name: string;
    type: string;
    distance: number;
  }>;
  methodology: {
    radius: number;
    dateFilter: string;
    excludedData: string[];
    sources: string[];
    confidence: string;
  };
}

// Fetch GBIF data with enhanced filtering
async function fetchGBIFData(lat: number, lon: number, radius: number, dateFilter: string): Promise<BiodiversitySpecies[]> {
  try {
    // Calculate date ranges
    const now = new Date();
    let startDate = '';
    if (dateFilter === 'recent') {
      startDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    } else if (dateFilter === 'medium') {
      startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    }
    
    // Exclude museum/herbarium specimens
    const basisOfRecord = 'HUMAN_OBSERVATION,MACHINE_OBSERVATION,OBSERVATION';
    
    let url = `https://api.gbif.org/v1/occurrence/search?decimalLatitude=${lat}&decimalLongitude=${lon}&radius=${radius * 1000}&limit=100&hasCoordinate=true&hasGeospatialIssue=false&basisOfRecord=${basisOfRecord}`;
    
    if (startDate) {
      url += `&eventDate=${startDate},${now.toISOString().split('T')[0]}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('GBIF API error:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log(`GBIF: Found ${data.results?.length || 0} occurrences`);
    
    if (!data.results) return [];
    
    return data.results.map((item: any, index: number) => ({
      id: `gbif-${item.key || index}`,
      scientificName: item.scientificName || 'Unknown',
      commonName: item.vernacularName || item.scientificName || 'Unknown',
      family: item.family || 'Unknown',
      kingdom: mapKingdom(item.kingdom),
      observations: 1,
      lastSeen: item.eventDate || item.dateIdentified || new Date().toISOString().split('T')[0],
      photos: item.media?.filter((m: any) => m.type === 'StillImage')?.map((m: any) => m.identifier) || [],
      source: 'gbif' as const,
      conservationStatus: item.iucnRedListCategory
    }));
  } catch (error) {
    console.error('Error fetching GBIF data:', error);
    return [];
  }
}

// Fetch iNaturalist data with date filtering
async function fetchINaturalistData(lat: number, lon: number, radius: number, dateFilter: string): Promise<BiodiversitySpecies[]> {
  try {
    // Calculate date ranges
    const now = new Date();
    let startDate = '';
    if (dateFilter === 'recent') {
      startDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    } else if (dateFilter === 'medium') {
      startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    }
    
    let url = `https://api.inaturalist.org/v1/observations?lat=${lat}&lng=${lon}&radius=${radius}&quality_grade=research&per_page=50&order=desc&order_by=observed_on&captive=false`;
    
    if (startDate) {
      url += `&d1=${startDate}&d2=${now.toISOString().split('T')[0]}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('iNaturalist API error:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log(`iNaturalist: Found ${data.results?.length || 0} observations`);
    
    if (!data.results) return [];
    
    return data.results.map((item: any, index: number) => ({
      id: `inaturalist-${item.id || index}`,
      scientificName: item.taxon?.name || 'Unknown',
      commonName: item.taxon?.preferred_common_name || item.taxon?.name || 'Unknown',
      family: item.taxon?.ancestry?.split('/').slice(-2, -1)[0] || 'Unknown',
      kingdom: mapKingdom(item.taxon?.iconic_taxon_name),
      observations: 1,
      lastSeen: item.observed_on || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      photos: item.photos?.map((p: any) => p.url) || [],
      source: 'inaturalist' as const,
      conservationStatus: item.taxon?.conservation_status?.status
    }));
  } catch (error) {
    console.error('Error fetching iNaturalist data:', error);
    return [];
  }
}

// Fetch eBird data with date filtering
async function fetchEBirdData(lat: number, lon: number, radius: number, dateFilter: string): Promise<BiodiversitySpecies[]> {
  try {
    // Calculate days back based on filter
    let daysBack = 30;
    if (dateFilter === 'recent') {
      daysBack = 730; // 2 years
    } else if (dateFilter === 'medium') {
      daysBack = 1825; // 5 years
    }
    
    const url = `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${lon}&dist=${radius}&back=${daysBack}&includeProvisional=false&maxResults=50`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('eBird API error:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log(`eBird: Found ${data?.length || 0} observations`);
    
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((item: any, index: number) => ({
      id: `ebird-${item.speciesCode || index}`,
      scientificName: item.sciName || 'Unknown',
      commonName: item.comName || item.sciName || 'Unknown',
      family: 'Aves',
      kingdom: 'Animalia' as const,
      observations: item.howMany || 1,
      lastSeen: item.obsDt || new Date().toISOString().split('T')[0],
      photos: [],
      source: 'ebird' as const
    }));
  } catch (error) {
    console.error('Error fetching eBird data:', error);
    return [];
  }
}

// Helper function to map kingdom names
function mapKingdom(kingdom: string): 'Plantae' | 'Animalia' | 'Fungi' | 'Other' {
  if (!kingdom) return 'Other';
  const k = kingdom.toLowerCase();
  if (k.includes('plantae') || k.includes('plant')) return 'Plantae';
  if (k.includes('animalia') || k.includes('animal')) return 'Animalia';
  if (k.includes('fungi') || k.includes('fungus')) return 'Fungi';
  return 'Other';
}

// Aggregate species data with cross-source validation
function aggregateSpeciesData(allSpecies: BiodiversitySpecies[]): BiodiversitySpecies[] {
  const speciesMap = new Map<string, BiodiversitySpecies & { sources: Set<string> }>();

  allSpecies.forEach(species => {
    const key = species.scientificName.toLowerCase();
    if (speciesMap.has(key)) {
      const existing = speciesMap.get(key)!;
      existing.observations += species.observations;
      existing.sources.add(species.source);
      
      // Keep the most recent date
      if (new Date(species.lastSeen) > new Date(existing.lastSeen)) {
        existing.lastSeen = species.lastSeen;
      }
      
      // Merge photos
      if (species.photos) {
        existing.photos = [...(existing.photos || []), ...species.photos];
      }
    } else {
      const extendedSpecies = { 
        ...species, 
        sources: new Set([species.source]) 
      };
      speciesMap.set(key, extendedSpecies);
    }
  });

  // Calculate confidence based on number of confirming sources
  const result = Array.from(speciesMap.values()).map(species => {
    const confirmedSources = species.sources.size;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    if (confirmedSources >= 3) confidence = 'high';
    else if (confirmedSources >= 2) confidence = 'medium';
    
    const { sources, ...finalSpecies } = species;
    return {
      ...finalSpecies,
      confidence,
      confirmedSources
    };
  });

  return result.sort((a, b) => {
    // Sort by confidence first, then by date
    if (a.confidence !== b.confidence) {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    }
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });
}

function calculateSummary(species: BiodiversitySpecies[]): BiodiversityData['summary'] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const birds = species.filter(s => {
    const isFromEbird = s.source === 'ebird';
    const isAvesFamily = s.family === 'Aves' || s.family?.toLowerCase().includes('aves');
    const isBirdFamily = s.family?.toLowerCase().includes('bird') || 
                        s.family?.toLowerCase().includes('idae');
    const isBirdInName = s.commonName?.toLowerCase().includes('oiseau') ||
                        s.commonName?.toLowerCase().includes('bird') ||
                        s.scientificName?.toLowerCase().includes('aves');
    
    return isFromEbird || isAvesFamily || isBirdFamily || isBirdInName;
  });
  
  return {
    totalSpecies: species.length,
    birds: birds.length,
    plants: species.filter(s => s.kingdom === 'Plantae').length,
    fungi: species.filter(s => s.kingdom === 'Fungi').length,
    others: species.filter(s => !['Plantae', 'Animalia', 'Fungi'].includes(s.kingdom)).length,
    recentObservations: species.filter(s => new Date(s.lastSeen) > thirtyDaysAgo).length
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 0.5, dateFilter = 'recent' }: BiodiversityQuery = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching biodiversity data for lat: ${latitude}, lon: ${longitude}, radius: ${radius}km, filter: ${dateFilter}`);

    // Fetch data from all sources in parallel with enhanced filtering
    const [gbifSpecies, inaturalistSpecies, ebirdSpecies] = await Promise.all([
      fetchGBIFData(latitude, longitude, radius, dateFilter),
      fetchINaturalistData(latitude, longitude, radius, dateFilter),
      fetchEBirdData(latitude, longitude, radius, dateFilter)
    ]);

    // Combine and aggregate all species data with cross-validation
    const allSpecies = [...gbifSpecies, ...inaturalistSpecies, ...ebirdSpecies];
    const aggregatedSpecies = aggregateSpeciesData(allSpecies);
    const summary = calculateSummary(aggregatedSpecies);

    const response: BiodiversityData = {
      location: {
        latitude,
        longitude,
        radius
      },
      summary,
      species: aggregatedSpecies,
      hotspots: [
        {
          name: "Zone d'étude locale",
          type: "research_area",
          distance: 0
        }
      ],
      methodology: {
        radius,
        dateFilter: dateFilter === 'recent' ? 'Dernières 2 années' : 'Dernières 2-5 années',
        excludedData: [
          'Spécimens de musée/herbier',
          'Données de captivité',
          'Observations non géolocalisées',
          'Données provisoires'
        ],
        sources: ['GBIF', 'iNaturalist', 'eBird'],
        confidence: 'Basée sur le nombre de sources confirmant chaque espèce'
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in biodiversity-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch biodiversity data', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
