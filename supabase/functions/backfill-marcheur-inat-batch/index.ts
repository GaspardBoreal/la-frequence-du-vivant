// Cron quotidien : ré-attache les nouvelles obs iNat de tous les marcheurs
// éligibles (compte iNat lié + participation validée) sur leurs explorations.
// Auth : header X-Cron-Secret obligatoire (comparé à CRON_SHARED_SECRET).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const MAX_COUPLES = 200;
const THROTTLE_MS = 250;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SECRET = Deno.env.get('CRON_SHARED_SECRET');
  const provided = req.headers.get('x-cron-secret');
  if (!SECRET || !provided || provided !== SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const startedAt = new Date().toISOString();

  // 1. Récupérer les couples éligibles (user_id, exploration_id, marche_event_id)
  const { data: rows, error: queryErr } = await admin
    .from('marche_participations')
    .select(`
      user_id,
      marche_event_id,
      validated_at,
      marche_events!inner(exploration_id),
      community_profiles!inner(
        id,
        community_profile_science_accounts!inner(network)
      )
    `)
    .not('validated_at', 'is', null)
    .eq('community_profiles.community_profile_science_accounts.network', 'inaturalist')
    .not('marche_events.exploration_id', 'is', null)
    .limit(MAX_COUPLES);

  if (queryErr) {
    return new Response(JSON.stringify({ error: queryErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Dédoublonner sur (user_id, exploration_id) ; on garde un marche_event_id représentatif
  const seen = new Map<string, { user_id: string; exploration_id: string; marche_event_id: string }>();
  for (const r of (rows ?? []) as any[]) {
    const explorationId = r.marche_events?.exploration_id;
    if (!explorationId) continue;
    const key = `${r.user_id}::${explorationId}`;
    if (!seen.has(key)) {
      seen.set(key, {
        user_id: r.user_id,
        exploration_id: explorationId,
        marche_event_id: r.marche_event_id,
      });
    }
  }
  const couples = Array.from(seen.values());

  let ok = 0;
  let noAccount = 0;
  let errors = 0;
  let totalAdded = 0;
  const errorSamples: Array<{ user_id: string; exploration_id: string; error: string }> = [];

  // 2. Invoquer la fonction unitaire pour chaque couple
  for (const c of couples) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/backfill-marcheur-inaturalist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SERVICE_ROLE}`,
          apikey: SERVICE_ROLE,
        },
        body: JSON.stringify({
          user_id: c.user_id,
          exploration_id: c.exploration_id,
          marche_event_id: c.marche_event_id,
          source: 'cron_daily',
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        errors++;
        if (errorSamples.length < 10) {
          errorSamples.push({
            user_id: c.user_id,
            exploration_id: c.exploration_id,
            error: json?.error || `HTTP ${resp.status}`,
          });
        }
      } else if (json?.status === 'no_account') {
        noAccount++;
      } else {
        ok++;
        totalAdded += Number(json?.inserted ?? json?.added ?? 0);
      }
    } catch (e) {
      errors++;
      if (errorSamples.length < 10) {
        errorSamples.push({
          user_id: c.user_id,
          exploration_id: c.exploration_id,
          error: String((e as Error).message ?? e),
        });
      }
    }
    await sleep(THROTTLE_MS);
  }

  // 3. Log de synthèse
  const summary = {
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    couples_total: couples.length,
    ok,
    no_account: noAccount,
    errors,
    observations_added: totalAdded,
    error_samples: errorSamples,
  };

  await admin.from('marcheur_backfill_log').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    exploration_id: '00000000-0000-0000-0000-000000000000',
    source: 'cron_daily_summary',
    status: errors > 0 ? 'partial' : 'ok',
    error: errors > 0 ? JSON.stringify(errorSamples) : null,
    completed_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
