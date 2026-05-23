import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maps each registry slug to a SQL-safe metric computation.
// Public mode: aggregates only, no PII.
const METRICS: Record<string, { table?: string; freshnessCol?: string; distinctCol?: string }> = {
  'inaturalist': { table: 'biodiversity_snapshots', freshnessCol: 'updated_at' },
  'gbif': { table: 'biodiversity_snapshots', freshnessCol: 'updated_at', distinctCol: 'scientific_name' },
  'lovable-ai': { table: 'species_eco_tags_kb', freshnessCol: 'last_validated_at' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Load registry
    const { data: registry, error: regErr } = await supabase
      .from('api_mcp_registry')
      .select('slug,is_critical')
      .order('display_order');
    if (regErr) throw regErr;

    const health: Record<string, {
      volume: number | null;
      freshness: string | null;
      status: 'green' | 'orange' | 'red' | 'unknown';
    }> = {};

    for (const entry of registry ?? []) {
      const m = METRICS[entry.slug];
      if (!m?.table) {
        health[entry.slug] = { volume: null, freshness: null, status: 'unknown' };
        continue;
      }
      try {
        // Volume
        let volume: number | null = null;
        if (m.distinctCol) {
          const { data: distinctRows } = await supabase.rpc('execute_count_distinct', {
            _table: m.table, _column: m.distinctCol,
          }).single() as any;
          volume = distinctRows?.count ?? null;
        }
        if (volume === null) {
          const { count } = await supabase.from(m.table).select('*', { count: 'exact', head: true });
          volume = count ?? 0;
        }
        // Freshness
        let freshness: string | null = null;
        if (m.freshnessCol) {
          const { data: freshRow } = await supabase
            .from(m.table)
            .select(m.freshnessCol)
            .order(m.freshnessCol, { ascending: false })
            .limit(1)
            .maybeSingle();
          freshness = freshRow ? (freshRow as any)[m.freshnessCol] : null;
        }
        // Status based on freshness vs 24h threshold for critical APIs
        let status: 'green' | 'orange' | 'red' | 'unknown' = 'green';
        if (entry.is_critical && freshness) {
          const ageH = (Date.now() - new Date(freshness).getTime()) / 36e5;
          if (ageH > 72) status = 'red';
          else if (ageH > 24) status = 'orange';
        } else if (!freshness && m.freshnessCol) {
          status = 'unknown';
        }
        health[entry.slug] = { volume, freshness, status };
      } catch (e) {
        console.error(`metric ${entry.slug} failed`, e);
        health[entry.slug] = { volume: null, freshness: null, status: 'unknown' };
      }
    }

    return new Response(JSON.stringify({ health, computedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
