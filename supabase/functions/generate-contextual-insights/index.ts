import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { explorationId, eventType, angle, userLevel, speciesCount, speciesNames } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build context-specific system prompt
    const toneMap: Record<string, string> = {
      agroecologique: "technique et scientifique, orienté données et protocoles",
      eco_poetique: "poétique et contemplatif, inspiré par la géopoétique de Kenneth White",
      eco_tourisme: "accessible et enthousiaste, orienté découverte et émerveillement",
    };

    const angleMap: Record<string, string> = {
      biodiversite: "la biodiversité (espèces, écosystèmes, indicateurs écologiques)",
      bioacoustique: "la bioacoustique (paysages sonores, chants d'oiseaux, indices acoustiques)",
      geopoetique: "la géopoétique (écriture, relation au paysage, poésie du terrain)",
    };

    const tone = toneMap[eventType] || toneMap.agroecologique;
    const angleDesc = angleMap[angle] || angleMap.biodiversite;

    const speciesContext = speciesNames?.length > 0 
      ? `Espèces observées sur cette exploration : ${speciesNames.slice(0, 15).join(", ")}. Total : ${speciesCount} espèces.`
      : `Aucune espèce encore documentée sur cette exploration.`;

    const systemPrompt = `Tu es un expert naturaliste et médiateur scientifique pour les Marcheurs du Vivant, une communauté de citoyens qui collectent des données de biodiversité en marchant.

Ton ton est ${tone}.
Tu te concentres sur ${angleDesc}.

${speciesContext}

Génère exactement 3 insights courts et percutants (max 2 phrases chacun) dans un JSON array.
Chaque insight a : "category" (formation|inspiration|experimentation), "title" (max 10 mots), "content" (max 50 mots).

Les insights doivent être basés sur les données réelles fournies et actionables pour un marcheur de niveau ${userLevel}.
Réponds UNIQUEMENT avec le JSON array, sans markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Génère les 3 insights contextuels." },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_insights",
            description: "Return contextual insights for walkers",
            parameters: {
              type: "object",
              properties: {
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", enum: ["formation", "inspiration", "experimentation"] },
                      title: { type: "string" },
                      content: { type: "string" },
                    },
                    required: ["category", "title", "content"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["insights"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_insights" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ insights: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let insights: any[] = [];

    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        insights = parsed.insights || [];
      }
    } catch (e) {
      console.error("Parse error:", e);
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ insights: [], error: e instanceof Error ? e.message : "Unknown" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
