import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { marcheId, latitude, longitude, speciesData, summary, methodology } = body;

    if (!marcheId || !latitude || !longitude || !speciesData || !summary) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for the upsert
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify marche exists
    const { data: marche, error: marcheError } = await serviceClient
      .from('marches')
      .select('id')
      .eq('id', marcheId)
      .single();

    if (marcheError || !marche) {
      return new Response(JSON.stringify({ error: 'Marche not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // ── Archivage + garde-fou anti-régression ──────────────────────
    const { data: prevSnap } = await serviceClient
      .from('biodiversity_snapshots')
      .select('*')
      .eq('marche_id', marcheId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const normName = (s: any) =>
      (s?.scientificName || s?.scientific_name || '').toString().trim().toLowerCase();
    const prevSpeciesArr: any[] = Array.isArray(prevSnap?.species_data) ? prevSnap!.species_data as any[] : [];
    const prevSet = new Set(prevSpeciesArr.map(normName).filter(Boolean));
    const newSet = new Set((speciesData as any[]).map(normName).filter(Boolean));
    const added = [...newSet].filter(x => !prevSet.has(x));
    const removed = [...prevSet].filter(x => !newSet.has(x));
    const newTotal = summary.totalSpecies || 0;
    const prevTotal = prevSnap?.total_species ?? prevSet.size;
    const regressionPct = prevTotal > 0 ? Math.max(0, (prevTotal - newTotal) / prevTotal) : 0;
    const shouldQuarantine = !!prevSnap && regressionPct > 0.15;

    // Insert new snapshot
    const { data: inserted, error: insertError } = await serviceClient
      .from('biodiversity_snapshots')
      .insert({
        marche_id: marcheId,
        latitude,
        longitude,
        snapshot_date: today,
        radius_meters: 500,
        total_species: newTotal,
        birds_count: summary.birds || 0,
        plants_count: summary.plants || 0,
        fungi_count: summary.fungi || 0,
        others_count: summary.others || 0,
        recent_observations: summary.recentObservations || 0,
        species_data: speciesData,
        methodology: methodology || null,
        biodiversity_index: newTotal > 0 ? Math.min(newTotal / 50, 1) : null,
        species_richness: newTotal,
        status: shouldQuarantine ? 'quarantine' : 'active',
        regression_pct: regressionPct,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[sync-biodiversity-snapshot] Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to sync snapshot', detail: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Archive previous snapshot in history (always — never delete)
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
        replaced_by_snapshot_id: inserted?.id ?? null,
        delta_species: {
          added,
          removed,
          added_count: added.length,
          removed_count: removed.length,
          prev_total: prevTotal,
          new_total: newTotal,
          regression_pct: regressionPct,
        },
        archive_reason: shouldQuarantine
          ? `quarantine: regression ${Math.round(regressionPct * 100)}% (kept previous active)`
          : 'replaced',
      });

      // If quarantine: keep previous active, mark new one as quarantine (done above).
      // Otherwise: demote previous to 'replaced' (never DELETE).
      if (!shouldQuarantine) {
        await serviceClient
          .from('biodiversity_snapshots')
          .update({ status: 'replaced' })
          .eq('id', prevSnap.id);
      }
    }

    console.log(`[sync-biodiversity-snapshot] ✅ marche ${marcheId}: ${newTotal} species, +${added.length}/-${removed.length}${shouldQuarantine ? ' (QUARANTINE)' : ''}`);

    return new Response(JSON.stringify({ 
      success: true, 
      snapshot_date: today,
      total_species: summary.totalSpecies 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[sync-biodiversity-snapshot] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
