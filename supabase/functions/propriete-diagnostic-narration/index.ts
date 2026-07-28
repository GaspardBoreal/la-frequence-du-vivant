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
        ? `Concordance sol/flore : ICG ${c.icg}/100 (${c.band ?? "n.c."}), ${c.points}/${c.max} points, fiabilité ${c.reliability ?? "n.c."} % sur ${c.evaluated ?? "?"}/8 lignes évaluées.${
            c.rows?.length
              ? ` Détail : ${c.rows
                  .map((r) => `${r.label} — sol ${r.soil} / flore ${r.flora} → ${r.match}`)
                  .join(" ; ")}.`
              : ""
          }`
        : "",

      body.observationNotes ? `Notes d'observation du site (Étape 1) : ${body.observationNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const length = (body as { length?: string }).length ?? "standard";
    const lengthRule =
      length === "court"
        ? "120 à 180 mots par variante, 3 paragraphes."
        : length === "detaille"
          ? "330 à 430 mots par variante, 4 paragraphes."
          : "220 à 320 mots par variante, 4 paragraphes.";

    const systemPrompt = `Tu es agronome-écologue, spécialiste de la lecture des sols par les plantes bio-indicatrices (méthode CNPF / Flore forestière française, Dumé-Gauberville-Mansion-Rameau, 2018).
Tu rédiges la narration du diagnostic d'un site précis, à destination d'un propriétaire ou d'un paysagiste professionnel.

Tu produis DEUX variantes du MÊME diagnostic, strictement identiques sur les faits, différentes seulement de registre :
- variante "agronomique" : précise, factuelle, orientée décision. Elle cite les chiffres (ICG, points, fiabilité), nomme les pôles dominants et conclut par des préconisations prudentes.
- variante "sensible" : narrative et incarnée, le site raconté par sa végétation, sans jamais perdre l'exactitude des données ni les chiffres essentiels.

STRUCTURE de chaque variante :
  1. Ce que la flore raconte du site (eau, texture, richesse, réaction).
  2. Ce que confirme ou nuance l'analyse de sol de l'Étape 2.
  3. La cohérence globale (ICG) et ce qu'elle signifie honnêtement, en mentionnant la fiabilité si des données manquent.
  4. Deux ou trois pistes d'action concrètes et prudentes.

RÈGLES ABSOLUES :
- ${lengthRule} Paragraphes séparés par une ligne vide, sans titres ni puces.
- Ne JAMAIS inventer d'espèce, de chiffre ou d'observation absente du contexte.
- Toujours nommer le doute quand la fiabilité est faible.
- Jamais de promesse commerciale, jamais de jargon inutile. Français.

FORMAT DE SORTIE : uniquement un objet JSON valide, sans texte autour, sans balises de code :
{"variants":[{"key":"agronomique","text":"..."},{"key":"sensible","text":"..."}]}`;

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
          {
            role: "user",
            content: `Voici les données du diagnostic. Réponds en JSON avec les deux variantes :\n\n${context}`,
          },
        ],
        response_format: { type: "json_object" },
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
    const raw: string = data?.choices?.[0]?.message?.content?.trim() ?? "";

    const LABELS: Record<string, string> = {
      agronomique: "Agronomique",
      sensible: "Sensible",
    };

    // Parsing tolérant : JSON strict, JSON encadré de ```…```, puis repli texte libre.
    let variants: Array<{ key: string; label: string; text: string }> = [];
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      const list = Array.isArray(parsed?.variants) ? parsed.variants : [];
      variants = list
        .map((v: { key?: string; text?: string }, i: number) => {
          const key = v?.key === "sensible" || i === 1 ? "sensible" : "agronomique";
          return { key, label: LABELS[key], text: (v?.text ?? "").trim() };
        })
        .filter((v: { text: string }) => v.text.length > 0);
    } catch {
      // ignore — repli ci-dessous
    }

    if (variants.length === 0 && cleaned) {
      variants = [{ key: "agronomique", label: LABELS.agronomique, text: cleaned }];
    }
    if (variants.length === 0) {
      return new Response(JSON.stringify({ error: "L'IA n'a rien retourné d'exploitable." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      // `narration` conservé pour rétrocompatibilité
      JSON.stringify({ variants, narration: variants[0].text, generatedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
