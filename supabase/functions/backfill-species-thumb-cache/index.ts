// backfill-species-thumb-cache : parcourt toutes les espèces connues
// (biodiversity_snapshots ∪ marcheur_observations) et appelle
// resolve-species-thumb par lots de 25.
//
// Usage : invoke({ limit?: number, dry_run?: boolean })
// - limit : nb max d'espèces à résoudre (défaut: tout)
// - dry_run : si true, retourne juste la liste sans rien résoudre

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const limit: number | null = typeof body?.limit === 'number' ? body.limit : null;
    const dryRun = !!body?.dry_run;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Récupère les noms scientifiques distincts via deux requêtes
    const names = new Set<string>();

    // biodiversity_snapshots stockent des observations par snapshot — on lit par batches
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('biodiversity_snapshots')
        .select('observations')
        .range(from, from + PAGE - 1);
      if (error) { console.warn('snapshots err', error.message); break; }
      if (!data || data.length === 0) break;
      for (const row of data) {
        const obs = (row as any).observations;
        if (Array.isArray(obs)) {
          for (const o of obs) {
            const sn = o?.scientificName || o?.scientific_name;
            if (typeof sn === 'string' && sn.trim().length >= 2) {
              names.add(sn.trim().toLowerCase());
            }
          }
        }
      }
      if (data.length < PAGE) break;
      from += PAGE;
      if (from > 50_000) break; // garde-fou
    }

    // marcheur_observations
    from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('marcheur_observations')
        .select('scientific_name')
        .range(from, from + PAGE - 1);
      if (error) { console.warn('obs err', error.message); break; }
      if (!data || data.length === 0) break;
      for (const row of data) {
        const sn = (row as any).scientific_name;
        if (typeof sn === 'string' && sn.trim().length >= 2) {
          names.add(sn.trim().toLowerCase());
        }
      }
      if (data.length < PAGE) break;
      from += PAGE;
      if (from > 100_000) break;
    }

    // Exclut les espèces déjà bien résolues (avec photo, non manual)
    const { data: cached } = await supabase
      .from('species_thumb_cache')
      .select('scientific_name')
      .not('photo_url', 'is', null)
      .neq('source', 'none');

    const cachedSet = new Set<string>((cached || []).map(r => (r as any).scientific_name));
    let toResolve = Array.from(names).filter(n => !cachedSet.has(n));

    if (limit && limit > 0) toResolve = toResolve.slice(0, limit);

    console.log(`[backfill] total=${names.size} alreadyCached=${cachedSet.size} toResolve=${toResolve.length}`);

    if (dryRun) {
      return new Response(JSON.stringify({
        total_distinct: names.size,
        already_cached: cachedSet.size,
        to_resolve: toResolve.length,
        sample: toResolve.slice(0, 20),
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const projectUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    let resolvedTotal = 0;
    let hitsTotal = 0;
    let missesTotal = 0;

    const BATCH = 25;
    for (let i = 0; i < toResolve.length; i += BATCH) {
      const batch = toResolve.slice(i, i + BATCH);
      const res = await fetch(`${projectUrl}/functions/v1/resolve-species-thumb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
        body: JSON.stringify({ scientific_names: batch }),
      });
      if (!res.ok) {
        console.warn(`[backfill] batch ${i} HTTP ${res.status}`);
        await res.text();
        continue;
      }
      const json = await res.json();
      resolvedTotal += json?.resolved?.length || 0;
      hitsTotal += json?.hits || 0;
      missesTotal += json?.misses || 0;
      console.log(`[backfill] batch ${i / BATCH + 1} hits=${json?.hits} misses=${json?.misses}`);
    }

    return new Response(JSON.stringify({
      total_distinct: names.size,
      processed: toResolve.length,
      resolved: resolvedTotal,
      hits: hitsTotal,
      misses: missesTotal,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[backfill] fatal:', (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
