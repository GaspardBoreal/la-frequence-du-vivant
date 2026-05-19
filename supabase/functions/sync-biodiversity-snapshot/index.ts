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

    const delta = {
      added,
      removed,
      added_count: added.length,
      removed_count: removed.length,
      prev_total: prevTotal,
      new_total: newTotal,
      regression_pct: regressionPct,
    };

    // QUARANTINE : on n'écrase pas, on archive le rejet
    if (shouldQuarantine) {
      await serviceClient.from('biodiversity_snapshots_history').insert({
        original_snapshot_id: null,
        marche_id: marcheId,
        latitude,
        longitude,
        snapshot_date: today,
        radius_meters: 500,
        total_species: newTotal,
        species_data: speciesData,
        methodology: methodology || null,
        original_created_at: new Date().toISOString(),
        replaced_by_snapshot_id: null,
        delta_species: delta,
        archive_reason: `quarantine-rejected: regression ${Math.round(regressionPct * 100)}% (kept previous active)`,
      });
      console.warn(`[sync-biodiversity-snapshot] ⚠️ quarantine ${marcheId} (${prevTotal}→${newTotal}, -${Math.round(regressionPct*100)}%) — previous kept`);
      return new Response(JSON.stringify({
        success: true,
        snapshot_date: prevSnap?.snapshot_date ?? today,
        total_species: prevTotal,
        quarantined: true,
        regression_pct: regressionPct,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // CAS NORMAL : archiver l'ancien puis le supprimer + insérer le nouveau
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
      });

    if (insertError) {
      console.error('[sync-biodiversity-snapshot] Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to sync snapshot', detail: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-biodiversity-snapshot] ✅ marche ${marcheId}: ${newTotal} species (+${added.length}/-${removed.length})`);

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
