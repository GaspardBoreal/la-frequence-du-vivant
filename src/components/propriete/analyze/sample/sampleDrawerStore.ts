import { useSyncExternalStore } from 'react';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

export interface SampleDrawerState {
  open: boolean;
  proprieteId?: string;
  samples: SoilSample[];
  sampleId?: string;
}

const EMPTY: SampleDrawerState = { open: false, samples: [] };

let state: SampleDrawerState = EMPTY;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

/** Ouvre la fiche « carotte » d'un prélèvement, depuis n'importe quelle carte. */
export const openSampleCore = (
  sampleId: string,
  samples: SoilSample[],
  proprieteId?: string,
) => {
  state = { open: true, sampleId, samples, proprieteId };
  emit();
};

export const closeSampleCore = () => {
  state = { ...state, open: false };
  emit();
};

export const focusSampleCore = (sampleId: string) => {
  state = { ...state, sampleId };
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSampleDrawer = (): SampleDrawerState =>
  useSyncExternalStore(subscribe, () => state, () => EMPTY);
