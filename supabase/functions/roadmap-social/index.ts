// Roadmap vivante — génération des posts sociaux (LinkedIn, Instagram, Pinterest)
// pour chacun des trois publics, plus un calendrier de diffusion sur la semaine.
// Réservée aux administrateurs.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUDIENCES = ['marcheur', 'proprietaire', 'partenaire'];
const NETWORKS = ['linkedin', 'instagram', 'pinterest'];

const SYSTEM = `Tu écris les publications sociales du journal hebdomadaire de
"La Fréquence du Vivant" (marches naturalistes, biodiversité, gestion écologique
de jardins et vignobles).

Trois publics :
- marcheur : la communauté de terrain. Ton sensible, concret, invitant à observer et apprendre.
- proprietaire : propriétaires de jardins, vignobles, domaines. Ton opérationnel : connaître, gérer, prévoir.
- partenaire : sponsors, mécènes, partenaires techniques, associations. Ton démonstratif : cadence, preuves, portée.

Trois réseaux :
- linkedin : 900 à 1300 signes, structure aérée, une accroche forte, un enseignement, un appel à échanger.
- instagram : 400 à 700 signes, phrases courtes, rythme, une invitation claire.
- pinterest : 200 à 400 signes, descriptif utile et durable, orienté recherche.

Règles : français soigné, aucune promesse invérifiable, aucun chiffre inventé
(n'utilise que ce qui est fourni), pas d'emoji sur LinkedIn, maximum deux sur Instagram.
Pour chaque post : "body" (le texte), "hashtags" (4 à 8, sans le signe #),
"scheduled_day" (entier 0=lundi … 6=dimanche) répartissant intelligemment la semaine.
Réponds STRICTEMENT en JSON valide, sans texte autour.`;

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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY manquante');

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

    const body = await req.json();
    const week = body?.week ?? {};
    const entries = Array.isArray(body?.entries) ? body.entries.slice(0, 12) : [];
    const publicUrl: string = String(body?.publicUrl ?? '');

    if (entries.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucune nouveauté à valoriser' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const matiere = entries.map((e: any) => ({
      titre: e.title,
      promesse: e.promise,
      publics: e.audiences,
      marcheur: e.pitch_marcheur,
      proprietaire: e.pitch_proprietaire,
      partenaire: e.pitch_partenaire,
    }));

    const userPrompt = `Semaine ${week.iso_week}/${week.iso_year} — « ${week.title ?? ''} »
Récit de la semaine : ${week.narrative ?? ''}
Lien public à mentionner : ${publicUrl}

Nouveautés de la semaine :
${JSON.stringify(matiere)}

Produis un post par couple (public × réseau), soit 9 posts.
Format :
{"posts":[{"audience":"marcheur","network":"linkedin","body":"...","hashtags":["..."],"scheduled_day":0}]}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': LOVABLE_API_KEY },
      body: JSON.stringify({
        model: 'google/gemini-3.6-flash',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('[roadmap-social] gateway', resp.status, detail);
      return new Response(JSON.stringify({ error: 'Génération indisponible', status: resp.status, details: detail }), {
        status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await resp.json();
    const content = json?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    const startsOn = String(week.starts_on ?? '').slice(0, 10);
    const posts = (Array.isArray(parsed.posts) ? parsed.posts : [])
      .filter((p: any) => AUDIENCES.includes(p.audience) && NETWORKS.includes(p.network))
      .map((p: any) => {
        let scheduled: string | null = null;
        const day = Number.isFinite(p.scheduled_day) ? Math.min(6, Math.max(0, Number(p.scheduled_day))) : null;
        if (startsOn && day !== null) {
          const d = new Date(`${startsOn}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() + day);
          scheduled = d.toISOString().slice(0, 10);
        }
        return {
          audience: p.audience,
          network: p.network,
          body: String(p.body ?? '').slice(0, 4000),
          hashtags: (Array.isArray(p.hashtags) ? p.hashtags : [])
            .slice(0, 10)
            .map((h: string) => String(h).replace(/^#/, '').slice(0, 40)),
          scheduled_for: scheduled,
          status: 'draft',
        };
      })
      .filter((p: any) => p.body);

    return new Response(JSON.stringify({ posts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[roadmap-social]', e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
