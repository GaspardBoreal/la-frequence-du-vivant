import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json(401, { error: 'unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Validate the user from the token (server-side)
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json(401, { error: 'unauthorized' });
    }
    const userId = userData.user.id;

    // Check admin role server-side
    const { data: isAdmin, error: adminErr } = await admin.rpc('check_is_admin_user', {
      check_user_id: userId,
    });
    if (adminErr) {
      console.error('admin check error', adminErr);
      return json(500, { error: 'admin_check_failed' });
    }
    if (!isAdmin) {
      return json(403, { error: 'forbidden' });
    }

    // Parse body
    let body: { event_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'invalid_json' });
    }
    const eventId = body.event_id;
    if (!eventId || typeof eventId !== 'string') {
      return json(400, { error: 'event_id_required' });
    }

    // Invited readers (registered users)
    const { data: readers, error: readersErr } = await admin
      .from('event_invited_readers')
      .select('id,event_id,user_id,invitation_id,added_by_user_id,promoted_to_participant_at,created_at')
      .eq('event_id', eventId);
    if (readersErr) {
      console.error('readers fetch error', readersErr);
      return json(500, { error: 'readers_fetch_failed' });
    }

    const userIds = Array.from(new Set((readers ?? []).map((r) => r.user_id).filter(Boolean) as string[]));
    const inviterFromAddedBy = (readers ?? [])
      .map((r) => r.added_by_user_id)
      .filter(Boolean) as string[];
    const invitationIds = (readers ?? [])
      .map((r) => r.invitation_id)
      .filter(Boolean) as string[];

    // Resolve invitation inviter ids
    let invitationsMap = new Map<string, string | null>();
    if (invitationIds.length > 0) {
      const { data: invs } = await admin
        .from('event_invitations')
        .select('id, invited_by_user_id')
        .in('id', invitationIds);
      invitationsMap = new Map((invs ?? []).map((i) => [i.id as string, (i.invited_by_user_id as string) ?? null]));
    }

    const inviterIds = Array.from(new Set([
      ...inviterFromAddedBy,
      ...Array.from(invitationsMap.values()).filter(Boolean) as string[],
    ]));

    const profileIds = Array.from(new Set([...userIds, ...inviterIds]));
    let profilesMap = new Map<string, { prenom: string | null; nom: string | null }>();
    if (profileIds.length > 0) {
      const { data: profiles } = await admin
        .from('community_profiles')
        .select('user_id, prenom, nom')
        .in('user_id', profileIds);
      profilesMap = new Map(
        (profiles ?? []).map((p) => [
          p.user_id as string,
          { prenom: (p.prenom as string) ?? null, nom: (p.nom as string) ?? null },
        ]),
      );
    }

    // Resolve emails for registered users via auth.admin
    const emailsMap = new Map<string, string | null>();
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const { data } = await admin.auth.admin.getUserById(uid);
          emailsMap.set(uid, data?.user?.email ?? null);
        } catch (e) {
          console.warn('getUserById failed', uid, e);
          emailsMap.set(uid, null);
        }
      }),
    );

    const readerRows = (readers ?? []).map((r) => {
      const profile = r.user_id ? profilesMap.get(r.user_id as string) : undefined;
      const inviterId = r.invitation_id
        ? invitationsMap.get(r.invitation_id as string) ?? null
        : (r.added_by_user_id as string | null);
      const inviterProfile = inviterId ? profilesMap.get(inviterId) : undefined;
      return {
        id: r.id,
        event_id: r.event_id,
        user_id: r.user_id,
        invitation_id: r.invitation_id,
        added_by_user_id: r.added_by_user_id,
        promoted_to_participant_at: r.promoted_to_participant_at,
        created_at: r.created_at,
        prenom: profile?.prenom ?? null,
        nom: profile?.nom ?? null,
        email: r.user_id ? emailsMap.get(r.user_id as string) ?? null : null,
        invited_by_prenom: inviterProfile?.prenom ?? null,
        source: r.invitation_id ? 'invitation' : 'manuel',
        status: 'inscrit',
      };
    });

    // Pending / expired email invitations
    const { data: pendingInvs, error: invErr } = await admin
      .from('event_invitations')
      .select('id, event_id, invited_by_user_id, invited_prenom, invited_email, expires_at, consumed_at, created_at')
      .eq('event_id', eventId)
      .is('consumed_at', null);
    if (invErr) {
      console.error('invitations fetch error', invErr);
      return json(500, { error: 'invitations_fetch_failed' });
    }

    const pendingInviterIds = Array.from(
      new Set((pendingInvs ?? []).map((i) => i.invited_by_user_id).filter(Boolean) as string[]),
    );
    let pendingInviterMap = profilesMap;
    const missing = pendingInviterIds.filter((id) => !pendingInviterMap.has(id));
    if (missing.length > 0) {
      const { data: extra } = await admin
        .from('community_profiles')
        .select('user_id, prenom, nom')
        .in('user_id', missing);
      const merged = new Map(profilesMap);
      (extra ?? []).forEach((p) => {
        merged.set(p.user_id as string, {
          prenom: (p.prenom as string) ?? null,
          nom: (p.nom as string) ?? null,
        });
      });
      pendingInviterMap = merged;
    }

    const now = Date.now();
    const invRows = (pendingInvs ?? []).map((i) => {
      const inviterProfile = i.invited_by_user_id
        ? pendingInviterMap.get(i.invited_by_user_id as string)
        : undefined;
      const expiresAt = i.expires_at ? new Date(i.expires_at as string).getTime() : null;
      return {
        id: i.id,
        event_id: i.event_id,
        user_id: null,
        invitation_id: i.id,
        added_by_user_id: i.invited_by_user_id,
        promoted_to_participant_at: null,
        created_at: i.created_at,
        prenom: i.invited_prenom ?? null,
        nom: null,
        email: i.invited_email ?? null,
        invited_by_prenom: inviterProfile?.prenom ?? null,
        source: 'invitation',
        status: expiresAt && expiresAt < now ? 'expire' : 'en_attente',
      };
    });

    const all = [...readerRows, ...invRows].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at as string).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at as string).getTime() : 0;
      return tb - ta;
    });

    return json(200, { readers: all });
  } catch (e) {
    console.error('event-invited-readers-list error', e);
    return json(500, { error: 'internal_error' });
  }
});
