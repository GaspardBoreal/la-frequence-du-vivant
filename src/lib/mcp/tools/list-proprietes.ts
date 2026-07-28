import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated, errorResult, jsonResult } from "../supabaseForUser";

export default defineTool({
  name: "list_proprietes",
  title: "Lister les propriétés",
  description:
    "Liste les propriétés (jardins, domaines, sites) accessibles à l'utilisateur connecté, avec id, nom, slug, ville et rôle.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("get_user_apps_access");
    if (error) return errorResult(error.message);
    const access = (data as any) ?? {};
    return jsonResult({
      proprietes: access.proprietesAccessibles ?? [],
      proprietePrincipaleId: access.proprietePrincipaleId ?? null,
      hasMarcheurAccess: !!access.hasMarcheurAccess,
    });
  },
});
