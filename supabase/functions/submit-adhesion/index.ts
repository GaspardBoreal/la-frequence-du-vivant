import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TYPES = ['agroecologique', 'ecotouristique', 'geopoetique', 'autre'] as const;
const COLLEGES = ['fondateurs', 'actifs', 'partenaires_mecenes'] as const;

const Schema = z.object({
  prenom: z.string().trim().min(1).max(80),
  nom: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(255),
  telephone: z.string().trim().max(40).optional().nullable(),
  ville: z.string().trim().max(120).optional().nullable(),
  types_marches: z.array(z.enum(TYPES)).default([]),
  autre_type_marche: z.string().trim().max(200).optional().nullable(),
  commentaires: z.string().trim().max(2000).optional().nullable(),
  college_demande: z.enum(COLLEGES).optional().nullable(),
  rgpd_consent: z.literal(true),
  source: z.string().trim().max(60).optional().nullable(),
  campaign: z.string().trim().max(80).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'invalid_payload', details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const data = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const userAgent = req.headers.get('user-agent') ?? null;

    // 1. Cherche un profil existant via auth.users.email
    let matchedProfileId: string | null = null;
    let matchedUserId: string | null = null;
    try {
      const { data: userList } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      // Naïf : recherche dans la première page. Pour BDD volumineuse → ajouter une RPC.
      const found = userList?.users?.find(
        (u) => (u.email ?? '').toLowerCase() === data.email,
      );
      if (found) {
        matchedUserId = found.id;
        const { data: profile } = await supabase
          .from('community_profiles')
          .select('id')
          .eq('user_id', found.id)
          .maybeSingle();
        if (profile) matchedProfileId = profile.id;
      }
    } catch (e) {
      console.warn('user lookup failed', e);
    }

    // 2. Toujours journaliser la demande
    const { data: requestRow, error: insertErr } = await supabase
      .from('adhesion_requests')
      .insert({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone ?? null,
        ville: data.ville ?? null,
        types_marches: data.types_marches,
        autre_type_marche: data.autre_type_marche ?? null,
        commentaires: data.commentaires ?? null,
        college_demande: data.college_demande ?? null,
        rgpd_consent: data.rgpd_consent,
        source: data.source ?? 'formulaire_public',
        campaign: data.campaign ?? null,
        user_agent: userAgent,
        matched_profile_id: matchedProfileId,
        status: matchedProfileId ? 'linked' : 'pending',
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('insert adhesion_requests failed', insertErr);
      return new Response(JSON.stringify({ error: 'insert_failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Si profil trouvé → mise à jour automatique vers Collège des Actifs.
    //    Le souhait des collèges Fondateurs/Mécènes reste un *souhait* (admin valide).
    let outcome: 'linked' | 'pending' = 'pending';
    if (matchedProfileId) {
      const collegeFinal: typeof COLLEGES[number] =
        data.college_demande === 'actifs' || !data.college_demande
          ? 'actifs'
          : 'actifs'; // toujours 'actifs' via formulaire public
      const updatePatch: Record<string, unknown> = {
        is_adherent: true,
        college_adhesion: collegeFinal,
        adhesion_date: new Date().toISOString(),
        adhesion_source: data.source ?? 'formulaire_public',
        adhesion_campaign: data.campaign ?? null,
        rgpd_newsletter_consent: true,
        rgpd_newsletter_consent_at: new Date().toISOString(),
        adhesion_commentaires: data.commentaires ?? null,
      };
      if (data.telephone) updatePatch.telephone = data.telephone;
      if (data.ville) updatePatch.ville = data.ville;

      // Complète aussi types_marches_interets en union
      const { data: existing } = await supabase
        .from('community_profiles')
        .select('types_marches_interets, autre_type_marche')
        .eq('id', matchedProfileId)
        .maybeSingle();
      const previousTypes = (existing?.types_marches_interets as string[] | null) ?? [];
      const merged = Array.from(new Set([...previousTypes, ...data.types_marches]));
      updatePatch.types_marches_interets = merged;
      if (data.autre_type_marche) updatePatch.autre_type_marche = data.autre_type_marche;

      const { error: updErr } = await supabase
        .from('community_profiles')
        .update(updatePatch)
        .eq('id', matchedProfileId);
      if (updErr) {
        console.error('profile update failed', updErr);
      } else {
        outcome = 'linked';
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        outcome,
        request_id: requestRow?.id,
        matched_profile_id: matchedProfileId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (e) {
    console.error('submit-adhesion error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
