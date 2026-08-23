import { supabase } from '@/integrations/supabase/client';

export const SESSION_EXPIRED_MSG =
  'Votre session a expiré. Reconnectez-vous, puis relancez l’opération.';

/**
 * Garantit un jeton utilisateur frais avant un appel de fonction admin.
 * Sans session valide, `functions.invoke` enverrait la clé anon et la fonction
 * répondrait un 401 « Auth session missing! » peu lisible : on préfère échouer
 * tôt avec un message actionnable.
 */
export const ensureFreshSession = async (): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error(SESSION_EXPIRED_MSG);
  const expiresAt = (session.expires_at ?? 0) * 1000;
  if (expiresAt - Date.now() < 60_000) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) throw new Error(SESSION_EXPIRED_MSG);
  }
};

/**
 * Invoque une edge function admin : session rafraîchie au préalable, corps
 * d'erreur extrait, et 401 traduit en consigne de reconnexion.
 */
export const invokeAdminFunction = async <T = Record<string, unknown>>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> => {
  await ensureFreshSession();
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let msg = error.message || 'Échec';
    let status: number | undefined;
    try {
      const ctx = (error as { context?: Response }).context;
      status = ctx?.status;
      if (ctx && typeof ctx.json === 'function') {
        const parsed = (await ctx.json()) as { error?: string };
        if (parsed?.error) msg = parsed.error;
      }
    } catch {
      /* noop */
    }
    if (status === 401 || /auth session missing|invalid or expired session/i.test(msg)) {
      throw new Error(SESSION_EXPIRED_MSG);
    }
    throw new Error(msg);
  }
  const payload = data as T & { error?: string };
  if (payload && typeof payload === 'object' && payload.error) throw new Error(payload.error);
  return data as T;
};
