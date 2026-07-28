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
  name: "get_propriete_observation_points",
  title: "Points d'observation géolocalisés",
  description:
    "Observations géolocalisées rattachées à une propriété (espèce, coordonnées, date, source marcheur ou iNaturalist), corrections GPS éditoriales déjà appliquées. Utile pour vérifier les cartes et les comptages.",
  inputSchema: {
    propriete: z.string().min(1).describe("Identifiant (UUID) ou slug de la propriété."),
    espece: z
      .string()
      .nullable()
      .describe("Filtre optionnel sur le nom scientifique ou commun (recherche partielle). Null = toutes."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(2000)
      .nullable()
      .describe("Nombre maximum de points retournés (défaut 500). Null = 500."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ propriete, espece, limit }, ctx) => {
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

    const needle = (espece ?? "").toLowerCase().trim();
    const points: any[] = [];

    for (const explorationId of explorationIds) {
      const { data, error } = await supabase.rpc("get_exploration_species_pool", {
        p_exploration_id: explorationId,
      });
      if (error) return errorResult(error.message);
      for (const sp of ((data as any)?.species ?? []) as any[]) {
        const scientific = sp.scientific_name || sp.key || "";
        if (
          needle &&
          !scientific.toLowerCase().includes(needle) &&
          !(sp.common_name || "").toLowerCase().includes(needle)
        ) {
          continue;
        }
        const attrs = [
          ...(Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : []),
          ...(Array.isArray(sp.attributions) ? sp.attributions : []),
        ];
        for (const a of attrs) {
          const lat = a.lat ?? a.latitude ?? null;
          const lng = a.lng ?? a.longitude ?? null;
          if (lat == null || lng == null) continue;
          points.push({
            scientificName: scientific,
            commonName: sp.common_name ?? null,
            kingdom: sp.kingdom ?? null,
            lat,
            lng,
            observationDate: a.observed_on ?? a.observation_date ?? a.date ?? null,
            source: a.source ?? (a.inat_observation_id ? "inaturalist" : "marcheur"),
            observer: a.observer_name ?? a.observer_login ?? null,
            explorationId,
          });
        }
      }
    }

    const max = limit ?? 500;
    return jsonResult({
      propriete: target,
      explorationIds,
      pointsTotal: points.length,
      returned: Math.min(max, points.length),
      points: points.slice(0, max),
    });
  },
});
