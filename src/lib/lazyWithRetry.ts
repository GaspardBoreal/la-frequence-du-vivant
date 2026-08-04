import { lazy, type ComponentType } from 'react';

const RELOAD_PREFIX = 'lazy-chunk-reloaded:';

function safeSession() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * React.lazy avec reprise sur échec réseau / re-optimisation Vite.
 * Un chunk peut devenir introuvable après un redéploiement ou une
 * re-optimisation des deps : on retente, puis on recharge la page une fois
 * PAR CHUNK (et non une seule fois pour toute la session, sinon le second
 * chunk périmé finit en écran blanc).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  chunkKey?: string,
) {
  const key = `${RELOAD_PREFIX}${chunkKey ?? factory.toString()}`;

  return lazy(async () => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const mod = await factory();
        safeSession()?.removeItem(key);
        return mod;
      } catch (error) {
        if (attempt === retries) {
          const storage = safeSession();
          if (storage && !storage.getItem(key)) {
            storage.setItem(key, '1');
            // Recharge complète : le nouveau index.html référence les bons hash.
            window.location.reload();
            // Ne se résout jamais : la page se recharge.
            return new Promise<{ default: T }>(() => {});
          }
          throw error;
        }
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    throw new Error('unreachable');
  });
}
