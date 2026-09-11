import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Idee {
  titre: string;
  description: string;
  duree: string;
  materiel: string;
}

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['lieu', 'vivant'],
  properties: {
    lieu: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titre', 'description', 'duree', 'materiel'],
        properties: {
          titre: { type: 'string' },
          description: { type: 'string' },
          duree: { type: 'string' },
          materiel: { type: 'string' },
        },
      },
    },
    vivant: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titre', 'description', 'duree', 'materiel'],
        properties: {
          titre: { type: 'string' },
          description: { type: 'string' },
          duree: { type: 'string' },
          materiel: { type: 'string' },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'Assistant non configuré.' }, 500);

    const body = await req.json().catch(() => ({}));
    const nom = String(body?.nom ?? '').slice(0, 120);
    const sous = String(body?.sous ?? '').slice(0, 200);
    const texte = String(body?.texte ?? '').slice(0, 800);
    const segment = body?.segment === 'aval' ? 'le marais salant' : 'le village d’Ars-en-Ré';
    if (!nom) return json({ error: 'Point manquant.' }, 400);

    const prompt = `Tu conçois des animations pour une marche du vivant sur l'île de Ré, avec la coopérative des sauniers d'Ars-en-Ré (12 septembre 2026).

Arrêt : « ${nom} » (${sous}) — situé dans ${segment}.
Contexte : ${texte || 'aucun texte complémentaire'}.

Propose exactement 3 animations dans "lieu" : très ancrées dans la matière et l'histoire de cet arrêt précis (sel, eau, argile, vivant, geste du saunier, patrimoine).
Propose exactement 3 animations dans "vivant" : dans l'esprit des Marches du Vivant — science participative et observation de la biodiversité. Quand c'est pertinent à cet arrêt, inclure un geste simple d'analyse de sol (test du boudin, sédimentation en bocal, mesure du pH), un relevé d'herbier des plantes halophiles, ou un temps d'écoute/observation guidée de l'avifaune.

Chaque idée : titre court et évocateur (max 6 mots), description en 2 phrases maximum, duree (ex. « 15 min »), materiel (matériel simple, une ligne). Français, ton concret et inspirant, sans emphase publicitaire. N'invente aucun fait historique précis.`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': key,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        input: prompt,
        stream: true,
        reasoning: { effort: 'low' },
        text: {
          format: {
            type: 'json_schema',
            name: 'animations',
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '');
      if (res.status === 429) return json({ error: 'Trop de demandes, réessayez dans un instant.' }, 429);
      if (res.status === 402) return json({ error: 'Crédits de l’Assistant épuisés.' }, 402);
      return json({ error: 'Assistant indisponible.', detail: detail.slice(0, 300) }, 502);
    }

    // Lecture SSE : on accumule le texte final.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let out = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === 'response.output_text.delta' && typeof evt.delta === 'string') {
            out += evt.delta;
          }
        } catch {
          /* fragment non JSON, ignoré */
        }
      }
    }

    let parsed: { lieu: Idee[]; vivant: Idee[] } | null = null;
    try {
      parsed = JSON.parse(out.trim());
    } catch {
      parsed = null;
    }
    if (!parsed?.lieu?.length || !parsed?.vivant?.length) {
      return json({ error: 'Réponse de l’Assistant illisible.' }, 502);
    }

    return json({ lieu: parsed.lieu.slice(0, 3), vivant: parsed.vivant.slice(0, 3) });
  } catch (e) {
    return json({ error: (e as Error)?.message ?? 'Erreur inattendue.' }, 500);
  }
});
