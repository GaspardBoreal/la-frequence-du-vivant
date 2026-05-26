// Admin: retire un Lecteur invité d'un événement et nettoie les tables liées.
import { validateAuth, createServiceClient, corsHeaders, forbiddenResponse } from '../_shared/auth-helper.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!isAdmin) return forbiddenResponse();

    const body = await req.json();
    const event_id: string = body?.event_id;
    const invited_reader_id: string = body?.invited_reader_id;
    if (!event_id || !invited_reader_id) {
      return new Response(JSON.stringify({ error: 'event_id et invited_reader_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createServiceClient();

    // Reload the reader row to enforce guardrails
    const { data: reader, error: readErr } = await admin
      .from('event_invited_readers')
      .select('id, event_id, user_id, invitation_id, promoted_to_participant_at')
      .eq('id', invited_reader_id)
      .eq('event_id', event_id)
      .maybeSingle();

    if (readErr) {
      console.error('[reader-delete] reload failed', readErr);
      return new Response(JSON.stringify({ error: readErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!reader) {
      return new Response(JSON.stringify({ error: 'not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (reader.promoted_to_participant_at) {
      return new Response(JSON.stringify({ error: 'already_promoted' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Delete the invited reader row
    const { error: delErr } = await admin
      .from('event_invited_readers')
      .delete()
      .eq('id', invited_reader_id);
    if (delErr) {
      console.error('[reader-delete] delete reader failed', delErr);
      return new Response(JSON.stringify({ error: delErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If the row came from an explicit invitation token, drop the (now useless) invitation
    let invitation_deleted = false;
    if (reader.invitation_id) {
      const { error: invDelErr } = await admin
        .from('event_invitations')
        .delete()
        .eq('id', reader.invitation_id);
      if (invDelErr) {
        console.warn('[reader-delete] invitation delete failed (non-fatal)', invDelErr);
      } else {
        invitation_deleted = true;
      }
    }

    return new Response(
      JSON.stringify({ success: true, invitation_deleted, user_id: reader.user_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[reader-delete] unexpected', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
