import { useSyncExternalStore } from 'react';
import type { Strate } from '@/lib/plantSpread';

/**
 * Ouverture du Scénographe d'ouvrage depuis n'importe où (inspecteur d'objet,
 * réponse du chatbot, registre des ouvrages). Store externe minimal, sur le
 * même patron que `proprieteChatFocus` : aucun contexte React à traverser.
 */

/** Espèce proposée, généralement extraite d'un tableau de l'IA de jardin. */
export interface ScenographeProposal {
  scientificName: string;
  commonNameFr?: string | null;
  strate?: Strate;
  heightM?: number | null;
  functions?: string[];
  note?: string | null;
}

interface ScenographeState {
  /** Propriété courante — enregistrée par le mount de l'espace propriété. */
  proprieteId: string | null;
  open: boolean;
  objetId: string | null;
  /** Propositions injectées à l'ouverture (herbier « Proposées »). */
  proposals: ScenographeProposal[];
}

const EMPTY: ScenographeState = { proprieteId: null, open: false, objetId: null, proposals: [] };

let state: ScenographeState = EMPTY;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const scenographeStore = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  registerPropriete: (proprieteId: string | null) => {
    if (state.proprieteId === proprieteId) return;
    state = { ...state, proprieteId };
    emit();
  },
  open: (objetId: string, proposals: ScenographeProposal[] = []) => {
    state = { ...state, open: true, objetId, proposals };
    emit();
  },
  close: () => {
    if (!state.open) return;
    state = { ...state, open: false };
    emit();
  },
};

export function useScenographeState(): ScenographeState {
  return useSyncExternalStore(scenographeStore.subscribe, scenographeStore.get, () => EMPTY);
}

/** Vrai si un Scénographe peut être ouvert depuis le contexte courant. */
export function useScenographeAvailable(): boolean {
  return useSyncExternalStore(
    scenographeStore.subscribe,
    () => !!state.proprieteId,
    () => false,
  );
}

export const openScenographe = (objetId: string, proposals: ScenographeProposal[] = []) =>
  scenographeStore.open(objetId, proposals);
