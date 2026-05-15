// Crée une invitation "Lecteur invité" et tente d'envoyer l'email d'invitation.
// Fallback: retourne l'URL d'invitation pour copier/partage manuel si l'email échoue.
import { validateAuth, createServiceClient, corsHeaders } from '../_shared/auth-helper.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const event_id: string | null = body?.event_id || null;
    const invited_email = String(body?.invited_email || '').trim().toLowerCase();
    const invited_prenom = String(body?.invited_prenom || '').trim();
    const send_email: boolean = body?.send_email !== false;
    const site_url: string = String(body?.site_url || '').replace(/\/$/, '');

    if (!invited_email || !invited_prenom) {
      return new Response(JSON.stringify({ error: 'Email et prénom requis.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createServiceClient();

    const { data: invitation, error: invErr } = await admin
      .from('event_invitations')
      .insert({
        event_id,
        invited_by_user_id: user!.id,
        invited_email,
        invited_prenom,
      })
      .select()
      .single();

    if (invErr) {
      console.error('[event-invitation-create] insert failed', invErr);
      return new Response(JSON.stringify({ error: invErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const invite_url = `${site_url}/marches-du-vivant/connexion?invitation=${invitation.token}`;

    let email_sent = false;
    let email_error: string | null = null;

    if (send_email) {
      try {
        const { error: mailErr } = await admin.auth.admin.inviteUserByEmail(invited_email, {
          data: {
            event_invitation_token: invitation.token,
            event_id,
            prenom: invited_prenom,
            invited_by: user!.id,
          },
          redirectTo: invite_url,
        });
        if (mailErr) {
          email_error = mailErr.message;
          console.warn('[event-invitation-create] inviteUserByEmail failed', mailErr.message);
        } else {
          email_sent = true;
        }
      } catch (e) {
        email_error = (e as Error).message;
        console.warn('[event-invitation-create] inviteUserByEmail threw', e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      invitation_id: invitation.id,
      token: invitation.token,
      invite_url,
      email_sent,
      email_error,
      expires_at: invitation.expires_at,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[event-invitation-create] unexpected', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
