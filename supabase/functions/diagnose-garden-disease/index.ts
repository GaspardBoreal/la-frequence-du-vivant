import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders } from "../_shared/auth-helper.ts";

/**
 * Le médecin du jardin : croise les images de la consultation, la lecture du
 * sol (registre des prélèvements), la météo des 30 derniers jours et la base
 * de connaissance des maladies pour proposer des hypothèses hiérarchisées et
 * une prescription vivante, du geste le plus doux au plus fort.
 */

interface KbEntry {
  common_name: string;
  scientific_name?: string | null;
  kind?: string | null;
  hosts?: string[] | null;
  signs?: string | null;
  confusions?: string | null;
  gravity?: string | null;
  favouring_conditions?: string | null;
  eco_actions?: unknown;
  prevention?: unknown;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { errorResponse } = await validateAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      subject,
      organ,
      aspect,
      onset,
      images = [],
      soil = null,
      weather = null,
      kb = [],
      month,
    }: {
      subject?: string;
      organ?: string;
      aspect?: string;
      onset?: string;
      images?: string[];
      soil?: Record<string, unknown> | null;
      weather?: Record<string, unknown> | null;
      kb?: KbEntry[];
      month?: number;
    } = body ?? {};

    if (!subject || typeof subject !== "string" || subject.length > 300) {
      return new Response(JSON.stringify({ error: "Sujet observé manquant ou invalide." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const kbDigest = (Array.isArray(kb) ? kb.slice(0, 14) : [])
      .map((e) => {
        const actions = Array.isArray(e.eco_actions)
          ? (e.eco_actions as Array<{ intensity?: number; label?: string }>)
              .map((a) => `${a.intensity ?? "?"}. ${a.label ?? ""}`)
              .join(" | ")
          : "";
        return [
          `— ${e.common_name}${e.scientific_name ? ` (${e.scientific_name})` : ""} [${e.kind ?? "?"}]`,
          `  hôtes : ${(e.hosts || []).join(", ") || "non précisé"}`,
          `  signes : ${e.signs ?? "—"}`,
          `  confusions : ${e.confusions ?? "—"}`,
          `  gravité : ${e.gravity ?? "—"}`,
          `  conditions favorisantes : ${e.favouring_conditions ?? "—"}`,
          `  gestes écologiques connus : ${actions || "—"}`,
        ].join("\n");
      })
      .join("\n");

    const soilDigest = soil
      ? [
          `structure : ${soil.structure ?? "non renseignée"}`,
          `texture : ${soil.texture ?? "non renseignée"}`,
          `pH : ${soil.ph ?? "non mesuré"}`,
          `signes de vie : ${Array.isArray(soil.life_signs) && soil.life_signs.length ? (soil.life_signs as string[]).join(", ") : "aucun relevé"}`,
        ].join(" · ")
      : "registre de sol non renseigné";

    const weatherDigest = weather
      ? [
          `température moyenne 30 j : ${weather.tempMean != null ? `${Number(weather.tempMean).toFixed(1)} °C` : "—"}`,
          `maxi moyen : ${weather.tempMax != null ? `${Number(weather.tempMax).toFixed(1)} °C` : "—"}`,
          `pluie cumulée : ${weather.precipSum != null ? `${Number(weather.precipSum).toFixed(0)} mm` : "—"}`,
          `humidité moyenne : ${weather.humidityMean != null ? `${Number(weather.humidityMean).toFixed(0)} %` : "—"}`,
        ].join(" · ")
      : "météo indisponible";

    const systemPrompt = `Tu es le médecin préventif et curatif du jardin pour La Fréquence du Vivant.
Tu observes, tu doutes à voix haute, tu ne prescris jamais de produit de synthèse.
Tu écris en français, à la deuxième personne du pluriel, avec des mots simples et justes.
Tu emploies le vocabulaire de la maison : « Observations » (jamais « contributions »), « Fréquences » (jamais « points »).

Sujet observé : ${subject}
Organe touché : ${organ || "non précisé"}
Aspect décrit : ${aspect || "non précisé"}
Depuis quand : ${onset || "non précisé"}
Mois en cours : ${month ?? new Date().getUTCMonth() + 1}

Lecture du sol du site (registre des prélèvements) : ${soilDigest}
Météo locale des 30 derniers jours : ${weatherDigest}

Base de connaissance interne (à privilégier, mais tu peux proposer une piste hors liste si elle explique mieux les signes) :
${kbDigest || "— base vide —"}

Règles :
- Propose 2 à 3 hypothèses, classées par confiance décroissante (confiance entre 0 et 1).
- Pour chaque hypothèse : ce qui se voit, les confusions possibles, la gravité, et une « lecture du terrain » qui relie EXPLICITEMENT les signes au sol et à la météo ci-dessus (par exemple : « 78 mm de pluie et une humidité de 84 % sur trente jours, sur un sol compact : le feutrage s'installe »). N'invente aucun chiffre : n'utilise que ceux fournis.
- Propose ensuite 4 à 7 gestes, du plus doux au plus fort (intensité 1 à 5), en distinguant le volet « curatif » et le volet « préventif ». Intensité 1 = observer et mesurer, 5 = intervention la plus forte encore compatible avec l'agriculture biologique.
- Chaque geste porte une fenêtre de réalisation (« dans les 3 jours », « à la chute des feuilles »…) et une précaution météo quand elle compte.
- Si les images ne montrent rien d'exploitable, dis-le dans terrain_reading et baisse la confiance.`;

    const userContent: unknown[] = [
      { type: "text", text: "Établis le diagnostic et la prescription vivante." },
    ];
    for (const img of (Array.isArray(images) ? images : []).slice(0, 4)) {
      if (typeof img === "string" && (img.startsWith("http") || img.startsWith("data:image"))) {
        userContent.push({ type: "image_url", image_url: { url: img } });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_diagnostic",
              description: "Hypothèses de diagnostic et prescription vivante",
              parameters: {
                type: "object",
                properties: {
                  hypotheses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        common_name: { type: "string" },
                        scientific_name: { type: "string" },
                        kind: {
                          type: "string",
                          enum: ["champignon", "bacterie", "virus", "insecte", "carence", "physiologique"],
                        },
                        confidence: { type: "number" },
                        what_you_see: { type: "string" },
                        confusions: { type: "string" },
                        gravity: { type: "string" },
                        terrain_reading: { type: "string" },
                      },
                      required: [
                        "common_name",
                        "scientific_name",
                        "kind",
                        "confidence",
                        "what_you_see",
                        "confusions",
                        "gravity",
                        "terrain_reading",
                      ],
                      additionalProperties: false,
                    },
                  },
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        volet: { type: "string", enum: ["curatif", "preventif"] },
                        intensity: { type: "number" },
                        label: { type: "string" },
                        detail: { type: "string" },
                        frequency: { type: "string" },
                        weather_caution: { type: "string" },
                        window_label: { type: "string" },
                      },
                      required: [
                        "volet",
                        "intensity",
                        "label",
                        "detail",
                        "frequency",
                        "weather_caution",
                        "window_label",
                      ],
                      additionalProperties: false,
                    },
                  },
                  verdict: { type: "string" },
                },
                required: ["hypotheses", "actions", "verdict"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_diagnostic" } },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("AI gateway error:", response.status, details);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Le médecin du jardin est très sollicité. Réessayez dans un instant." }),
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
        JSON.stringify({ error: "Diagnostic indisponible", status: response.status, details }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    let parsed: Record<string, unknown> = { hypotheses: [], actions: [], verdict: "" };
    try {
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (args) parsed = JSON.parse(args);
    } catch (e) {
      console.error("Parse error:", e);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnose-garden-disease error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
