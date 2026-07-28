import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  supabaseForUser,
  notAuthenticated,
  errorResult,
  jsonResult,
  resolveProprieteId,
} from "../supabaseForUser";

const normName = (s: string | null | undefined): string =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default defineTool({
  name: "get_propriete_species_pool",
  title: "Pool d'espèces observées",
  description:
    "Liste dédupliquée des espèces observées sur une propriété (nom scientifique, nom commun, règne, famille, nombre d'observations, dernière observation). Matière première pour auditer les comptages affichés.",
  inputSchema: {
    propriete: z.string().min(1).describe("Identifiant (UUID) ou slug de la propriété."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .nullable()
      .describe("Nombre maximum d'espèces retournées (défaut 300). Null = 300."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ propriete, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const target = await resolveProprieteId(supabase, propriete);
    if (!target) return errorResult(`Propriété introuvable ou non accessible : ${propriete}`);

    const { data: links, error: linkErr } = await supabase
      .from("propriete_marche_events")
      .select("marche_events!inner(exploration_id)")
      .eq("propriete_id", target.id);
    if (linkErr) return errorResult(linkErr.message);

    const explorationIds = Array.from(
      new Set(
        ((links as any[]) ?? [])
          .map((r) => r.marche_events?.exploration_id)
          .filter((v: unknown): v is string => !!v)
      )
    );

    const bucket = new Map<
      string,
      {
        scientific: string;
        common: string | null;
        kingdom: string | null;
        family: string | null;
        iconicTaxon: string | null;
        observations: number;
        lastSeen: string | null;
      }
    >();

    for (const explorationId of explorationIds) {
      const { data, error } = await supabase.rpc("get_exploration_species_pool", {
        p_exploration_id: explorationId,
      });
      if (error) return errorResult(error.message);
      for (const sp of ((data as any)?.species ?? []) as any[]) {
        const scientific = sp.scientific_name || sp.common_name || sp.key || "";
        const key = normName(scientific);
        if (!key) continue;
        const prev = bucket.get(key);
        if (prev) {
          prev.observations += sp.observations ?? 0;
          if (sp.last_seen && (!prev.lastSeen || sp.last_seen > prev.lastSeen)) {
            prev.lastSeen = sp.last_seen;
          }
          prev.common = prev.common ?? sp.common_name ?? null;
        } else {
          bucket.set(key, {
            scientific,
            common: sp.common_name ?? null,
            kingdom: sp.kingdom ?? null,
            family: sp.family ?? null,
            iconicTaxon: sp.iconic_taxon ?? null,
            observations: sp.observations ?? 0,
            lastSeen: sp.last_seen ?? null,
          });
        }
      }
    }

    const all = Array.from(bucket.values()).sort((a, b) => b.observations - a.observations);
    const max = limit ?? 300;

    return jsonResult({
      propriete: target,
      explorationIds,
      speciesTotal: all.length,
      observationsTotal: all.reduce((s, sp) => s + sp.observations, 0),
      returned: Math.min(max, all.length),
      species: all.slice(0, max),
    });
  },
});
