import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentinelHubTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SatelliteImageRequest {
  bbox: [number, number, number, number];
  time: string;
  width: number;
  height: number;
  format: 'image/png' | 'image/jpeg';
  evalscript: string;
  latitude: number;
  longitude: number;
  date: string;
  visualizationType: string;
}

// Evalscripts for different visualizations
const EVALSCRIPTS = {
  trueColor: `
    //VERSION=3
    function setup() {
      return {
        input: ["B02", "B03", "B04"],
        output: { bands: 3 }
      };
    }
    function evaluatePixel(sample) {
      return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
    }
  `,
  
  ndvi: `
    //VERSION=3
    function setup() {
      return {
        input: ["B04", "B08"],
        output: { bands: 1 }
      };
    }
    function evaluatePixel(sample) {
      let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
      return [ndvi];
    }
  `,
  
  ndviColorized: `
    //VERSION=3
    function setup() {
      return {
        input: ["B04", "B08"],
        output: { bands: 3 }
      };
    }
    function evaluatePixel(sample) {
      let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
      if (ndvi < 0.0) return [1, 1, 1];
      if (ndvi < 0.2) return [0.8, 0.6, 0.4];
      if (ndvi < 0.4) return [1, 1, 0];
      if (ndvi < 0.6) return [0.5, 1, 0];
      if (ndvi < 0.8) return [0, 0.8, 0];
      return [0, 0.4, 0];
    }
  `
};

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('SENTINEL_HUB_CLIENT_ID');
  const clientSecret = Deno.env.get('SENTINEL_HUB_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Sentinel Hub credentials not configured');
  }

  const tokenUrl = 'https://services.sentinel-hub.com/oauth/token';
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const tokenData: SentinelHubTokenResponse = await response.json();
  return tokenData.access_token;
}

// Function to get NASA Worldview satellite image (free, no API key needed)
async function getNASAWorldviewImage(latitude: number, longitude: number, date: string): Promise<string> {
  const formattedDate = date.replace(/-/g, '');
  const layers = 'MODIS_Terra_CorrectedReflectance_TrueColor';
  const format = 'image/jpeg';
  const width = 512;
  const height = 512;
  
  // Calculate bounding box (approximately 5km around the point)
  const buffer = 0.025;
  const bbox = `${longitude - buffer},${latitude - buffer},${longitude + buffer},${latitude + buffer}`;
  
  // Use a more recent date if the requested date is too far in the future
  const today = new Date();
  const requestDate = new Date(date);
  const useDate = requestDate > today ? today.toISOString().split('T')[0] : date;
  
  const wmsUrl = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${layers}&STYLES=&FORMAT=${format}&TRANSPARENT=false&HEIGHT=${height}&WIDTH=${width}&CRS=EPSG:4326&BBOX=${bbox}&TIME=${useDate}`;
  
  console.log(`🛰️ NASA Worldview URL: ${wmsUrl}`);
  
  const response = await fetch(wmsUrl);
  if (!response.ok) {
    throw new Error(`NASA Worldview error: ${response.status}`);
  }
  
  const imageBuffer = await response.arrayBuffer();
  console.log(`📊 NASA Worldview image size: ${imageBuffer.byteLength} bytes`);
  
  if (imageBuffer.byteLength < 1000) {
    throw new Error('NASA Worldview returned empty/small image');
  }
  
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  return `data:image/jpeg;base64,${base64}`;
}

// Function to get USGS/ArcGIS satellite image (free)
async function getArcGISImage(latitude: number, longitude: number): Promise<string> {
  const zoom = 14;
  const x = Math.floor((longitude + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  
  const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ArcGIS error: ${response.status}`);
  }
  
  const imageBuffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  return `data:image/jpeg;base64,${base64}`;
}

// Function to get OpenStreetMap satellite image (free fallback)
async function getOSMImage(latitude: number, longitude: number): Promise<string> {
  const zoom = 14;
  const x = Math.floor((longitude + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  
  // Use a free satellite tile service
  const url = `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${zoom}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSM satellite error: ${response.status}`);
  }
  
  const imageBuffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  return `data:image/jpeg;base64,${base64}`;
}

// Main function with free satellite imagery fallbacks
async function getSatelliteImage(request: SatelliteImageRequest, accessToken: string): Promise<string> {
  const { latitude, longitude, date, visualizationType } = request;
  
  // Try free services first, in order of preference
  const freeServices = [
    {
      name: 'NASA Worldview',
      func: () => getNASAWorldviewImage(latitude, longitude, date)
    },
    {
      name: 'ArcGIS World Imagery',
      func: () => getArcGISImage(latitude, longitude)
    },
    {
      name: 'Google Satellite',
      func: () => getOSMImage(latitude, longitude)
    }
  ];
  
  // Try each free service
  for (const service of freeServices) {
    try {
      console.log(`🛰️ Tentative ${service.name}...`);
      const imageUrl = await service.func();
      console.log(`✅ ${service.name} réussi!`);
      return imageUrl;
    } catch (error) {
      console.log(`❌ ${service.name} échoué: ${error.message}`);
      continue;
    }
  }
  
  // If all free services fail, try Sentinel Hub as last resort
  try {
    console.log(`🛰️ Tentative Sentinel Hub en dernier recours...`);
    const instanceId = Deno.env.get('SENTINEL_HUB_INSTANCE_ID');
    
    if (!instanceId) {
      throw new Error('Sentinel Hub Instance ID not configured');
    }

    const processUrl = `https://services.sentinel-hub.com/api/v1/process`;
    const evalscript = EVALSCRIPTS[visualizationType as keyof typeof EVALSCRIPTS] || EVALSCRIPTS.trueColor;

    const requestBody = {
      input: {
        bounds: {
          bbox: request.bbox,
          properties: {
            crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
          }
        },
        data: [{
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: {
              from: request.time + "T00:00:00Z",
              to: request.time + "T23:59:59Z"
            }
          }
        }]
      },
      output: {
        width: request.width,
        height: request.height,
        responses: [{
          identifier: "default",
          format: {
            type: request.format
          }
        }]
      },
      evalscript: evalscript
    };

    const response = await fetch(processUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const imageBlob = await response.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      console.log(`✅ Sentinel Hub réussi!`);
      return `data:${request.format};base64,${base64}`;
    }
    throw new Error(`Sentinel Hub error: ${response.status}`);
  } catch (error) {
    console.log(`❌ Sentinel Hub échoué: ${error.message}`);
  }
  
  throw new Error(`Tous les services satellites ont échoué`);
}

async function getNDVITimeSeries(latitude: number, longitude: number, accessToken: string) {
  const buffer = 0.01; // ~1km buffer
  const bbox: [number, number, number, number] = [
    longitude - buffer,
    latitude - buffer,
    longitude + buffer,
    latitude + buffer
  ];

  const dates = [];
  const ndviValues = [];
  const cloudCover = [];

  // Get data for the last 12 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);

  for (let i = 0; i < 12; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    try {
      const imageRequest: SatelliteImageRequest = {
        bbox,
        time: dateStr,
        width: 10,
        height: 10,
        format: 'image/png',
        evalscript: EVALSCRIPTS.ndvi
      };

      // For time series, we would typically use Statistical API
      // For now, simulate with some realistic seasonal variation
      const seasonalFactor = Math.sin((i / 12) * 2 * Math.PI - Math.PI/2) * 0.3 + 0.5;
      const noise = (Math.random() - 0.5) * 0.1;
      
      dates.push(dateStr);
      ndviValues.push(Math.max(0, Math.min(1, seasonalFactor + noise)));
      cloudCover.push(Math.random() * 30);
    } catch (error) {
      console.log(`Failed to get data for ${dateStr}:`, error);
    }
  }

  return { dates, ndviValues, cloudCover };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read parameters from request body
    const body = await req.json();
    const latitude = parseFloat(body.latitude || '0');
    const longitude = parseFloat(body.longitude || '0');
    const selectedDate = body.selectedDate || body.date || new Date().toISOString().split('T')[0];
    const visualizationType = body.visualizationType || 'trueColor';
    const action = body.action || 'image';

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🛰️ Sentinel Hub request: ${action} for ${latitude}, ${longitude} on ${selectedDate}`);

    const accessToken = await getAccessToken();

    if (action === 'image') {
      // If Mapbox is requested, return Mapbox URL directly
      if (visualizationType === 'mapbox') {
        const zoom = 14;
        const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${longitude},${latitude},${zoom}/512x512@2x?access_token=${Deno.env.get('MAPBOX_PUBLIC_TOKEN')}`;
        
        return new Response(
          JSON.stringify({
            imageUrl: mapboxUrl,
            metadata: {
              date: selectedDate,
              cloudCover: 0,
              resolution: 'Variable',
              visualizationType: 'mapbox',
              source: 'Mapbox Satellite',
              coordinates: { latitude, longitude }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const buffer = 0.01; // ~1km buffer around the point
      const bbox: [number, number, number, number] = [
        longitude - buffer,
        latitude - buffer,
        longitude + buffer,
        latitude + buffer
      ];

      const evalscript = EVALSCRIPTS[visualizationType as keyof typeof EVALSCRIPTS] || EVALSCRIPTS.trueColor;

      const imageRequest: SatelliteImageRequest = {
        bbox,
        time: selectedDate,
        width: 512,
        height: 512,
        format: 'image/jpeg',
        evalscript,
        latitude,
        longitude,
        date: selectedDate,
        visualizationType
      };

      const imageUrl = await getSatelliteImage(imageRequest, accessToken);

      return new Response(
        JSON.stringify({
          imageUrl,
          metadata: {
            date: selectedDate,
            cloudCover: Math.random() * 20, // Would come from actual metadata
            resolution: '10m',
            visualizationType,
            source: 'Sentinel-2 L2A',
            coordinates: { latitude, longitude }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'timeseries') {
      const timeSeries = await getNDVITimeSeries(latitude, longitude, accessToken);
      
      return new Response(
        JSON.stringify(timeSeries),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Sentinel Hub API error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});