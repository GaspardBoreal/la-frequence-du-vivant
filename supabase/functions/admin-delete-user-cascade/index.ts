// Admin: suppression cascade complète d'un compte utilisateur (tests d'onboarding).
// Refuse de supprimer un admin. Supporte un mode dry-run qui retourne les décomptes par table sans rien supprimer.
// La cascade exhaustive (17+ tables) est centralisée côté Postgres dans admin_purge_user_cascade.
import { validateAuth, createServiceClient, corsHeaders, forbiddenResponse } from '../_shared/auth-helper.ts';

interface Body {
  user_id?: string;
  email?: string;
  dry_run?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!isAdmin) return forbiddenResponse();

    const body = (await req.json()) as Body;
    let userId = body?.user_id?.trim() || undefined;
    let email = body?.email?.trim().toLowerCase() || undefined;
    const dryRun = Boolean(body?.dry_run);

    if (!userId && !email) {
      return new Response(JSON.stringify({ error: 'user_id ou email requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createServiceClient();

    // Résoudre user_id depuis l'email si nécessaire
    if (!userId && email) {
      let page = 1;
      const perPage = 200;
      while (page <= 20 && !userId) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
        if (error) {
          return new Response(JSON.stringify({ error: `auth list failed: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const match = data.users.find((u) => (u.email || '').toLowerCase() === email);
        if (match) userId = match.id;
        if (data.users.length < perPage) break;
        page += 1;
      }
      if (!userId) {
        return new Response(JSON.stringify({ error: `Ce compte n'existe pas dans la liste des utilisateurs (${email})`, not_found: true }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Récupérer l'email pour le retour si on a démarré depuis user_id
    if (!email && userId) {
      const { data: au } = await admin.auth.admin.getUserById(userId);
      email = (au?.user?.email || '').toLowerCase() || undefined;
    }

    // Garde-fou: refuser si admin
    const { data: isTargetAdmin } = await admin.rpc('check_is_admin_user', { check_user_id: userId });
    if (isTargetAdmin === true) {
      return new Response(JSON.stringify({ error: 'forbidden: target is admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- DRY RUN : comptage via RPC ---
    if (dryRun) {
      const { data: counts, error: cntErr } = await admin.rpc('admin_count_user_cascade', { target_user_id: userId });
      if (cntErr) {
        return new Response(JSON.stringify({ error: `count failed: ${cntErr.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // Ajouter les invitations par email (non visibles via user_id)
      let invByEmail = 0;
      if (email) {
        const { count } = await admin.from('event_invitations').select('*', { count: 'exact', head: true }).ilike('invited_email', email);
        invByEmail = count ?? 0;
      }
      const enriched = { ...(counts as Record<string, number>), event_invitations_by_email: invByEmail };
      return new Response(JSON.stringify({ success: true, dry_run: true, user_id: userId, email, counts: enriched }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- PURGE CASCADE via RPC atomique ---
    const { data: purged, error: purgeErr } = await admin.rpc('admin_purge_user_cascade', { target_user_id: userId });
    if (purgeErr) {
      return new Response(JSON.stringify({ error: `purge failed: ${purgeErr.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const deleted = (purged as Record<string, number>) ?? {};

    // Invitations résiduelles par email (non rattachées au user_id)
    if (email) {
      const { error: e2, count } = await admin.from('event_invitations').delete({ count: 'exact' }).ilike('invited_email', email);
      if (e2) throw new Error(`event_invitations(email): ${e2.message}`);
      deleted['event_invitations_by_email'] = count ?? 0;
    }

    // auth.users en dernier
    const { error: authErr } = await admin.auth.admin.deleteUser(userId!);
    if (authErr) {
      return new Response(JSON.stringify({ error: `auth delete failed: ${authErr.message}`, deleted_before_auth: deleted }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    deleted['auth_users'] = 1;

    return new Response(JSON.stringify({ success: true, user_id: userId, email, deleted }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[admin-delete-user-cascade] unexpected', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
