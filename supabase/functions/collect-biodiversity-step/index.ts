import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateAuth, corsHeaders, forbiddenResponse, createServiceClient } from "../_shared/auth-helper.ts"

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin authentication for biodiversity data collection
    const { user, isAdmin, errorResponse } = await validateAuth(req);
    
    if (errorResponse) {
      return errorResponse;
    }
    
    if (!isAdmin) {
      return forbiddenResponse('Admin access required for biodiversity data collection');
    }

    // Use service role client for database operations
    const supabase = createServiceClient()

    const { logId, marcheId, latitude, longitude, marcheName } = await req.json()
    
    console.log(`🔄 Processing biodiversity for marche: ${marcheName} (${marcheId})`)

    // Update log with current marche
    await supabase
      .from('data_collection_logs')
      .update({
        last_ping: new Date().toISOString(),
        summary_stats: {
          current_marche_name: marcheName,
          current_data_type: 'biodiversity'
        }
      })
      .eq('id', logId)

    // Call biodiversity data function with retries
    let biodiversityData = null
    let attempt = 0
    const maxAttempts = 3
    
    while (attempt < maxAttempts && !biodiversityData) {
      attempt++
      console.log(`📡 Calling biodiversity-data function (attempt ${attempt})`)
      
      try {
        const { data, error } = await supabase.functions.invoke('biodiversity-data', {
          body: { 
            latitude: parseFloat(latitude), 
            longitude: parseFloat(longitude),
            radius: 500
          }
        })

        if (error) {
          console.error(`❌ Biodiversity API error (attempt ${attempt}):`, error)
          if (attempt === maxAttempts) throw error
          // Exponential backoff: 400ms, 800ms
          await new Promise(resolve => setTimeout(resolve, 400 * attempt))
          continue
        }

        biodiversityData = data
        console.log(`✅ Biodiversity data received: ${data?.species?.length || 0} species`)
        break
        
      } catch (err) {
        console.error(`❌ Biodiversity function call failed (attempt ${attempt}):`, err)
        if (attempt === maxAttempts) throw err
        await new Promise(resolve => setTimeout(resolve, 400 * attempt))
      }
    }

    if (!biodiversityData) {
      throw new Error('Failed to get biodiversity data after all retries')
    }

    // Process and save biodiversity snapshot
    const speciesData = biodiversityData.species || []
    const summary = biodiversityData.summary || {}
    
    // Calculate metrics
    const totalSpecies = summary.totalSpecies || speciesData.length || 0
    const birdsCount = summary.birds || speciesData.filter(s => s.kingdom === 'Animalia' && (s.family || '').toLowerCase().includes('bird')).length || 0
    const plantsCount = summary.plants || speciesData.filter(s => s.kingdom === 'Plantae').length || 0
    const fungiCount = summary.fungi || speciesData.filter(s => s.kingdom === 'Fungi').length || 0
    const othersCount = totalSpecies - birdsCount - plantsCount - fungiCount

    const snapshotData = {
      marche_id: marcheId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius_meters: 500,
      total_species: totalSpecies,
      birds_count: birdsCount,
      plants_count: plantsCount,
      fungi_count: fungiCount,
      others_count: othersCount,
      recent_observations: summary.recentObservations || 0,
      species_data: speciesData,
      sources_data: biodiversityData.methodology || {},
      methodology: biodiversityData.methodology || {},
      snapshot_date: new Date().toISOString().split('T')[0]
    }

    const { error: insertError } = await supabase
      .from('biodiversity_snapshots')
      .insert(snapshotData)

    if (insertError) {
      console.error('❌ Failed to insert biodiversity snapshot:', insertError)
      throw insertError
    }

    // Update collection log progress
    const { data: currentLog } = await supabase
      .from('data_collection_logs')
      .select('marches_processed, marches_total, summary_stats, errors_count')
      .eq('id', logId)
      .single()

    if (currentLog) {
      const newProcessed = (currentLog.marches_processed || 0) + 1
      const updatedStats = {
        ...(currentLog.summary_stats || {}),
        processed_ids: [...((currentLog.summary_stats?.processed_ids) || []), marcheId],
        current_marche_name: marcheName,
        current_data_type: 'biodiversity'
      }

      await supabase
        .from('data_collection_logs')
        .update({
          marches_processed: newProcessed,
          last_ping: new Date().toISOString(),
          summary_stats: updatedStats
        })
        .eq('id', logId)

      console.log(`📊 Progress: ${newProcessed}/${currentLog.marches_total} marches processed`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Biodiversity step collection failed:', error)

    // Update error count in log
    const requestBody = await req.clone().json().catch(() => ({}));
    const logId = requestBody.logId;
    
    if (logId) {
      try {
        const supabaseService = createServiceClient()

        const { data: currentLog } = await supabaseService
          .from('data_collection_logs')
          .select('errors_count')
          .eq('id', logId)
          .single()

        if (currentLog) {
          await supabaseService
            .from('data_collection_logs')
            .update({
              errors_count: (currentLog.errors_count || 0) + 1,
              last_ping: new Date().toISOString()
            })
            .eq('id', logId)
        }
      } catch (logError) {
        console.error('Failed to update error count:', logError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})