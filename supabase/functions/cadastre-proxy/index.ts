import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [CADASTRE PROXY] Méthode de requête:', req.method);
    console.log('🔍 [CADASTRE PROXY] URL complète:', req.url);
    
    let parcelId: string | null = null;
    
    // Récupérer parcelId depuis les paramètres URL ou le body
    if (req.method === 'GET') {
      const url = new URL(req.url);
      parcelId = url.searchParams.get('parcelId');
      console.log('🔍 [CADASTRE PROXY] GET parcelId:', parcelId);
    } else if (req.method === 'POST') {
      try {
        const body = await req.text();
        console.log('🔍 [CADASTRE PROXY] Body brut reçu:', body);
        
        if (body && body.trim()) {
          const parsedBody = JSON.parse(body);
          parcelId = parsedBody.parcelId;
          console.log('🔍 [CADASTRE PROXY] POST parcelId parsé:', parcelId);
        } else {
          console.warn('⚠️ [CADASTRE PROXY] Body vide ou null');
        }
      } catch (parseError) {
        console.error('❌ [CADASTRE PROXY] Erreur parsing JSON:', parseError);
        console.log('🔍 [CADASTRE PROXY] Headers content-type:', req.headers.get('content-type'));
      }
    }

    if (!parcelId) {
      console.error('❌ [CADASTRE PROXY] Paramètre parcelId manquant');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Paramètre parcelId requis' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🏘️ [CADASTRE PROXY] Récupération pour parcelId: ${parcelId}`);
    
    // Extraire le code commune des 5 premiers caractères
    const codeCommune = parcelId.substring(0, 5);
    console.log(`🏘️ [CADASTRE PROXY] Code commune: ${codeCommune}`);
    
    // URLs à tester dans l'ordre
    const urlsToTry = [
      `https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/communes/${codeCommune}/cadastre-${codeCommune}-parcelles.json`,
      `https://cadastre.data.gouv.fr/bundler/cadastre-etalab/latest/geojson/communes/${codeCommune}/cadastre-${codeCommune}-parcelles.json`,
      `https://opendatasoft.github.io/cadastre-france/data/geojson/communes/${codeCommune}/cadastre-${codeCommune}-parcelles.json`
    ];

    let geoJsonData = null;
    let workingUrl = null;

    for (const testUrl of urlsToTry) {
      try {
        console.log(`🔍 [CADASTRE PROXY] Test URL: ${testUrl}`);
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Supabase-Edge-Function/1.0',
          },
        });

        if (response.ok) {
          geoJsonData = await response.json();
          workingUrl = testUrl;
          console.log(`✅ [CADASTRE PROXY] URL fonctionnelle: ${testUrl}`);
          break;
        } else {
          console.warn(`⚠️ [CADASTRE PROXY] ${testUrl} retourne: ${response.status}`);
        }
      } catch (error) {
        console.warn(`⚠️ [CADASTRE PROXY] Erreur avec ${testUrl}:`, error);
      }
    }

    if (!geoJsonData) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Aucune URL cadastrale fonctionnelle pour la commune ${codeCommune}`,
          parcelId
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📦 [CADASTRE PROXY] ${geoJsonData.features?.length || 0} parcelles trouvées`);

    // Chercher la parcelle avec l'ID correspondant
    const parcel = geoJsonData.features?.find((feature: any) => 
      feature.properties?.id === parcelId
    );

    if (parcel) {
      console.log(`✅ [CADASTRE PROXY] Parcelle ${parcelId} trouvée`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            geometry: parcel.geometry,
            properties: parcel.properties
          },
          parcelId,
          sourceUrl: workingUrl
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.warn(`❌ [CADASTRE PROXY] Parcelle ${parcelId} non trouvée`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Parcelle ${parcelId} non trouvée dans les données`,
          availableParcels: geoJsonData.features?.slice(0, 5).map((f: any) => f.properties?.id) || [],
          parcelId
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('❌ [CADASTRE PROXY] Erreur complète:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue lors de la récupération des données cadastrales'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});