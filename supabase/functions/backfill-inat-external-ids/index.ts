// Backfill one-shot : résout `external_id` + `display_name` pour tous les
// `community_profile_science_accounts` iNaturalist où `external_id IS NULL`.
// Idempotent : peut être relancé sans danger.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Optionnel : verifier admin via JWT
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { data: accounts, error: selErr } = await supabase
      .from('community_profile_science_accounts')
      .select('id, username')
      .eq('network', 'inaturalist')
      .is('external_id', null);
    if (selErr) throw selErr;

    const results: Array<{ id: string; username: string; status: string; external_id?: string }> = [];

    for (const acc of accounts || []) {
      const login = (acc.username || '').trim();
      if (!login) {
        results.push({ id: acc.id, username: login, status: 'skipped_no_login' });
        continue;
      }
      try {
        const resp = await fetch(`https://api.inaturalist.org/v1/users/${encodeURIComponent(login)}`, {
          headers: { Accept: 'application/json' },
        });
        if (!resp.ok) {
          results.push({ id: acc.id, username: login, status: `inat_${resp.status}` });
          await sleep(1100);
          continue;
        }
        const json = await resp.json();
        const u = json?.results?.[0];
        if (!u?.id) {
          results.push({ id: acc.id, username: login, status: 'no_user' });
          await sleep(1100);
          continue;
        }
        const externalId = String(u.id);
        const displayName = u.name || u.login || login;
        const { error: updErr } = await supabase
          .from('community_profile_science_accounts')
          .update({ external_id: externalId, display_name: displayName })
          .eq('id', acc.id);
        if (updErr) {
          results.push({ id: acc.id, username: login, status: `db_err:${updErr.message}` });
        } else {
          results.push({ id: acc.id, username: login, status: 'ok', external_id: externalId });
        }
      } catch (e: any) {
        results.push({ id: acc.id, username: login, status: `fetch_err:${e?.message || e}` });
      }
      // throttle 1 req/s — rate limit iNat
      await sleep(1100);
    }

    const summary = {
      total: accounts?.length || 0,
      ok: results.filter((r) => r.status === 'ok').length,
      failed: results.filter((r) => r.status !== 'ok' && r.status !== 'skipped_no_login').length,
      skipped: results.filter((r) => r.status === 'skipped_no_login').length,
    };

    return new Response(JSON.stringify({ summary, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
