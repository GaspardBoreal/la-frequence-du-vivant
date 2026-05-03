import { useEffect, useSyncExternalStore } from 'react';

export interface ChatEntity {
  type: 'marche_event' | 'marcheur' | 'exploration';
  id: string;
}

export interface ChatPageState {
  /** Libellé humain de la fiche (ex: "Marche du Vivant à DEVIAT, 14 mars 2026") */
  label?: string;
  /** Onglet actuellement actif (chaîne hiérarchique : "Apprendre › Ce que nous avons vu › La main") */
  activeTab?: string;
  /** Filtres / sous-états en cours (libre) */
  filters?: Record<string, unknown>;
  /**
   * Snapshot des données réellement affichées à l'écran.
   * Chaque sous-onglet publie son slice via `useChatTabSnapshot(key, data)`.
   * Permet à l'IA de répondre "ce que tu vois" sans re-fetcher côté serveur.
   */
  visibleData?: Record<string, unknown>;
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
    setState({
      entity: state.entity,
      pageState: {
        ...state.pageState,
        ...pageState,
        // Merge filters and visibleData rather than replace.
        filters: pageState.filters
          ? { ...(state.pageState.filters || {}), ...pageState.filters }
          : state.pageState.filters,
        visibleData: pageState.visibleData
          ? { ...(state.pageState.visibleData || {}), ...pageState.visibleData }
          : state.pageState.visibleData,
      },
    });
  },
  /** Publie / remplace une slice de visibleData identifiée par `key`. */
  setVisibleSlice: (key: string, value: unknown) => {
    const next = { ...(state.pageState.visibleData || {}) };
    if (value === undefined) delete next[key];
    else next[key] = value;
    setState({ entity: state.entity, pageState: { ...state.pageState, visibleData: next } });
  },
  clear: () => setState({ entity: null, pageState: {} }),
};

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

export const chatPageContext = store;

/**
 * Helper hook : qu'une page pose au montage pour signaler au chatbot
 * la fiche en cours et son état d'écran.
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

/**
 * Helper hook : un sous-composant publie son snapshot de données visibles
 * à l'IA sous une clé donnée. Auto-nettoyage au démontage.
 *
 * @example useChatTabSnapshot('apprendre.main.pratiques', entries.map(e => ({ id: e.id, title: e.title })));
 */
export function useChatTabSnapshot(key: string, value: unknown) {
  const valueKey = JSON.stringify(value ?? null);
  useEffect(() => {
    store.setVisibleSlice(key, value);
    return () => store.setVisibleSlice(key, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, valueKey]);
}
