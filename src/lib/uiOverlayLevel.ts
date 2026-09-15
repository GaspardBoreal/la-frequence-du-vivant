import { useSyncExternalStore } from 'react';

/**
 * Registre minimal des surfaces plein écran (Atelier, cartes plein écran…).
 * Elles vivent en `z-[3000]` dans des portails : le chatbot doit passer
 * au-dessus quand l'une d'elles est ouverte, sinon il devient inaccessible.
 */
let count = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const fullscreenSurfaces = {
  get: () => count,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  push: () => {
    count += 1;
    emit();
  },
  pop: () => {
    count = Math.max(0, count - 1);
    emit();
  },
};

/** Vrai si une surface plein écran est ouverte. */
export function useFullscreenSurfaceOpen(): boolean {
  return useSyncExternalStore(
    fullscreenSurfaces.subscribe,
    () => count > 0,
    () => false,
  );
}

/**
 * Verrou de défilement partagé : compteur unique pour toutes les surfaces
 * faites main. Évite qu'une surface restaure une valeur d'`overflow` périmée
 * et laisse la page figée.
 */
let scrollLocks = 0;
let previousOverflow = '';

export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {};
  if (scrollLocks === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    scrollLocks = Math.max(0, scrollLocks - 1);
    if (scrollLocks === 0) document.body.style.overflow = previousOverflow;
  };
}

/** Niveaux de superposition du chatbot selon le contexte. */
export const CHAT_Z = {
  base: 1200,
  aboveFullscreen: 3200,
} as const;
