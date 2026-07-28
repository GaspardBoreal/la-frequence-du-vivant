import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  propertyName?: string;
  commune?: string | null;
  plants?: Array<{ name: string; latin?: string; family?: string }>;
  poles?: Array<{ label: string; axis: string; level: string; points: number }>;
  soil?: Record<string, unknown>;
  concordance?: {
    icg: number;
    band: string;
    points: number;
    max: number;
    reliability: number;
    evaluated: number;
    rows: Array<{ label: string; soil: string; flora: string; match: string }>;
  };
  observationNotes?: string | null;
  speciesTotal?: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY manquante" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Payload;
    const c = body.concordance;

    const context = [
      `Site : ${body.propertyName ?? "propriété"}${body.commune ? ` (${body.commune})` : ""}.`,
      body.speciesTotal ? `Espèces observées sur le site (science participative) : ${body.speciesTotal}.` : "",
      body.plants?.length
        ? `Cortège bio-indicateur relevé (${body.plants.length}) : ${body.plants
            .map((p) => `${p.name}${p.latin ? ` (${p.latin})` : ""}`)
            .join(", ")}.`
        : "Aucune plante bio-indicatrice cochée.",
      body.poles?.length
        ? `Somme des indices par pôle : ${body.poles
            .map((p) => `${p.label} = ${p.points} pt (${p.level})`)
            .join(" · ")}.`
        : "",
      body.soil ? `Lecture du sol (Étape 2) : ${JSON.stringify(body.soil)}.` : "",
      c
        ? `Concordance sol/flore : ICG ${c.icg}/100 (${c.band}), ${c.points}/${c.max} points, fiabilité ${c.reliability} % sur ${c.evaluated}/8 lignes évaluées. Détail : ${c.rows
            .map((r) => `${r.label} — sol ${r.soil} / flore ${r.flora} → ${r.match}`)
            .join(" ; ")}.`
        : "",
      body.observationNotes ? `Notes d'observation du site (Étape 1) : ${body.observationNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `Tu es agronome-écologue, spécialiste de la lecture des sols par les plantes bio-indicatrices (méthode CNPF / Flore forestière française, Dumé-Gauberville-Mansion-Rameau, 2018).
Tu rédiges la narration du diagnostic d'un site précis, à destination d'un propriétaire ou d'un paysagiste professionnel.

RÈGLES :
- 4 paragraphes courts, séparés par une ligne vide, sans titres ni puces.
  1. Ce que la flore raconte du site (eau, texture, richesse, réaction).
  2. Ce que confirme ou nuance l'analyse de sol de l'Étape 2.
  3. La cohérence globale (ICG) et ce qu'elle signifie honnêtement, en mentionnant la fiabilité si des données manquent.
  4. Deux ou trois pistes d'action concrètes et prudentes.
- Écriture précise, sobre, vivante ; jamais de jargon inutile, jamais de promesse commerciale.
- Ne JAMAIS inventer d'espèce, de chiffre ou d'observation absente du contexte.
- Toujours nommer le doute quand la fiabilité est faible.
- 220 à 320 mots, en français.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voici les données du diagnostic :\n\n${context}` },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      const status = res.status === 429 || res.status === 402 ? res.status : 500;
      const error =
        res.status === 429
          ? "Trop de requêtes, réessayez dans un instant."
          : res.status === 402
            ? "Crédits IA épuisés — rechargez votre espace de travail."
            : `Erreur IA (${res.status}) : ${text.slice(0, 300)}`;
      return new Response(JSON.stringify({ error }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const narration = data?.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ narration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
