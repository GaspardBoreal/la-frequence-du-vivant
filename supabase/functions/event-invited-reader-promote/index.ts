// Admin: promeut un Lecteur invité en Participant validé d'un événement.
import { validateAuth, createServiceClient, corsHeaders, forbiddenResponse } from '../_shared/auth-helper.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { isAdmin, errorResponse, user } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!isAdmin) return forbiddenResponse();

    const body = await req.json();
    const event_id: string = body?.event_id;
    const user_id: string = body?.user_id;
    if (!event_id || !user_id) {
      return new Response(JSON.stringify({ error: 'event_id et user_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createServiceClient();

    // Insert participation (idempotent)
    const { error: partErr } = await admin
      .from('marche_participations')
      .upsert({
        marche_event_id: event_id,
        user_id,
        validated_at: new Date().toISOString(),
        validation_method: 'admin_promotion_invite',
      }, { onConflict: 'marche_event_id,user_id', ignoreDuplicates: false });
    if (partErr) {
      console.error('[promote] participation insert failed', partErr);
      return new Response(JSON.stringify({ error: partErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Mark reader as promoted (keep row for audit)
    await admin.from('event_invited_readers')
      .update({ promoted_to_participant_at: new Date().toISOString() })
      .eq('event_id', event_id).eq('user_id', user_id);

    // Set statut back to 'marcheur'
    await admin.from('community_profiles')
      .update({ statut: 'marcheur' })
      .eq('user_id', user_id);

    return new Response(JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[promote] unexpected', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
