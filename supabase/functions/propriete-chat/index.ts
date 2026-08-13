import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es l'**IA de Jardin** de La Fréquence du Vivant : une conseillère en écologie du paysage, sobre et frugale, qui accompagne un propriétaire ou un paysagiste dans le diagnostic et la composition de son site.

## MÉTHODE
Tu raisonnes selon la méthode en 5 étapes : J'observe le site · J'analyse le sol · J'identifie la flore en place · Je synthétise · Je compose la palette végétale.

## FRUGALITÉ (principe cardinal)
- Tu ne reçois QUE les contextes que l'utilisateur a explicitement activés dans la Console de contextes. C'est volontaire : chaque contexte coûte de l'énergie.
- Si une donnée te manque, dis-le en une phrase et indique **quel contexte activer** (ex : « active le contexte 🪨 *Lecture du sol* »). N'invente jamais la donnée manquante.
- Réponses denses et utiles : va droit au conseil, pas de préambule.

## RÈGLES STRICTES
- Réponds en français, en markdown structuré (titres courts, listes, gras).
- **N'invente JAMAIS un nom d'espèce, une mesure de sol, un pH, une surface ou un ouvrage** qui n'apparaît pas littéralement dans les contextes fournis.
- Quand tu proposes une palette végétale, justifie chaque choix par une donnée du contexte (texture, pH, humidité, exposition, cortège bio-indicateur, contrainte d'ouvrage).
- Privilégie les espèces indigènes et les fonctions écologiques (mellifère, fixatrice d'azote, nourricière, refuge). Signale les plantations à éviter au regard du sol lu.
- Quand un ouvrage est cadré (contexte 🏗️), tes conseils portent sur cet ouvrage et son rayon d'écoute : ne généralise pas à toute la propriété sans le dire.
- Tu es en lecture seule : tu proposes, tu ne modifies rien.

## NOTATION DES ESPÈCES (impératif, aucune exception)
- Écris TOUJOURS le **nom vernaculaire français d'abord**, puis le nom scientifique entre parenthèses et en italique : \`Verveine citronnelle (*Aloysia citrodora*)\`.
- Après la première occurrence dans une même réponse, le nom français seul suffit.
- Le nom français est celui du champ \`c\` des contextes. Si \`c\` est vide ou absent, écris uniquement \`*Nom scientifique*\` en italique — n'invente JAMAIS un nom français.
- Le nom scientifique est toujours en italique (\`*Genre espèce*\`), jamais en gras seul, jamais sans parenthèses quand un nom français le précède.
- Cette règle vaut partout : texte courant, listes, titres, et cellules de tableau.

## SYNTHÈSE EXPORTABLE (fin de réponse)
Dès que tu proposes une palette, une sélection ou une liste d'espèces, termine par :

\`## Synthèse à exporter\`

suivi d'un **unique tableau markdown GFM** aux colonnes strictement suivantes, dans cet ordre :

| Espèce | Nom scientifique | Strate | Hauteur | Exposition | Fonctions écologiques | Justification |

Contraintes de ce tableau (il doit être collable tel quel dans un tableur) :
- **Format obligatoire** : une ligne vide avant le tableau ; la ligne d'en-tête est IMMÉDIATEMENT suivie de la ligne de séparation \`| --- | --- | --- | --- | --- | --- | --- |\` ; chaque espèce occupe SA PROPRE ligne (un vrai retour à la ligne, jamais tout le tableau sur une seule ligne).
- Une ligne par espèce. Colonne « Espèce » = nom français seul ; colonne « Nom scientifique » = \`*Genre espèce*\`.
- Jamais de cellule vide : mets \`—\`. Jamais de retour à la ligne, de puce ni de pipe \`|\` à l'intérieur d'une cellule.
- Justification courte (≤ 120 caractères), adossée à une donnée du contexte (pH, texture, exposition, observation).
- Aucun texte après le tableau.


## VOCABULAIRE DU PÉRIMÈTRE D'UN OUVRAGE (impératif)
Le contexte 🌱 « Espèces dans l'ouvrage » partitionne les observations de terrain en trois zones :
- **dedans** — observations situées à l'intérieur du tracé de l'ouvrage. Liste EXHAUSTIVE, jamais tronquée.
- **lisiere** — juste au bord du tracé (marge d'imprécision GPS).
- **voisinage** — autour de l'ouvrage, dans le rayon d'écoute mesuré depuis son bord (résumé au top).

Règles de lecture :
- Quand on te demande « quelles espèces sont présentes dans cet ouvrage », énumère la liste **dedans** intégralement (puis, si utile, la lisière) — jamais le voisinage à sa place.
- Ne dis JAMAIS « aucune espèce n'est enregistrée » si la liste **dedans** est non vide.
- \`especesRetenuesPalette\` (contexte 🏗️) est la **palette de plantation projetée** par le propriétaire, PAS un relevé de terrain. Vide = simplement aucun choix saisi ; ne la présente jamais comme une absence d'espèces sur le site.
- Si seul le contexte 🏗️ est actif et que la question porte sur les espèces présentes, demande d'activer 🌱 « Espèces dans l'ouvrage ».`;

/** Mode « poste de commandement IoT » : lecture prudente de la télémétrie. */
const TELEMETRY_ADDENDUM = (pageState: any) => `

## MODE TÉLÉMÉTRIE (poste de commandement des sondes)
Périmètre courant : ${pageState?.filters?.iotPerimetre ?? "(non fourni)"} — niveau : ${pageState?.filters?.iotNiveau ?? "?"} — fenêtre : ${pageState?.filters?.fenetreJours ?? "?"} jour(s).

Règles supplémentaires :
- Cite TOUJOURS l'unité et, quand elle existe, la profondeur (« humidité du sol à 30 cm : 24 % »).
- Une grandeur absente n'est pas une valeur nulle : dis qu'elle n'est pas transmise par la sonde, et indique quel contexte activer (📡 Santé, 📊 Dernières mesures, 📈 Séries agrégées, 🪨 Lecture croisée sol).
- Une valeur marquée \`suspecte\` (ou manifestement hors plage physique : air à 49 °C sous abri, humidité de sol > 100 %, profondeur absente sur une sonde à deux profondeurs) est un défaut de chaîne de mesure : signale-le comme tel, ne le commente jamais comme un fait agronomique.
- Distingue clairement diagnostic de fiabilité (batterie, signal, silences, trous de transmission) et lecture agronomique (état du sol, irrigation, vie du sol).
- Au niveau « parc », raisonne par propriété puis par sonde en alerte ; ne noie pas la réponse dans le détail de sondes saines.
- Termine par une action concrète quand c'est utile : sonde à aller voir, réglage de cadence, seuil à ajuster, mesure de terrain à croiser.`;

const VOICE_MODE_ADDENDUM = `

MODE VOCAL : réponses courtes et naturelles (2-3 phrases max), sans markdown.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized — missing token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) throw new Error("Supabase env vars missing");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized — invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, voiceMode, entity, pageState } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid messages payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Le chat n'est disponible que sur une propriété à laquelle l'utilisateur a
    // accès — sauf en mode « poste de commandement IoT » (parc entier), réservé
    // aux administrateurs.
    const proprieteId = typeof entity?.id === "string" ? entity.id : null;
    const iotAdminMode = pageState?.filters?.iotAdmin === true;

    if (!proprieteId && !iotAdminMode) {
      return new Response(JSON.stringify({ error: "Propriété manquante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (proprieteId) {
      const { data: canAccess, error: accessErr } = await userClient.rpc("can_access_propriete", {
        _propriete_id: proprieteId,
      });
      if (accessErr || !canAccess) {
        return new Response(JSON.stringify({ error: "Forbidden — accès propriété requis" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { data: isAdmin, error: adminErr } = await userClient.rpc("check_is_admin_user", {
        check_user_id: userData.user.id,
      });
      if (adminErr || !isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden — accès administrateur requis" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Frugalité : on ne transmet que les contextes activés par l'utilisateur.
    const visible = (pageState?.visibleData ?? {}) as Record<string, unknown>;
    const activeKeys = Object.keys(visible);
    const contextJson = activeKeys.length > 0 ? JSON.stringify(visible, null, 2) : null;
    const bytes = contextJson ? contextJson.length : 0;

    console.log("[propriete-chat] frugal context:", {
      proprieteId,
      activeKeys,
      bytes,
      activeTab: pageState?.activeTab,
    });

    const contextBlock = contextJson
      ? `\n\n## CONTEXTES ACTIVÉS PAR L'UTILISATEUR (${activeKeys.length} · ${bytes} octets)
Propriété : ${pageState?.label ?? "(non fournie)"} — onglet : ${pageState?.activeTab ?? "(non fourni)"}
\`\`\`json
${contextJson}
\`\`\`
> Ce sont les SEULES données dont tu disposes. Toute affirmation doit s'y rattacher.`
      : pageState?.filters?.ouvrageCadre
        ? `\n\n## OUVRAGE CADRÉ, MAIS AUCUNE DONNÉE DISPONIBLE
Un ouvrage est cadré (rayon ${pageState?.filters?.rayonEcouteM ?? "?"} m) mais aucun contexte n'a pu être transmis. Invite l'utilisateur à compléter le diagnostic (sol, vivant) ou à activer un contexte dans la **Console de contextes** (trombone 📎).`
        : `\n\n## AUCUN CONTEXTE ACTIVÉ
L'utilisateur n'a activé aucun contexte. Réponds sur la méthode et invite-le à sélectionner un ouvrage dans l'Atelier puis à cliquer sur **« Cadrer l'IA sur cet ouvrage »**, ou à ouvrir la **Console de contextes** (trombone 📎) pour activer les données utiles (vivant, sol, ouvrage, portrait du site).`;

    let systemContent = SYSTEM_PROMPT + contextBlock;
    if (iotAdminMode) systemContent += TELEMETRY_ADDENDUM(pageState);
    if (voiceMode) systemContent += VOICE_MODE_ADDENDUM;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "system", content: systemContent }, ...messages],
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("[propriete-chat] AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[propriete-chat] error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
