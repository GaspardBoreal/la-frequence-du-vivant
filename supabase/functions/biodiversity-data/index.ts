import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BiodiversityQuery {
  latitude: number;
  longitude: number;
  radius?: number; // en km, défaut 5km
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
}

async function fetchGBIFData(lat: number, lon: number, radius: number): Promise<BiodiversitySpecies[]> {
  try {
    const radiusMeters = radius * 1000;
    const url = `https://api.gbif.org/v1/occurrence/search?lat=${lat}&lon=${lon}&radius=${radiusMeters}&limit=100&hasCoordinate=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return (data.results || []).map((item: any) => ({
      id: `gbif-${item.key}`,
      scientificName: item.scientificName || 'Inconnu',
      commonName: item.vernacularName || item.scientificName || 'Inconnu',
      family: item.family || 'Inconnu',
      kingdom: item.kingdom || 'Other',
      observations: 1,
      lastSeen: item.eventDate || new Date().toISOString(),
      source: 'gbif' as const,
      conservationStatus: item.threatStatus
    }));
  } catch (error) {
    console.error('Erreur GBIF:', error);
    return [];
  }
}

async function fetchINaturalistData(lat: number, lon: number, radius: number): Promise<BiodiversitySpecies[]> {
  try {
    const url = `https://api.inaturalist.org/v1/observations?lat=${lat}&lng=${lon}&radius=${radius}&per_page=50&quality_grade=research`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return (data.results || []).map((item: any) => ({
      id: `inaturalist-${item.id}`,
      scientificName: item.taxon?.name || 'Inconnu',
      commonName: item.taxon?.preferred_common_name || item.taxon?.name || 'Inconnu',
      family: item.taxon?.family_name || 'Inconnu',
      kingdom: item.taxon?.kingdom_name || 'Other',
      observations: 1,
      lastSeen: item.observed_on || new Date().toISOString(),
      photos: item.photos?.slice(0, 3).map((p: any) => p.url) || [],
      source: 'inaturalist' as const,
      conservationStatus: item.taxon?.conservation_status?.status
    }));
  } catch (error) {
    console.error('Erreur iNaturalist:', error);
    return [];
  }
}

async function fetchEBirdData(lat: number, lon: number, radius: number): Promise<BiodiversitySpecies[]> {
  try {
    const url = `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${lon}&dist=${radius}&back=30&maxResults=50`;
    
    const response = await fetch(url, {
      headers: {
        'X-eBirdApiToken': 'aactb7qe7vj1' // Token public eBird
      }
    });
    
    if (!response.ok) {
      console.log('eBird API non disponible');
      return [];
    }
    
    const data = await response.json();
    
    return (data || []).map((item: any) => ({
      id: `ebird-${item.speciesCode}`,
      scientificName: item.sciName || 'Inconnu',
      commonName: item.comName || item.sciName || 'Inconnu',
      family: 'Aves',
      kingdom: 'Animalia' as const,
      observations: item.howMany || 1,
      lastSeen: item.obsDt || new Date().toISOString(),
      source: 'ebird' as const
    }));
  } catch (error) {
    console.error('Erreur eBird:', error);
    return [];
  }
}

function aggregateSpeciesData(allSpecies: BiodiversitySpecies[]): BiodiversitySpecies[] {
  const speciesMap = new Map<string, BiodiversitySpecies>();
  
  allSpecies.forEach(species => {
    const key = species.scientificName.toLowerCase();
    
    if (speciesMap.has(key)) {
      const existing = speciesMap.get(key)!;
      existing.observations += species.observations;
      if (species.photos && species.photos.length > 0) {
        existing.photos = [...(existing.photos || []), ...species.photos].slice(0, 5);
      }
      if (new Date(species.lastSeen) > new Date(existing.lastSeen)) {
        existing.lastSeen = species.lastSeen;
      }
    } else {
      speciesMap.set(key, { ...species });
    }
  });
  
  return Array.from(speciesMap.values()).sort((a, b) => b.observations - a.observations);
}

function calculateSummary(species: BiodiversitySpecies[]): BiodiversityData['summary'] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return {
    totalSpecies: species.length,
    birds: species.filter(s => s.kingdom === 'Animalia' && s.family === 'Aves').length,
    plants: species.filter(s => s.kingdom === 'Plantae').length,
    fungi: species.filter(s => s.kingdom === 'Fungi').length,
    others: species.filter(s => !['Plantae', 'Animalia', 'Fungi'].includes(s.kingdom)).length,
    recentObservations: species.filter(s => new Date(s.lastSeen) > thirtyDaysAgo).length
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 5 }: BiodiversityQuery = await req.json();
    
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude et longitude requises' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Récupération données biodiversité pour: ${latitude}, ${longitude}, rayon: ${radius}km`);

    // Récupération parallèle des données
    const [gbifSpecies, inaturalistSpecies, ebirdSpecies] = await Promise.all([
      fetchGBIFData(latitude, longitude, radius),
      fetchINaturalistData(latitude, longitude, radius),
      fetchEBirdData(latitude, longitude, radius)
    ]);

    const allSpecies = [...gbifSpecies, ...inaturalistSpecies, ...ebirdSpecies];
    const aggregatedSpecies = aggregateSpeciesData(allSpecies);
    const summary = calculateSummary(aggregatedSpecies);

    const biodiversityData: BiodiversityData = {
      location: { latitude, longitude, radius },
      summary,
      species: aggregatedSpecies.slice(0, 50), // Limiter à 50 espèces principales
      hotspots: [] // À implémenter avec des données de zones protégées
    };

    console.log(`Données récupérées: ${biodiversityData.species.length} espèces, ${biodiversityData.summary.totalSpecies} total`);

    return new Response(
      JSON.stringify(biodiversityData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur dans biodiversity-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});