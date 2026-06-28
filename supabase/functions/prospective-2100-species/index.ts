// Edge function : génère un récit prospectif 2100 par espèce (Lovable AI Gemini Flash)
// + cache dans public.species_prospective_2100_cache.
import { createClient } from "npm:@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!lovableKey) {
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

    const supabase = createClient(supabaseUrl, serviceKey);

    // Cache hit ?
    const { data: cached } = await supabase
      .from("species_prospective_2100_cache")
      .select("scientific_name,status,narrative,generated_at")
      .eq("scientific_name", body.scientific_name)
      .maybeSingle();
    if (cached) {
      return new Response(JSON.stringify({ ...cached, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Tu es un écologue narratif. En 2 phrases (≤ 240 caractères au total), raconte le futur probable à l'horizon 2100 de cette espèce dans le sud-ouest de la France, en climat +2,5 à +3,5°C. Style sobre, poétique, factuel, sans alarmisme inutile. Réponds STRICTEMENT en JSON: {"status":"stable|recul|migrante|nouvelle","narrative":"..."}.
Espèce: ${body.scientific_name}${body.common_name ? ` (${body.common_name})` : ""}
Famille: ${body.family ?? "?"} — Taxon iconique: ${body.iconic_taxon ?? "?"}
Indice heuristique préalable: ${body.fallback_status ?? "stable"}.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      return new Response(JSON.stringify({ error: "ai_failed", detail: text }), {
        status: aiResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiJson = await aiResp.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { status?: string; narrative?: string } = {};
    try { parsed = JSON.parse(raw); } catch { /* noop */ }

    const status = ["stable", "recul", "migrante", "nouvelle"].includes(parsed.status ?? "")
      ? parsed.status!
      : (body.fallback_status ?? "stable");
    const narrative = (parsed.narrative ?? "").trim() || "Projection 2100 indisponible.";

    await supabase.from("species_prospective_2100_cache").upsert({
      scientific_name: body.scientific_name,
      status,
      narrative,
      generated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ scientific_name: body.scientific_name, status, narrative, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
