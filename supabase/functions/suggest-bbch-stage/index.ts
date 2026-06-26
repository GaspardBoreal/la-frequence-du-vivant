// Edge function : suggère le stade BBCH le plus probable à partir d'une photo
// + d'une culture (référentiel INRAE/AgroPortal). Vision via Lovable AI Gateway.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StageDef {
  macro: number;
  emoji: string;
  labelFr: string;
  uri: string;
}

interface Body {
  crop_key: string;
  crop_label_fr: string;
  scientific_name: string;
  ontology_uri?: string;
  photo_url: string;
  stages: StageDef[];
}

const MODEL = 'google/gemini-3-flash-preview';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Auth requise' }, 401);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'LOVABLE_API_KEY missing' }, 500);

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Auth invalide' }, 401);

    const body = (await req.json()) as Body;
    if (!body?.photo_url || !body?.crop_key || !Array.isArray(body?.stages)) {
      return json({ error: 'Paramètres invalides' }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. cache hit
    const { data: cached } = await admin
      .from('pheno_ai_suggestions')
      .select('*')
      .eq('photo_url', body.photo_url)
      .eq('crop_key', body.crop_key)
      .maybeSingle();

    if (cached) {
      return json({
        cached: true,
        macro: cached.macro,
        confidence: cached.confidence,
        rationale: cached.rationale,
        alternative_macro: cached.alternative_macro,
        unknown: cached.unknown,
      });
    }

    // 2. construire le prompt à partir des stades de la culture
    const stageList = body.stages
      .map((s) => `- BBCH ${s.macro} ${s.emoji} ${s.labelFr}`)
      .join('\n');

    const systemPrompt = `Tu es un agronome/phénologue expert (référentiel BBCH — INRAE phenologicalstages + AgroPortal PPDO/PPD-CR).
Tu reçois UNE photo d'une culture identifiée : ${body.crop_label_fr} (${body.scientific_name}).
Tu dois identifier le stade phénologique macro (échelle BBCH 0–9) le plus probable visible sur la photo.

Stades possibles (spécifiques à cette culture) :
${stageList}

Règles strictes :
- Ne choisis QUE parmi les macros listés ci-dessus.
- "confidence" ∈ [0,1] : 1.0 = très sûr (indices visuels clairs), 0.5 = plausible, 0.0 = impossible à juger.
- Si confidence < 0.4 → unknown=true (image floue, hors culture, plan trop large, etc.).
- "rationale" : 1 phrase courte FR, factuelle, citant ce que tu vois (couleur des fleurs, présence siliques, feuillage, fruits…).
- "alternative_macro" : optionnel, second stade plausible si tu hésites entre deux.
- Ontologie de référence : ${body.ontology_uri ?? 'n/a'}.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Identifie le stade BBCH de cette photo de ${body.crop_label_fr}.` },
              { type: 'image_url', image_url: { url: body.photo_url } },
            ],
          },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'submit_bbch_stage',
            description: 'Retourne le stade BBCH macro le plus probable identifié sur la photo.',
            parameters: {
              type: 'object',
              properties: {
                macro: { type: 'integer', minimum: 0, maximum: 9 },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                rationale: { type: 'string' },
                alternative_macro: { type: 'integer', minimum: 0, maximum: 9 },
                unknown: { type: 'boolean' },
              },
              required: ['macro', 'confidence', 'rationale', 'unknown'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'submit_bbch_stage' } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      if (aiResp.status === 429) return json({ error: 'Limite IA atteinte, réessaie dans 1 min' }, 429);
      if (aiResp.status === 402) return json({ error: 'Crédits IA épuisés' }, 402);
      console.error('AI gateway error', aiResp.status, txt);
      return json({ error: 'Échec analyse IA' }, 502);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return json({ error: 'Réponse IA invalide' }, 502);

    const parsed = JSON.parse(toolCall.function.arguments);
    const allowed = new Set(body.stages.map((s) => s.macro));
    const macro = allowed.has(parsed.macro) ? parsed.macro : null;
    const alternative_macro = parsed.alternative_macro !== undefined && allowed.has(parsed.alternative_macro)
      ? parsed.alternative_macro
      : null;
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;
    const unknown = Boolean(parsed.unknown) || macro === null || confidence < 0.4;

    const result = {
      macro,
      confidence,
      rationale: String(parsed.rationale ?? '').slice(0, 400),
      alternative_macro,
      unknown,
    };

    // 3. cache write
    await admin.from('pheno_ai_suggestions').upsert({
      photo_url: body.photo_url,
      crop_key: body.crop_key,
      scientific_name: body.scientific_name,
      macro: result.macro,
      confidence: result.confidence,
      rationale: result.rationale,
      alternative_macro: result.alternative_macro,
      unknown: result.unknown,
      model: MODEL,
    }, { onConflict: 'photo_url,crop_key' });

    return json({ cached: false, ...result });
  } catch (e) {
    console.error('suggest-bbch-stage error', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown' }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
