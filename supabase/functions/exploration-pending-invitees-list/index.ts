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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json(401, { error: 'unauthorized' });
    const token = authHeader.replace('Bearer ', '');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json(401, { error: 'unauthorized' });

    let body: { exploration_id?: string } = {};
    try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }); }
    const explorationId = body.exploration_id;
    if (!explorationId || typeof explorationId !== 'string') {
      return json(400, { error: 'exploration_id_required' });
    }

    // Resolve all events belonging to this exploration
    const { data: events, error: evErr } = await admin
      .from('marche_events')
      .select('id, title, date_marche')
      .eq('exploration_id', explorationId);
    if (evErr) {
      console.error('events fetch error', evErr);
      return json(500, { error: 'events_fetch_failed' });
    }
    const eventIds = (events || []).map((e: any) => e.id);
    const eventById = new Map<string, any>((events || []).map((e: any) => [e.id, e]));

    if (eventIds.length === 0) {
      return json(200, { pending: [], registered_not_promoted: [] });
    }

    // === A. Registered readers (event_invited_readers) not promoted ===
    const { data: readers, error: rErr } = await admin
      .from('event_invited_readers')
      .select('user_id, event_id, created_at, invite_source')
      .in('event_id', eventIds)
      .is('promoted_to_participant_at', null)
      .not('user_id', 'is', null);
    if (rErr) {
      console.error('readers fetch error', rErr);
      return json(500, { error: 'readers_fetch_failed' });
    }

    const userIds = Array.from(new Set((readers || []).map((r: any) => r.user_id)));
    let profilesMap = new Map<string, any>();
    if (userIds.length > 0) {
      const { data: profs } = await admin
        .from('community_profiles')
        .select('user_id, prenom, nom, avatar_url')
        .in('user_id', userIds);
      (profs || []).forEach((p: any) => profilesMap.set(p.user_id, p));
    }

    // Dedup by user_id, keep most recent
    const byUser = new Map<string, any>();
    (readers || []).forEach((r: any) => {
      const prev = byUser.get(r.user_id);
      if (!prev || new Date(r.created_at) > new Date(prev.created_at)) byUser.set(r.user_id, r);
    });
    const registered = Array.from(byUser.values()).map((r: any) => ({
      user_id: r.user_id,
      event: eventById.get(r.event_id) || null,
      invite_source: r.invite_source,
      profile: profilesMap.get(r.user_id) || null,
    }));

    // === B. Pending email invitations (event_invitations not consumed) ===
    const { data: invs, error: iErr } = await admin
      .from('event_invitations')
      .select('id, event_id, invited_prenom, invited_email, expires_at, consumed_at, created_at')
      .in('event_id', eventIds)
      .is('consumed_at', null);
    if (iErr) {
      console.error('invitations fetch error', iErr);
      return json(500, { error: 'invitations_fetch_failed' });
    }

    const now = Date.now();
    // Exclude emails that already correspond to a registered auth user
    const emails = Array.from(new Set((invs || []).map((i: any) => (i.invited_email || '').toLowerCase()).filter(Boolean)));
    const registeredEmails = new Set<string>();
    if (emails.length > 0) {
      // Best-effort: scan auth users page by page; for small invite lists this is acceptable.
      // We rely on identities listing via admin API.
      try {
        const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        (usersList?.users || []).forEach((u: any) => {
          if (u.email && emails.includes(u.email.toLowerCase())) registeredEmails.add(u.email.toLowerCase());
        });
      } catch (e) {
        console.warn('listUsers failed (non blocking)', e);
      }
    }

    const pending = (invs || [])
      .filter((i: any) => {
        const expiresAt = i.expires_at ? new Date(i.expires_at).getTime() : null;
        if (expiresAt && expiresAt < now) return false; // skip expired
        const em = (i.invited_email || '').toLowerCase();
        if (em && registeredEmails.has(em)) return false; // already signed up → not "pending"
        return true;
      })
      .map((i: any) => ({
        invitation_id: i.id,
        prenom: i.invited_prenom || null,
        // Mask email: keep only the first letter + domain for context
        email_hint: i.invited_email
          ? `${(i.invited_email as string).charAt(0)}***@${(i.invited_email as string).split('@')[1] ?? ''}`
          : null,
        event: eventById.get(i.event_id) || null,
        created_at: i.created_at,
        expires_at: i.expires_at,
      }));

    return json(200, { pending, registered_not_promoted: registered });
  } catch (e) {
    console.error('exploration-pending-invitees-list error', e);
    return json(500, { error: 'internal_error' });
  }
});
