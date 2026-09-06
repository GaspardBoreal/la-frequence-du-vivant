import { useSyncExternalStore } from 'react';
import type { TourRef } from './types';

interface TourRefState {
  open: boolean;
  ref: TourRef | null;
  nonce: number;
}

const EMPTY: TourRefState = { open: false, ref: null, nonce: 0 };
let state: TourRefState = EMPTY;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Ouvre le panneau bas sur une ressource, sans quitter le tour. */
export const openTourRef = (ref: TourRef) => {
  state = { open: true, ref, nonce: state.nonce + 1 };
  emit();
};

export const closeTourRef = () => {
  state = { ...state, open: false };
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useTourRefDrawer = (): TourRefState =>
  useSyncExternalStore(subscribe, () => state, () => EMPTY);
