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

    const { explorationId, force, marcheIds: requestedMarcheIds } = await req.json();
    if (!explorationId) {
      return new Response(JSON.stringify({ error: 'explorationId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🌿 [collect-event-biodiversity] Starting for exploration: ${explorationId} (force=${!!force}, subset=${Array.isArray(requestedMarcheIds) ? requestedMarcheIds.length : 'all'})`);

    // Rate limiting: check if snapshots exist for this exploration < 24h
    const { data: explorationRow } = await serviceClient
      .from('explorations')
      .select('default_radius_m')
      .eq('id', explorationId)
      .maybeSingle();
    const explorationDefaultRadiusM: number | null =
      (explorationRow as any)?.default_radius_m ?? null;

    let explorationMarchesQuery = serviceClient
      .from('exploration_marches')
      .select('marche_id, ordre, marches (id, nom_marche, ville, latitude, longitude, radius_m)')
      .eq('exploration_id', explorationId)
      .in('publication_status', ['published', 'published_public'])
      .order('ordre');

    if (Array.isArray(requestedMarcheIds) && requestedMarcheIds.length > 0) {
      explorationMarchesQuery = explorationMarchesQuery.in('marche_id', requestedMarcheIds);
    }

    const { data: explorationMarches } = await explorationMarchesQuery;

    if (!explorationMarches?.length) {
      return new Response(JSON.stringify({ error: 'No marches found for this exploration' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const marcheIds = explorationMarches.map((em: any) => em.marche_id);

    // Check rate limiting: any snapshot < 24h for these marches?
    // Bypassed when `force=true` (e.g. user changed a radius and wants immediate recompute).
    const recentMarcheIds = new Set<string>();
    if (!force) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentSnapshots } = await serviceClient
        .from('biodiversity_snapshots')
        .select('id, marche_id')
        .in('marche_id', marcheIds)
        .gte('created_at', twentyFourHoursAgo);
      (recentSnapshots || []).forEach((s: any) => recentMarcheIds.add(s.marche_id));
    }

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

      // Résolution du rayon : override marche → défaut exploration → 500 m
      const radiusM: number =
        (marche as any)?.radius_m ?? explorationDefaultRadiusM ?? 500;
      const radiusKm = radiusM / 1000;

      try {
        // Call biodiversity-data with retries
        let biodiversityData = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const { data, error } = await serviceClient.functions.invoke('biodiversity-data', {
              body: {
                latitude: parseFloat(String(marche.latitude)),
                longitude: parseFloat(String(marche.longitude)),
                radius: radiusKm,
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

        // ── Archivage + garde-fou anti-régression ──────────────────────
        const { data: prevSnap } = await serviceClient
          .from('biodiversity_snapshots')
          .select('*')
          .eq('marche_id', em.marche_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const normName = (s: any) =>
          (s?.scientificName || s?.scientific_name || '').toString().trim().toLowerCase();
        const prevArr: any[] = Array.isArray(prevSnap?.species_data) ? prevSnap!.species_data as any[] : [];
        const prevSet = new Set(prevArr.map(normName).filter(Boolean));
        const newSet = new Set((speciesData as any[]).map(normName).filter(Boolean));
        const added = [...newSet].filter(x => !prevSet.has(x));
        const removed = [...prevSet].filter(x => !newSet.has(x));
        const prevTotal = prevSnap?.total_species ?? prevSet.size;
        const regressionPct = prevTotal > 0 ? Math.max(0, (prevTotal - totalSpecies) / prevTotal) : 0;
        const shouldQuarantine = !!prevSnap && regressionPct > 0.15;

        const delta = {
          added,
          removed,
          added_count: added.length,
          removed_count: removed.length,
          prev_total: prevTotal,
          new_total: totalSpecies,
          regression_pct: regressionPct,
        };

        if (shouldQuarantine) {
          // On n'écrase pas : on archive le rejet et on garde l'ancien snapshot actif
          await serviceClient.from('biodiversity_snapshots_history').insert({
            original_snapshot_id: null,
            marche_id: em.marche_id,
            latitude: parseFloat(String(marche.latitude)),
            longitude: parseFloat(String(marche.longitude)),
            snapshot_date: new Date().toISOString().split('T')[0],
            radius_meters: radiusM,
            total_species: totalSpecies,
            birds_count: birdsCount,
            plants_count: plantsCount,
            fungi_count: fungiCount,
            others_count: othersCount,
            recent_observations: summary.recentObservations || 0,
            species_data: speciesData,
            methodology: biodiversityData.methodology || {},
            original_created_at: new Date().toISOString(),
            delta_species: delta,
            archive_reason: `quarantine-rejected: regression ${Math.round(regressionPct * 100)}% (kept previous active)`,
          });
          console.warn(`⚠️  ${marcheName}: QUARANTINE (${prevTotal}→${totalSpecies}, -${Math.round(regressionPct*100)}%) — previous kept`);
          totalProcessed++;
          continue;
        }

        // Cas normal : archiver l'ancien puis le supprimer
        if (prevSnap) {
          await serviceClient.from('biodiversity_snapshots_history').insert({
            original_snapshot_id: prevSnap.id,
            marche_id: prevSnap.marche_id,
            latitude: prevSnap.latitude,
            longitude: prevSnap.longitude,
            snapshot_date: prevSnap.snapshot_date,
            radius_meters: prevSnap.radius_meters,
            total_species: prevSnap.total_species,
            birds_count: prevSnap.birds_count,
            plants_count: prevSnap.plants_count,
            fungi_count: prevSnap.fungi_count,
            others_count: prevSnap.others_count,
            recent_observations: prevSnap.recent_observations,
            species_data: prevSnap.species_data,
            sources_data: prevSnap.sources_data,
            methodology: prevSnap.methodology,
            biodiversity_index: prevSnap.biodiversity_index,
            species_richness: prevSnap.species_richness,
            original_created_at: prevSnap.created_at,
            delta_species: delta,
            archive_reason: 'replaced',
          });
          await serviceClient
            .from('biodiversity_snapshots')
            .delete()
            .eq('id', prevSnap.id);
        }

        const { error: insertError } = await serviceClient
          .from('biodiversity_snapshots')
          .insert({
            marche_id: em.marche_id,
            latitude: parseFloat(String(marche.latitude)),
            longitude: parseFloat(String(marche.longitude)),
            radius_meters: radiusM,
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
          console.log(`✅ ${marcheName}: ${totalSpecies} species (+${added.length}/-${removed.length})`);
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
