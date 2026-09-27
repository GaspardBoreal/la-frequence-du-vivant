import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAuth, forbiddenResponse, corsHeaders } from "../_shared/auth-helper.ts";
import { fetchInatFr } from "../_shared/inat-fr-name.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const { isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!isAdmin) return forbiddenResponse();

    const body = await req.json().catch(() => ({}));
    const offset = Math.max(0, Number(body?.offset) || 0);
    const limit = Math.min(50, Math.max(1, Number(body?.limit) || 50));
    const dryRun = !!body?.dryRun;

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: rows, error, count } = await sb
      .from("species_translations")
      .select("id, scientific_name, common_name_fr, alternative_names_fr, source", { count: "exact" })
      .in("source", ["ai", "wikipedia"])
      .order("scientific_name")
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const changed: Array<{ sci: string; before: string | null; after: string }> = [];
    const unchanged: string[] = [];
    const notFound: string[] = [];

    for (const r of rows || []) {
      const fr = await fetchInatFr(r.scientific_name);
      await sleep(1000);
      if (!fr) { notFound.push(r.scientific_name); continue; }
      if ((r.common_name_fr || "").trim().toLowerCase() === fr.toLowerCase()) {
        unchanged.push(r.scientific_name);
        if (!dryRun) await sb.from("species_translations").update({ source: "inaturalist", confidence_level: "high" }).eq("id", r.id);
        continue;
      }
      changed.push({ sci: r.scientific_name, before: r.common_name_fr, after: fr });
      if (!dryRun) {
        const alts = new Set<string>(r.alternative_names_fr || []);
        if (r.common_name_fr) alts.add(r.common_name_fr);
        await sb.from("species_translations").update({
          common_name_fr: fr, source: "inaturalist", confidence_level: "high",
          alternative_names_fr: Array.from(alts), updated_at: new Date().toISOString(),
        }).eq("id", r.id);
      }
    }

    // Rows switched to 'inaturalist' leave the filtered set: next page keeps the same offset
    // except for rows that stayed (notFound) — hence nextOffset = offset + notFound.length.
    const processed = (rows || []).length;
    const nextOffset = dryRun ? offset + processed : offset + notFound.length;
    return json({ processed, remainingApprox: Math.max(0, (count || 0) - processed), nextOffset, done: processed < limit, changed, unchanged, notFound });
  } catch (e: any) {
    console.error("realign-species-names", e);
    return json({ error: e?.message || "error" }, 500);
  }
});
