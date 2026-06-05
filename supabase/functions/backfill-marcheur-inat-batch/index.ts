// Cron quotidien : ré-attache les nouvelles obs iNat de tous les marcheurs
// éligibles (compte iNat lié + inscription) sur leurs explorations.
// Deux passes :
//  - Pass 1 (haute priorité) : participations DÉJÀ validées
//  - Pass 2 (opportuniste)   : participations NON validées → si au moins une
//                              obs iNat est trouvée dans le périmètre, on
//                              auto-valide la participation (validation_method
//                              = 'inat_auto'), ce qui déclenche promotion de
//                              rôle via trigger update_community_role_on_participation.
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

type Couple = {
  user_id: string;
  exploration_id: string;
  marche_event_id: string;
  participation_id: string;
  validated: boolean;
};

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

  // 1. Récupérer TOUS les couples éligibles (validés et non validés)
  const { data: rows, error: queryErr } = await admin
    .from('marche_participations')
    .select(`
      id,
      user_id,
      marche_event_id,
      validated_at,
      marche_events!inner(exploration_id),
      community_profiles!inner(
        id,
        community_profile_science_accounts!inner(network)
      )
    `)
    .eq('community_profiles.community_profile_science_accounts.network', 'inaturalist')
    .not('marche_events.exploration_id', 'is', null)
    .limit(MAX_COUPLES * 2);

  if (queryErr) {
    return new Response(JSON.stringify({ error: queryErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Dédoublonner sur (user_id, exploration_id) en gardant la participation
  // validée si elle existe, sinon une non validée.
  const seen = new Map<string, Couple>();
  for (const r of (rows ?? []) as any[]) {
    const explorationId = r.marche_events?.exploration_id;
    if (!explorationId) continue;
    const key = `${r.user_id}::${explorationId}`;
    const validated = !!r.validated_at;
    const existing = seen.get(key);
    if (!existing || (validated && !existing.validated)) {
      seen.set(key, {
        user_id: r.user_id,
        exploration_id: explorationId,
        marche_event_id: r.marche_event_id,
        participation_id: r.id,
        validated,
      });
    }
  }
  const couples = Array.from(seen.values()).slice(0, MAX_COUPLES);

  let ok = 0;
  let noAccount = 0;
  let errors = 0;
  let totalAdded = 0;
  let autoValidated = 0;
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
          source: c.validated ? 'cron_daily' : 'cron_daily_opportunistic',
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
        const inserted = Number(json?.inserted ?? json?.added ?? 0);
        totalAdded += inserted;

        // 2.b. Auto-validation opportuniste : participation non validée
        // + au moins une obs iNat dans le périmètre = preuve de présence.
        if (!c.validated && inserted > 0) {
          const { error: upErr } = await admin
            .from('marche_participations')
            .update({
              validated_at: new Date().toISOString(),
              validation_method: 'inat_auto',
            })
            .eq('id', c.participation_id)
            .is('validated_at', null);
          if (!upErr) autoValidated++;
        }
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
    couples_validated: couples.filter((c) => c.validated).length,
    couples_unvalidated: couples.filter((c) => !c.validated).length,
    ok,
    no_account: noAccount,
    errors,
    observations_added: totalAdded,
    auto_validated: autoValidated,
    error_samples: errorSamples,
  };

  await admin.from('marcheur_backfill_log').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    exploration_id: null,
    source: 'cron_daily_summary',
    status: errors > 0 ? 'partial' : 'ok',
    observations_inserted: totalAdded,
    marches_scanned: couples.length,
    detail: summary as any,
    error: errors > 0 ? JSON.stringify(errorSamples) : null,
    completed_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
