import { validateAuth, corsHeaders, forbiddenResponse, createServiceClient } from "../_shared/auth-helper.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const service = createServiceClient();

    // Curator check
    let hasAccess = isAdmin;
    if (!hasAccess) {
      const { data: profile } = await service
        .from('community_profiles').select('role').eq('user_id', user.id).single();
      hasAccess = !!profile && ['ambassadeur', 'sentinelle'].includes(profile.role);
    }

    const body = await req.json().catch(() => ({}));
    const { waypointId } = body || {};
    if (!waypointId) {
      return new Response(JSON.stringify({ error: 'waypointId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: wp, error: wpErr } = await service
      .from('exploration_waypoints')
      .select('id, marche_event_id, latitude, longitude, created_by')
      .eq('id', waypointId).single();

    if (wpErr || !wp) {
      return new Response(JSON.stringify({ error: 'Waypoint not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!hasAccess) {
      // Allow event creator
      const { data: ev } = await service.from('marche_events').select('created_by').eq('id', wp.marche_event_id).single();
      if (ev?.created_by !== user.id && wp.created_by !== user.id) {
        return forbiddenResponse('Accès réservé aux Ambassadeurs / Sentinelles / créateurs');
      }
    }

    console.log(`🌿 [waypoint-bio] ${waypointId} @ ${wp.latitude},${wp.longitude}`);

    let bio = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data, error } = await service.functions.invoke('biodiversity-data', {
          body: {
            latitude: parseFloat(String(wp.latitude)),
            longitude: parseFloat(String(wp.longitude)),
            radius: 0.5,
            mode: 'batch',
          },
        });
        if (error) throw error;
        bio = data; break;
      } catch (e) {
        console.error(`Attempt ${attempt} failed`, e);
        if (attempt < 3) await new Promise(r => setTimeout(r, 400 * attempt));
      }
    }

    if (!bio) {
      return new Response(JSON.stringify({ error: 'Biodiversity API failed' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const species = bio.species || [];
    const summary = bio.summary || {};
    const totalSpecies = summary.totalSpecies || species.length || 0;
    const observations = summary.totalObservations || summary.recentObservations || 0;

    await service.from('waypoint_biodiversity_snapshots').insert({
      waypoint_id: waypointId,
      species_count: totalSpecies,
      observations_count: observations,
      species,
    });

    await service.from('exploration_waypoints')
      .update({ biodiversity_synced_at: new Date().toISOString() })
      .eq('id', waypointId);

    return new Response(JSON.stringify({
      success: true,
      speciesCount: totalSpecies,
      observationsCount: observations,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('❌ collect-waypoint-biodiversity', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
