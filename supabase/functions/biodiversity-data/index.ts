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

interface BiodiversityObservation {
  observerName?: string;
  observerInstitution?: string;
  observationMethod?: string;
  originalUrl?: string;
  exactLatitude?: number;
  exactLongitude?: number;
  locationName?: string;
  date: string;
  source: 'gbif' | 'inaturalist' | 'ebird';
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
  attributions: BiodiversityObservation[];
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
    
    // Use geometry search instead of lat/lon + radius for better accuracy
    // Create a bounding box around the point
    const radiusInDegrees = radius / 111; // Approximate conversion km to degrees
    const north = lat + radiusInDegrees;
    const south = lat - radiusInDegrees;
    const east = lon + radiusInDegrees;
    const west = lon - radiusInDegrees;
    
    // Build URL with proper GBIF parameters
    let url = `https://api.gbif.org/v1/occurrence/search`;
    const params = new URLSearchParams({
      'decimalLatitude': lat.toString(),
      'decimalLongitude': lon.toString(),
      'limit': '100',
      'hasCoordinate': 'true',
      'hasGeospatialIssue': 'false',
      'basisOfRecord': 'HUMAN_OBSERVATION,MACHINE_OBSERVATION,OBSERVATION'
    });
    
    // Add geometry filter for better precision
    params.append('geometry', `POLYGON((${west} ${south},${east} ${south},${east} ${north},${west} ${north},${west} ${south}))`);
    
    if (startDate) {
      params.append('eventDate', `${startDate},${now.toISOString().split('T')[0]}`);
    }
    
    url += '?' + params.toString();
    console.log('GBIF URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BiodiversityApp/1.0 (contact@example.com)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('GBIF API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('GBIF error details:', errorText);
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
      conservationStatus: item.iucnRedListCategory,
      attributions: [{
        observerName: item.recordedBy || 'Anonyme',
        observerInstitution: item.institutionCode || item.collectionCode || 'GBIF',
        observationMethod: item.basisOfRecord || 'Observation',
        originalUrl: `https://www.gbif.org/occurrence/${item.key}`,
        exactLatitude: item.decimalLatitude,
        exactLongitude: item.decimalLongitude,
        locationName: item.locality || item.stateProvince || item.country,
        date: item.eventDate || item.dateIdentified || new Date().toISOString().split('T')[0],
        source: 'gbif' as const
      }]
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
    
    // Élargir le rayon de recherche pour Bonzac et supprimer les filtres restrictifs
    const searchRadius = Math.max(radius, 1); // Minimum 1km pour capturer plus d'observations
    
    const params = new URLSearchParams({
      'lat': lat.toString(),
      'lng': lon.toString(),
      'radius': searchRadius.toString(),
      // Supprimer quality_grade pour inclure toutes les observations, même récentes
      'per_page': '200',
      'order': 'desc',
      'order_by': 'observed_on',
      'captive': 'false',
      'geo': 'true',
      'identified': 'true',
      'include_new_projects': 'true' // Inclure les nouveaux projets
    });
    
    if (startDate) {
      params.append('d1', startDate);
      params.append('d2', now.toISOString().split('T')[0]);
    }
    
    const url = `https://api.inaturalist.org/v1/observations?${params.toString()}`;
    console.log('📍 iNaturalist API URL:', url);
    console.log('📍 Coordonnées utilisées:', { lat, lon, radius: searchRadius });
    console.log('🔧 Paramètres de recherche modifiés pour capturer les observations récentes de Gaspard');
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BiodiversityApp/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ iNaturalist API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ iNaturalist error details:', errorText);
      return [];
    }
    
    const data = await response.json();
    console.log(`✅ iNaturalist: Found ${data.results?.length || 0} raw observations`);
    console.log('📊 Total results available:', data.total_results);
    
    // Log détaillé de TOUTES les observations avec coordonnées pour debug Bonzac
    if (data.results && data.results.length > 0) {
      console.log('🔍 DEBUG iNaturalist - Échantillon de 5 espèces avec coordonnées:');
      data.results.slice(0, 5).forEach((obs: any, idx: number) => {
        const lat_obs = obs.geojson?.coordinates?.[1] || obs.location?.[0];
        const lon_obs = obs.geojson?.coordinates?.[0] || obs.location?.[1];
        // Calculer la distance réelle
        const distance = calculateDistance(lat, lon, lat_obs, lon_obs);
        console.log(`  ${idx + 1}. ${obs.taxon?.name || 'Unknown'} (${obs.taxon?.preferred_common_name || 'Unknown'})`);
        console.log(`     Coordonnées: (${lat_obs}, ${lon_obs})`);
        console.log(`     Lieu: ${obs.place_guess || 'Inconnu'}`);
        console.log(`     Distance calculée: ${distance.toFixed(3)}km (rayon demandé: ${searchRadius}km)`);
      });
    }
    
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
      conservationStatus: item.taxon?.conservation_status?.status,
      attributions: [{
        observerName: item.user?.name || item.user?.login || 'Anonyme',
        observerInstitution: 'iNaturalist Community',
        observationMethod: item.quality_grade === 'research' ? 'Observation validée' : 'Observation',
        originalUrl: `https://www.inaturalist.org/observations/${item.id}`,
        exactLatitude: item.geojson?.coordinates?.[1] || item.location?.[0],
        exactLongitude: item.geojson?.coordinates?.[0] || item.location?.[1],
        locationName: item.place_guess || 'Localisation inconnue',
        date: item.observed_on || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        source: 'inaturalist' as const
      }]
    }));
  } catch (error) {
    console.error('Error fetching iNaturalist data:', error);
    return [];
  }
}

// Fetch eBird hotspots near the location
async function fetchEBirdHotspots(lat: number, lon: number, radius: number): Promise<any[]> {
  try {
    const apiKey = Deno.env.get('EBIRD_API_KEY');
    const params = new URLSearchParams({
      'lat': lat.toString(),
      'lng': lon.toString(),
      'dist': Math.min(radius * 2, 50).toString(), // Larger radius for hotspots
      'back': '30',
      'fmt': 'json'
    });
    
    const url = `https://api.ebird.org/v2/ref/hotspot/geo?${params.toString()}`;
    console.log('🔥 eBird Hotspots URL:', url);
    
    const headers: any = {
      'User-Agent': 'BiodiversityApp/1.0',
      'Accept': 'application/json'
    };
    
    if (apiKey) {
      headers['x-ebirdapitoken'] = apiKey;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error('eBird Hotspots API error:', response.status, response.statusText);
      return [];
    }
    
    const hotspots = await response.json();
    console.log(`🔥 Found ${hotspots?.length || 0} eBird hotspots`);
    return hotspots || [];
  } catch (error) {
    console.error('Error fetching eBird hotspots:', error);
    return [];
  }
}

// Fetch notable eBird observations (rare species)
async function fetchEBirdNotable(lat: number, lon: number, radius: number, dateFilter: string): Promise<BiodiversitySpecies[]> {
  try {
    const apiKey = Deno.env.get('EBIRD_API_KEY');
    // eBird API limite le paramètre 'back' à 30 jours maximum
    let daysBack = 30;
    if (dateFilter === 'recent') {
      daysBack = 30; // Corrigé: max 30 jours pour eBird
    } else if (dateFilter === 'medium') {
      daysBack = 30; // Corrigé: max 30 jours pour eBird
    }
    
    const params = new URLSearchParams({
      'lat': lat.toString(),
      'lng': lon.toString(),
      'dist': Math.min(radius, 50).toString(),
      'back': daysBack.toString(),
      'maxResults': '50',
      'fmt': 'json'
    });
    
    const url = `https://api.ebird.org/v2/data/obs/geo/recent/notable?${params.toString()}`;
    console.log('⭐ eBird Notable URL:', url);
    
    const headers: any = {
      'User-Agent': 'BiodiversityApp/1.0',
      'Accept': 'application/json'
    };
    
    if (apiKey) {
      headers['x-ebirdapitoken'] = apiKey;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error('eBird Notable API error:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log(`⭐ Found ${data?.length || 0} notable eBird observations`);
    
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((item: any, index: number) => ({
      id: `ebird-notable-${item.speciesCode || index}`,
      scientificName: item.sciName || 'Unknown',
      commonName: item.comName || item.sciName || 'Unknown',
      family: 'Aves',
      kingdom: 'Animalia' as const,
      observations: item.howMany || 1,
      lastSeen: item.obsDt || new Date().toISOString().split('T')[0],
      photos: [],
      source: 'ebird' as const,
      conservationStatus: 'Notable',
      confidence: 'high' as const,
      attributions: [{
        observerName: item.userDisplayName || 'Observateur eBird',
        observerInstitution: 'eBird/Cornell Lab (Notable)',
        observationMethod: 'Observation remarquable',
        originalUrl: item.hasRichMedia ? `https://ebird.org/checklist/${item.subId}` : `https://ebird.org/species/${item.speciesCode}`,
        exactLatitude: item.lat,
        exactLongitude: item.lng,
        locationName: item.locName || 'Localisation inconnue',
        date: item.obsDt || new Date().toISOString().split('T')[0],
        source: 'ebird' as const
      }]
    }));
  } catch (error) {
    console.error('Error fetching eBird notable data:', error);
    return [];
  }
}

// Fetch eBird data with enhanced API integration
async function fetchEBirdData(lat: number, lon: number, radius: number, dateFilter: string): Promise<BiodiversitySpecies[]> {
  try {
    const apiKey = Deno.env.get('EBIRD_API_KEY');
    
    // eBird API limite le paramètre 'back' à 30 jours maximum
    let daysBack = 30;
    if (dateFilter === 'recent') {
      daysBack = 30; // Corrigé: max 30 jours pour eBird
    } else if (dateFilter === 'medium') {
      daysBack = 30; // Corrigé: max 30 jours pour eBird
    }
    
    const params = new URLSearchParams({
      'lat': lat.toString(),
      'lng': lon.toString(),
      'dist': Math.min(radius, 50).toString(), // eBird limite le rayon à 50km
      'back': daysBack.toString(),
      'includeProvisional': 'false',
      'maxResults': '200', // Augmenté pour récupérer plus d'espèces
      'fmt': 'json'
    });
    
    const url = `https://api.ebird.org/v2/data/obs/geo/recent?${params.toString()}`;
    console.log('🐦 eBird Recent URL:', url);
    console.log('🐦 eBird paramètres:', { lat, lon, radius, daysBack, dateFilter });
    
    const headers: any = {
      'User-Agent': 'BiodiversityApp/1.0',
      'Accept': 'application/json'
    };
    
    // Add API key if available for better rate limits and access
    if (apiKey) {
      headers['x-ebirdapitoken'] = apiKey;
      console.log('🔑 Using eBird API key for enhanced access');
    } else {
      console.warn('⚠️ No eBird API key found - limited rate limits apply');
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error('🐦 eBird API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('🐦 eBird error details:', errorText);
      
      // Gestion spéciale pour le rate limiting (418 I'm a teapot)
      if (response.status === 418) {
        console.log('eBird rate limit reached, waiting and retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const retryResponse = await fetch(url, {
          headers: {
            'User-Agent': 'BiodiversityApp/1.0',
            'Accept': 'application/json'
          }
        });
        
        if (!retryResponse.ok) {
          console.error('eBird retry failed:', retryResponse.status, retryResponse.statusText);
          return [];
        }
        
        const retryData = await retryResponse.json();
        console.log(`eBird (retry): Found ${retryData?.length || 0} observations`);
        
        if (!retryData || !Array.isArray(retryData)) return [];
        
        return retryData.map((item: any, index: number) => ({
          id: `ebird-${item.speciesCode || index}`,
          scientificName: item.sciName || 'Unknown',
          commonName: item.comName || item.sciName || 'Unknown',
          family: 'Aves',
          kingdom: 'Animalia' as const,
          observations: item.howMany || 1,
          lastSeen: item.obsDt || new Date().toISOString().split('T')[0],
          photos: [],
          source: 'ebird' as const,
          attributions: [{
            observerName: item.userDisplayName || 'Observateur eBird',
            observerInstitution: 'eBird/Cornell Lab',
            observationMethod: 'Observation ornithologique',
            originalUrl: item.hasRichMedia ? `https://ebird.org/checklist/${item.subId}` : undefined,
            exactLatitude: item.lat,
            exactLongitude: item.lng,
            locationName: item.locName || 'Localisation inconnue',
            date: item.obsDt || new Date().toISOString().split('T')[0],
            source: 'ebird' as const
          }]
        }));
      }
      
      return [];
    }
    
    const data = await response.json();
    console.log(`🐦 eBird: Found ${data?.length || 0} observations`);
    
    // Log spécial pour debug eBird
    if (data && data.length > 0) {
      console.log('🐦 Échantillon eBird (première observation):');
      const first = data[0];
      console.log(`  - Espèce: ${first.comName} (${first.sciName})`);
      console.log(`  - Observateur: ${first.userDisplayName || 'Anonyme'}`);
      console.log(`  - Date: ${first.obsDt}`);
      console.log(`  - Lieu: ${first.locName}`);
      console.log(`  - Coordonnées: (${first.lat}, ${first.lng})`);
      console.log(`  - Nombre: ${first.howMany || 'Non spécifié'}`);
    }
    
    if (!data || !Array.isArray(data)) return [];
    
    // Traitement des données avec récupération des photos
    const processedData = await Promise.all(
      data.map(async (item: any, index: number) => {
        // Tentative de récupération des photos eBird si hasRichMedia est true
        let photos: string[] = [];
        if (item.hasRichMedia && apiKey) {
          try {
            photos = await fetchEBirdPhotos(item.speciesCode, item.subId, apiKey);
          } catch (error) {
            console.log(`⚠️ Could not fetch photos for ${item.comName}:`, error);
          }
        }

        return {
          id: `ebird-${item.speciesCode || index}`,
          scientificName: item.sciName || 'Unknown',
          commonName: item.comName || item.sciName || 'Unknown',
          family: 'Aves',
          kingdom: 'Animalia' as const,
          observations: item.howMany || 1,
          lastSeen: item.obsDt || new Date().toISOString().split('T')[0],
          photos,
          source: 'ebird' as const,
          attributions: [{
            observerName: item.userDisplayName || 'Observateur eBird',
            observerInstitution: 'eBird/Cornell Lab',
            observationMethod: 'Observation ornithologique',
            originalUrl: item.hasRichMedia ? `https://ebird.org/checklist/${item.subId}` : `https://ebird.org/species/${item.speciesCode}`,
            exactLatitude: item.lat,
            exactLongitude: item.lng,
            locationName: item.locName || 'Localisation inconnue',
            date: item.obsDt || new Date().toISOString().split('T')[0],
            source: 'ebird' as const
          }]
        };
      })
    );
    
    console.log(`🐦 eBird mapping completed: ${processedData.length} species mapped`);
    if (processedData.length > 0) {
      console.log(`🐦 Premier oiseau mappé: ${processedData[0].commonName} (kingdom: ${processedData[0].kingdom})`);
    }
    
    return processedData;
  } catch (error) {
    console.error('Error fetching eBird data:', error);
    return [];
  }
}

// Fonction pour récupérer les photos eBird via Macaulay Library
async function fetchEBirdPhotos(speciesCode: string, subId: string, apiKey: string): Promise<string[]> {
  try {
    // Utiliser l'API Macaulay Library pour obtenir des photos d'oiseaux
    const mediaUrl = `https://search.macaulaylibrary.org/api/v1/search?taxonCode=${speciesCode}&mediaType=Photo&count=1&sort=rating_rank_desc`;
    
    const response = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'BiodiversityApp/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`Macaulay Library API error for ${speciesCode}:`, response.status);
      // Fallback vers une image générique d'oiseau
      return [`https://www.allaboutbirds.org/guide/assets/photo/${speciesCode}-photo-1.jpg`];
    }
    
    const mediaData = await response.json();
    
    if (mediaData && mediaData.results && mediaData.results.length > 0) {
      const photos = mediaData.results.slice(0, 2).map((result: any) => {
        return `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${result.assetId}/320`;
      });
      return photos;
    }
    
    // Fallback vers une image générique si pas de résultats
    return [`https://www.allaboutbirds.org/guide/assets/photo/${speciesCode}-photo-1.jpg`];
  } catch (error) {
    console.log(`Error fetching eBird photos for ${speciesCode}:`, error);
    // Fallback vers une image générique
    return [`https://www.allaboutbirds.org/guide/assets/photo/${speciesCode}-photo-1.jpg`];
  }
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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
      
      // Merge attributions
      existing.attributions = [...existing.attributions, ...species.attributions];
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
    const [gbifSpecies, inaturalistSpecies, ebirdSpecies, ebirdNotable, ebirdHotspots] = await Promise.all([
      fetchGBIFData(latitude, longitude, radius, dateFilter),
      fetchINaturalistData(latitude, longitude, radius, dateFilter),
      fetchEBirdData(latitude, longitude, radius, dateFilter),
      fetchEBirdNotable(latitude, longitude, radius, dateFilter),
      fetchEBirdHotspots(latitude, longitude, radius)
    ]);

    // Log des données brutes avant agrégation
    console.log('📊 Données brutes collectées:');
    console.log(`  - GBIF: ${gbifSpecies.length} observations`);
    console.log(`  - iNaturalist: ${inaturalistSpecies.length} observations`);
    console.log(`  - eBird: ${ebirdSpecies.length} observations`);
    console.log(`  - eBird Notable: ${ebirdNotable.length} observations`);
    console.log(`  - Total avant agrégation: ${gbifSpecies.length + inaturalistSpecies.length + ebirdSpecies.length + ebirdNotable.length} observations`);
    
    // Debug spécial pour les données eBird
    if (ebirdSpecies.length > 0) {
      console.log('🐦 eBird species kingdoms:');
      ebirdSpecies.slice(0, 3).forEach(bird => {
        console.log(`  - ${bird.commonName}: kingdom=${bird.kingdom}, family=${bird.family}`);
      });
    }

    // Combine and aggregate all species data with cross-validation
    const allSpecies = [...gbifSpecies, ...inaturalistSpecies, ...ebirdSpecies, ...ebirdNotable];
    const aggregatedSpecies = aggregateSpeciesData(allSpecies);
    
    // Process eBird hotspots for context
    const hotspots = ebirdHotspots.map((hotspot: any) => ({
      name: hotspot.locName || 'Hotspot eBird',
      type: 'ebird_hotspot',
      distance: calculateDistance(latitude, longitude, hotspot.lat, hotspot.lng)
    })).sort((a, b) => a.distance - b.distance).slice(0, 5);
    console.log(`📊 Après agrégation: ${aggregatedSpecies.length} espèces uniques`);
    
    // DEBUG SPÉCIAL BONZAC - Analyse complète des observations iNaturalist
    if (inaturalistSpecies.length > 0) {
      console.log(`🔍 DEBUG iNaturalist - Échantillon de 5 espèces avec coordonnées:`);
      inaturalistSpecies.slice(0, 5).forEach((species, index) => {
        console.log(`  ${index + 1}. ${species.scientificName} (${species.commonName})`);
        if (species.attributions && species.attributions.length > 0) {
          const attrib = species.attributions[0];
          const distance = calculateDistance(latitude, longitude, attrib.exactLatitude!, attrib.exactLongitude!);
          console.log(`     Coordonnées: (${attrib.exactLatitude}, ${attrib.exactLongitude})`);
          console.log(`     Lieu: ${attrib.locationName || 'Non spécifié'}`);
          console.log(`     Distance calculée: ${distance.toFixed(3)}km (rayon demandé: ${radius}km)`);
        }
      });
    }
    
    // Log spécial pour Bonzac avec les coordonnées exactes
    if (Math.abs(latitude - 45.00651802965869) < 0.001 && Math.abs(longitude - (-0.2210985)) < 0.001) {
      console.log('🎯 DEBUG SPÉCIAL BONZAC - Toutes observations iNaturalist:');
      inaturalistSpecies.forEach((species, idx) => {
        species.attributions.forEach(attr => {
          if (attr.exactLatitude && attr.exactLongitude) {
            const dist = calculateDistance(latitude, longitude, attr.exactLatitude, attr.exactLongitude);
            console.log(`  ${idx + 1}. ${species.scientificName} (${species.commonName})`);
            console.log(`     Observer: ${attr.observerName} le ${attr.date}`);
            console.log(`     Coordonnées: (${attr.exactLatitude}, ${attr.exactLongitude})`);
            console.log(`     Distance: ${dist.toFixed(3)}km de Bonzac`);
            console.log(`     URL: ${attr.originalUrl}`);
          }
        });
      });
    }
    
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
        },
        ...hotspots
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
        confidence: 'Basée sur le nombre de sources confirmant chaque espèce',
        rawDataCounts: {
          gbif: gbifSpecies.length,
          inaturalist: inaturalistSpecies.length,
          ebird: ebirdSpecies.length,
          totalBeforeAggregation: gbifSpecies.length + inaturalistSpecies.length + ebirdSpecies.length,
          totalAfterAggregation: aggregatedSpecies.length
        }
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
