// Roadmap vivante — relevé d'activité réelle sur une période (lecture seule).
// Sert de matière factuelle à la composition de l'édition hebdomadaire.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Auth requise' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Session invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await userClient.rpc('check_is_admin_user', {
      check_user_id: userData.user.id,
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Réservé aux administrateurs' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { from, to } = await req.json();
    if (!from || !to) {
      return new Response(JSON.stringify({ error: 'Période manquante' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const start = `${String(from).slice(0, 10)}T00:00:00Z`;
    const end = `${String(to).slice(0, 10)}T23:59:59Z`;

    const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const countOf = async (table: string, column = 'created_at') => {
      const { count, error } = await admin
        .from(table)
        .select('id', { count: 'exact', head: true })
        .gte(column, start)
        .lte(column, end);
      if (error) {
        console.warn(`[roadmap-activity-digest] ${table}:`, error.message);
        return null;
      }
      return count ?? 0;
    };

    const [
      marches, proprietes, consultations, capteurs, mesures,
      observations, medias, marcheurs, testimonies,
    ] = await Promise.all([
      countOf('marche_events'),
      countOf('proprietes'),
      countOf('propriete_consultations'),
      countOf('iot_capteurs'),
      countOf('iot_mesures', 'mesure_at'),
      countOf('marcheur_observations'),
      countOf('marcheur_medias'),
      countOf('community_profiles'),
      countOf('event_testimonies'),
    ]);

    return new Response(JSON.stringify({
      periode: { from, to },
      nouvelles_marches: marches,
      nouvelles_proprietes: proprietes,
      consultations_clinique: consultations,
      capteurs_ajoutes: capteurs,
      mesures_recues: mesures,
      observations_du_vivant: observations,
      medias_deposes: medias,
      nouveaux_marcheurs: marcheurs,
      temoignages: testimonies,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[roadmap-activity-digest]', e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
