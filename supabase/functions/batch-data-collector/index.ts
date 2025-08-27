import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchCollectionRequest {
  collectionTypes: ('biodiversity' | 'weather' | 'real_estate')[];
  mode: 'scheduled' | 'manual';
  marchesFilter?: {
    ids?: string[];
    region?: string;
    departement?: string;
  };
  batchMode?: boolean; // New: enable batch optimizations
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('🚀 Batch data collection initiated');

    const request: BatchCollectionRequest = await req.json();
    const { collectionTypes, mode, marchesFilter, batchMode = true } = request;
    
    if (batchMode) {
      console.log('⚡ BATCH MODE ENABLED - Using performance optimizations');
    }

    // Start logging this collection
    const { data: logEntry, error: logError } = await supabase
      .from('data_collection_logs')
      .insert({
        collection_type: collectionTypes.join(','),
        collection_mode: mode,
        status: 'running'
      })
      .select()
      .single();

    if (logError || !logEntry) {
      throw new Error(`Failed to create collection log: ${logError?.message}`);
    }

    console.log(`📝 Collection log created: ${logEntry.id}`);

    // Fetch marches to process
    let marchesQuery = supabase
      .from('marches')
      .select('id, nom_marche, latitude, longitude, ville, region, departement');

    if (marchesFilter?.ids) {
      marchesQuery = marchesQuery.in('id', marchesFilter.ids);
    }
    if (marchesFilter?.region) {
      marchesQuery = marchesQuery.eq('region', marchesFilter.region);
    }
    if (marchesFilter?.departement) {
      marchesQuery = marchesQuery.eq('departement', marchesFilter.departement);
    }

    const { data: marches, error: marchesError } = await marchesQuery;

    if (marchesError) {
      throw new Error(`Failed to fetch marches: ${marchesError.message}`);
    }

    const validMarches = marches?.filter(m => m.latitude && m.longitude) || [];
    console.log(`📍 Processing ${validMarches.length} marches with coordinates`);

    // Update log with total count and initial state
    await supabase
      .from('data_collection_logs')
      .update({ 
        marches_total: validMarches.length,
        marches_processed: 0,
        summary_stats: {
          processed: 0,
          total_marches: validMarches.length,
          current_data_type: 'Prêt à démarrer...',
          current_marche_name: 'Initialisation'
        }
      })
      .eq('id', logEntry.id);

    // 🚀 RETOUR IMMÉDIAT DU LOGID POUR POLLING TEMPS RÉEL
    console.log(`⚡ Returning logId immediately for real-time tracking: ${logEntry.id}`);
    
    // Start background collection task
    EdgeRuntime.waitUntil(
      (async () => {
        console.log(`🔄 Starting background collection for ${validMarches.length} marches`);
        
        let errorsCount = 0;
        const results = {
          biodiversity: [],
          weather: [],
          real_estate: []
        };

        // Process each marche in background
        for (let i = 0; i < validMarches.length; i++) {
          const marche = validMarches[i];
          console.log(`🔄 Processing marche: ${marche.nom_marche || marche.ville} (${marche.ville})`);

          // Update progress BEFORE processing
          await supabase
            .from('data_collection_logs')
            .update({ 
              marches_processed: i,
              summary_stats: {
                current_marche_name: marche.nom_marche || marche.ville,
                current_data_type: 'Initialisation...',
                marche_start_time: new Date().toISOString(),
                processed: i,
                total_marches: validMarches.length
              }
            })
            .eq('id', logEntry.id);

          // Collect biodiversity data via eBird API
          if (collectionTypes.includes('biodiversity')) {
            // Update current data type
            await supabase
              .from('data_collection_logs')
              .update({ 
                summary_stats: {
                  current_marche_name: marche.nom_marche || marche.ville,
                  current_data_type: '🌿 Collecte biodiversité...',
                  marche_start_time: new Date().toISOString(),
                  processed: i,
                  total_marches: validMarches.length
                }
              })
              .eq('id', logEntry.id);

            let heartbeatInterval: number | undefined;
            let timeoutId: number | undefined;
            try {
              // Configuration du rayon de recherche biodiversité
              const biodiversityRadius = 500; // Rayon par défaut selon SEARCH_RADIUS_CONFIG
              
              // Add timeout and batch mode for robustness
              const controller = new AbortController();
              const timeoutMs = 30000; // 30 second timeout
              
              // Heartbeat mechanism for long operations
              heartbeatInterval = setInterval(async () => {
                await supabase
                  .from('data_collection_logs')
                  .update({ 
                    last_ping: new Date().toISOString(),
                    summary_stats: {
                      current_marche_name: marche.nom_marche || marche.ville,
                      current_data_type: '🌿 Collecte biodiversité... (en cours)',
                      marche_start_time: new Date().toISOString(),
                      processed: i,
                      total_marches: validMarches.length
                    }
                  })
                  .eq('id', logEntry.id);
              }, 5000); // 5 second heartbeat
              
              timeoutId = setTimeout(() => {
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                controller.abort();
              }, timeoutMs);
              
              const { data: biodivData, error: biodivError } = await supabase.functions.invoke('biodiversity-data', {
                body: {
                  latitude: marche.latitude,
                  longitude: marche.longitude,
                  radius: biodiversityRadius,
                  mode: batchMode ? 'batch' : 'interactive' // Use batch mode for performance
                }
              });
              
              if (timeoutId) clearTimeout(timeoutId);
              if (heartbeatInterval) clearInterval(heartbeatInterval);

              if (!biodivError && biodivData) {
                // Store biodiversity snapshot
                const snapshot = {
                  marche_id: marche.id,
                  latitude: marche.latitude,
                  longitude: marche.longitude,
                  radius_meters: biodiversityRadius,
                  total_species: biodivData.summary?.totalSpecies || 0,
                  birds_count: biodivData.summary?.birds || 0,
                  plants_count: biodivData.summary?.plants || 0,
                  fungi_count: biodivData.summary?.fungi || 0,
                  others_count: biodivData.summary?.others || 0,
                  recent_observations: biodivData.summary?.recentObservations || 0,
                  species_data: biodivData.species,
                  sources_data: biodivData.hotspots,
                  methodology: biodivData.methodology
                };

                const { error: insertError } = await supabase
                  .from('biodiversity_snapshots')
                  .insert(snapshot);

                if (insertError) {
                  console.error(`❌ Biodiversity insert error for ${marche.nom_marche}:`, insertError);
                  errorsCount++;
                } else {
                  results.biodiversity.push({ marche_id: marche.id, success: true });
                }
              }
            } catch (error) {
              if (heartbeatInterval) clearInterval(heartbeatInterval); // Clear heartbeat on error
              if (timeoutId) clearTimeout(timeoutId);
              
              if ((error as any).name === 'AbortError') {
                console.error(`⏱️ Biodiversity collection timeout for ${marche.nom_marche}`);
              } else {
                console.error(`❌ Biodiversity collection error for ${marche.nom_marche}:`, error);
              }
              errorsCount++;
            }
          }

          // Collect weather data via Open-Meteo
          if (collectionTypes.includes('weather')) {
            // Update current data type
            await supabase
              .from('data_collection_logs')
              .update({ 
                summary_stats: {
                  current_marche_name: marche.nom_marche || marche.ville,
                  current_data_type: '🌤️ Collecte météo...',
                  marche_start_time: new Date().toISOString(),
                  processed: i,
                  total_marches: validMarches.length
                }
              })
              .eq('id', logEntry.id);

            let heartbeatIntervalW: number | undefined;
            let timeoutIdW: number | undefined;
            try {
              // Add timeout for weather collection too
              const controller = new AbortController();
              const timeoutMs = 12000; // 12 second timeout (matching open-meteo-data)
              
              // Heartbeat for weather collection
              heartbeatIntervalW = setInterval(async () => {
                await supabase
                  .from('data_collection_logs')
                  .update({ 
                    last_ping: new Date().toISOString(),
                    summary_stats: {
                      current_marche_name: marche.nom_marche || marche.ville,
                      current_data_type: '🌤️ Collecte météo... (en cours)',
                      marche_start_time: new Date().toISOString(),
                      processed: i,
                      total_marches: validMarches.length
                    }
                  })
                  .eq('id', logEntry.id);
              }, 5000); // 5 second heartbeat
              
              timeoutIdW = setTimeout(() => {
                if (heartbeatIntervalW) clearInterval(heartbeatIntervalW);
                controller.abort();
              }, timeoutMs);
              
              const { data: weatherData, error: weatherError } = await supabase.functions.invoke('open-meteo-data', {
                body: {
                  latitude: marche.latitude,
                  longitude: marche.longitude,
                  days: 30
                }
              });
              
              if (timeoutIdW) clearTimeout(timeoutIdW);
              if (heartbeatIntervalW) clearInterval(heartbeatIntervalW);

              if (!weatherError && weatherData?.success && weatherData.data) {
                const aggregated = weatherData.data.aggregated;
                
                const snapshot = {
                  marche_id: marche.id,
                  latitude: marche.latitude,
                  longitude: marche.longitude,
                  temperature_avg: aggregated.temperature?.avg,
                  temperature_min: aggregated.temperature?.min,
                  temperature_max: aggregated.temperature?.max,
                  humidity_avg: aggregated.humidity?.avg,
                  humidity_min: aggregated.humidity?.min,
                  humidity_max: aggregated.humidity?.max,
                  precipitation_total: aggregated.precipitation?.total,
                  precipitation_days: aggregated.precipitation?.days,
                  wind_speed_avg: aggregated.wind?.avg,
                  sunshine_hours: aggregated.sunshine?.total,
                  raw_data: weatherData.data
                };

                const { error: insertError } = await supabase
                  .from('weather_snapshots')
                  .insert(snapshot);

                if (insertError) {
                  console.error(`❌ Weather insert error for ${marche.nom_marche}:`, insertError);
                  errorsCount++;
                } else {
                  results.weather.push({ marche_id: marche.id, success: true });
                }
              }
            } catch (error) {
              if (heartbeatIntervalW) clearInterval(heartbeatIntervalW); // Clear heartbeat on error
              if (timeoutIdW) clearTimeout(timeoutIdW);
              
              if ((error as any).name === 'AbortError') {
                console.error(`⏱️ Weather collection timeout for ${marche.nom_marche}`);
              } else {
                console.error(`❌ Weather collection error for ${marche.nom_marche}:`, error);
              }
              errorsCount++;
            }
          }

          // Collect real estate data via LEXICON
          if (collectionTypes.includes('real_estate')) {
            // Update current data type
            await supabase
              .from('data_collection_logs')
              .update({ 
                summary_stats: {
                  current_marche_name: marche.nom_marche || marche.ville,
                  current_data_type: '🏠 Collecte immobilier...',
                  marche_start_time: new Date().toISOString(),
                  processed: i,
                  total_marches: validMarches.length
                }
              })
              .eq('id', logEntry.id);

            let heartbeatIntervalR: number | undefined;
            let timeoutIdR: number | undefined;
            try {
              // Add timeout for real estate collection too
              const controller = new AbortController();
              const timeoutMs = 8000; // 8 second timeout
              
              // Heartbeat for real estate collection
              heartbeatIntervalR = setInterval(async () => {
                await supabase
                  .from('data_collection_logs')
                  .update({ 
                    last_ping: new Date().toISOString(),
                    summary_stats: {
                      current_marche_name: marche.nom_marche || marche.ville,
                      current_data_type: '🏠 Collecte immobilier... (en cours)',
                      marche_start_time: new Date().toISOString(),
                      processed: i,
                      total_marches: validMarches.length
                    }
                  })
                  .eq('id', logEntry.id);
              }, 5000); // 5 second heartbeat
              
              timeoutIdR = setTimeout(() => {
                if (heartbeatIntervalR) clearInterval(heartbeatIntervalR);
                controller.abort();
              }, timeoutMs);
              
              const { data: realEstateData, error: realEstateError } = await supabase.functions.invoke('lexicon-proxy', {
                body: {
                  latitude: marche.latitude,
                  longitude: marche.longitude
                }
              });
              
              if (timeoutIdR) clearTimeout(timeoutIdR);
              if (heartbeatIntervalR) clearInterval(heartbeatIntervalR);

              if (!realEstateError && realEstateData) {
                // Process transactions if available
                const transactions = realEstateData.transactions || [];
                
                // Note: LEXICON utilise des données ponctuelles (pas de rayon)
                // Le radius_meters est conservé pour compatibilité historique uniquement
                const snapshot: any = {
                  marche_id: marche.id,
                  latitude: marche.latitude,
                  longitude: marche.longitude,
                  radius_meters: 0, // Point-based, pas de rayon réel
                  transactions_count: transactions.length,
                  transactions_data: transactions.length > 0 ? transactions : null,
                  raw_data: realEstateData
                };

                // Calculate price metrics if transactions exist
                if (transactions.length > 0) {
                  const prices = transactions
                    .map((t: any) => t.prix_m2 || t.price_per_m2)
                    .filter((p: number) => p && p > 0);
                  
                  if (prices.length > 0) {
                    snapshot.avg_price_m2 = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
                    const sortedPrices = prices.sort((a: number, b: number) => a - b);
                    snapshot.median_price_m2 = sortedPrices[Math.floor(sortedPrices.length / 2)];
                  }
                }

                const { error: insertError } = await supabase
                  .from('real_estate_snapshots')
                  .insert(snapshot);

                if (insertError) {
                  console.error(`❌ Real estate insert error for ${marche.nom_marche}:`, insertError);
                  errorsCount++;
                } else {
                  results.real_estate.push({ marche_id: marche.id, success: true });
                }
              }
            } catch (error) {
              if (heartbeatIntervalR) clearInterval(heartbeatIntervalR); // Clear heartbeat on error
              if (timeoutIdR) clearTimeout(timeoutIdR);
              
              if ((error as any).name === 'AbortError') {
                console.error(`⏱️ Real estate collection timeout for ${marche.nom_marche}`);
              } else {
                console.error(`❌ Real estate collection error for ${marche.nom_marche}:`, error);
              }
              errorsCount++;
            }
          }

          // Update final progress for this marche
          await supabase
            .from('data_collection_logs')
            .update({ 
              marches_processed: i + 1,
              summary_stats: {
                current_marche_name: marche.nom_marche || marche.ville,
                current_data_type: 'Marché terminé ✅',
                marche_start_time: new Date().toISOString(),
                processed: i + 1,
                total_marches: validMarches.length
              }
            })
            .eq('id', logEntry.id);

          // Rate limiting - wait 500ms between marches for performance
          if (i < validMarches.length - 1) {
            console.log(`⏳ Délai de 500ms avant prochain marché (${i + 2}/${validMarches.length})`);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Update ping and next marche info
            await supabase
              .from('data_collection_logs')
              .update({ 
                last_ping: new Date().toISOString(),
                summary_stats: {
                  current_marche_name: `Préparation marché ${i + 2}/${validMarches.length}`,
                  current_data_type: 'En attente...',
                  processed: i + 1,
                  total_marches: validMarches.length,
                  next_marche: validMarches[i + 1]?.nom_marche || validMarches[i + 1]?.ville
                }
              })
              .eq('id', logEntry.id);
          }
        }

        // Finalize collection log in background
        const completedAt = new Date();
        const durationSeconds = Math.floor((completedAt.getTime() - new Date(logEntry.started_at).getTime()) / 1000);

        await supabase
          .from('data_collection_logs')
          .update({
            status: 'completed',
            completed_at: completedAt.toISOString(),
            duration_seconds: durationSeconds,
            marches_processed: validMarches.length,
            errors_count: errorsCount,
            summary_stats: {
              results,
              total_marches: validMarches.length,
              processed: validMarches.length,
              errors: errorsCount,
              success_rate: Math.round((validMarches.length - errorsCount) / validMarches.length * 100),
              current_data_type: 'Collection terminée ✅',
              current_marche_name: 'Tous les marchés traités'
            }
          })
          .eq('id', logEntry.id);

        console.log(`✅ Background collection completed: ${validMarches.length} processed, ${errorsCount} errors`);
      })()
    );

    // Return response immediately with logId for real-time tracking
    return new Response(JSON.stringify({
      success: true,
      logId: logEntry.id,
      message: 'Collection started in background',
      total_marches: validMarches.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in batch-data-collector:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});