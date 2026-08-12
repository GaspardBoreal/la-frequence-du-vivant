// Table ronde des IA — dialogue public (protégé par mot de passe partagé) entre
// l'IA de Jardin de La Fréquence du Vivant et l'IA du fournisseur BRAD.
// Aucune donnée de propriété n'est lue : tout le contexte vient du rapport transmis.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const PASSWORD = Deno.env.get('TRUST_PASSWORD') ?? 'WINWINBRAD-LFDV';

const SYSTEM = `Tu es « l'IA de Jardin » de La Fréquence du Vivant : agronome de terrain, précise, sobre, en français.

Cadre de la conversation : une table ronde technique avec l'IA du fournisseur de sondes (BRAD Technology).
Sujet : la qualité de la chaîne de télémétrie et ses conséquences agronomiques sur le registre de sol du Jardin Monde DEVIAT.

Règles :
- Tu ne t'appuies QUE sur le rapport de télémétrie fourni ci-dessous. N'invente aucune valeur, aucune mesure, aucune date.
- Quand une donnée manque, dis-le explicitement et explique ce qu'elle empêche de conclure côté sol.
- Sois concret : champ attendu, unité, profondeur, cadence.
- Réponds en Markdown court : un paragraphe d'analyse, puis des puces « Ce que cela change au jardin » et « Ce que je demande ».
- Ton : confraternel, exigeant, jamais accusateur. Un partenariat, pas un audit punitif.
- Nomenclature botanique : nom français d'abord, nom latin entre parenthèses si utile.`;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { password, reportMarkdown, messages } = await req.json();

    if (typeof password !== 'string' || password.trim().toUpperCase() !== PASSWORD) {
      return json({ error: 'Accès refusé' }, 401);
    }
    if (!Array.isArray(messages) || messages.length === 0) return json({ error: 'Messages manquants' }, 400);
    if (typeof reportMarkdown !== 'string' || reportMarkdown.length < 50) return json({ error: 'Rapport manquant' }, 400);

    const trimmed = messages.slice(-16).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? '').slice(0, 8000),
    }));

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'LOVABLE_API_KEY absente' }, 500);

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3.6-flash',
        stream: true,
        messages: [
          { role: 'system', content: `${SYSTEM}\n\n## RAPPORT DE TÉLÉMÉTRIE (source unique)\n\n${reportMarkdown.slice(0, 30000)}` },
          ...trimmed,
        ],
      }),
    });

    if (resp.status === 429) return json({ error: 'Trop de requêtes, réessayez dans un instant.' }, 429);
    if (resp.status === 402) return json({ error: 'Crédits IA épuisés.' }, 402);
    if (!resp.ok) {
      console.error('[trust-table-ronde] gateway error', resp.status, await resp.text());
      return json({ error: 'Erreur du service IA' }, 500);
    }

    return new Response(resp.body, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } });
  } catch (e) {
    console.error('[trust-table-ronde]', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
