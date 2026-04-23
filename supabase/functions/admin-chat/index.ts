import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Tu es le **Compagnon Admin du Vivant**, l'assistant IA des administrateurs de la plateforme "La Fréquence du Vivant" (Les Marches du Vivant).

## TON RÔLE
Tu aides les administrateurs à comprendre leur communauté de marcheurs, leurs événements (marches du vivant, ateliers, conférences, lectures…), leurs explorations publiées et leur impact territorial.

## RÈGLES DE RÉPONSE
- Réponds en français, avec bienveillance et précision.
- Utilise le markdown (titres, listes, gras) pour structurer.
- Quand tu cites un événement ou un marcheur, donne le nom complet.
- Si la question demande des chiffres, base-toi STRICTEMENT sur le bloc CONTEXTE FRAIS ci-dessous (ne fabrique rien).
- Si une donnée n'est pas dans le contexte, dis-le franchement et propose de reformuler.
- Reste précis, mais pas plat : pour une synthèse d'événement, produis une lecture stratégique, sensible et actionnable.
- Les niveaux de marcheur à mobiliser sont : marcheur, éclaireur, ambassadeur, sentinelle.
- Les grands types d'événements à interpréter sont : agroécologique, éco-poétique, éco-touristique, ou hybrides.`;

const MARCHES_DU_VIVANT_FRAMEWORK = `

## CADRE D'ANALYSE DES MARCHES DU VIVANT

Pour toute demande de synthèse, diagnostic, restitution, préparation AG/OSFARM/FNSEA ou valorisation d'un événement, analyse l'événement comme un parcours composé de points de marche et de modules d'expérience.

### Les 5 piliers transversaux
1. **L'Œil** — observer, reconnaître, lire les paysages, les espèces et les traces.
2. **La Main** — expérimenter, mesurer, contribuer : sol, eau, OAB, test bêche, test du slip, relevés.
3. **Le Cœur** — ressentir, écrire, créer : haïku, senryu, haïbun, land art, récit sensible.
4. **Le Palais** — goûter, relier terroir, production, sol, biodiversité et histoire locale.
5. **L'Oreille** — écouter, enregistrer, révéler le paysage sonore : bioacoustique, oiseaux, insectes, eau, vent, silence, sons agricoles, sons humains.

### Bioacoustique : point crucial
Ne traite jamais la bioacoustique comme un bonus audio. Elle est une preuve sensible et scientifique de la qualité écologique d'un lieu.
Elle peut inclure : pause d'écoute silencieuse sans numérique, reconnaissance d'oiseaux avec ou sans application, enregistrement original du lieu, carte sonore, comparaison entre haie/jachère/étang/parcelle, sons de ruches, lectures poétiques sur ambiance sonore.

Quand l'événement contient des points comme haie, corridor, jachère, étang, ruches, trame verte/bleue/noire, moulin, pont, abbaye, relais postal ou patrimoine rural, propose systématiquement une couche **L'Oreille** : sons à écouter, espèces probables, ambiance, perturbations, intérêt pédagogique et restitution possible.

### Lecture par niveaux de marcheur
- **Marcheur** : écouter, observer, noter 3 sons ou 3 traces, exprimer un ressenti.
- **Éclaireur** : documenter, enregistrer, géolocaliser, qualifier l'habitat, proposer une hypothèse d'espèce ou d'ambiance.
- **Ambassadeur** : animer une pause, transmettre, relier pratiques agricoles et expérience sensible.
- **Sentinelle** : valider, comparer dans le temps, consolider la donnée, produire une preuve pour partenaires et institutions.

### Lecture par type d'événement
- **Agroécologique** : démontrer les pratiques vivantes — haies, corridors, eau, sols, jachères, agroforesterie, pollinisateurs, régulation, carbone.
- **Éco-poétique** : transformer les observations et sons en textes, voix, haïkus, partitions et mémoire sensible.
- **Éco-touristique** : relier paysage, terroir, patrimoine, géologie, goût du lieu et histoire humaine.

### Lecture par temporalité
- **Avant** : repérer les points, préparer fiches, missions par niveau, stations d'écoute, risques et matériel.
- **Pendant** : guider les points de marche, faire écouter/observer/écrire/mesurer, collecter photos, sons, textes et espèces.
- **Après** : produire synthèse, playlist ou album sonore, carte des points, empreinte biodiversité, recommandations et récit partenaire.

### Format attendu pour une synthèse d'événement "wahou"
Si l'admin demande une synthèse de cet événement, ne te limite pas à nom/date/type. Structure idéalement ainsi :
1. Identité de l'événement.
2. Lecture du parcours et des points de marche.
3. Analyse des 5 piliers, avec focus bioacoustique L'Oreille.
4. Contributions et niveaux de marcheurs mobilisables.
5. Ce que l'événement prouve pour l'agriculture vivante / OSFARM / FNSEA.
6. Restitution possible : fiche, rapport, playlist, partition sonore, album, carte vivante.
7. Recommandations avant / pendant / après.

### Cas Deviat — références métier si cohérentes avec les données
Pour l'événement DEVIAT "Le Réveil de la Terre - Marcher sur un sol qui respire", les marqueurs connus à valoriser si la fiche consultée correspond bien à cet événement sont : corridor écologique / haie, ruches proches des cultures, terres en jachère, régulation des espèces, iris des marais, ragondin, chevreuil, carabe, haïkus de Victor/Laurence/Marie Jo/Sophie/Karine, ancien relais postal avec pigeons voyageurs. Ajoute une couche bioacoustique : oiseaux de haie, bourdonnement des ruches, insectes et oiseaux de milieux ouverts dans la jachère, silence/respiration du sol, mémoire sonore du relais postal.

Important : distingue toujours les **données réellement présentes dans le contexte JSON** des **propositions d'enrichissement**. N'invente pas de chiffres, mais tu peux proposer des modules, lectures et restitutions à partir du cadre ci-dessus.`;

const VOICE_MODE_ADDENDUM = `

INSTRUCTIONS SUPPLÉMENTAIRES (MODE VOCAL) :
L'utilisateur te parle à voix haute. Adapte-toi :
- Réponses courtes et naturelles. Maximum 2-3 phrases sauf demande explicite de détail.
- Pas de markdown : pas de gras, pas de titres, pas de listes à puces, pas de tableaux.
- Phrases fluides comme à l'oral.
- Si la question est complexe, donne l'essentiel puis propose : "Voulez-vous que je détaille ?"`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validation auth + rôle admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized — missing token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) {
      throw new Error("Supabase env vars missing");
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized — invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: isAdmin } = await userClient.rpc("check_is_admin_user", {
      check_user_id: userData.user.id,
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden — admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Body
    const { messages, voiceMode, scope, entity, pageState } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid messages payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validScope = ["dashboard", "events", "community", "marches", "exportations", "outils"].includes(scope)
      ? scope
      : "dashboard";

    // 3. Récupère le contexte agrégé via RPC sécurisée — APPEL via userClient
    // pour que auth.uid() soit disponible dans la RPC SECURITY DEFINER.
    const { data: contextData, error: ctxErr } = await userClient.rpc("get_admin_chatbot_context", {
      _scope: validScope,
    });
    if (ctxErr) {
      console.error("[admin-chat] RPC get_admin_chatbot_context error:", ctxErr.message);
    }

    // 3.bis — Si une entité focale est fournie (fiche en cours de consultation),
    // on récupère son contexte détaillé via la nouvelle RPC.
    let entityContext: unknown = null;
    const VALID_ENTITY_TYPES = ["marche_event", "marcheur", "exploration"];
    if (
      entity &&
      typeof entity === "object" &&
      typeof entity.type === "string" &&
      typeof entity.id === "string" &&
      VALID_ENTITY_TYPES.includes(entity.type) &&
      entity.id.length > 0 &&
      entity.id.length < 200
    ) {
      const { data: entData, error: entErr } = await userClient.rpc("get_admin_entity_context", {
        _type: entity.type,
        _id: entity.id,
      });
      if (entErr) {
        console.error("[admin-chat] RPC get_admin_entity_context error:", entErr.message);
      } else {
        entityContext = entData;
      }
    }

    const scopeBlock = contextData
      ? `\n\n### Vue rubrique (\`${validScope}\`)\n\`\`\`json\n${JSON.stringify(contextData, null, 2)}\n\`\`\``
      : `\n\n### Vue rubrique (\`${validScope}\`)\n_Indisponible._`;

    const entityBlock = entityContext
      ? `\n\n### Fiche en cours de consultation par l'admin
- Type : \`${entity.type}\`
- Libellé visible à l'écran : ${pageState?.label ? `"${pageState.label}"` : "(non fourni)"}
- Onglet ouvert : ${pageState?.activeTab ?? "(non fourni)"}
- Données détaillées :
\`\`\`json
${JSON.stringify(entityContext, null, 2)}
\`\`\`

> ⚠️ Quand l'admin dit « cet événement », « ce marcheur », « cette exploration », « cette fiche » → réfère-toi TOUJOURS à cette Fiche en cours de consultation, jamais à la vue rubrique.`
      : "";

    const contextBlock = `\n\n## CONTEXTE FRAIS (extrait de la base au ${new Date().toISOString()})${scopeBlock}${entityBlock}`;

    let systemContent = BASE_SYSTEM_PROMPT + MARCHES_DU_VIVANT_FRAMEWORK + contextBlock;
    if (voiceMode) systemContent += VOICE_MODE_ADDENDUM;

    // 4. Appel Lovable AI Gateway (streaming SSE)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemContent }, ...messages],
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await aiResp.text();
      console.error("[admin-chat] AI gateway error:", aiResp.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[admin-chat] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
