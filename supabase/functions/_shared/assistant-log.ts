// Journalisation des échanges avec l'Assistant, pour reconstituer le parcours
// d'usage d'un marcheur. Écriture avec le rôle de service, sans jamais bloquer
// ni ralentir la réponse en cours de diffusion.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

export interface AssistantLogMeta {
  userId: string;
  /** Surface d'origine : 'jardin', 'communaute', 'iot', 'tour'… */
  surface: string;
  proprieteId?: string | null;
  explorationId?: string | null;
  marcheEventId?: string | null;
  model?: string | null;
  /** Identifiants des contextes activés dans la console. */
  contexts?: unknown;
  /** Dernière question posée (texte brut). */
  question: string;
}

const serviceClient = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

/** Une conversation par surface et par cible, réutilisée pendant 2 heures. */
async function resolveConversation(
  db: ReturnType<typeof createClient>,
  meta: AssistantLogMeta,
): Promise<string | null> {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  let q = db
    .from("assistant_conversations")
    .select("id")
    .eq("user_id", meta.userId)
    .eq("surface", meta.surface)
    .gte("last_message_at", since)
    .order("last_message_at", { ascending: false })
    .limit(1);

  q = meta.proprieteId ? q.eq("propriete_id", meta.proprieteId) : q.is("propriete_id", null);

  const { data } = await q;
  if (data && data.length > 0) return data[0].id as string;

  const { data: created, error } = await db
    .from("assistant_conversations")
    .insert({
      user_id: meta.userId,
      surface: meta.surface,
      propriete_id: meta.proprieteId ?? null,
      exploration_id: meta.explorationId ?? null,
      marche_event_id: meta.marcheEventId ?? null,
      title: meta.question.slice(0, 120),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[assistant-log] conversation insert", error.message);
    return null;
  }
  return created?.id as string;
}

async function persist(meta: AssistantLogMeta, answer: string, latencyMs: number, error?: string) {
  const db = serviceClient();
  if (!db) return;
  try {
    const conversationId = await resolveConversation(db, meta);
    if (!conversationId) return;
    const contexts = Array.isArray(meta.contexts) ? meta.contexts : [];
    await db.from("assistant_messages").insert([
      {
        conversation_id: conversationId,
        user_id: meta.userId,
        role: "user",
        content: meta.question.slice(0, 20000),
        contexts,
      },
      {
        conversation_id: conversationId,
        user_id: meta.userId,
        role: "assistant",
        content: answer.slice(0, 40000),
        contexts,
        model: meta.model ?? null,
        latency_ms: latencyMs,
        error: error ?? null,
      },
    ]);
    await db
      .from("assistant_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  } catch (e) {
    console.error("[assistant-log] persist", e instanceof Error ? e.message : e);
  }
}

/** Extrait le texte d'une question éventuellement multimodale. */
export function questionText(messages: unknown): string {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as { role?: string; content?: unknown };
    if (m?.role !== "user") continue;
    if (typeof m.content === "string") return m.content;
    if (Array.isArray(m.content)) {
      return m.content
        .map((p) => (typeof p === "object" && p && "text" in p ? String((p as { text: unknown }).text ?? "") : ""))
        .join(" ")
        .trim();
    }
  }
  return "";
}

/**
 * Renvoie un flux identique à celui du modèle, tout en accumulant la réponse
 * pour la journaliser une fois la diffusion terminée.
 */
export function teeAndLogAssistant(
  body: ReadableStream<Uint8Array> | null,
  meta: AssistantLogMeta,
): ReadableStream<Uint8Array> | null {
  if (!body) return body;
  const startedAt = Date.now();
  const [toClient, toLog] = body.tee();

  const collect = (async () => {
    const decoder = new TextDecoder();
    const reader = toLog.getReader();
    let buffer = "";
    let answer = "";
    let failure: string | undefined;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") answer += delta;
          } catch {
            // fragment non JSON : ignoré
          }
        }
      }
    } catch (e) {
      failure = e instanceof Error ? e.message : String(e);
    }
    await persist(meta, answer, Date.now() - startedAt, failure);
  })();

  const runtime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(collect);

  return toClient;
}
