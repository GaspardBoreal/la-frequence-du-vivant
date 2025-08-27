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

interface BirdPhoto {
  url: string;
  source: 'inaturalist' | 'flickr' | 'placeholder';
  attribution?: string;
  license?: string;
  photographer?: string;
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
      kingdom: mapKingdom(item, item.family, item.scientificName),
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
      kingdom: mapKingdom(item.taxon, item.taxon?.iconic_taxon_name, item.taxon?.name),
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

// Fonction pour récupérer les photos d'oiseaux
async function fetchBirdPhoto(scientificName: string, commonName?: string): Promise<BirdPhoto | null> {
  try {
    console.log(`🔍 Recherche photo pour: ${scientificName} (${commonName})`);
    
    // 1. Essayer iNaturalist d'abord
    const inatUrl = `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&has[]=photos&quality_grade=research&per_page=3&order=desc&order_by=votes`;
    console.log(`📍 iNaturalist URL: ${inatUrl}`);
    
    const inatResponse = await fetch(inatUrl);
    console.log(`📍 iNaturalist Response Status: ${inatResponse.status}`);
    
    if (inatResponse.ok) {
      const inatData = await inatResponse.json();
      console.log(`📍 iNaturalist Results: ${inatData.results?.length || 0}`);
      
      if (inatData.results && inatData.results.length > 0) {
        const observation = inatData.results[0];
        const photo = observation.photos?.[0];
        console.log(`📍 Photo found: ${photo?.url || 'none'}`);
        
        if (photo) {
          const photoData = {
            url: photo.url.replace('square', 'medium'),
            source: 'inaturalist' as const,
            attribution: `Photo by ${observation.user?.name || 'iNaturalist user'}`,
            license: observation.license_code || 'Unknown',
            photographer: observation.user?.name
          };
          console.log(`✅ iNaturalist photo found for ${scientificName}:`, photoData);
          return photoData;
        }
      }
    }

    console.log(`⚠️ No iNaturalist photo found for ${scientificName}, trying Flickr...`);

    // 2. Fallback vers Flickr
    const searchTerm = commonName || scientificName;
    const flickrUrl = `https://api.flickr.com/services/feeds/photos_public.gne?format=json&nojsoncallback=1&tags=${encodeURIComponent(searchTerm + ' bird')}&per_page=3`;
    console.log(`📍 Flickr URL: ${flickrUrl}`);
    
    const flickrResponse = await fetch(flickrUrl);
    console.log(`📍 Flickr Response Status: ${flickrResponse.status}`);
    
    if (flickrResponse.ok) {
      const flickrData = await flickrResponse.json();
      console.log(`📍 Flickr Results: ${flickrData.items?.length || 0}`);
      
      if (flickrData.items && flickrData.items.length > 0) {
        const item = flickrData.items[0];
        console.log(`📍 Flickr photo found: ${item.media?.m || 'none'}`);
        
        const photoData = {
          url: item.media.m.replace('_m.jpg', '_c.jpg'),
          source: 'flickr' as const,
          attribution: `Photo by ${item.author?.replace(/.*\(([^)]+)\).*/, '$1') || 'Flickr user'}`,
          license: 'Flickr',
          photographer: item.author?.replace(/.*\(([^)]+)\).*/, '$1')
        };
        console.log(`✅ Flickr photo found for ${scientificName}:`, photoData);
        return photoData;
      }
    }

    console.log(`❌ No photo found for ${scientificName} from any source`);
    return null;
  } catch (error) {
    console.error(`❌ Error fetching photo for ${scientificName}:`, error);
    return null;
  }
}

// Fonction pour récupérer les données audio de Xeno-Canto (API publique)
async function fetchXenoCantoRecordings(scientificName: string): Promise<any[]> {
  try {
    console.log(`🎵 Recherche Xeno-Canto pour: ${scientificName}`);
    
    const apiKey = Deno.env.get('XENO_CANTO_API_KEY');
    if (!apiKey) {
      console.warn('⚠️ Clé API Xeno-Canto manquante');
      return [];
    }
    
    // Utiliser l'API v3 avec la clé requise
    const searchUrl = `https://xeno-canto.org/api/3/recordings?query=sp:"${encodeURIComponent(scientificName)}"&key=${apiKey}&page=1`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.warn(`⚠️ Erreur Xeno-Canto pour ${scientificName}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.recordings && data.recordings.length > 0) {
      // Trier par qualité (A > B > C > D > E) et limiter aux 5 meilleurs
      const qualityOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
      const sortedRecordings = data.recordings
        .filter((r: any) => r.file && r.sono?.small)
        .sort((a: any, b: any) => {
          const aScore = qualityOrder[a.q as keyof typeof qualityOrder] || 0;
          const bScore = qualityOrder[b.q as keyof typeof qualityOrder] || 0;
          return bScore - aScore;
        })
        .slice(0, 5);

      console.log(`✅ Xeno-Canto trouvé pour ${scientificName}: ${sortedRecordings.length} enregistrements`);
      
      return sortedRecordings.map((recording: any) => ({
        id: recording.id,
        file: `https://xeno-canto.org/${recording.file}`,
        fileName: recording.file,
        sono: {
          small: recording.sono.small,
          med: recording.sono.med,
          large: recording.sono.large,
          full: recording.sono.full
        },
        osci: recording.osci,
        quality: recording.q,
        length: recording.length,
        type: recording.type,
        sex: recording.sex || '',
        stage: recording.stage || '',
        method: recording.method || '',
        recordist: recording.rec || '',
        date: recording.date || '',
        time: recording.time || '',
        location: recording.loc || '',
        latitude: recording.lat || '',
        longitude: recording.lng || '',
        altitude: recording.alt || '',
        temperature: recording.rems?.includes('temp:') ? recording.rems.split('temp:')[1]?.split(',')[0]?.trim() : undefined,
        device: recording.rems?.includes('device:') ? recording.rems.split('device:')[1]?.split(',')[0]?.trim() : undefined,
        microphone: recording.rems?.includes('mic:') ? recording.rems.split('mic:')[1]?.split(',')[0]?.trim() : undefined,
        sampleRate: recording.rems?.includes('smp:') ? recording.rems.split('smp:')[1]?.split(',')[0]?.trim() : undefined,
        license: recording.lic || '',
        remarks: recording.rems,
        animalSeen: recording.rems?.includes('animal seen') ? 'yes' : recording.rems?.includes('animal not seen') ? 'no' : undefined,
        playbackUsed: recording.rems?.includes('playback used') ? 'yes' : recording.rems?.includes('playback not used') ? 'no' : undefined,
        backgroundSpecies: Array.isArray(recording.also) ? recording.also : [],
        url: `https://xeno-canto.org/${recording.id}`
      }));
    }
    
    console.log(`📭 Aucun enregistrement Xeno-Canto pour ${scientificName}`);
    return [];
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération Xeno-Canto pour ${scientificName}:`, error);
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
function mapKingdom(taxon: any, family?: string, scientificName?: string): 'Plantae' | 'Animalia' | 'Fungi' | 'Other' {
  // Check iNaturalist taxon ancestors first (most reliable)
  if (taxon?.ancestors && Array.isArray(taxon.ancestors)) {
    for (const ancestor of taxon.ancestors) {
      const ancestorName = ancestor.name?.toLowerCase();
      if (ancestorName === 'plantae') return 'Plantae';
      if (ancestorName === 'animalia') return 'Animalia';
      if (ancestorName === 'fungi') return 'Fungi';
    }
  }
  
  // Check direct taxon kingdom  
  const kingdomValue = taxon?.kingdom || taxon?.rank_kingdom || family;
  if (kingdomValue) {
    const normalizedKingdom = kingdomValue.toLowerCase();
    if (normalizedKingdom.includes('plantae') || normalizedKingdom.includes('plant')) {
      return 'Plantae';
    }
    if (normalizedKingdom.includes('animalia') || normalizedKingdom.includes('animal')) {
      return 'Animalia';
    }
    if (normalizedKingdom.includes('fungi') || normalizedKingdom.includes('fungus')) {
      return 'Fungi';
    }
  }
  
  // Scientific name-based fallbacks for common groups
  if (scientificName) {
    const name = scientificName.toLowerCase();
    // Butterflies and moths (Lepidoptera)
    if (name.includes('vanessa') || name.includes('maniola') || name.includes('iphiclides') || 
        name.includes('macroglossum') || name.includes('pieris') || name.includes('aglais') ||
        name.includes('inachis') || name.includes('polygonia') || name.includes('papilio') ||
        name.includes('gonepteryx') || name.includes('anthocharis') || name.includes('lycaena') ||
        name.includes('polyommatus') || name.includes('erebia')) {
      return 'Animalia';
    }
    // Dragonflies (Odonata)
    if (name.includes('calopteryx') || name.includes('libellula') || name.includes('sympetrum') ||
        name.includes('aeshna') || name.includes('anax') || name.includes('ischnura') ||
        name.includes('coenagrion')) {
      return 'Animalia';
    }
    // Birds (common genera)
    if (name.includes('turdus') || name.includes('parus') || name.includes('falco') ||
        name.includes('buteo') || name.includes('hirundo') || name.includes('phoenicurus') ||
        name.includes('anthus') || name.includes('emberiza') || name.includes('oenanthe') ||
        name.includes('linaria') || name.includes('rana') || name.includes('rupicapra')) {
      return 'Animalia';
    }
  }
  
  // Fallback based on family/order hints
  if (family) {
    const normalizedFamily = family.toLowerCase();
    if (normalizedFamily.includes('aves') || normalizedFamily.includes('bird') ||
        normalizedFamily.includes('lepidoptera') || normalizedFamily.includes('butterfly') ||
        normalizedFamily.includes('odonata') || normalizedFamily.includes('dragonfly') ||
        normalizedFamily.includes('idae') || normalizedFamily.includes('mammalia') ||
        normalizedFamily.includes('amphibia') || normalizedFamily.includes('reptilia')) {
      return 'Animalia';
    }
  }
  
  console.log(`⚠️ mapKingdom fallback to 'Other' for:`, { taxon, family, scientificName });
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

    console.log('📡 Enrichissement avec audio Xeno-Canto et photos...');
    
    // Enrichir les espèces eBird avec photos
    const enrichedEBirdSpecies = await Promise.all(
      [...ebirdNotable, ...ebirdSpecies].map(async (species) => {
        try {
          const photoData = await fetchBirdPhoto(species.scientificName, species.commonName);
          return {
            ...species,
            photoData
          };
        } catch (error) {
          console.error(`Error fetching photo for ${species.commonName}:`, error);
          return species;
        }
      })
    );

    // Enrichir les espèces iNaturalist avec photoData formaté
    const enrichedINaturalistSpecies = inaturalistSpecies.map(species => {
      if (species.photos && species.photos.length > 0) {
        const photoData = {
          url: species.photos[0],
          source: 'inaturalist' as const,
          attribution: species.attributions?.[0]?.observerName ? `Photo by ${species.attributions[0].observerName}` : 'Photo by iNaturalist user',
          license: 'iNaturalist',
          photographer: species.attributions?.[0]?.observerName
        };
        console.log(`✅ iNaturalist photo data created for ${species.commonName}:`, photoData);
        return {
          ...species,
          photoData
        };
      }
      return species;
    });

    // Log des données brutes avant agrégation
    console.log('📊 Données brutes collectées:');
    console.log(`  - GBIF: ${gbifSpecies.length} observations`);
    console.log(`  - iNaturalist: ${enrichedINaturalistSpecies.length} observations`);
    console.log(`  - eBird: ${ebirdSpecies.length} observations`);
    console.log(`  - eBird Notable: ${ebirdNotable.length} observations`);
    console.log(`  - Total avant agrégation: ${gbifSpecies.length + enrichedINaturalistSpecies.length + ebirdSpecies.length + ebirdNotable.length} observations`);
    
    // Debug spécial pour les données eBird
    if (ebirdSpecies.length > 0) {
      console.log('🐦 eBird species kingdoms:');
      ebirdSpecies.slice(0, 3).forEach(bird => {
        console.log(`  - ${bird.commonName}: kingdom=${bird.kingdom}, family=${bird.family}`);
      });
    }

    // Combine and aggregate all species data with cross-validation
    const allSpecies = [...gbifSpecies, ...enrichedINaturalistSpecies, ...enrichedEBirdSpecies];
    console.log('🎵 Enrichissement audio Xeno-Canto pour toutes les espèces...');
    
    // Enrichir TOUTES les espèces avec des données audio si ce sont des oiseaux
    const audioEnrichedSpecies = await Promise.all(
      allSpecies.map(async (species) => {
        // Vérifier si c'est probablement un oiseau
        const isFromEbird = species.source === 'ebird';
        const isAvesFamily = species.family === 'Aves' || species.family?.toLowerCase().includes('aves');
        const isBirdFamily = species.family?.toLowerCase().includes('bird') || species.family?.toLowerCase().includes('idae');
        const isBirdInName = species.commonName?.toLowerCase().includes('oiseau') || species.commonName?.toLowerCase().includes('bird') || species.scientificName?.toLowerCase().includes('aves');
        const isBird = isFromEbird || isAvesFamily || isBirdFamily || isBirdInName;
        
        console.log(`🔍 Checking ${species.commonName}: isBird=${isBird}, source=${species.source}, family=${species.family}`);
        
        if (isBird) {
          try {
            const xenoCantoRecordings = await fetchXenoCantoRecordings(species.scientificName);
            if (xenoCantoRecordings.length > 0) {
              console.log(`🎵 Audio enriched for ${species.commonName}: ${xenoCantoRecordings.length} recordings`);
              return {
                ...species,
                xenoCantoRecordings
              };
            } else {
              console.log(`⚠️ No Xeno-Canto recordings found for ${species.commonName}`);
            }
          } catch (error) {
            console.log(`⚠️ Could not fetch Xeno-Canto data for ${species.commonName}:`, error);
          }
        }
        
        return species;
      })
    );
    
    const aggregatedSpecies = aggregateSpeciesData(audioEnrichedSpecies);
    
    // Debug kingdom classification BEFORE processing hotspots
    console.log(`📊 Après agrégation: ${aggregatedSpecies.length} espèces uniques`);
    aggregatedSpecies.forEach(species => {
      console.log(`🔍 Classification "${species.scientificName}": kingdom="${species.kingdom}", commonName="${species.commonName}", source=${species.source}, family=${species.family || 'N/A'}`);
    });
    
    // Process eBird hotspots for context
    const hotspots = ebirdHotspots.map((hotspot: any) => ({
      name: hotspot.locName || 'Hotspot eBird',
      type: 'ebird_hotspot',
      distance: calculateDistance(latitude, longitude, hotspot.lat, hotspot.lng)
    })).sort((a, b) => a.distance - b.distance).slice(0, 5);
    
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
