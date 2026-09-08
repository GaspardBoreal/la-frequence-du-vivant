import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maps each registry slug to a SQL-safe metric computation.
// Public mode: aggregates only, no PII.
// mode 'freshness' : la donnée doit arriver en continu (âge de la dernière écriture).
// mode 'backlog'   : service à la demande — on mesure le retard, pas l'ancienneté.
const METRICS: Record<
  string,
  {
    table?: string;
    freshnessCol?: string;
    distinctCol?: string;
    mode?: 'freshness' | 'backlog';
    backlogRpc?: string;
  }
> = {
  'inaturalist': { table: 'biodiversity_snapshots', freshnessCol: 'updated_at', mode: 'freshness' },
  'gbif': { table: 'biodiversity_snapshots', freshnessCol: 'updated_at', distinctCol: 'scientific_name', mode: 'freshness' },
  'lovable-ai': {
    table: 'species_eco_tags_kb',
    freshnessCol: 'last_validated_at',
    mode: 'backlog',
    backlogRpc: 'count_species_awaiting_eco_tags',
  },
};

// Seuils backlog : 0 = vert, 1..30 = orange, >30 = rouge.
const BACKLOG_ORANGE_MAX = 30;
// Un service à la demande doit avoir été contrôlé au moins une fois par semaine.
const CHECK_SILENCE_HOURS = 7 * 24;

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
      backlog: number | null;
      lastCheckedAt: string | null;
      status: 'green' | 'orange' | 'red' | 'unknown';
    }> = {};

    for (const entry of registry ?? []) {
      const m = METRICS[entry.slug];
      if (!m?.table) {
        health[entry.slug] = { volume: null, freshness: null, backlog: null, lastCheckedAt: null, status: 'unknown' };
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

        let status: 'green' | 'orange' | 'red' | 'unknown' = 'green';
        let backlog: number | null = null;
        let lastCheckedAt: string | null = null;

        if (m.mode === 'backlog' && m.backlogRpc) {
          const { data: backlogValue, error: backlogErr } = await supabase.rpc(m.backlogRpc);
          if (backlogErr) {
            status = 'red';
          } else {
            backlog = typeof backlogValue === 'number' ? backlogValue : Number(backlogValue ?? 0);
            status = backlog === 0 ? 'green' : backlog <= BACKLOG_ORANGE_MAX ? 'orange' : 'red';
          }

          // Trace du contrôle : ce service peut légitimement n'avoir rien à faire.
          const nowIso = new Date().toISOString();
          await supabase.from('api_mcp_checks').insert({
            slug: entry.slug,
            backlog,
            note: backlog === null ? 'contrôle impossible' : `${backlog} espèce(s) en attente`,
          });
          lastCheckedAt = nowIso;

          // Silence prolongé de la surveillance (au cas où plus rien ne contrôle).
          if (status === 'green') {
            const { data: prev } = await supabase
              .from('api_mcp_checks')
              .select('checked_at')
              .eq('slug', entry.slug)
              .lt('checked_at', nowIso)
              .order('checked_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (prev?.checked_at) {
              const ageH = (Date.now() - new Date(prev.checked_at).getTime()) / 36e5;
              if (ageH > CHECK_SILENCE_HOURS) status = 'orange';
            }
          }
        } else if (entry.is_critical && freshness) {
          const ageH = (Date.now() - new Date(freshness).getTime()) / 36e5;
          if (ageH > 72) status = 'red';
          else if (ageH > 24) status = 'orange';
        } else if (!freshness && m.freshnessCol) {
          status = 'unknown';
        }

        health[entry.slug] = { volume, freshness, backlog, lastCheckedAt, status };
      } catch (e) {
        console.error(`metric ${entry.slug} failed`, e);
        health[entry.slug] = { volume: null, freshness: null, backlog: null, lastCheckedAt: null, status: 'unknown' };
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
