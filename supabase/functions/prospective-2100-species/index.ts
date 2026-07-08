// Edge function : génère un récit prospectif 2100 par espèce (Lovable AI Gemini Flash)
// + cache dans public.species_prospective_2100_cache.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  scientific_name: string;
  common_name?: string;
  iconic_taxon?: string;
  family?: string;
  fallback_status?: string;
}

const ALLOWED_STATUS = ["stable", "recul", "migrante", "nouvelle"] as const;

/** Extrait un objet JSON même si l'IA l'entoure de ```json … ``` ou de bavardage. */
function safeParseJson(raw: string): { status?: string; narrative?: string } {
  if (!raw) return {};
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Essaye d'extraire le premier bloc {...}
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* noop */ }
    }
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const t0 = Date.now();
  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!lovableKey) {
      console.error("[prospective-2100] missing LOVABLE_API_KEY");
      return new Response(JSON.stringify({ error: "missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.scientific_name) {
      return new Response(JSON.stringify({ error: "scientific_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`[prospective-2100] start sci=${body.scientific_name}`);

    const supabase = createClient(supabaseUrl, serviceKey);

    // Cache hit ?
    const { data: cached } = await supabase
      .from("species_prospective_2100_cache")
      .select("scientific_name,status,narrative,generated_at")
      .eq("scientific_name", body.scientific_name)
      .maybeSingle();
    if (cached && cached.narrative && cached.narrative.length > 10) {
      console.log(`[prospective-2100] cache-hit sci=${body.scientific_name}`);
      return new Response(JSON.stringify({ ...cached, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Tu es un écologue narratif. En 2 phrases (≤ 240 caractères au total), raconte le futur probable à l'horizon 2100 de cette espèce dans le sud-ouest de la France, en climat +2,5 à +3,5°C. Style sobre, poétique, factuel, sans alarmisme inutile. Réponds STRICTEMENT en JSON: {"status":"stable|recul|migrante|nouvelle","narrative":"..."}.
Espèce: ${body.scientific_name}${body.common_name ? ` (${body.common_name})` : ""}
Famille: ${body.family ?? "?"} — Taxon iconique: ${body.iconic_taxon ?? "?"}
Indice heuristique préalable: ${body.fallback_status ?? "stable"}.`;

    const model = "google/gemini-2.5-flash";
    console.log(`[prospective-2100] ai-call model=${model}`);
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableKey,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    console.log(`[prospective-2100] ai-status http=${aiResp.status}`);
    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error(`[prospective-2100] ai-failed status=${aiResp.status} body=${text.slice(0, 400)}`);
      // Propager 402 / 429 pour un affichage front contextuel
      const status = aiResp.status === 402 ? 402 : aiResp.status === 429 ? 429 : 502;
      const errorCode =
        status === 402 ? "credits_exhausted" : status === 429 ? "rate_limited" : "ai_failed";
      return new Response(JSON.stringify({ error: errorCode, detail: text.slice(0, 300) }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiJson = await aiResp.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    const parsed = safeParseJson(raw);
    console.log(`[prospective-2100] parse-ok status=${parsed.status} narr_len=${(parsed.narrative ?? "").length}`);

    const status = ALLOWED_STATUS.includes(parsed.status as any)
      ? parsed.status!
      : (body.fallback_status ?? "stable");
    const narrative = (parsed.narrative ?? "").trim();

    if (!narrative) {
      // On préfère renvoyer une erreur explicite plutôt qu'un texte vide en cache.
      console.warn(`[prospective-2100] empty-narrative raw=${raw.slice(0, 200)}`);
      return new Response(
        JSON.stringify({ error: "empty_narrative", detail: raw.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase.from("species_prospective_2100_cache").upsert({
      scientific_name: body.scientific_name,
      status,
      narrative,
      generated_at: new Date().toISOString(),
    });

    console.log(`[prospective-2100] done sci=${body.scientific_name} dur=${Date.now() - t0}ms`);
    return new Response(
      JSON.stringify({
        scientific_name: body.scientific_name,
        status,
        narrative,
        cached: false,
        model,
        duration_ms: Date.now() - t0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[prospective-2100] fatal", e);
    return new Response(JSON.stringify({ error: "internal", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
