// Admin-only edge function to create a new marcheur (auth user + community_profile)
import { validateAuth, createServiceClient, corsHeaders, forbiddenResponse } from '../_shared/auth-helper.ts';

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

    if (send_invite) {
      // Send invitation email — user sets their own password
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { prenom, nom, created_by_admin: user!.id },
      });
      if (error) throw error;
      newUserId = data.user?.id ?? null;
    } else {
      // Create user directly with provided password (or auto-generated)
      const finalPassword = password && password.length >= 8
        ? password
        : crypto.randomUUID().slice(0, 12) + 'A1!';
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { prenom, nom, created_by_admin: user!.id },
      });
      if (error) throw error;
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
      // Rollback: delete the auth user we just created to avoid orphans
      await admin.auth.admin.deleteUser(newUserId).catch(() => {});
      throw profileError;
    }

    console.log('[admin-create-marcheur] created', { newUserId, by: user!.id });

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId, profile }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[admin-create-marcheur] error', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message || 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
