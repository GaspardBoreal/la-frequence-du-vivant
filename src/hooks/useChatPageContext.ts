import { useEffect, useSyncExternalStore } from 'react';

export interface ChatEntity {
  type: 'marche_event' | 'marcheur' | 'exploration';
  id: string;
}

export interface ChatPageState {
  /** Libellé humain de la fiche (ex: "Marche du Vivant à DEVIAT, 14 mars 2026") */
  label?: string;
  /** Onglet actuellement actif (ex: "Vue d'ensemble", "Marcheurs") */
  activeTab?: string;
  /** Filtres en cours (libre) */
  filters?: Record<string, unknown>;
}

interface State {
  entity: ChatEntity | null;
  pageState: ChatPageState;
}

let state: State = { entity: null, pageState: {} };
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

const store = {
  getState: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setContext: (entity: ChatEntity | null, pageState: ChatPageState = {}) => {
    setState({ entity, pageState });
  },
  setPageState: (pageState: ChatPageState) => {
    setState({ entity: state.entity, pageState: { ...state.pageState, ...pageState } });
  },
  clear: () => setState({ entity: null, pageState: {} }),
};

/**
 * Hook React qui s'abonne au store et retourne une slice du state.
 * Imite l'API de zustand pour minimiser les changements appelants.
 */
export function useChatPageContextStore<T>(selector: (s: State & {
  setContext: typeof store.setContext;
  setPageState: typeof store.setPageState;
  clear: typeof store.clear;
}) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector({
      ...state,
      setContext: store.setContext,
      setPageState: store.setPageState,
      clear: store.clear,
    }),
    () => selector({
      ...state,
      setContext: store.setContext,
      setPageState: store.setPageState,
      clear: store.clear,
    }),
  );
}

/** Accès direct (non-réactif) — utile pour set depuis n'importe où. */
export const chatPageContext = store;

/**
 * Helper hook : qu'une page admin pose au montage pour signaler au chatbot
 * la fiche en cours de consultation et son état d'écran.
 *
 * @example
 *   useChatPageContextProvider(
 *     event ? { type: 'marche_event', id: event.id } : null,
 *     { label: event?.titre, activeTab: 'Vue d\'ensemble' }
 *   );
 */
export function useChatPageContextProvider(
  entity: ChatEntity | null,
  pageState: ChatPageState = {}
) {
  const entityKey = entity ? `${entity.type}:${entity.id}` : '';
  const stateKey = JSON.stringify(pageState);

  useEffect(() => {
    store.setContext(entity, pageState);
    return () => store.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityKey, stateKey]);
}
