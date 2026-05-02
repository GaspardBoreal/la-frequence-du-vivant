// Admin-only edge function to create a new marcheur (auth user + community_profile)
import { validateAuth, createServiceClient, corsHeaders, forbiddenResponse } from '../_shared/auth-helper.ts';

function generatePassword() {
  const base = crypto.randomUUID().replace(/-/g, '');
  return base.slice(0, 12) + 'A1!x';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!isAdmin) return forbiddenResponse();

    const body = await req.json();
    const {
      email,
      password,
      prenom,
      nom,
      ville,
      telephone,
      date_naissance,
      genre,
      csp,
      csp_precision,
      role,
      send_invite,
    } = body || {};

    if (!email || !prenom || !nom) {
      return new Response(
        JSON.stringify({ error: 'Email, prénom et nom sont requis.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const admin = createServiceClient();

    let newUserId: string | null = null;
    let inviteSent = false;
    let generatedPassword: string | null = null;
    let inviteWarning: string | null = null;

    // Try invite first if requested, but fall back to direct creation if SMTP fails
    if (send_invite) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { prenom, nom, created_by_admin: user!.id },
      });
      if (!error && data?.user?.id) {
        newUserId = data.user.id;
        inviteSent = true;
      } else {
        console.warn('[admin-create-marcheur] invite failed, falling back to direct creation:', error?.message);
        inviteWarning = `Email d'invitation non envoyé (SMTP indisponible). Compte créé avec un mot de passe temporaire — à transmettre manuellement au marcheur.`;
        // If invite created an orphan user (rare), the next createUser will fail with "already registered"
        // We try to capture the user that was created by invite even though email failed
        // by attempting createUser; if conflict, surface explanatory error.
      }
    }

    if (!newUserId) {
      // Direct creation (either explicitly requested, or invite fallback)
      const finalPassword = (password && String(password).length >= 8)
        ? String(password)
        : generatePassword();
      generatedPassword = finalPassword;

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { prenom, nom, created_by_admin: user!.id },
      });
      if (error) {
        console.error('[admin-create-marcheur] createUser failed:', error);
        return new Response(
          JSON.stringify({ error: error.message || "Impossible de créer l'utilisateur." }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      newUserId = data.user?.id ?? null;
    }

    if (!newUserId) {
      return new Response(
        JSON.stringify({ error: "Impossible de créer l'utilisateur." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the community profile
    const { data: profile, error: profileError } = await admin
      .from('community_profiles')
      .insert({
        user_id: newUserId,
        prenom: String(prenom).trim(),
        nom: String(nom).trim(),
        ville: ville?.trim() || null,
        telephone: telephone?.trim() || null,
        date_naissance: date_naissance || null,
        genre: genre || null,
        csp: csp || null,
        csp_precision: csp_precision?.trim().slice(0, 80) || null,
        role: role || 'marcheur_en_devenir',
      })
      .select()
      .single();

    if (profileError) {
      console.error('[admin-create-marcheur] profile insert failed:', profileError);
      // Rollback: delete the auth user we just created to avoid orphans
      await admin.auth.admin.deleteUser(newUserId).catch(() => {});
      return new Response(
        JSON.stringify({ error: profileError.message || 'Erreur création profil' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[admin-create-marcheur] created', { newUserId, by: user!.id, inviteSent });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        profile,
        invite_sent: inviteSent,
        temporary_password: generatedPassword,
        warning: inviteWarning,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[admin-create-marcheur] unexpected error', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message || 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
