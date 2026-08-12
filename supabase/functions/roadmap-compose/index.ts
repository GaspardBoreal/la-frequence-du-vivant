// Roadmap vivante — composition IA de l'édition hebdomadaire.
// Réservée aux administrateurs. Transforme une matière brute (prompts, notes,
// changelog, relevé d'activité) en nouveautés déclinées pour trois publics.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM = `Tu es le rédacteur du journal hebdomadaire de "La Fréquence du Vivant",
une application de marches naturalistes, de suivi de biodiversité et de gestion
écologique de sites (jardins, vignobles, domaines).

À partir de la matière fournie (prompts de développement, notes, changelog,
relevé d'activité), tu produis la liste des NOUVEAUTÉS réellement livrées.

Règles :
- Une nouveauté = un acquis concret et vérifiable pour un utilisateur. Jamais de
  jargon technique (pas de noms de fichiers, de tables, de composants).
- Français soigné, sobre, incarné. Pas d'emphase commerciale, pas d'emoji.
- "promise" : une seule phrase qui dit ce que l'utilisateur peut faire maintenant.
- "audiences" : parmi marcheur, proprietaire, partenaire (au moins une).
- Les trois "pitch_*" reformulent le même acquis selon le public :
  marcheur (sensible, terrain, apprentissage),
  proprietaire (opérationnel : connaître, gérer, prévoir),
  partenaire (démonstratif : dynamique, preuve, portée).
- "domain" : un mot-clé court (Terrain, Sol, Cartographie, IA, Capteurs, Partage, Pilotage…).
- Regroupe ce qui va ensemble. Vise 4 à 8 nouveautés, jamais plus de 12.
- Propose aussi "week_title" (titre éditorial de la semaine, 3 à 7 mots) et
  "narrative" (2 à 4 phrases racontant le fil de la semaine).
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
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
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
    const raw: string = String(body?.raw ?? '').slice(0, 60000);
    const digest = body?.digest ?? null;
    const periode: string = String(body?.periode ?? '');

    if (!raw.trim() && !digest) {
      return new Response(JSON.stringify({ error: 'Aucune matière fournie' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = [
      `Période : ${periode || 'semaine en cours'}`,
      digest ? `Relevé d'activité de la période (données réelles) :\n${JSON.stringify(digest)}` : '',
      raw ? `Matière fournie :\n${raw}` : '',
      `Format de réponse JSON :
{"week_title":"...","narrative":"...","entries":[{"title":"...","promise":"...","body":"...","domain":"...","audiences":["marcheur"],"pitch_marcheur":"...","pitch_proprietaire":"...","pitch_partenaire":"..."}]}`,
    ].filter(Boolean).join('\n\n');

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': LOVABLE_API_KEY,
      },
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
      console.error('[roadmap-compose] gateway', resp.status, detail);
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

    const entries = Array.isArray(parsed.entries) ? parsed.entries.slice(0, 12) : [];
    const clean = entries.map((e: any, i: number) => ({
      title: String(e.title ?? '').slice(0, 160),
      promise: String(e.promise ?? '').slice(0, 300),
      body: String(e.body ?? '').slice(0, 1500),
      domain: String(e.domain ?? '').slice(0, 40),
      audiences: (Array.isArray(e.audiences) ? e.audiences : [])
        .filter((a: string) => ['marcheur', 'proprietaire', 'partenaire'].includes(a)),
      pitch_marcheur: String(e.pitch_marcheur ?? '').slice(0, 400),
      pitch_proprietaire: String(e.pitch_proprietaire ?? '').slice(0, 400),
      pitch_partenaire: String(e.pitch_partenaire ?? '').slice(0, 400),
      position: i,
    })).filter((e: any) => e.title);

    return new Response(JSON.stringify({
      week_title: String(parsed.week_title ?? '').slice(0, 120),
      narrative: String(parsed.narrative ?? '').slice(0, 1200),
      entries: clean,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[roadmap-compose]', e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
