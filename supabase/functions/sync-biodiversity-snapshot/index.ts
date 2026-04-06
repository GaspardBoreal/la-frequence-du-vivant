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

    // Delete existing snapshots for this marche (keep only latest)
    await serviceClient
      .from('biodiversity_snapshots')
      .delete()
      .eq('marche_id', marcheId);

    // Insert new snapshot
    const { error: insertError } = await serviceClient
      .from('biodiversity_snapshots')
      .insert({
        marche_id: marcheId,
        latitude,
        longitude,
        snapshot_date: today,
        radius_meters: 500,
        total_species: summary.totalSpecies || 0,
        birds_count: summary.birds || 0,
        plants_count: summary.plants || 0,
        fungi_count: summary.fungi || 0,
        others_count: summary.others || 0,
        recent_observations: summary.recentObservations || 0,
        species_data: speciesData,
        methodology: methodology || null,
        biodiversity_index: summary.totalSpecies > 0 ? Math.min(summary.totalSpecies / 50, 1) : null,
        species_richness: summary.totalSpecies || 0,
      });

    if (insertError) {
      console.error('[sync-biodiversity-snapshot] Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to sync snapshot', detail: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-biodiversity-snapshot] ✅ Synced for marche ${marcheId}: ${summary.totalSpecies} species`);

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
