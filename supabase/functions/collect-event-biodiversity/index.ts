import { validateAuth, corsHeaders, forbiddenResponse, createServiceClient } from "../_shared/auth-helper.ts"

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const serviceClient = createServiceClient();

    // Check community role (ambassadeur/sentinelle) or admin
    let hasAccess = isAdmin;
    if (!hasAccess) {
      const { data: profile } = await serviceClient
        .from('community_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const allowedRoles = ['ambassadeur', 'sentinelle'];
      hasAccess = !!profile && allowedRoles.includes(profile.role);
    }

    if (!hasAccess) {
      return forbiddenResponse('Accès réservé aux Ambassadeurs et Sentinelles');
    }

    const { explorationId } = await req.json();
    if (!explorationId) {
      return new Response(JSON.stringify({ error: 'explorationId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🌿 [collect-event-biodiversity] Starting for exploration: ${explorationId}`);

    // Rate limiting: check if snapshots exist for this exploration < 24h
    const { data: explorationMarches } = await serviceClient
      .from('exploration_marches')
      .select('marche_id, ordre, marches (id, nom_marche, ville, latitude, longitude)')
      .eq('exploration_id', explorationId)
      .in('publication_status', ['published', 'published_public'])
      .order('ordre');

    if (!explorationMarches?.length) {
      return new Response(JSON.stringify({ error: 'No marches found for this exploration' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const marcheIds = explorationMarches.map((em: any) => em.marche_id);

    // Check rate limiting: any snapshot < 24h for these marches?
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentSnapshots } = await serviceClient
      .from('biodiversity_snapshots')
      .select('id, marche_id')
      .in('marche_id', marcheIds)
      .gte('created_at', twentyFourHoursAgo);

    const recentMarcheIds = new Set((recentSnapshots || []).map((s: any) => s.marche_id));
    const marchesToProcess = explorationMarches.filter(
      (em: any) => !recentMarcheIds.has(em.marche_id) && em.marches?.latitude && em.marches?.longitude
    );

    if (marchesToProcess.length === 0) {
      // All marches already have recent snapshots
      return new Response(JSON.stringify({
        success: true,
        marchesProcessed: 0,
        totalSpecies: 0,
        message: 'Toutes les étapes ont déjà été analysées récemment',
        alreadyCollected: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a collection log for progress tracking
    const { data: logEntry } = await serviceClient
      .from('data_collection_logs')
      .insert({
        collection_type: 'biodiversity',
        collection_mode: 'community',
        status: 'running',
        marches_total: marchesToProcess.length,
        marches_processed: 0,
        started_at: new Date().toISOString(),
        summary_stats: { exploration_id: explorationId, triggered_by: user.id }
      })
      .select('id')
      .single();

    const logId = logEntry?.id;
    let totalProcessed = 0;
    let totalErrors = 0;
    let totalSpeciesCollected = 0;

    // Process each marche sequentially
    for (const em of marchesToProcess) {
      const marche = (em as any).marches;
      if (!marche?.latitude || !marche?.longitude) continue;

      const marcheName = marche.nom_marche || marche.ville || 'Étape';
      console.log(`📡 Processing: ${marcheName} (${totalProcessed + 1}/${marchesToProcess.length})`);

      // Update progress in log
      if (logId) {
        await serviceClient
          .from('data_collection_logs')
          .update({
            marches_processed: totalProcessed,
            last_ping: new Date().toISOString(),
            summary_stats: {
              exploration_id: explorationId,
              triggered_by: user.id,
              current_marche_name: marcheName,
              current_step: totalProcessed + 1,
              total_steps: marchesToProcess.length,
            }
          })
          .eq('id', logId);
      }

      try {
        // Call biodiversity-data with retries
        let biodiversityData = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const { data, error } = await serviceClient.functions.invoke('biodiversity-data', {
              body: {
                latitude: parseFloat(String(marche.latitude)),
                longitude: parseFloat(String(marche.longitude)),
                radius: 0.5,
                mode: 'batch',
              }
            });
            if (error) throw error;
            biodiversityData = data;
            break;
          } catch (err) {
            console.error(`❌ Attempt ${attempt} failed for ${marcheName}:`, err);
            if (attempt < 3) await new Promise(r => setTimeout(r, 400 * attempt));
          }
        }

        if (!biodiversityData) {
          totalErrors++;
          continue;
        }

        const speciesData = biodiversityData.species || [];
        const summary = biodiversityData.summary || {};
        const totalSpecies = summary.totalSpecies || speciesData.length || 0;
        const birdsCount = summary.birds || speciesData.filter((s: any) => s.kingdom === 'Animalia').length || 0;
        const plantsCount = summary.plants || speciesData.filter((s: any) => s.kingdom === 'Plantae').length || 0;
        const fungiCount = summary.fungi || speciesData.filter((s: any) => s.kingdom === 'Fungi').length || 0;
        const othersCount = totalSpecies - birdsCount - plantsCount - fungiCount;

        const { error: insertError } = await serviceClient
          .from('biodiversity_snapshots')
          .insert({
            marche_id: em.marche_id,
            latitude: parseFloat(String(marche.latitude)),
            longitude: parseFloat(String(marche.longitude)),
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
            snapshot_date: new Date().toISOString().split('T')[0],
          });

        if (insertError) {
          console.error(`❌ Insert failed for ${marcheName}:`, insertError);
          totalErrors++;
        } else {
          totalProcessed++;
          totalSpeciesCollected += totalSpecies;
          console.log(`✅ ${marcheName}: ${totalSpecies} species`);
        }
      } catch (err) {
        console.error(`❌ Error processing ${marcheName}:`, err);
        totalErrors++;
      }
    }

    // Finalize log
    if (logId) {
      await serviceClient
        .from('data_collection_logs')
        .update({
          status: 'completed',
          marches_processed: totalProcessed,
          errors_count: totalErrors,
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round((Date.now() - new Date(logEntry!.created_at || Date.now()).getTime()) / 1000),
          summary_stats: {
            exploration_id: explorationId,
            triggered_by: user.id,
            total_species_collected: totalSpeciesCollected,
          }
        })
        .eq('id', logId);
    }

    console.log(`🌿 Done: ${totalProcessed} marches, ${totalSpeciesCollected} species, ${totalErrors} errors`);

    return new Response(JSON.stringify({
      success: true,
      marchesProcessed: totalProcessed,
      totalSpecies: totalSpeciesCollected,
      errors: totalErrors,
      logId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ collect-event-biodiversity failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
