// Backfill: enrich existing biodiversity_snapshots iNat attributions with the
// canonical, immutable `observerLogin` (+ observerId, observerProfileUrl).
//
// One-shot, idempotent. Admin-only.
// - Scans snapshots whose species_data contains iNat attributions without
//   observerLogin.
// - For each unique iNat observation URL, calls public iNat API to fetch
//   user.login + user.id (in-memory dedup cache).
// - Patches attributions in-place and updates the snapshot.
//
// Voir mem://technical/community/identity-matching-logic.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INAT_API = 'https://api.inaturalist.org/v1/observations';

interface InatUserLite {
  login: string | null;
  id: number | null;
}

const userCache = new Map<string, InatUserLite>(); // obsId -> user

async function fetchInatBatch(obsIds: string[]): Promise<void> {
  if (!obsIds.length) return;
  const missing = obsIds.filter((id) => !userCache.has(id));
  if (!missing.length) return;

  // iNat supports /v1/observations/{id1,id2,...} (comma-separated, max 200)
  const chunk = missing.slice(0, 30);
  const url = `${INAT_API}/${chunk.join(',')}`;
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'marches-du-vivant/1.0' } });
    if (!resp.ok) {
      console.warn(`iNat API ${resp.status} for batch of ${chunk.length}`);
      // Mark as fetched-but-unknown to avoid retry loops within this run
      chunk.forEach((id) => userCache.set(id, { login: null, id: null }));
      return;
    }
    const data = await resp.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const seen = new Set<string>();
    for (const r of results) {
      const obsId = String(r?.id || '');
      if (!obsId) continue;
      seen.add(obsId);
      userCache.set(obsId, {
        login: r?.user?.login || null,
        id: r?.user?.id ?? null,
      });
    }
    // Unresolved IDs (deleted/private obs) → null sentinel
    chunk.forEach((id) => {
      if (!seen.has(id)) userCache.set(id, { login: null, id: null });
    });
  } catch (e) {
    console.error('iNat fetch error', e);
    chunk.forEach((id) => userCache.set(id, { login: null, id: null }));
  }
}

function extractObsId(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/inaturalist\.org\/observations\/(\d+)/);
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Admin auth: JWT belongs to an admin, OR service role bearer (internal cron only)
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const isServiceRole = jwt === SERVICE_ROLE;
    if (!isServiceRole) {
      const userClient = createClient(SUPABASE_URL, ANON, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: isAdmin } = await userClient.rpc('has_role', {
        _user_id: userData.user.id,
        _role: 'admin',
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = body?.dryRun === true;
    const marcheId: string | null = body?.marcheId || null; // scope optionnel

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Pull snapshots in pages
    const pageSize = 200;
    let from = 0;
    let scanned = 0;
    let updated = 0;
    let attributionsPatched = 0;
    let obsFetched = 0;

    while (true) {
      let q = admin
        .from('biodiversity_snapshots')
        .select('id, marche_id, species_data')
        .order('created_at', { ascending: true })
        .range(from, from + pageSize - 1);
      if (marcheId) q = q.eq('marche_id', marcheId);
      const { data: snaps, error } = await q;
      if (error) throw error;
      if (!snaps || snaps.length === 0) break;

      for (const snap of snaps) {
        scanned++;
        const arr = (snap as any).species_data;
        if (!Array.isArray(arr)) continue;

        // Collect missing obs IDs for this snapshot
        const needed: string[] = [];
        for (const sp of arr) {
          const attrs = Array.isArray(sp?.attributions) ? sp.attributions : [];
          for (const a of attrs) {
            if ((a?.source || '').toLowerCase() !== 'inaturalist') continue;
            if (a?.observerLogin) continue; // already enriched
            const id = extractObsId(a?.originalUrl);
            if (id && !userCache.has(id)) needed.push(id);
          }
        }
        // Batch-fetch
        for (let i = 0; i < needed.length; i += 30) {
          await fetchInatBatch(needed.slice(i, i + 30));
        }
        obsFetched += needed.length;

        // Patch in-place
        let patched = false;
        for (const sp of arr) {
          const attrs = Array.isArray(sp?.attributions) ? sp.attributions : [];
          for (const a of attrs) {
            if ((a?.source || '').toLowerCase() !== 'inaturalist') continue;
            if (a?.observerLogin) continue;
            const id = extractObsId(a?.originalUrl);
            if (!id) continue;
            const u = userCache.get(id);
            if (!u || !u.login) continue;
            a.observerLogin = u.login;
            if (u.id != null) a.observerId = u.id;
            if (!a.observerProfileUrl) {
              a.observerProfileUrl = `https://www.inaturalist.org/people/${u.login}`;
            }
            patched = true;
            attributionsPatched++;
          }
        }
        if (patched && !dryRun) {
          const { error: upErr } = await admin
            .from('biodiversity_snapshots')
            .update({ species_data: arr })
            .eq('id', (snap as any).id);
          if (upErr) {
            console.error('Update snapshot failed', (snap as any).id, upErr);
          } else {
            updated++;
          }
        } else if (patched) {
          updated++;
        }
      }

      if (snaps.length < pageSize) break;
      from += pageSize;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        dryRun,
        scanned,
        updated,
        attributionsPatched,
        obsFetched,
        cacheSize: userCache.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('backfill error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
