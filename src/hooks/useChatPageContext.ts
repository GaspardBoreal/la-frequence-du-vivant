import { create } from 'zustand';
import { useEffect } from 'react';

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

interface ChatPageContextStore {
  entity: ChatEntity | null;
  pageState: ChatPageState;
  setContext: (entity: ChatEntity | null, pageState?: ChatPageState) => void;
  setPageState: (pageState: ChatPageState) => void;
  clear: () => void;
}

export const useChatPageContextStore = create<ChatPageContextStore>((set) => ({
  entity: null,
  pageState: {},
  setContext: (entity, pageState = {}) => set({ entity, pageState }),
  setPageState: (pageState) => set((s) => ({ pageState: { ...s.pageState, ...pageState } })),
  clear: () => set({ entity: null, pageState: {} }),
}));

/**
 * Helper hook : qu'une page admin pose au montage pour signaler au chatbot
 * la fiche en cours de consultation et son état d'écran.
 *
 * @example
 *   useChatPageContextProvider(
 *     event ? { type: 'marche_event', id: event.id } : null,
 *     { label: event?.titre, activeTab: 'Vue d'ensemble' }
 *   );
 */
export function useChatPageContextProvider(
  entity: ChatEntity | null,
  pageState: ChatPageState = {}
) {
  const setContext = useChatPageContextStore((s) => s.setContext);
  const clear = useChatPageContextStore((s) => s.clear);

  // Stable signature for deps
  const entityKey = entity ? `${entity.type}:${entity.id}` : '';
  const stateKey = JSON.stringify(pageState);

  useEffect(() => {
    setContext(entity, pageState);
    return () => clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityKey, stateKey]);
}
