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
    // Support both JSON body (POST) and URL query params (GET)
    const url = new URL(req.url);
    let latitude: string | null = url.searchParams.get('latitude');
    let longitude: string | null = url.searchParams.get('longitude');

    if ((!latitude || !longitude) && (req.method === 'POST' || req.method === 'PUT')) {
      try {
        const body = await req.json().catch(() => null) as any;
        if (body && (body.latitude !== undefined) && (body.longitude !== undefined)) {
          latitude = String(body.latitude);
          longitude = String(body.longitude);
        }
      } catch (e) {
        console.warn('⚠️ [LEXICON PROXY] Impossible de parser le corps JSON:', e);
      }
    }

    if (!latitude || !longitude) {
      console.error('❌ [LEXICON PROXY] Paramètres manquants - latitude ou longitude');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Paramètres latitude et longitude requis' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🌱 [LEXICON PROXY] Appel API pour lat: ${latitude}, lng: ${longitude}`);
    
    const lexiconUrl = `https://lexicon.osfarm.org/tools/parcel-identifier.json?latitude=${latitude}&longitude=${longitude}`;
    console.log(`🌱 [LEXICON PROXY] URL LEXICON: ${lexiconUrl}`);

    // Internal timeout to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let response: Response;
    try {
      response = await fetch(lexiconUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log(`🌱 [LEXICON PROXY] Statut de la réponse: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ [LEXICON PROXY] Erreur API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`❌ [LEXICON PROXY] Corps de l'erreur:`, errorText);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: `Erreur API LEXICON: ${response.status} - ${response.statusText}`,
          coordinates: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log(`✅ [LEXICON PROXY] Données reçues:`, data);
    console.log(`✅ [LEXICON PROXY] Type des données:`, typeof data);
    console.log(`✅ [LEXICON PROXY] Clés disponibles:`, Object.keys(data || {}));

    return new Response(
      JSON.stringify({
        success: true,
        data: data,
        coordinates: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [LEXICON PROXY] Erreur complète:', error);
    console.error('❌ [LEXICON PROXY] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue lors de la récupération des données LEXICON'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});