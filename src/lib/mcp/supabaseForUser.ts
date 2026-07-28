import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Client Supabase agissant AU NOM de l'utilisateur qui a autorisé le connecteur.
 * Les politiques RLS existantes s'appliquent telles quelles : aucune clé
 * service_role n'est utilisée ici, jamais.
 */
export function supabaseForUser(ctx: ToolContext) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const notAuthenticated = () => ({
  content: [{ type: "text" as const, text: "Non authentifié : reconnectez le connecteur." }],
  isError: true,
});

export const errorResult = (message: string) => ({
  content: [{ type: "text" as const, text: message }],
  isError: true,
});

export const jsonResult = (payload: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  structuredContent: payload as Record<string, unknown>,
});

/** Résout une propriété par id OU slug (les deux acceptés côté outils). */
export async function resolveProprieteId(
  supabase: ReturnType<typeof supabaseForUser>,
  ref: string
): Promise<{ id: string; nom: string | null; slug: string | null } | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
  const query = supabase.from("proprietes").select("id, nom, slug").limit(1);
  const { data } = isUuid ? await query.eq("id", ref) : await query.eq("slug", ref);
  const row = (data ?? [])[0] as { id: string; nom: string | null; slug: string | null } | undefined;
  return row ?? null;
}
