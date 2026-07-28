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
  name: "get_propriete_biodiversity",
  title: "Synthèse biodiversité",
  description:
    "Synthèse biodiversité d'une propriété : nombre total d'espèces, répartition par règne, top espèces, dernier événement et dernière observation. Source identique à celle affichée dans l'application.",
  inputSchema: {
    propriete: z.string().min(1).describe("Identifiant (UUID) ou slug de la propriété."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ propriete }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const target = await resolveProprieteId(supabase, propriete);
    if (!target) return errorResult(`Propriété introuvable ou non accessible : ${propriete}`);

    const { data, error } = await supabase.rpc("get_propriete_biodiversity", {
      p_propriete_id: target.id,
    });
    if (error) return errorResult(error.message);
    return jsonResult({ propriete: target, biodiversite: data ?? {} });
  },
});
