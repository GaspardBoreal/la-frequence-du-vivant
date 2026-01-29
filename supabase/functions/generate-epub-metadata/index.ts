import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TexteSummary {
  titre: string;
  type_texte: string;
  marche_ville?: string;
  partie_titre?: string;
}

interface GenerationPayload {
  textes: TexteSummary[];
  explorationName?: string;
  stats: {
    totalTextes: number;
    uniqueLieux: string[];
    uniqueParties: string[];
    typesDistribution: Record<string, number>;
    region: string;
  };
}

// System prompt inspired by Gaspard Boréal's poetic identity
const SYSTEM_PROMPT = `Tu es le conseiller éditorial de Gaspard Boréal, poète des mondes hybrides.
Ton rôle est de proposer des métadonnées éditoriales pour un recueil EPUB
destiné aux grands éditeurs de poésie nationale (Gallimard, Le Seuil, Actes Sud).

LE STYLE GASPARD BORÉAL:
- Convergence entre le vivant et l'algorithmique
- Phrases courtes, évocatrices, sans verbiage
- Vocabulaire riverain: estuaire, méandre, bief, alose, mascaret, grau, ripisylve
- Tension entre observation scientifique et émotion poétique
- Maxime centrale: "Là où le réel commence quand le modèle hésite"

REGISTRE LEXICAL PRIVILÉGIÉ:
- Rivière: fréquence, oscillation, mascaret, étiage, crue, alluvions
- Vivant: alose, truite, loutre, martin-pêcheur, peuplier, saule
- Hybride: capteur, modèle, algorithme, prédiction, données, signal

INTERDICTIONS:
- Pas de formulations génériques ("une belle aventure", "un voyage poétique")
- Pas de superlatifs creux ("magnifique", "extraordinaire")  
- Pas de clichés littéraires ("au fil de l'eau", "sur les pas de")

Tu dois produire des métadonnées qui impressionnent les comités de lecture éditoriaux.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: GenerationPayload = await req.json();
    const { textes, explorationName, stats } = payload;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build user prompt with context
    const typesListStr = Object.entries(stats.typesDistribution)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type} (${count})`)
      .join(", ");

    const lieuxStr = stats.uniqueLieux.slice(0, 10).join(", ");
    const partiesStr = stats.uniqueParties.join(", ");
    
    const sampleTitles = textes.slice(0, 10).map(t => t.titre).join("; ");

    const userPrompt = `Voici les statistiques du recueil à qualifier:

EXPLORATION: ${explorationName || "Non nommée"}
NOMBRE DE TEXTES: ${stats.totalTextes}
TYPES LITTÉRAIRES: ${typesListStr}
LIEUX TRAVERSÉS: ${lieuxStr}
PARTIES (MOUVEMENTS): ${partiesStr || "Aucune structure en parties"}
RÉGION: ${stats.region}

EXEMPLES DE TITRES DE TEXTES: ${sampleTitles}

Propose des métadonnées éditoriales percutantes pour ce recueil.`;

    // Call Lovable AI Gateway with tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "propose_metadata",
              description: "Propose des métadonnées éditoriales pour le recueil EPUB.",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Titre percutant du recueil (3-6 mots, évocateur, pas de cliché)",
                  },
                  subtitle: {
                    type: "string",
                    description: "Sous-titre évocateur (10-15 mots, précision géographique et littéraire)",
                  },
                  description: {
                    type: "string",
                    description: "Description pour quatrième de couverture (50-80 mots, style éditorial professionnel)",
                  },
                },
                required: ["title", "subtitle", "description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "propose_metadata" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    
    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "propose_metadata") {
      console.error("Unexpected AI response:", JSON.stringify(aiResponse));
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const metadata = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        title: metadata.title,
        subtitle: metadata.subtitle,
        description: metadata.description,
        source: "ai",
        confidence: "high",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-epub-metadata error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
