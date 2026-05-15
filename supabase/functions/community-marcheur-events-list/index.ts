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

interface EventRow {
  event_id: string;
  title: string;
  date_marche: string;
  lieu: string | null;
  exploration_name: string | null;
  relation: 'participant' | 'invite';
  invite_source?: 'manuel' | 'invitation';
  invited_by_prenom?: string | null;
  validated_at?: string | null;
  promoted_to_participant_at?: string | null;
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

    const { data: isAdmin, error: adminErr } = await admin.rpc('check_is_admin_user', {
      check_user_id: userData.user.id,
    });
    if (adminErr) return json(500, { error: 'admin_check_failed' });
    if (!isAdmin) return json(403, { error: 'forbidden' });

    let body: { user_id?: string } = {};
    try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }); }
    const targetUserId = body.user_id;
    if (!targetUserId || typeof targetUserId !== 'string') {
      return json(400, { error: 'user_id_required' });
    }

    // 1) Participations
    const { data: parts, error: partsErr } = await admin
      .from('marche_participations')
      .select('marche_event_id, validated_at, marche_events(id, title, date_marche, lieu, exploration_id, explorations(name))')
      .eq('user_id', targetUserId);
    if (partsErr) {
      console.error('participations fetch error', partsErr);
      return json(500, { error: 'participations_fetch_failed' });
    }

    // 2) Invited readers
    const { data: invs, error: invsErr } = await admin
      .from('event_invited_readers')
      .select('event_id, invitation_id, added_by_user_id, promoted_to_participant_at, marche_events(id, title, date_marche, lieu, exploration_id, explorations(name))')
      .eq('user_id', targetUserId);
    if (invsErr) {
      console.error('invited readers fetch error', invsErr);
      return json(500, { error: 'invited_fetch_failed' });
    }

    // Resolve inviter prénoms
    const invitationIds = (invs ?? []).map((i: any) => i.invitation_id).filter(Boolean) as string[];
    let invitationInviterMap = new Map<string, string | null>();
    if (invitationIds.length > 0) {
      const { data: invRows } = await admin
        .from('event_invitations')
        .select('id, invited_by_user_id')
        .in('id', invitationIds);
      invitationInviterMap = new Map((invRows ?? []).map((r: any) => [r.id, r.invited_by_user_id ?? null]));
    }

    const inviterIds = Array.from(new Set([
      ...((invs ?? []).map((i: any) => i.added_by_user_id).filter(Boolean) as string[]),
      ...(Array.from(invitationInviterMap.values()).filter(Boolean) as string[]),
    ]));
    let inviterPrenomMap = new Map<string, string | null>();
    if (inviterIds.length > 0) {
      const { data: profs } = await admin
        .from('community_profiles')
        .select('user_id, prenom')
        .in('user_id', inviterIds);
      inviterPrenomMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.prenom ?? null]));
    }

    const participantRows: EventRow[] = (parts ?? [])
      .filter((p: any) => p.marche_events)
      .map((p: any) => ({
        event_id: p.marche_events.id,
        title: p.marche_events.title,
        date_marche: p.marche_events.date_marche,
        lieu: p.marche_events.lieu ?? null,
        exploration_name: p.marche_events.explorations?.name ?? null,
        relation: 'participant',
        validated_at: p.validated_at ?? null,
      }));

    const participantEventIds = new Set(participantRows.map(r => r.event_id));

    const inviteRows: EventRow[] = (invs ?? [])
      .filter((i: any) => i.marche_events && !participantEventIds.has(i.marche_events.id))
      .map((i: any) => {
        const inviterId = i.invitation_id
          ? invitationInviterMap.get(i.invitation_id) ?? null
          : (i.added_by_user_id ?? null);
        return {
          event_id: i.marche_events.id,
          title: i.marche_events.title,
          date_marche: i.marche_events.date_marche,
          lieu: i.marche_events.lieu ?? null,
          exploration_name: i.marche_events.explorations?.name ?? null,
          relation: 'invite' as const,
          invite_source: i.invitation_id ? 'invitation' as const : 'manuel' as const,
          invited_by_prenom: inviterId ? inviterPrenomMap.get(inviterId) ?? null : null,
          promoted_to_participant_at: i.promoted_to_participant_at ?? null,
        };
      });

    const all = [...participantRows, ...inviteRows].sort((a, b) => {
      const ta = new Date(a.date_marche).getTime();
      const tb = new Date(b.date_marche).getTime();
      return tb - ta;
    });

    return json(200, { events: all });
  } catch (e) {
    console.error('community-marcheur-events-list error', e);
    return json(500, { error: 'internal_error' });
  }
});
