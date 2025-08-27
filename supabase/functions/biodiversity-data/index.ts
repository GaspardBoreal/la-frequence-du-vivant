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
  mode?: 'interactive' | 'batch'; // New: batch mode skips heavy enrichments
}

interface BirdPhoto {
  url: string;
  source: 'inaturalist' | 'flickr' | 'placeholder';
  attribution?: string;
  license?: string;
  photographer?: string;
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

interface XenoCantoRecording {
  id: string;
  file: string;
  fileName: string;
  sono: {
    small: string;
    med: string;
    large: string;
    full: string;
  };
  osci: {
    small: string;
    med: string;
    large: string;
  };
  quality: string;
  length: string;
  type: string;
  sex: string;
  stage: string;
  method: string;
  recordist: string;
  date: string;
  time: string;
  location: string;
  latitude: string;
  longitude: string;
  altitude: string;
  temperature?: string;
  device?: string;
  microphone?: string;
  sampleRate?: string;
  license: string;
  remarks?: string;
  animalSeen?: string;
  playbackUsed?: string;
  backgroundSpecies?: string[];
  url: string;
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
  photoData?: BirdPhoto;
  audioUrl?: string;
  sonogramUrl?: string;
  source: 'gbif' | 'inaturalist' | 'ebird';
  conservationStatus?: string;
  confidence?: 'high' | 'medium' | 'low';
  confirmedSources?: number;
  attributions: BiodiversityObservation[];
  xenoCantoRecordings?: XenoCantoRecording[];
  recordingQuality?: string;
  soundType?: string;
  recordingContext?: {
    method: string;
    equipment?: string;
    conditions?: string;
  };
  behavioralInfo?: {
    sex?: string;
    stage?: string;
    animalSeen?: boolean;
    playbackUsed?: boolean;
  };
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
    withAudio?: number;
    withPhotos?: number;
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
      kingdom: mapKingdom(item, item.scientificName, item.family),
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
    
    // Utiliser le rayon exactement comme demandé sans modification
    const searchRadius = radius;
    
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
      kingdom: mapKingdom(item.taxon, item.taxon?.name, item.taxon?.iconic_taxon_name),
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
    
    // Traitement des données avec récupération des données audio xeno-canto
    const processedData = await Promise.all(
      data.map(async (item: any, index: number) => {
        // Récupérer les enregistrements Xeno-Canto
        let xenoCantoRecordings: any[] = [];
        try {
          xenoCantoRecordings = await fetchXenoCantoRecordings(item.sciName || '');
          console.log(`🎵 Xeno-Canto data fetched for ${item.comName}: ${xenoCantoRecordings.length} recordings`);
        } catch (error) {
          console.log(`⚠️ Could not fetch Xeno-Canto data for ${item.comName}:`, error);
        }

        // Debug: afficher les détails de l'observateur
        console.log(`🔍 Observer debug for ${item.comName}: userDisplayName="${item.userDisplayName}", subId="${item.subId}"`);
        
        const species = {
          id: `ebird-${item.speciesCode || index}`,
          scientificName: item.sciName || 'Unknown',
          commonName: item.comName || item.sciName || 'Unknown',
          family: 'Aves',
          kingdom: 'Animalia' as const,
          observations: item.howMany || 1,
          lastSeen: item.obsDt || new Date().toISOString().split('T')[0],
          photos: [],
          audioUrl: xenoCantoRecordings[0]?.file,
          sonogramUrl: xenoCantoRecordings[0]?.sono?.med,
          source: 'ebird' as const,
          xenoCantoRecordings,
          recordingQuality: xenoCantoRecordings[0]?.quality,
          attributions: [{
            observerName: item.userDisplayName || item.obsPerson || 'Contributeur eBird anonyme',
            observerInstitution: 'eBird/Cornell Lab of Ornithology',
            observationMethod: 'Observation ornithologique',
            originalUrl: item.subId ? `https://ebird.org/checklist/${item.subId}` : `https://ebird.org/species/${item.speciesCode}`,
            exactLatitude: item.lat,
            exactLongitude: item.lng,
            locationName: item.locName || 'Localisation inconnue',
            date: item.obsDt || new Date().toISOString().split('T')[0],
            source: 'ebird' as const
          }]
        };

        // Enrichir avec les métadonnées Xeno-Canto
        if (xenoCantoRecordings.length > 0) {
          const bestRecording = xenoCantoRecordings[0];
          species.soundType = bestRecording.type;
          species.recordingContext = {
            method: bestRecording.method,
            equipment: [bestRecording.device, bestRecording.microphone].filter(Boolean).join(', ') || undefined,
            conditions: [bestRecording.temperature && `${bestRecording.temperature}°C`, bestRecording.time].filter(Boolean).join(', ') || undefined
          };
          species.behavioralInfo = {
            sex: bestRecording.sex || undefined,
            stage: bestRecording.stage || undefined,
            animalSeen: bestRecording.animalSeen === 'yes',
            playbackUsed: bestRecording.playbackUsed === 'yes'
          };
        }

        return species;
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

// Helper function to fetch bird photos with timeout
async function fetchBirdPhoto(scientificName: string, isBatchMode: boolean = false): Promise<BirdPhoto | null> {
  // Skip photo fetching in batch mode for performance
  if (isBatchMode) {
    console.log(`⚡ Batch mode: Skipping photo fetch for ${scientificName}`);
    return null;
  }

  try {
    console.log(`🔍 Fetching photo for ${scientificName} from iNaturalist...`);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const iNatUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&per_page=1&rank=species`;
    const iNatResponse = await fetch(iNatUrl, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'BiodiversityDataCollector/1.0' }
    });
    
    clearTimeout(timeout);
    
    if (iNatResponse.ok) {
      const iNatData = await iNatResponse.json();
      if (iNatData.results && iNatData.results.length > 0) {
        const taxon = iNatData.results[0];
        if (taxon.default_photo) {
          console.log(`✅ Photo found on iNaturalist for ${scientificName}`);
          return {
            url: taxon.default_photo.medium_url || taxon.default_photo.url,
            source: 'inaturalist',
            attribution: taxon.default_photo.attribution,
            license: taxon.default_photo.license_code,
            photographer: taxon.default_photo.attribution?.split('(c)')[1]?.trim()
          };
        }
      }
    }
    
    return null;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`⏱️ Photo fetch timeout for ${scientificName}`);
    } else {
      console.warn(`⚠️ Error fetching photo for ${scientificName}:`, error);
    }
    return null;
  }
}

// Helper function to fetch Xeno-Canto recordings with timeout and batch mode support
async function fetchXenoCantoRecordings(scientificName: string, isBatchMode: boolean = false): Promise<XenoCantoRecording[]> {
  // Skip Xeno-Canto in batch mode for performance (major bottleneck)
  if (isBatchMode) {
    console.log(`⚡ Batch mode: Skipping Xeno-Canto for ${scientificName}`);
    return [];
  }

  try {
    console.log(`🎵 Fetching Xeno-Canto recordings for ${scientificName}...`);
    
    // Add aggressive timeout to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout (was infinite)
    
    const url = `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(scientificName)}+q:A&page=1&rpp=5`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BiodiversityDataCollector/1.0'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`⚠️ Erreur Xeno-Canto pour ${scientificName}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`🎵 Xeno-Canto data fetched for ${scientificName}: ${data.recordings?.length || 0} recordings`);
    
    if (!data.recordings || data.recordings.length === 0) {
      return [];
    }

    return data.recordings.slice(0, 2).map((recording: any) => ({ // Limit to 2 recordings for performance
      id: recording.id,
      file: recording.file,
      fileName: recording['file-name'] || `${scientificName}_${recording.id}.mp3`,
      sono: {
        small: recording.sono?.small || '',
        med: recording.sono?.med || '',
        large: recording.sono?.large || '',
        full: recording.sono?.full || ''
      },
      osci: {
        small: recording.osci?.small || '',
        med: recording.osci?.med || '',
        large: recording.osci?.large || ''
      },
      quality: recording.q || 'N/A',
      length: recording.length || 'N/A',
      type: recording.type || 'call',
      sex: recording.sex || 'unknown',
      stage: recording.stage || 'adult',
      method: recording.method || 'field recording',
      recordist: recording.rec || 'Unknown',
      date: recording.date || 'Unknown',
      time: recording.time || 'Unknown',
      location: `${recording.cnt || 'Unknown'}, ${recording.loc || 'Unknown'}`,
      latitude: recording.lat || '',
      longitude: recording.lng || '',
      altitude: recording.alt || '',
      temperature: recording.temp,
      device: recording.mic,
      microphone: recording.mic,
      sampleRate: recording.smp,
      license: recording.lic || 'Unknown',
      remarks: recording.rmk,
      animalSeen: recording['animal-seen'],
      playbackUsed: recording['playback-used'],
      backgroundSpecies: recording['background-species'] ? recording['background-species'].split(',').map((s: string) => s.trim()) : [],
      url: `https://xeno-canto.org/${recording.id}`
    }));

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`⏱️ Xeno-Canto fetch timeout for ${scientificName}`);
    } else {
      console.warn(`⚠️ Erreur lors de la récupération des enregistrements Xeno-Canto pour ${scientificName}:`, error);
    }
    return [];
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

// Helper function to map kingdom names with enhanced fallbacks
function mapKingdom(taxon?: any, scientificName: string = '', family?: string): 'Plantae' | 'Animalia' | 'Fungi' | 'Other' {
  // Check scientific name patterns for animal classes (FIXED: this was missing!)
  const animalClasses = [
    'insecta', 'aves', 'mammalia', 'reptilia', 'amphibia', 'actinopterygii',
    'arachnida', 'mollusca', 'crustacea', 'cnidaria', 'echinodermata'
  ];
  
  const scientificLower = scientificName.toLowerCase();
  if (animalClasses.some(cls => scientificLower.includes(cls))) {
    console.log(`🔍 Classification "${scientificName}": kingdom="Animalia", source=scientific_name_pattern`);
    return 'Animalia';
  }

  // Check iNaturalist iconic_taxon_name (CRITICAL: this was missing!)
  if (taxon?.iconic_taxon_name) {
    const iconicTaxon = taxon.iconic_taxon_name.toLowerCase();
    // Map animal classes to Animalia
    if (iconicTaxon === 'insecta' || iconicTaxon === 'aves' || iconicTaxon === 'mammalia' || 
        iconicTaxon === 'reptilia' || iconicTaxon === 'amphibia' || iconicTaxon === 'actinopterygii' ||
        iconicTaxon === 'arachnida' || iconicTaxon === 'mollusca' || iconicTaxon === 'crustacea' ||
        iconicTaxon === 'animalia') {
      console.log(`🔍 Classification "${scientificName}": kingdom="Animalia", commonName="${taxon?.preferred_common_name}", source=inaturalist, iconic_taxon="${iconicTaxon}"`);
      return 'Animalia';
    }
    // Map plant classes to Plantae
    if (iconicTaxon === 'plantae' || iconicTaxon === 'tracheophyta') {
      return 'Plantae';
    }
    // Map fungal classes to Fungi
    if (iconicTaxon === 'fungi') {
      return 'Fungi';
    }
  }
  
  // Check direct taxon kingdom  
  const kingdomValue = taxon?.kingdom || taxon?.rank_kingdom || family;
  if (kingdomValue) {
    const kingdom = kingdomValue.toLowerCase();
    
    if (kingdom.includes('plant') || kingdom === 'plantae' || kingdom === 'archaeplastida') {
      return 'Plantae';
    }
    
    if (kingdom.includes('animal') || kingdom === 'animalia' || kingdom === 'metazoa') {
      return 'Animalia';
    }
    
    if (kingdom.includes('fung') || kingdom === 'fungi') {
      return 'Fungi';
    }
  }

  // Look for bird/animal indicators in the data
  if (taxon) {
    const commonName = (taxon.preferred_common_name || taxon.english_name || '').toLowerCase();
    const familyName = (taxon.ancestry?.family || taxon.family || '').toLowerCase();
    
    // Bird indicators
    if (commonName.includes('bird') || familyName.includes('idae') || 
        taxon.rank === 'species' && (taxon.observations_count > 0)) {
      return 'Animalia';
    }
  }

  console.log(`⚠️ Espèce classée "Other": "${scientificName}", taxon:`, taxon);
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
    const query: BiodiversityQuery = await req.json();
    console.log('🔍 Biodiversity query received:', query);
    
    const { latitude, longitude, radius = 500, dateFilter = 'recent', mode = 'interactive' } = query;
    const isBatchMode = mode === 'batch';
    
    if (isBatchMode) {
      console.log('⚡ Running in BATCH MODE - skipping heavy enrichments');
    }

    // Fetch data from all sources in parallel with timeout and error handling
    console.log('🚀 Starting parallel data fetch from all sources...');
    const results = await Promise.allSettled([
      fetchGBIFData(latitude, longitude, radius, dateFilter),
      fetchINaturalistData(latitude, longitude, radius, dateFilter),
      fetchEBirdData(latitude, longitude, radius, dateFilter),
      fetchEBirdNotable(latitude, longitude, radius, dateFilter),
      fetchEBirdHotspots(latitude, longitude, radius)
    ]);

    // Extract successful results with error logging
    const gbifData = results[0].status === 'fulfilled' ? results[0].value : [];
    const iNaturalistData = results[1].status === 'fulfilled' ? results[1].value : [];
    const eBirdData = results[2].status === 'fulfilled' ? results[2].value : [];
    const eBirdNotableData = results[3].status === 'fulfilled' ? results[3].value : [];
    const eBirdHotspots = results[4].status === 'fulfilled' ? results[4].value : [];

    // Log any failed requests
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const sources = ['GBIF', 'iNaturalist', 'eBird', 'eBird Notable', 'eBird Hotspots'];
        console.error(`❌ ${sources[index]} fetch failed:`, result.reason);
      }
    });

    // Combine and deduplicate species data
    const allSpecies = [...gbifData, ...iNaturalistData, ...eBirdData, ...eBirdNotableData];
    const aggregatedSpecies = aggregateSpeciesData(allSpecies);

    console.log(`📊 Aggregated ${aggregatedSpecies.length} unique species`);

    // Calculate summary statistics
    const summary = calculateSummary(aggregatedSpecies);

    // Enrich species with photos and audio (skip in batch mode for performance)
    if (!isBatchMode) {
      console.log('🎨 Enriching species with photos and audio...');
      
      // Use Promise.allSettled to prevent individual failures from blocking the entire process
      const enrichmentPromises = aggregatedSpecies
        .filter(species => species.kingdom === 'Animalia')
        .map(async (species) => {
          try {
            // Fetch bird photo
            if (!species.photoData) {
              species.photoData = await fetchBirdPhoto(species.scientificName, isBatchMode);
            }

            // Fetch Xeno-Canto recordings for birds
            if (!species.xenoCantoRecordings) {
              species.xenoCantoRecordings = await fetchXenoCantoRecordings(species.scientificName, isBatchMode);
              
              if (species.xenoCantoRecordings && species.xenoCantoRecordings.length > 0) {
                const bestRecording = species.xenoCantoRecordings[0];
                species.recordingQuality = bestRecording.quality;
                species.soundType = bestRecording.type;
                species.recordingContext = {
                  method: bestRecording.method,
                  equipment: bestRecording.device || bestRecording.microphone,
                  conditions: bestRecording.remarks
                };
                species.behavioralInfo = {
                  sex: bestRecording.sex !== 'unknown' ? bestRecording.sex : undefined,
                  stage: bestRecording.stage !== 'adult' ? bestRecording.stage : undefined,
                  animalSeen: bestRecording.animalSeen === 'yes',
                  playbackUsed: bestRecording.playbackUsed === 'yes'
                };
                
                // Set primary audio URL if available
                if (bestRecording.file) {
                  species.audioUrl = `https://xeno-canto.org/${bestRecording.id}/download`;
                }
                if (bestRecording.sono?.large) {
                  species.sonogramUrl = bestRecording.sono.large;
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ Enrichment failed for ${species.scientificName}:`, error);
          }
        });

      // Wait for all enrichments to complete or fail
      await Promise.allSettled(enrichmentPromises);
    } else {
      console.log('⚡ Batch mode: Skipping species enrichment for performance');
    }

    // Update summary with enriched data counts
    summary.withPhotos = aggregatedSpecies.filter(s => s.photoData?.url).length;
    summary.withAudio = aggregatedSpecies.filter(s => s.audioUrl).length;

    // Prepare response
    const response: BiodiversityData = {
      location: { latitude, longitude, radius },
      summary,
      species: aggregatedSpecies,
      hotspots: eBirdHotspots,
      methodology: {
        radius,
        dateFilter,
        excludedData: ['Domestic species', 'Hybrids'],
        sources: ['GBIF', 'iNaturalist', 'eBird'],
        confidence: 'Aggregated from multiple sources with deduplication'
      }
    };

    console.log(`✅ Biodiversity data processed: ${response.species.length} species, ${response.summary.totalSpecies} total`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in biodiversity-data function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      location: null,
      summary: { totalSpecies: 0, birds: 0, plants: 0, fungi: 0, others: 0, recentObservations: 0 },
      species: [],
      hotspots: [],
      methodology: { radius: 500, dateFilter: 'recent', excludedData: [], sources: [], confidence: 'Error occurred' }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
