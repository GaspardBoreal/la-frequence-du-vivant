import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders } from "../_shared/auth-helper.ts";

/**
 * Les trois premiers gestes du jardin, rédigés par l'IA de jardin à partir de
 * l'intention *courante* (priorité, problème, cap à six mois, lieu, moyens).
 * Écriture côté client via `save_propriete_onboarding` : ici, pas de base.
 */

const SKETCHES = ["bocal", "haie", "sol", "eau", "semis", "observation", "taille", "compost"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { errorResponse } = await validateAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const { context = [] }: { proprieteId?: string; context?: string[] } = await req.json();
    const lignes = Array.isArray(context)
      ? context.filter((l) => typeof l === "string" && l.trim()).slice(0, 40)
      : [];

    if (lignes.length === 0) {
      return new Response(JSON.stringify({ error: "Intention vide." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const month = new Date().getMonth() + 1;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "Tu es l'IA de jardin de Fréquence Jardin : sobre, concrète, jamais bavarde. " +
              "Tu proposes exactement trois premiers gestes, du plus doux au plus engageant, " +
              "réalisables par la personne décrite, avec ses moyens et son temps. " +
              "Le premier geste répond directement à sa priorité (et au problème qu'elle décrit, " +
              "s'il y en a un). Le deuxième sert son cap à six mois. Le troisième soigne le vivant " +
              "du lieu (sol, eau, refuges). Titre de 3 à 6 mots, explication d'une à deux phrases, " +
              "en français, sans emoji, sans jargon inutile, adaptée à la saison (mois " + month + ").",
          },
          { role: "user", content: `Intention du jardin :\n${lignes.map((l) => `- ${l}`).join("\n")}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_gestures",
              description: "Les trois premiers gestes du jardin",
              parameters: {
                type: "object",
                properties: {
                  gestures: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        detail: { type: "string" },
                        sketch: { type: "string", enum: SKETCHES },
                      },
                      required: ["title", "detail", "sketch"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["gestures"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_gestures" } },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("AI gateway error:", response.status, details);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "L'IA de jardin est très sollicitée. Réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés pour cet espace de travail." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "Rédaction des gestes indisponible", status: response.status }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    let gestures: Array<{ title: string; detail: string; sketch?: string }> = [];
    try {
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (args) gestures = JSON.parse(args).gestures ?? [];
    } catch (e) {
      console.error("Parse error:", e);
    }

    gestures = gestures
      .filter((g) => g && typeof g.title === "string" && g.title.trim())
      .slice(0, 3)
      .map((g) => ({
        title: g.title.trim(),
        detail: typeof g.detail === "string" ? g.detail.trim() : "",
        sketch: g.sketch && SKETCHES.includes(g.sketch) ? g.sketch : null,
      }));

    return new Response(JSON.stringify({ gestures }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-garden-gestures error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
