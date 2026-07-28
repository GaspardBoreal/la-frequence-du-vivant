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
  name: "get_propriete_overview",
  title: "Fiche propriété",
  description:
    "Fiche complète d'une propriété : identité, parcelles cadastrales (surfaces, géométrie), événements de marche liés et contributeurs.",
  inputSchema: {
    propriete: z
      .string()
      .min(1)
      .describe("Identifiant (UUID) ou slug de la propriété, ex. 'jardin-monde-deviat'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ propriete }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const target = await resolveProprieteId(supabase, propriete);
    if (!target) return errorResult(`Propriété introuvable ou non accessible : ${propriete}`);

    const [{ data: fiche }, parcelles, events] = await Promise.all([
      supabase.from("proprietes").select("*").eq("id", target.id).maybeSingle(),
      supabase.rpc("list_propriete_parcelles", { _propriete_id: target.id }),
      supabase
        .from("propriete_marche_events")
        .select("marche_events(id, title, date_marche, exploration_id, slug)")
        .eq("propriete_id", target.id),
    ]);

    if (parcelles.error) return errorResult(parcelles.error.message);

    return jsonResult({
      propriete: fiche ?? { id: target.id, nom: target.nom, slug: target.slug },
      parcelles: parcelles.data ?? [],
      surfaceTotaleM2: ((parcelles.data as any[]) ?? []).reduce(
        (s, p) => s + (p.contenance_m2 ?? 0),
        0
      ),
      evenements: ((events.data as any[]) ?? []).map((r) => r.marche_events).filter(Boolean),
    });
  },
});
