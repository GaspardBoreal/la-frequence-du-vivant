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
    console.log('🔍 [CADASTRE PROXY] Nouvelle requête reçue');
    console.log('🔍 [CADASTRE PROXY] Méthode:', req.method);
    console.log('🔍 [CADASTRE PROXY] URL:', req.url);
    
    let parcelId: string | null = null;
    
    // Récupérer parcelId depuis les paramètres URL ou le body
    if (req.method === 'GET') {
      const url = new URL(req.url);
      parcelId = url.searchParams.get('parcelId');
      console.log('🔍 [CADASTRE PROXY] GET parcelId:', parcelId);
    } else if (req.method === 'POST') {
      try {
        const contentType = req.headers.get('content-type') || '';
        console.log('🔍 [CADASTRE PROXY] Content-Type reçu:', contentType);
        
        // Lire le body comme texte d'abord
        const bodyText = await req.text();
        console.log('🔍 [CADASTRE PROXY] Body brut reçu:', bodyText);
        console.log('🔍 [CADASTRE PROXY] Longueur du body:', bodyText?.length || 0);
        
        if (bodyText && bodyText.trim() !== '') {
          try {
            const parsedBody = JSON.parse(bodyText);
            console.log('🔍 [CADASTRE PROXY] Body parsé avec succès:', parsedBody);
            parcelId = parsedBody.parcelId;
            console.log('🔍 [CADASTRE PROXY] ParcelId extrait:', parcelId);
          } catch (parseError) {
            console.error('❌ [CADASTRE PROXY] Erreur parsing JSON:', parseError);
            console.log('🔍 [CADASTRE PROXY] Body qui a causé l\'erreur:', bodyText);
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: 'Erreur de parsing JSON: ' + parseError.message,
                receivedBody: bodyText,
                contentType: contentType
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        } else {
          console.warn('⚠️ [CADASTRE PROXY] Body vide ou null');
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Body de requête vide',
              contentType: contentType
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } catch (error) {
        console.error('❌ [CADASTRE PROXY] Erreur lecture body:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Erreur lecture du body: ' + error.message 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
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
    
    // URLs à tester dans l'ordre de priorité
    const urlsToTry = [
      `https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/communes/${codeCommune}/cadastre-${codeCommune}-parcelles.json`,
      `https://cadastre.data.gouv.fr/bundler/cadastre-etalab/latest/geojson/communes/${codeCommune}/cadastre-${codeCommune}-parcelles.json`,
      `https://opendatasoft.github.io/cadastre-france/data/geojson/communes/${codeCommune}/cadastre-${codeCommune}-parcelles.json`
    ];

    let geoJsonData = null;
    let workingUrl = null;

    // Tester chaque URL jusqu'à en trouver une qui fonctionne
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

        console.log(`🔍 [CADASTRE PROXY] Statut réponse pour ${testUrl}: ${response.status}`);

        if (response.ok) {
          geoJsonData = await response.json();
          workingUrl = testUrl;
          console.log(`✅ [CADASTRE PROXY] URL fonctionnelle: ${testUrl}`);
          console.log(`📦 [CADASTRE PROXY] ${geoJsonData.features?.length || 0} parcelles trouvées`);
          break;
        } else {
          console.warn(`⚠️ [CADASTRE PROXY] ${testUrl} retourne: ${response.status}`);
        }
      } catch (error) {
        console.warn(`⚠️ [CADASTRE PROXY] Erreur avec ${testUrl}:`, error.message);
      }
    }

    if (!geoJsonData || !geoJsonData.features) {
      console.error(`❌ [CADASTRE PROXY] Aucune URL cadastrale fonctionnelle pour la commune ${codeCommune}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Aucune données cadastrales disponibles pour la commune ${codeCommune}`,
          parcelId,
          codeCommune
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Chercher la parcelle avec l'ID correspondant
    const parcel = geoJsonData.features.find((feature: any) => 
      feature.properties?.id === parcelId
    );

    if (parcel) {
      console.log(`✅ [CADASTRE PROXY] Parcelle ${parcelId} trouvée`);
      console.log(`🔍 [CADASTRE PROXY] Propriétés de la parcelle:`, parcel.properties);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            geometry: parcel.geometry,
            properties: parcel.properties
          },
          parcelId,
          sourceUrl: workingUrl,
          codeCommune
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.warn(`❌ [CADASTRE PROXY] Parcelle ${parcelId} non trouvée`);
      const availableParcels = geoJsonData.features?.slice(0, 5).map((f: any) => f.properties?.id) || [];
      console.log('🔍 [CADASTRE PROXY] Quelques IDs disponibles:', availableParcels);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: `Parcelle ${parcelId} non trouvée dans les données`,
          availableParcels,
          parcelId,
          codeCommune,
          totalParcels: geoJsonData.features?.length || 0
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
        message: 'Erreur interne du serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'),
        error: error instanceof Error ? error.stack : String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});