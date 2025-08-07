import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔍 [CADASTRE PROXY] Function called!');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [CADASTRE PROXY] Request method:', req.method);
    console.log('🔍 [CADASTRE PROXY] Request URL:', req.url);
    
    let parcelId: string | null = null;
    
    if (req.method === 'POST') {
      const requestBody = await req.json();
      console.log('🔍 [CADASTRE PROXY] Request body:', requestBody);
      parcelId = requestBody.parcelId;
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      parcelId = url.searchParams.get('parcelId');
    }

    console.log('🔍 [CADASTRE PROXY] ParcelId extracted:', parcelId);

    if (!parcelId) {
      console.error('❌ [CADASTRE PROXY] Missing parcelId');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'ParcelId is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract commune code from first 5 characters and department from first 2
    const codeCommune = parcelId.substring(0, 5);
    const codeDepartement = parcelId.substring(0, 2);
    console.log('🔍 [CADASTRE PROXY] Commune code:', codeCommune);
    console.log('🔍 [CADASTRE PROXY] Department code:', codeDepartement);
    
    // Test URLs in order - new structure with department folders and compressed files
    const urlsToTry = [
      `https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/communes/${codeDepartement}/${codeCommune}/cadastre-${codeCommune}-parcelles.json.gz`,
      `https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/communes/${codeDepartement}/${codeCommune}/cadastre-${codeCommune}-parcelles.json`,
      `https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/communes/${codeCommune}/cadastre-${codeCommune}-parcelles.json`,
      `https://opendatasoft.github.io/cadastre-france/data/geojson/communes/${codeCommune}/cadastre-${codeCommune}-parcelles.json`
    ];

    for (const testUrl of urlsToTry) {
      try {
        console.log('🔍 [CADASTRE PROXY] Testing URL:', testUrl);
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, application/gzip',
            'Accept-Encoding': 'gzip',
            'User-Agent': 'Supabase-Edge-Function/1.0',
          },
        });

        console.log('🔍 [CADASTRE PROXY] Response status:', response.status);

        if (response.ok) {
          let geoJsonData;
          
          // Handle compressed files
          if (testUrl.endsWith('.gz')) {
            console.log('🗜️ [CADASTRE PROXY] Handling compressed file');
            const decompressedStream = response.body?.pipeThrough(new DecompressionStream('gzip'));
            const decompressedResponse = new Response(decompressedStream);
            geoJsonData = await decompressedResponse.json();
          } else {
            geoJsonData = await response.json();
          }
          
          console.log('✅ [CADASTRE PROXY] Data fetched successfully');
          console.log('📦 [CADASTRE PROXY] Number of features:', geoJsonData.features?.length || 0);
          
          // Find the specific parcel
          const parcel = geoJsonData.features?.find((feature: any) => 
            feature.properties?.id === parcelId
          );

          if (parcel) {
            console.log('✅ [CADASTRE PROXY] Parcel found:', parcelId);
            return new Response(
              JSON.stringify({
                success: true,
                data: {
                  geometry: parcel.geometry,
                  properties: parcel.properties
                },
                parcelId,
                sourceUrl: testUrl
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }
      } catch (error) {
        console.warn('⚠️ [CADASTRE PROXY] Error with URL:', testUrl, error.message);
      }
    }

    console.error('❌ [CADASTRE PROXY] No working URLs found');
    return new Response(
      JSON.stringify({
        success: false,
        message: `No cadastral data found for parcel ${parcelId}`,
        parcelId
      }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [CADASTRE PROXY] Server error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error: ' + error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});