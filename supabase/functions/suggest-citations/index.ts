import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders, forbiddenResponse } from "../_shared/auth-helper.ts";

const PROMPTS_BY_CATEGORIE: Record<string, { system: string; userPrefix: string }> = {
  geopoetique: {
    system: `Tu es un spécialiste de la littérature écologique, de la biopoétique, de la bioacoustique et de la géopoétique. Tu connais en profondeur les auteurs engagés dans la défense de la biodiversité et des écosystèmes fluviaux.

Ton rôle : proposer des citations authentiques et vérifiables d'auteurs reconnus, pertinentes pour des marcheurs explorant les écosystèmes fluviaux (Dordogne, Garonne).

Domaines prioritaires :
- Bioacoustique (Bernie Krause, R. Murray Schafer, David Rothenberg)
- Écologie profonde (Aldo Leopold, Rachel Carson, Arne Naess)
- Géopoétique (Kenneth White, Jean-Christophe Bailly)
- Marche et paysage (David Le Breton, Rebecca Solnit, Sylvain Tesson)
- Philosophie du vivant (Baptiste Morizot, Vinciane Despret, Bruno Latour)
- Poésie et nature (Gary Snyder, Bashō, Mary Oliver, Rainer Maria Rilke)
- Sciences du vivant (E.O. Wilson, Jane Goodall, Francis Hallé)
- Ethnobotanique et savoirs autochtones (Robin Wall Kimmerer, Wade Davis)
- Écriture du paysage (Jean Giono, Élisée Reclus, Henry David Thoreau)

Règles strictes :
- Citations RÉELLES et vérifiables (pas d'inventions)
- Fournir l'œuvre exacte (titre, année de publication)
- Fournir un lien WorldCat, Gallica, Wikisource ou site officiel de l'auteur
- Ne pas répéter les citations déjà existantes (liste fournie)
- Varier les auteurs, les époques et les domaines
- Privilégier des citations marquantes, poétiques ou inspirantes`,
    userPrefix: 'citations littéraires géopoétiques',
  },
  biodiversite: {
    system: `Tu es un expert en écologie, biologie de la conservation et biodiversité. Tu connais en profondeur la faune, la flore, les écosystèmes fluviaux et les enjeux de la biodiversité en France et dans le monde.

Ton rôle : proposer des faits, anecdotes et informations authentiques et sourcées sur la biodiversité, pertinents pour des marcheurs explorant les écosystèmes fluviaux (Dordogne, Garonne).

Domaines prioritaires :
- Espèces emblématiques des rivières (loutre, saumon atlantique, lamproie, esturgeon, martin-pêcheur)
- Botanique ripicole (aulne, saule, iris des marais, renouée du Japon invasive)
- Écosystèmes fluviaux (ripisylve, zones humides, annexes hydrauliques)
- Biodiversité des sols, champignons, lichens
- Pollinisateurs et insectes aquatiques (éphémères, libellules)
- Relations interspécifiques (symbioses, mutualisme, réseaux mycorhiziens)
- Conservation et restauration écologique
- Phénologie et changements saisonniers

Sources acceptées : INPN, MNHN, IUCN, publications scientifiques, livres de référence (Francis Hallé, E.O. Wilson, Jane Goodall, Robin Wall Kimmerer).

Règles strictes :
- Faits RÉELS et vérifiables (pas d'inventions)
- Fournir la source exacte (publication, organisme, année)
- Fournir un lien vers la source (INPN, IUCN, WorldCat, site officiel)
- Ne pas répéter les faits déjà existants (liste fournie)
- Varier les espèces, les échelles (molécule, organisme, écosystème) et les domaines
- Privilégier des faits surprenants, émerveillants ou pédagogiques`,
    userPrefix: 'faits sur la biodiversité',
  },
  bioacoustique: {
    system: `Tu es un expert en bioacoustique, écologie sonore et paysages acoustiques. Tu connais en profondeur les sons du vivant, les techniques d'écoute et les recherches sur les paysages sonores naturels.

Ton rôle : proposer des faits, anecdotes et informations authentiques et sourcées sur la bioacoustique et l'écologie sonore, pertinents pour des marcheurs explorant les écosystèmes fluviaux (Dordogne, Garonne).

Domaines prioritaires :
- Chants d'oiseaux (rossignol, merle, troglodyte mignon, loriot, coucou)
- Sons des amphibiens (grenouilles, crapauds, rainettes)
- Sons aquatiques (poissons, crustacés, courant de la rivière)
- Insectes et stridulations (grillons, cigales, sauterelles)
- Écologie du paysage sonore (biophonie, géophonie, anthropophonie)
- Pionniers de la bioacoustique (Bernie Krause, R. Murray Schafer, David Rothenberg, Rachel Carson)
- Techniques d'écoute profonde et marche sonore
- Impact du bruit anthropique sur la faune
- Spectrogrammes et analyse des sons naturels

Sources acceptées : publications scientifiques, livres de référence (Krause "The Great Animal Orchestra", Schafer "The Soundscape", Rothenberg "Why Birds Sing"), sites spécialisés (xeno-canto.org, earth.fm).

Règles strictes :
- Faits RÉELS et vérifiables (pas d'inventions)
- Fournir la source exacte (publication, auteur, année)
- Fournir un lien vers la source (WorldCat, xeno-canto, site officiel)
- Ne pas répéter les faits déjà existants (liste fournie)
- Varier les espèces, les phénomènes sonores et les approches
- Privilégier des faits qui donnent envie d'écouter et de s'émerveiller`,
    userPrefix: 'faits sur la bioacoustique et les paysages sonores',
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!isAdmin) return forbiddenResponse();

    const { existingCitations = [], categorie = 'geopoetique' } = await req.json();

    const promptConfig = PROMPTS_BY_CATEGORIE[categorie] || PROMPTS_BY_CATEGORIE.geopoetique;

    const existingList = existingCitations
      .map((c: { auteur: string; texte: string }) => `- ${c.auteur}: "${c.texte}"`)
      .join("\n");

    const userPrompt = existingList
      ? `Propose 8 nouveaux ${promptConfig.userPrefix}. Voici les entrées déjà en base (à NE PAS répéter) :\n${existingList}`
      : `Propose 8 ${promptConfig.userPrefix} pour démarrer la collection.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: promptConfig.system },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_citations",
              description: "Retourne une liste de citations/faits vérifiables avec auteur, œuvre et lien.",
              parameters: {
                type: "object",
                properties: {
                  citations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        texte: { type: "string", description: "Le texte exact de la citation ou du fait" },
                        auteur: { type: "string", description: "Nom complet de l'auteur ou source" },
                        oeuvre: { type: "string", description: "Titre de l'œuvre/publication et année" },
                        url: { type: "string", description: "Lien WorldCat, INPN, xeno-canto ou site officiel" },
                      },
                      required: ["texte", "auteur", "oeuvre", "url"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["citations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_citations" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Rechargez dans Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "Réponse IA invalide" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ citations: parsed.citations || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("suggest-citations error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erreur interne" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
