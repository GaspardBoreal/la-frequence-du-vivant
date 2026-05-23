// Edge function : classification IA en batch des tags écologiques d'espèces.
// Réservée aux curateurs (ambassadeur, sentinelle, admin). Écrit dans
// species_eco_tags_kb pour bénéficier cross-marches.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const ECO_TAGS = [
  'arbre', 'haie_bocage', 'vieil_arbre',
  'mellifere', 'pollinisateur', 'nourricier_oiseaux', 'plante_hote_papillons',
  'fixateur_azote', 'ameliorant_sol', 'decomposeur',
  'phytoremediation', 'refuge_faune',
] as const;

interface SpeciesInput {
  scientific_name: string;
  common_name?: string | null;
  family?: string | null;
  iconic_taxon?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Auth requise' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    // Vérifier user + rôle curateur
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Auth invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isCurator } = await admin.rpc('is_eco_curator', { _user_id: userData.user.id });
    if (!isCurator) {
      return new Response(JSON.stringify({ error: 'Réservé aux curateurs' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const species: SpeciesInput[] = Array.isArray(body.species) ? body.species : [];
    if (species.length === 0) {
      return new Response(JSON.stringify({ classified: [], skipped_existing: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Skip celles déjà dans la KB
    const names = species.map(s => s.scientific_name?.trim()).filter(Boolean);
    const { data: existing } = await admin
      .from('species_eco_tags_kb')
      .select('scientific_name, tags, confidence')
      .in('scientific_name', names);
    const existingMap = new Map((existing || []).map((r: any) => [r.scientific_name, r]));
    const toClassify = species.filter(s => !existingMap.has(s.scientific_name?.trim()));

    if (toClassify.length === 0) {
      return new Response(
        JSON.stringify({ classified: [], skipped_existing: existing?.length ?? 0, from_kb: existing }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Batch par paquets de 25 pour éviter prompts trop longs
    const BATCH = 25;
    const results: Array<{ scientific_name: string; tags: string[]; confidence: number }> = [];

    for (let i = 0; i < toClassify.length; i += BATCH) {
      const slice = toClassify.slice(i, i + BATCH);
      const list = slice.map((s, idx) =>
        `${idx + 1}. ${s.scientific_name}${s.common_name ? ` (${s.common_name})` : ''}${s.family ? ` — famille: ${s.family}` : ''}${s.iconic_taxon ? ` — groupe: ${s.iconic_taxon}` : ''}`
      ).join('\n');

      const systemPrompt = `Tu es un biologiste/écologue expert. Pour chaque espèce, attribue les "fonctions écologiques" (services rendus à l'écosystème) parmi cette liste stricte :

- arbre : ligneux > 7m
- haie_bocage : ligneux/arbuste de haie ou ronciers
- vieil_arbre : essences potentiellement centenaires (chênes, tilleuls, hêtres, marronniers, platanes, châtaigniers, pins, cèdres…)
- mellifere : plante nectarifère/pollinifère
- pollinisateur : animal qui pollinise (abeilles, syrphes, papillons imagos…)
- nourricier_oiseaux : produit baies/graines pour oiseaux
- plante_hote_papillons : nourrit les chenilles
- fixateur_azote : Fabaceae, Alnus, etc.
- ameliorant_sol : améliore la structure du sol
- decomposeur : recycle la matière (champignons, vers, cloportes, coléoptères saproxyliques…)
- phytoremediation : épure eau/sol
- refuge_faune : abrite la petite faune (arbustes denses, vieux arbres, prédateurs auxiliaires, oiseaux…)

Règles :
- 1 espèce peut porter 0 à 4 tags
- Sois RIGOUREUX : ne mets pas "arbre" pour une herbacée, pas "mellifère" pour un insecte
- confidence ∈ [0,1] : 1.0 si certain, 0.5 si plausible mais incertain, 0.0 si tu ne peux pas trancher
- Si confidence < 0.4, retourne tags: []`;

      const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Classifie ces ${slice.length} espèces :\n${list}` },
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'submit_classifications',
              description: 'Retourne les classifications pour chaque espèce du batch',
              parameters: {
                type: 'object',
                properties: {
                  results: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        scientific_name: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string', enum: ECO_TAGS as any } },
                        confidence: { type: 'number', minimum: 0, maximum: 1 },
                      },
                      required: ['scientific_name', 'tags', 'confidence'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['results'],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: 'function', function: { name: 'submit_classifications' } },
        }),
      });

      if (!aiResp.ok) {
        const txt = await aiResp.text();
        if (aiResp.status === 429) {
          return new Response(JSON.stringify({ error: 'Limite IA atteinte, réessaie dans 1 min' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (aiResp.status === 402) {
          return new Response(JSON.stringify({ error: 'Crédits IA épuisés — ajoute des crédits dans Settings > Workspace > Usage' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('AI gateway error', aiResp.status, txt);
        continue;
      }

      const aiData = await aiResp.json();
      const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) continue;
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        (parsed.results || []).forEach((r: any) => {
          if (r.scientific_name && Array.isArray(r.tags)) {
            results.push({
              scientific_name: String(r.scientific_name).trim(),
              tags: r.tags.filter((t: string) => (ECO_TAGS as readonly string[]).includes(t)),
              confidence: typeof r.confidence === 'number' ? r.confidence : 0.5,
            });
          }
        });
      } catch (e) {
        console.error('parse tool call failed', e);
      }
    }

    // Écrit en KB uniquement les confidence >= 0.75 (auto-validé)
    // Les autres restent en suggestion (renvoyées au client pour pré-remplir l'éditeur)
    const HIGH_CONF = 0.75;
    const toUpsert = results
      .filter(r => r.confidence >= HIGH_CONF && r.tags.length > 0)
      .map(r => ({
        scientific_name: r.scientific_name,
        tags: r.tags,
        confidence: r.confidence,
        source: 'ai',
        last_validated_by: userData.user.id,
      }));

    if (toUpsert.length > 0) {
      const { error: upErr } = await admin
        .from('species_eco_tags_kb')
        .upsert(toUpsert, { onConflict: 'scientific_name' });
      if (upErr) console.error('kb upsert error', upErr);
    }

    return new Response(JSON.stringify({
      classified: results,
      auto_validated: toUpsert.length,
      suggestions: results.filter(r => r.confidence < HIGH_CONF && r.tags.length > 0),
      skipped_existing: existing?.length ?? 0,
      total_processed: toClassify.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('classify-species-eco-tags error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
