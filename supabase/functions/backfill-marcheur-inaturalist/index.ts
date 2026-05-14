// Backfill: scanne les observations iNaturalist d'un marcheur dans le rayon GPS
// des marches d'une exploration et les insère dans marcheur_observations.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const RADIUS_KM = 0.5; // 500 m, cohérent avec sync-biodiversity-snapshot
const PER_PAGE = 200;
const MAX_PAGES = 5;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  let logId: string | null = null;
  let body: any = {};

  try {
    body = await req.json();
    const { user_id, exploration_id, marche_event_id, source } = body || {};
    if (!user_id || !exploration_id) {
      return new Response(JSON.stringify({ error: 'user_id and exploration_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create log row
    const { data: logRow } = await admin.from('marcheur_backfill_log').insert({
      user_id, exploration_id, marche_event_id: marche_event_id ?? null,
      source: source || 'unknown', status: 'pending',
    }).select('id').single();
    logId = logRow?.id ?? null;

    // 1. Resolve crew_id (ensure exists)
    const { data: crewIdRpc } = await admin.rpc('ensure_exploration_marcheur', {
      p_user_id: user_id, p_exploration_id: exploration_id,
    });
    const crewId = crewIdRpc as string | null;
    if (!crewId) throw new Error('Could not ensure exploration_marcheur row');

    // 2. iNat handle
    const { data: profile } = await admin.from('community_profiles')
      .select('id').eq('user_id', user_id).maybeSingle();
    if (!profile?.id) {
      await admin.from('marcheur_backfill_log').update({
        status: 'no_account', error: 'no community profile', completed_at: new Date().toISOString(),
      }).eq('id', logId!);
      return new Response(JSON.stringify({ status: 'no_account' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: sci } = await admin.from('community_profile_science_accounts')
      .select('username').eq('profile_id', profile.id).eq('network', 'inaturalist').maybeSingle();
    const inatLogin = sci?.username;
    if (!inatLogin) {
      await admin.from('marcheur_backfill_log').update({
        status: 'no_account', error: 'no inaturalist account linked',
        completed_at: new Date().toISOString(),
      }).eq('id', logId!);
      return new Response(JSON.stringify({ status: 'no_account' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Marches of the exploration
    const { data: marches } = await admin.from('exploration_marches')
      .select('marche_id, marches:marche_id(id, latitude, longitude)')
      .eq('exploration_id', exploration_id);

    const marcheList = (marches || [])
      .map((m: any) => m.marches)
      .filter((m: any) => m && typeof m.latitude === 'number' && typeof m.longitude === 'number');

    if (!marcheList.length) {
      await admin.from('marcheur_backfill_log').update({
        status: 'success', observations_inserted: 0, marches_scanned: 0,
        completed_at: new Date().toISOString(),
      }).eq('id', logId!);
      return new Response(JSON.stringify({ status: 'success', inserted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. For each marche, scan iNat — dédoublonnage par obs.id iNat (pas par espèce !)
    let totalInserted = 0;
    type Candidate = {
      inat_id: number;
      marche_id: string;
      distance_km: number;
      species_scientific_name: string;
      observation_date: string | null;
      photo_url: string | null;
      latitude: number;
      longitude: number;
    };
    // Map: inat_id -> meilleur candidat (marche la plus proche)
    const bestByObs = new Map<number, Candidate>();

    for (const m of marcheList) {
      let page = 1;
      while (page <= MAX_PAGES) {
        const url = new URL('https://api.inaturalist.org/v1/observations');
        url.searchParams.set('user_login', inatLogin);
        url.searchParams.set('lat', String(m.latitude));
        url.searchParams.set('lng', String(m.longitude));
        url.searchParams.set('radius', String(RADIUS_KM));
        url.searchParams.set('per_page', String(PER_PAGE));
        url.searchParams.set('page', String(page));
        url.searchParams.set('order_by', 'observed_on');

        const r = await fetch(url.toString(), { headers: { 'User-Agent': 'MarchesDuVivant/1.0' } });
        if (!r.ok) break;
        const json = await r.json();
        const results: any[] = json?.results || [];
        if (!results.length) break;

        for (const obs of results) {
          const inatId: number | undefined = obs?.id;
          if (!inatId) continue;
          const sciName: string | undefined =
            obs?.taxon?.name || obs?.species_guess || undefined;
          if (!sciName) continue;
          const lat = obs?.geojson?.coordinates?.[1] ?? obs?.location?.split(',')?.[0];
          const lng = obs?.geojson?.coordinates?.[0] ?? obs?.location?.split(',')?.[1];
          const oLat = typeof lat === 'string' ? parseFloat(lat) : lat;
          const oLng = typeof lng === 'string' ? parseFloat(lng) : lng;
          if (!Number.isFinite(oLat) || !Number.isFinite(oLng)) continue;
          const dist = haversineKm(m.latitude, m.longitude, oLat, oLng);
          if (dist > RADIUS_KM) continue;

          const existing = bestByObs.get(inatId);
          if (!existing || dist < existing.distance_km) {
            bestByObs.set(inatId, {
              inat_id: inatId,
              marche_id: m.id,
              distance_km: dist,
              species_scientific_name: sciName,
              observation_date: obs?.observed_on || null,
              photo_url: obs?.photos?.[0]?.url?.replace('square', 'medium') || null,
              latitude: oLat,
              longitude: oLng,
            });
          }
        }
        if (results.length < PER_PAGE) break;
        page += 1;
      }
    }

    const allInserts = Array.from(bestByObs.values());

    // 5. Insert (idempotent via unique partial index sur (marcheur_id, inaturalist_observation_id))
    if (allInserts.length) {
      const rows = allInserts.map((r) => ({
        marcheur_id: crewId,
        marche_id: r.marche_id,
        species_scientific_name: r.species_scientific_name,
        observation_date: r.observation_date,
        photo_url: r.photo_url,
        inaturalist_observation_id: r.inat_id,
        latitude: r.latitude,
        longitude: r.longitude,
        notes: 'iNaturalist backfill',
      }));
      const { error: insErr, count } = await admin
        .from('marcheur_observations')
        .upsert(rows, { onConflict: 'marcheur_id,inaturalist_observation_id', ignoreDuplicates: true, count: 'exact' });
      if (insErr) throw insErr;
      totalInserted = count ?? rows.length;
    }

    await admin.from('marcheur_backfill_log').update({
      status: 'success',
      observations_inserted: totalInserted,
      marches_scanned: marcheList.length,
      detail: { inat_login: inatLogin, candidates: allInserts.length },
      completed_at: new Date().toISOString(),
    }).eq('id', logId!);

    return new Response(JSON.stringify({
      status: 'success',
      inserted: totalInserted,
      marches_scanned: marcheList.length,
      candidates: allInserts.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('[backfill-marcheur-inaturalist] error', err);
    if (logId) {
      await admin.from('marcheur_backfill_log').update({
        status: 'error', error: err?.message || String(err),
        completed_at: new Date().toISOString(),
      }).eq('id', logId);
    }
    return new Response(JSON.stringify({ error: err?.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
