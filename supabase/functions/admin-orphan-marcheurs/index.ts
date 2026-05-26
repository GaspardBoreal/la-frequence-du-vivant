// Admin: lister et purger les fiches marcheur orphelines (user_id sans compte auth).
import { validateAuth, createServiceClient, corsHeaders, forbiddenResponse } from '../_shared/auth-helper.ts';

interface Body {
  action?: 'list' | 'purge';
  user_ids?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!isAdmin) return forbiddenResponse();

    const body = (await req.json().catch(() => ({}))) as Body;
    const action = body?.action ?? 'list';
    const admin = createServiceClient();

    if (action === 'list') {
      const { data, error } = await admin.rpc('admin_orphan_exploration_marcheurs');
      if (error) {
        return new Response(JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, orphans: data ?? [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'purge') {
      const ids = Array.isArray(body?.user_ids) ? body!.user_ids!.filter(Boolean) : [];
      if (ids.length === 0) {
        return new Response(JSON.stringify({ error: 'user_ids requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const results: Array<{ user_id: string; deleted?: unknown; error?: string }> = [];
      for (const uid of ids) {
        const { data, error } = await admin.rpc('admin_purge_user_cascade', { target_user_id: uid });
        if (error) results.push({ user_id: uid, error: error.message });
        else results.push({ user_id: uid, deleted: data });
      }
      return new Response(JSON.stringify({ success: true, results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'action inconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[admin-orphan-marcheurs] unexpected', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
