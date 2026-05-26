// Admin: suppression cascade complète d'un compte utilisateur (tests d'onboarding).
// Refuse de supprimer un admin. Supporte un mode dry-run qui retourne les décomptes par table sans rien supprimer.
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

    // Résoudre user_id depuis l'email si nécessaire (auth.admin.listUsers paginé)
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
        return new Response(JSON.stringify({ error: `Aucun compte auth trouvé pour ${email}` }),
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

    // Compter par table
    const counts: Record<string, number> = {};
    const tally = async (table: string, q: any) => {
      const { count, error } = await q.select('*', { count: 'exact', head: true });
      if (error) console.warn(`[delete-cascade] count ${table} failed`, error);
      counts[table] = count ?? 0;
    };

    await tally('marche_participations', admin.from('marche_participations').eq('user_id', userId!));
    await tally('event_invited_readers', admin.from('event_invited_readers').eq('user_id', userId!));
    // event_invitations: par consumed_by_user_id OU par email
    {
      const { count: c1 } = await admin.from('event_invitations').select('*', { count: 'exact', head: true }).eq('consumed_by_user_id', userId!);
      let c2 = 0;
      if (email) {
        const { count } = await admin.from('event_invitations').select('*', { count: 'exact', head: true }).ilike('invited_email', email);
        c2 = count ?? 0;
      }
      counts['event_invitations'] = (c1 ?? 0) + c2;
    }
    await tally('community_profiles', admin.from('community_profiles').eq('user_id', userId!));

    if (dryRun) {
      return new Response(JSON.stringify({ success: true, dry_run: true, user_id: userId, email, counts }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Cascade explicite (les FK en CASCADE feront le reste sur auth.users delete)
    const deleted: Record<string, number> = {};

    const del = async (table: string, q: any) => {
      const { error, count } = await q;
      if (error) throw new Error(`${table}: ${error.message}`);
      deleted[table] = count ?? 0;
    };

    await del('marche_participations',
      admin.from('marche_participations').delete({ count: 'exact' }).eq('user_id', userId!));
    await del('event_invited_readers',
      admin.from('event_invited_readers').delete({ count: 'exact' }).eq('user_id', userId!));

    // event_invitations: par consumed_by_user_id puis par email
    {
      const { error: e1, count: c1 } = await admin.from('event_invitations').delete({ count: 'exact' }).eq('consumed_by_user_id', userId!);
      if (e1) throw new Error(`event_invitations(consumed): ${e1.message}`);
      let c2 = 0;
      if (email) {
        const { error: e2, count } = await admin.from('event_invitations').delete({ count: 'exact' }).ilike('invited_email', email);
        if (e2) throw new Error(`event_invitations(email): ${e2.message}`);
        c2 = count ?? 0;
      }
      deleted['event_invitations'] = (c1 ?? 0) + c2;
    }

    // community_profiles (sera aussi supprimé par CASCADE sur auth.users, mais on le fait explicitement pour avoir le count)
    await del('community_profiles',
      admin.from('community_profiles').delete({ count: 'exact' }).eq('user_id', userId!));

    // auth.users en dernier — cascade le reste
    const { error: authErr } = await admin.auth.admin.deleteUser(userId!);
    if (authErr) {
      return new Response(JSON.stringify({ error: `auth delete failed: ${authErr.message}`, deleted_before_auth: deleted }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    deleted['auth_users'] = 1;

    return new Response(JSON.stringify({ success: true, user_id: userId, email, deleted, planned_counts: counts }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[admin-delete-user-cascade] unexpected', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
