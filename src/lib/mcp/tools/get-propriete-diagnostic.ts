import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  supabaseForUser,
  notAuthenticated,
  errorResult,
  jsonResult,
  resolveProprieteId,
} from "../supabaseForUser";

export default defineTool({
  name: "get_propriete_diagnostic",
  title: "Diagnostic (J'observe / J'analyse / J'identifie)",
  description:
    "Données brutes des 3 étapes du diagnostic d'une propriété : observations du site, analyse du sol (prélèvements, structure, texture, pH, vie) et diagnostic flore (plantes observées, concordance, score ICG).",
  inputSchema: {
    propriete: z.string().min(1).describe("Identifiant (UUID) ou slug de la propriété."),
    etape: z
      .enum(["observe", "sol", "flore", "toutes"])
      .nullable()
      .describe("Étape à retourner. Null = toutes."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ propriete, etape }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const target = await resolveProprieteId(supabase, propriete);
    if (!target) return errorResult(`Propriété introuvable ou non accessible : ${propriete}`);

    const want = etape ?? "toutes";
    const out: Record<string, unknown> = { propriete: target };

    if (want === "observe" || want === "toutes") {
      const { data, error } = await supabase
        .from("propriete_observations")
        .select("*")
        .eq("propriete_id", target.id)
        .maybeSingle();
      if (error && (error as any).code !== "PGRST116") return errorResult(error.message);
      out.observe = data ?? null;
    }

    if (want === "sol" || want === "toutes") {
      const { data, error } = await supabase
        .from("propriete_soil_diagnostics")
        .select("*")
        .eq("propriete_id", target.id)
        .maybeSingle();
      if (error && (error as any).code !== "PGRST116") return errorResult(error.message);
      out.sol = data ?? null;
    }

    if (want === "flore" || want === "toutes") {
      const { data, error } = await supabase
        .from("propriete_flora_diagnostics")
        .select("*")
        .eq("propriete_id", target.id)
        .maybeSingle();
      if (error && (error as any).code !== "PGRST116") return errorResult(error.message);
      out.flore = data ?? null;
    }

    return jsonResult(out);
  },
});
