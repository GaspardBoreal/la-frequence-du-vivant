// Analyse IA des espèces d'une exploration : statut IUCN, rareté locale, EEE, parapluie
// Produit pour chaque espèce un score 0-100, une raison éditoriale et une catégorie suggérée.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'google/gemini-3-flash-preview';
const MAX_SPECIES = 60; // Cap pour limiter coût et latence

interface SpeciesInput {
  key: string;
  scientificName: string | null;
  commonName: string | null;
  count: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { explorationId } = await req.json();
    if (!explorationId) {
      return new Response(JSON.stringify({ error: 'explorationId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) throw new Error('LOVABLE_API_KEY not configured');

    // Auth check via user JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    // Curator check
    const { data: isCurator } = await admin.rpc('is_exploration_curator', { _user_id: userId });
    if (!isCurator) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Build species pool from biodiversity_snapshots (with diagnostic)
    const { data: events } = await admin
      .from('marche_events')
      .select('id, latitude, longitude')
      .eq('exploration_id', explorationId);

    const eventsArr = events || [];
    const marchesTotal = eventsArr.length;
    const marchesWithGps = eventsArr.filter((e: any) => e.latitude != null && e.longitude != null).length;

    if (marchesTotal === 0) {
      return new Response(
        JSON.stringify({
          analyzed: 0,
          status: 'no_marches',
          marches_total: 0,
          marches_with_gps: 0,
          marches_with_snapshots: 0,
          message: "Aucune marche dans cette exploration. Crée d'abord une marche dans l'onglet Marches.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eventIds = eventsArr.map((e: any) => e.id);
    const { data: snaps } = await admin
      .from('biodiversity_snapshots')
      .select('marche_id, species_data')
      .in('marche_id', eventIds);
    const snapsArr = snaps || [];
    const marchesWithSnapshots = new Set(snapsArr.map((s: any) => s.marche_id)).size;

    const map = new Map<string, SpeciesInput>();
    snapsArr.forEach((s: any) => {
      const arr = Array.isArray(s.species_data) ? s.species_data : [];
      arr.forEach((sp: any) => {
        const sci = (sp.scientificName || sp.scientific_name || '').toString().trim();
        const com = (sp.commonName || sp.common_name || sp.vernacularName || '').toString().trim();
        const key = (sci || com).toLowerCase();
        if (!key) return;
        const existing = map.get(key);
        if (existing) existing.count += 1;
        else map.set(key, { key: sci || com, scientificName: sci || null, commonName: com || null, count: 1 });
      });
    });

    const pool = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, MAX_SPECIES);

    if (pool.length === 0) {
      let status: 'no_gps' | 'no_snapshots' | 'empty_pool' = 'empty_pool';
      let message = "Pool d'espèces vide pour cette exploration.";
      if (marchesWithGps === 0) {
        status = 'no_gps';
        message = `Aucune des ${marchesTotal} marche(s) n'a de coordonnées GPS. Renseigne la latitude/longitude dans l'onglet Marches pour pouvoir lancer l'analyse.`;
      } else if (marchesWithSnapshots === 0) {
        status = 'no_snapshots';
        message = `${marchesWithGps} marche(s) géolocalisée(s), mais aucune collecte biodiversité n'a encore été faite. Ouvre l'onglet Empreinte / Carte sur chaque marche pour déclencher la collecte iNaturalist, puis relance.`;
      }
      return new Response(
        JSON.stringify({
          analyzed: 0,
          status,
          marches_total: marchesTotal,
          marches_with_gps: marchesWithGps,
          marches_with_snapshots: marchesWithSnapshots,
          message,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Single batched call to Lovable AI to categorize all species at once
    const systemPrompt = `Tu es un naturaliste éditorial pour "La Fréquence du Vivant", un projet géopoétique en Dordogne. Pour chaque espèce d'une liste, tu produis :
- ai_score (0-100) : intérêt à mettre en valeur (rareté, statut, biotope)
- category : une parmi emblematique, parapluie, eee, auxiliaire, protegee
- ai_reason : une phrase courte (max 18 mots), ton sensible et précis, en français, sans cliché
- criteria : objet { iucn?: 'LC'|'NT'|'VU'|'EN'|'CR'|'DD', rarity_local?: 'common'|'uncommon'|'rare', umbrella?: bool, invasive?: bool, protected?: bool }
Privilégie le terrain dordonien (vallée de la Dordogne) : truite fario, écrevisse à pattes blanches, loutre, milan noir, alouette lulu, orchidées, cistude… Marque comme EEE : robinier, renouée du Japon, ragondin, écrevisse de Louisiane, jussie, ailante.`;

    const tools = [
      {
        type: 'function',
        function: {
          name: 'categorize_species',
          description: 'Catégorise toutes les espèces fournies',
          parameters: {
            type: 'object',
            properties: {
              species: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', description: 'Identifiant exact reçu en input (key)' },
                    ai_score: { type: 'integer', minimum: 0, maximum: 100 },
                    category: {
                      type: 'string',
                      enum: ['emblematique', 'parapluie', 'eee', 'auxiliaire', 'protegee'],
                    },
                    ai_reason: { type: 'string' },
                    criteria: {
                      type: 'object',
                      properties: {
                        iucn: { type: 'string', enum: ['LC', 'NT', 'VU', 'EN', 'CR', 'DD'] },
                        rarity_local: { type: 'string', enum: ['common', 'uncommon', 'rare'] },
                        umbrella: { type: 'boolean' },
                        invasive: { type: 'boolean' },
                        protected: { type: 'boolean' },
                      },
                    },
                  },
                  required: ['key', 'ai_score', 'category', 'ai_reason'],
                  additionalProperties: false,
                },
              },
            },
            required: ['species'],
            additionalProperties: false,
          },
        },
      },
    ];

    const userPrompt = `Voici ${pool.length} espèces observées (key | scientifique | commun | nb obs). Catégorise-les toutes :\n\n${pool
      .map(s => `${s.key} | ${s.scientificName || '?'} | ${s.commonName || '?'} | ${s.count}`)
      .join('\n')}`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools,
        tool_choice: { type: 'function', function: { name: 'categorize_species' } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite IA atteinte, réessaie dans une minute.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits IA épuisés, ajoutez des crédits dans Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('AI error', aiResp.status, txt);
      throw new Error(`AI gateway error ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call in AI response');
    const args = JSON.parse(toolCall.function.arguments);
    const results: any[] = args.species || [];

    // 3. Upsert curations: replace existing AI rows for this exploration / sense='oeil'
    await admin
      .from('exploration_curations')
      .delete()
      .eq('exploration_id', explorationId)
      .eq('sense', 'oeil')
      .eq('source', 'ai');

    // Top-3 per category get auto-pinned (display_order >= 0); rest stays as suggestions (display_order = 9999)
    const grouped: Record<string, any[]> = {};
    results.forEach(r => {
      const c = r.category || 'auxiliaire';
      grouped[c] = grouped[c] || [];
      grouped[c].push(r);
    });
    Object.values(grouped).forEach(arr => arr.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0)));

    const rows = results.map(r => {
      const grp = grouped[r.category] || [];
      const idx = grp.findIndex((x: any) => x.key === r.key);
      const pinned = idx >= 0 && idx < 3; // top 3 par catégorie pré-épinglés
      return {
        exploration_id: explorationId,
        sense: 'oeil',
        entity_type: 'species',
        entity_id: r.key,
        category: r.category,
        source: 'ai',
        ai_score: r.ai_score,
        ai_reason: r.ai_reason,
        ai_criteria: r.criteria || {},
        display_order: pinned ? idx : 9999,
        created_by: userId,
      };
    });

    if (rows.length > 0) {
      const { error: insErr } = await admin.from('exploration_curations').insert(rows);
      if (insErr) console.error('Insert curations error:', insErr);
    }

    // Cache analysis
    await admin.from('exploration_ai_analyses').insert({
      exploration_id: explorationId,
      model: MODEL,
      species_analyzed_count: rows.length,
      summary: { categories: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])) },
      created_by: userId,
    });

    return new Response(JSON.stringify({ analyzed: rows.length, model: MODEL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('analyze-exploration-species error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
