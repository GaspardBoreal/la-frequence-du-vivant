// Edge function : Audit IA Frugale (AFNOR SPEC 2314)
// Lance un audit, appelle Lovable AI Gateway avec tool calling, enregistre le rapport.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Contexte projet — synthèse "Marches du Vivant" injectée au LLM (rédigée par le code)
const PROJECT_CONTEXT_MARCHES_DU_VIVANT = `
APPLICATION AUDITÉE : La Fréquence du Vivant — Marches du Vivant (cœur)
URL : https://la-frequence-du-vivant.com
Périmètre audité : application web React/Vite des marches biodiversité (hors Dordonia)

## STACK TECHNIQUE
- Frontend : React 18 + Vite 5 + TypeScript + Tailwind CSS + shadcn/ui
- Backend : Supabase EU (Postgres + Edge Functions Deno) — hébergement européen
- Hébergement front : Vercel
- Pas de modèle entraîné maison. Pas de GPU. Aucun entraînement de modèle.
- IA consommée via API : Lovable AI Gateway (Google Gemini) — pas d'accès direct OpenAI/Anthropic.

## USAGES IA (LLM consommés via Gateway)
1. classify-species-eco-tags : classification d'espèces (tags écologiques) en BATCH, modèle Gemini Flash (petit), prompt court, tool calling JSON
2. ChatBot screen-aware : chat assistant guidé par le DOM, modèle Flash, contexte limité aux slices visibles
3. French species names resolver (auto-fill) : LLM léger pour proposer un nom FR si manquant — résultat caché en BDD pour ne PAS réinterroger
4. Guide de marche (suggestions parking, boucles) : usage ponctuel
5. Quiz companion : aide à la révision (mode non-DB)
6. Aucun usage IA en streaming permanent. Aucun usage temps réel coûteux.

## CHOIX DE FRUGALITÉ DÉJÀ EN PLACE
- Modèle par défaut : Gemini Flash (petit modèle), Pro uniquement si nécessaire
- Tool calling structuré (pas de génération texte longue répétitive)
- Caching systématique des résultats LLM (noms FR, classifications éco-tags) dans Postgres → 1 appel par espèce, jamais plus
- Knowledge base cross-marches "species_eco_tags_kb" mutualisée → évite ré-inférence
- Pas de prompt envoyé côté client : tous les prompts sont sur le backend (edge functions)
- Batch processing pour la classification (≥ 10 espèces / appel)
- Snapshot history avec garde-fou anti-régression (rejet si delta iNat > 15 %)

## DONNÉES
- Sources : iNaturalist (Open Data CC), uploads marcheurs (photos GPS)
- Déduplication stricte des espèces par nom scientifique
- Normalisation NFD pour matching marcheurs
- RLS Postgres complète, PII protégée par RPC SECURITY DEFINER
- Snapshots biodiversité agrégés côté serveur (RPC get_exploration_species_count) → 1 query unique pour Carnet/Carte/Synthèse
- Politique de fraîcheur : prioriser observationDate, sync background quand l'utilisateur ouvre un onglet biodiversité
- Pas de duplication massive : 1 espèce = 1 ligne canonique + snapshots delta
- Médias : storage Supabase EU, conversion HEIC → JPEG côté client (pas d'envoi du brut), compression côté upload

## INFRASTRUCTURE
- Tout hébergé en Europe (Supabase EU + Vercel EU edge)
- Pas de GPU, pas de datacenter dédié IA
- Edge Functions Deno : isolés, démarrage à froid, s'éteignent automatiquement après inactivité (gérés par Supabase, scale-to-zero)
- Pas d'environnement dev/test allumé H24 : Lovable preview à la demande
- Pas de mesure CO2 actuelle (CodeCarbon/EcoLogits non intégrés) — point faible reconnu

## GOUVERNANCE
- Projet documenté dans mem://index.md (mémoire vivante)
- Frugalité mentionnée comme principe "Sobriété Informationnelle" (limit cognitive load)
- Pas encore de critère AFNOR explicite formalisé dans le process
- Pas de procédure de fin de vie documentée
- Pas d'analyse comparée "scénario sans IA" formalisée

## EFFETS REBOND IDENTIFIÉS / POINTS FAIBLES À AUDITER
- Pas de mesure CO2eq par requête LLM
- Pas de tableau de bord environnemental
- Pas d'estimation a priori du coût environnemental d'un nouvel usage IA
- Acculturation AFNOR SPEC 2314 en cours (cette mise en place d'audit en est le démarrage)
`;

async function generateSlug(supabase: any, base: string): Promise<string> {
  const slugBase = base.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const ts = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  let slug = `${slugBase}-${ts}`;
  // Ensure uniqueness
  const { data } = await supabase.from('audit_runs').select('id').eq('slug', slug).maybeSingle();
  if (data) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  return slug;
}

const REPORT_TOOL = {
  type: 'function',
  function: {
    name: 'submit_audit_report',
    description: 'Soumet le rapport complet d\'audit IA Frugale AFNOR SPEC 2314.',
    parameters: {
      type: 'object',
      properties: {
        global_score: { type: 'integer', minimum: 0, maximum: 100 },
        maturity_level: {
          type: 'string',
          enum: ['non_conforme', 'insuffisant', 'en_progression', 'conforme', 'exemplaire'],
        },
        maturity_label: { type: 'string', description: 'Libellé court avec emoji (ex: 🟡 En progression)' },
        domain_scores: {
          type: 'object',
          properties: {
            domain1: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, name: { type: 'string' } }, required: ['score', 'max', 'name'] },
            domain2: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, name: { type: 'string' } }, required: ['score', 'max', 'name'] },
            domain3: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, name: { type: 'string' } }, required: ['score', 'max', 'name'] },
            domain4: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, name: { type: 'string' } }, required: ['score', 'max', 'name'] },
          },
          required: ['domain1', 'domain2', 'domain3', 'domain4'],
        },
        strong_points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              domain: { type: 'integer', minimum: 1, maximum: 4 },
              title: { type: 'string' },
              justification: { type: 'string' },
              afnor_reference: { type: 'string', description: 'Ex: BP03' },
            },
            required: ['domain', 'title', 'justification', 'afnor_reference'],
          },
        },
        improvements: {
          type: 'object',
          properties: {
            critical: { type: 'array', items: { $ref: '#/$defs/improvement' } },
            important: { type: 'array', items: { $ref: '#/$defs/improvement' } },
            desirable: { type: 'array', items: { $ref: '#/$defs/improvement' } },
            long_term: { type: 'array', items: { $ref: '#/$defs/improvement' } },
          },
          required: ['critical', 'important', 'desirable', 'long_term'],
        },
        env_indicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              priority: { type: 'string', enum: ['haute', 'moyenne'] },
              currently_measured: { type: 'boolean' },
              unit: { type: 'string' },
            },
            required: ['name', 'priority', 'currently_measured'],
          },
        },
        action_plan: {
          type: 'object',
          properties: {
            phase1_quick: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, afnor_reference: { type: 'string' }, impact: { type: 'string' } }, required: ['action', 'afnor_reference', 'impact'] } },
            phase2_short: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, afnor_reference: { type: 'string' }, impact: { type: 'string' } }, required: ['action', 'afnor_reference', 'impact'] } },
            phase3_medium: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, afnor_reference: { type: 'string' }, impact: { type: 'string' } }, required: ['action', 'afnor_reference', 'impact'] } },
          },
          required: ['phase1_quick', 'phase2_short', 'phase3_medium'],
        },
        executive_summary: { type: 'string', description: '3-5 phrases résumant le verdict d\'audit' },
      },
      required: ['global_score', 'maturity_level', 'maturity_label', 'domain_scores', 'strong_points', 'improvements', 'env_indicators', 'action_plan', 'executive_summary'],
      $defs: {
        improvement: {
          type: 'object',
          properties: {
            problem: { type: 'string' },
            afnor_reference: { type: 'string' },
            recommended_action: { type: 'string' },
            estimated_impact: { type: 'string', enum: ['Élevé', 'Modéré', 'Faible'] },
          },
          required: ['problem', 'afnor_reference', 'recommended_action', 'estimated_impact'],
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const user = userData.user;

  const { data: isAdmin } = await userClient.rpc('check_is_admin_user', { check_user_id: user.id });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const { template_id, scope_label } = body;
  if (!template_id || !scope_label) {
    return new Response(JSON.stringify({ error: 'template_id et scope_label requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Load template
  const { data: tpl, error: tplErr } = await admin
    .from('audit_prompt_templates')
    .select('*')
    .eq('id', template_id)
    .maybeSingle();
  if (tplErr || !tpl) {
    return new Response(JSON.stringify({ error: 'Template introuvable' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const slug = await generateSlug(admin, scope_label);

  // Create run "running"
  const { data: run, error: insErr } = await admin
    .from('audit_runs')
    .insert({
      slug,
      template_id: tpl.id,
      template_name: tpl.name,
      template_version: tpl.version,
      prompt_snapshot: tpl.prompt_text,
      scope_label,
      scope_context_json: { context_text: PROJECT_CONTEXT_MARCHES_DU_VIVANT },
      model_used: 'google/gemini-2.5-pro',
      launched_by: user.id,
      launched_by_email: user.email ?? null,
      status: 'running',
      is_public: true,
    })
    .select()
    .single();
  if (insErr) {
    return new Response(JSON.stringify({ error: 'DB insert failed', detail: insErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Call Lovable AI Gateway
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    await admin.from('audit_runs').update({ status: 'failed', error_message: 'LOVABLE_API_KEY missing' }).eq('id', run.id);
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: tpl.prompt_text },
          {
            role: 'user',
            content: `Voici le contexte complet de l'application à auditer.\n\n${PROJECT_CONTEXT_MARCHES_DU_VIVANT}\n\nProduis le rapport d'audit en appelant l'outil submit_audit_report. Sois rigoureux : justifie chaque score par les éléments du contexte ci-dessus.`,
          },
        ],
        tools: [REPORT_TOOL],
        tool_choice: { type: 'function', function: { name: 'submit_audit_report' } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      const msg = aiResp.status === 429 ? 'Limite de débit IA atteinte, réessayez dans quelques minutes.'
        : aiResp.status === 402 ? 'Crédits IA épuisés. Ajoutez des crédits dans Settings > Workspace > Usage.'
        : `Erreur AI Gateway ${aiResp.status}: ${t}`;
      await admin.from('audit_runs').update({ status: 'failed', error_message: msg }).eq('id', run.id);
      return new Response(JSON.stringify({ error: msg }), { status: aiResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      const msg = 'Le LLM n\'a pas retourné de tool call structuré.';
      await admin.from('audit_runs').update({ status: 'failed', error_message: msg, report_json: aiJson }).eq('id', run.id);
      return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const report = JSON.parse(toolCall.function.arguments);

    await admin.from('audit_runs').update({
      status: 'completed',
      report_json: report,
      global_score: report.global_score,
      maturity_level: report.maturity_level,
      domain_scores: report.domain_scores,
    }).eq('id', run.id);

    return new Response(JSON.stringify({ success: true, slug, id: run.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    await admin.from('audit_runs').update({ status: 'failed', error_message: msg }).eq('id', run.id);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
