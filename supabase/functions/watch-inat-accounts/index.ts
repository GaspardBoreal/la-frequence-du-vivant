// Veilleur horaire : récupère les observations iNaturalist récentes du compte
// de l'association et des marcheurs liés, vérifie qu'elles figurent bien dans
// le dernier snapshot de chaque marche dont elles sont dans le rayon, sinon
// relance une collecte ciblée et journalise l'écart (inat_watch_misses).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};
const ASSOCIATION_LOGIN = 'les-marches-du-vivant';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const haversine = (a: number, b: number, c: number, d: number) => {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (c - a) * toR, dLng = (d - b) * toR;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a * toR) * Math.cos(c * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const SECRET = Deno.env.get('CRON_SHARED_SECRET');
  if (!SECRET || req.headers.get('x-cron-secret') !== SECRET) return json({ error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const sb = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: accounts } = await sb
    .from('community_profile_science_accounts')
    .select('username')
    .eq('network', 'inaturalist');
  const logins = Array.from(new Set([ASSOCIATION_LOGIN, ...(accounts || []).map((a: any) => (a.username || '').trim().toLowerCase()).filter(Boolean)]));

  const { data: marches } = await sb.from('marches').select('id, latitude, longitude, radius_m').not('latitude', 'is', null);
  const { data: em } = await sb.from('exploration_marches').select('exploration_id, marche_id');
  const explByMarche = new Map<string, string[]>();
  for (const r of em || []) {
    const l = explByMarche.get(r.marche_id) || [];
    l.push(r.exploration_id);
    explByMarche.set(r.marche_id, l);
  }

  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const snapCache = new Map<string, string>();
  const toCollect = new Map<string, Set<string>>(); // exploration -> marches
  let checked = 0, missing = 0, resolved = 0;

  for (const login of logins) {
    let obs: any[] = [];
    try {
      const r = await fetch(`https://api.inaturalist.org/v1/observations?user_login=${encodeURIComponent(login)}&updated_since=${since}&per_page=200&order_by=updated_at`);
      if (r.ok) obs = (await r.json()).results || [];
    } catch (_) { /* ignore */ }
    await sleep(1000);

    for (const o of obs) {
      const coords = o?.geojson?.coordinates;
      if (!Array.isArray(coords)) continue;
      const [lng, lat] = coords.map(Number);
      for (const m of marches || []) {
        const radius = Number(m.radius_m) || 500;
        if (haversine(Number(m.latitude), Number(m.longitude), lat, lng) > radius) continue;
        checked++;
        if (!snapCache.has(m.id)) {
          const { data: s } = await sb.from('biodiversity_snapshots').select('species_data')
            .eq('marche_id', m.id).order('created_at', { ascending: false }).limit(1);
          snapCache.set(m.id, JSON.stringify(s?.[0]?.species_data ?? []));
        }
        const present = snapCache.get(m.id)!.includes(`/observations/${o.id}"`);
        const expl = (explByMarche.get(m.id) || [])[0] ?? null;
        if (present) {
          const { count } = await sb.from('inat_watch_misses').update({ resolved_at: new Date().toISOString(), last_checked_at: new Date().toISOString() }, { count: 'exact' })
            .eq('inat_observation_id', o.id).eq('marche_id', m.id).is('resolved_at', null);
          resolved += count || 0;
          continue;
        }
        missing++;
        const reason = o.obscured || o.geoprivacy === 'obscured' ? 'coordonnées masquées'
          : !o.taxon ? 'espèce non identifiée'
          : !['species', 'subspecies', 'variety'].includes(o.taxon?.rank) ? 'identification au-dessus de l’espèce'
          : 'en attente de collecte';
        const { data: existing } = await sb.from('inat_watch_misses').select('id').eq('inat_observation_id', o.id).eq('marche_id', m.id).maybeSingle();
        const row = {
          inat_observation_id: o.id, marche_id: m.id, exploration_id: expl, observer_login: login,
          scientific_name: o.taxon?.name ?? null, observed_on: o.observed_on ?? null,
          observation_url: `https://www.inaturalist.org/observations/${o.id}`, reason,
          last_checked_at: new Date().toISOString(), resolved_at: null,
        };
        if (existing) await sb.from('inat_watch_misses').update(row).eq('id', existing.id);
        else await sb.from('inat_watch_misses').insert(row);
        if (reason === 'en attente de collecte') {
          for (const e of explByMarche.get(m.id) || []) {
            const set = toCollect.get(e) || new Set();
            set.add(m.id);
            toCollect.set(e, set);
          }
        }
      }
    }
  }

  const triggered: string[] = [];
  for (const [explorationId, ids] of toCollect) {
    try {
      await fetch(`${url}/functions/v1/collect-event-biodiversity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cron-secret': SECRET, apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '' },
        body: JSON.stringify({ explorationId, force: true, marcheIds: Array.from(ids) }),
      });
      triggered.push(explorationId);
    } catch (e) { console.warn('collect failed', explorationId, e); }
  }

  return json({ logins: logins.length, checked, missing, resolved, triggered });
});
