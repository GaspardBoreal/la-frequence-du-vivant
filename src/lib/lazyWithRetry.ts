import { lazy, type ComponentType } from 'react';

/**
 * React.lazy avec reprise sur échec réseau / re-optimisation Vite.
 * Un chunk peut devenir introuvable après un redéploiement ou une
 * re-optimisation des deps : on retente, puis on recharge la page une fois.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
) {
  return lazy(async () => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await factory();
      } catch (error) {
        if (attempt === retries) {
          const key = 'lazy-chunk-reloaded';
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
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
