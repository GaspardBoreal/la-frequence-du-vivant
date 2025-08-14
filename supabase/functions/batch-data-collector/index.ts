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
    const { collectionTypes, mode, marchesFilter } = request;

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

    // Update log with total count
    await supabase
      .from('data_collection_logs')
      .update({ marches_total: validMarches.length })
      .eq('id', logEntry.id);

    let processedCount = 0;
    let errorsCount = 0;
    const results = {
      biodiversity: [],
      weather: [],
      real_estate: []
    };

    // Process each marche
    for (const marche of validMarches) {
      try {
        console.log(`🔄 Processing marche: ${marche.nom_marche} (${marche.ville})`);

        // Update current marche in progress
        await supabase
          .from('data_collection_logs')
          .update({ 
            marches_processed: processedCount,
            summary_stats: {
              current_marche_name: marche.nom_marche || marche.ville,
              current_marche_id: marche.id,
              current_data_type: collectionTypes.length > 1 ? 
                'Collecte multiple...' : 
                (collectionTypes[0] === 'biodiversity' ? '🌿 Biodiversité' :
                 collectionTypes[0] === 'weather' ? '🌤️ Météo' :
                 collectionTypes[0] === 'real_estate' ? '🏠 Immobilier' : 'Collecte en cours'),
              processed: processedCount,
              total_marches: validMarches.length,
              marche_start_time: new Date().toISOString()
            }
          })
          .eq('id', logEntry.id);

        // Collect biodiversity data
        if (collectionTypes.includes('biodiversity')) {
          // Update current data type
          await supabase
            .from('data_collection_logs')
            .update({ 
              summary_stats: {
                current_marche_name: marche.nom_marche || marche.ville,
                current_data_type: '🌿 Collecte biodiversité...',
                processed: processedCount,
                total_marches: validMarches.length
              }
            })
            .eq('id', logEntry.id);

          try {
            const { data: biodivData, error: biodivError } = await supabase.functions.invoke('biodiversity-data', {
              body: {
                latitude: marche.latitude,
                longitude: marche.longitude,
                radius: 500
              }
            });

            if (!biodivError && biodivData) {
              // Store biodiversity snapshot
              const snapshot = {
                marche_id: marche.id,
                latitude: marche.latitude,
                longitude: marche.longitude,
                radius_meters: 500,
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
            console.error(`❌ Biodiversity collection error for ${marche.nom_marche}:`, error);
            errorsCount++;
          }
        }

        // Collect weather data
        if (collectionTypes.includes('weather')) {
          // Update current data type
          await supabase
            .from('data_collection_logs')
            .update({ 
              summary_stats: {
                current_marche_name: marche.nom_marche || marche.ville,
                current_data_type: '🌤️ Collecte météo...',
                processed: processedCount,
                total_marches: validMarches.length
              }
            })
            .eq('id', logEntry.id);

          try {
            const { data: weatherData, error: weatherError } = await supabase.functions.invoke('open-meteo-data', {
              body: {
                latitude: marche.latitude,
                longitude: marche.longitude,
                days: 30
              }
            });

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
            console.error(`❌ Weather collection error for ${marche.nom_marche}:`, error);
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
                processed: processedCount,
                total_marches: validMarches.length
              }
            })
            .eq('id', logEntry.id);

          try {
            const { data: realEstateData, error: realEstateError } = await supabase.functions.invoke('lexicon-proxy', {
              body: {
                latitude: marche.latitude,
                longitude: marche.longitude
              }
            });

            if (!realEstateError && realEstateData) {
              // Process transactions if available
              const transactions = realEstateData.transactions || [];
              
              const snapshot = {
                marche_id: marche.id,
                latitude: marche.latitude,
                longitude: marche.longitude,
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
            console.error(`❌ Real estate collection error for ${marche.nom_marche}:`, error);
            errorsCount++;
          }
        }

        processedCount++;

        // Update progress more frequently
        await supabase
          .from('data_collection_logs')
          .update({ 
            marches_processed: processedCount,
            errors_count: errorsCount,
            summary_stats: {
              current_marche_name: processedCount < validMarches.length ? 
                `Marche ${processedCount + 1}/${validMarches.length}` : 
                'Finalisation...',
              processed: processedCount,
              total_marches: validMarches.length,
              results
            }
          })
          .eq('id', logEntry.id);

        // Rate limiting: wait 100ms between marches
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing marche ${marche.nom_marche}:`, error);
        errorsCount++;
        processedCount++;
      }
    }

    // Finalize collection log
    const completedAt = new Date();
    const durationSeconds = Math.floor((completedAt.getTime() - new Date(logEntry.started_at).getTime()) / 1000);

    await supabase
      .from('data_collection_logs')
      .update({
        status: 'completed',
        completed_at: completedAt.toISOString(),
        duration_seconds: durationSeconds,
        marches_processed: processedCount,
        errors_count: errorsCount,
        summary_stats: {
          results,
          total_marches: validMarches.length,
          processed: processedCount,
          errors: errorsCount,
          success_rate: Math.round((processedCount - errorsCount) / processedCount * 100)
        }
      })
      .eq('id', logEntry.id);

    console.log(`✅ Batch collection completed: ${processedCount} processed, ${errorsCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      logId: logEntry.id,
      summary: {
        total_marches: validMarches.length,
        processed: processedCount,
        errors: errorsCount,
        duration_seconds: durationSeconds,
        results
      }
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