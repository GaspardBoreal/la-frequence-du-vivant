// Synthèse écrite des agrégats du parcours d'accueil, réservée aux administrateurs.
// Aucun nom de jardin ni donnée personnelle n'est transmis au modèle.

import { validateAuth, corsHeaders, forbiddenResponse } from '../_shared/auth-helper.ts';

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

const VOLET_CONSIGNE: Record<string, string> = {
  personae: 'Décris les personae dominantes et ce qui les distingue vraiment.',
  emails: 'Propose les angles éditoriaux des boucles d’emails, persona par persona.',
  notifications: 'Propose les notifications les plus utiles et le risque de sur-sollicitation.',
  reussite: 'Explique où l’accompagnement change le plus la donne et pourquoi.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!isAdmin) return forbiddenResponse('Action réservée aux administrateurs');

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Service d’analyse indisponible (clé manquante).' }), {
        status: 500, headers: jsonHeaders,
      });
    }

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* corps vide */ }

    const volet = typeof body.volet === 'string' && body.volet in VOLET_CONSIGNE ? body.volet : 'personae';
    const total = typeof body.total === 'number' ? body.total : 0;
    if (!Array.isArray(body.personae) || total <= 0) {
      return new Response(JSON.stringify({ error: 'Données d’analyse incomplètes.' }), {
        status: 400, headers: jsonHeaders,
      });
    }

    const resume = JSON.stringify({
      total,
      personae: body.personae,
      reussite: body.reussite ?? null,
    });

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': apiKey,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.8-flash',
        messages: [
          {
            role: 'system',
            content:
              'Tu es analyste pour Fréquence Jardin. Tu écris en français, sobre et concret, sans jargon ni emphase. ' +
              'Tu ne inventes aucun chiffre : tu ne commentes que les agrégats fournis. ' +
              'Réponds en 4 à 6 phrases courtes, suivies de 3 recommandations en puces.',
          },
          {
            role: 'user',
            content: `${VOLET_CONSIGNE[volet]}\n\nAgrégats anonymes :\n${resume}`,
          },
        ],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      const message =
        resp.status === 402
          ? 'Crédits d’IA épuisés : ajoutez des crédits pour relancer la synthèse.'
          : resp.status === 403
            ? 'L’IA est désactivée ou une limite administrateur a été atteinte.'
            : resp.status === 429
              ? 'Trop de demandes en même temps : réessayez dans une minute.'
              : 'La synthèse n’a pas pu être produite.';
      console.error('[admin-onboarding-analyse] gateway', resp.status, detail.slice(0, 400));
      return new Response(JSON.stringify({ error: message }), { status: resp.status, headers: jsonHeaders });
    }

    const data = await resp.json();
    const synthese = data?.choices?.[0]?.message?.content ?? null;
    if (!synthese) {
      return new Response(JSON.stringify({ error: 'La synthèse est revenue vide.' }), {
        status: 502, headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ synthese }), { headers: jsonHeaders });
  } catch (e) {
    console.error('[admin-onboarding-analyse]', e);
    return new Response(JSON.stringify({ error: 'Erreur inattendue pendant l’analyse.' }), {
      status: 500, headers: jsonHeaders,
    });
  }
});
