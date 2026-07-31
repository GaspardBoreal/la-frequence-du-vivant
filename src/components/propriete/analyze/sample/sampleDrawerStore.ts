import { useSyncExternalStore } from 'react';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import type { SoilBlockId } from '@/components/propriete/analyze/media/soilTestCatalog';

export interface SampleDrawerState {
  open: boolean;
  proprieteId?: string;
  samples: SoilSample[];
  sampleId?: string;
  /** Strate sur laquelle ouvrir la fiche (sceau des 4 strates). */
  block?: SoilBlockId;
  /** Incrémenté à chaque ouverture : permet de re-cibler la même strate. */
  nonce: number;
}

const EMPTY: SampleDrawerState = { open: false, samples: [], nonce: 0 };

let state: SampleDrawerState = EMPTY;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

/** Ouvre la fiche « carotte » d'un prélèvement, depuis n'importe quelle carte. */
export const openSampleCore = (
  sampleId: string,
  samples: SoilSample[],
  proprieteId?: string,
  block?: SoilBlockId,
) => {
  state = { open: true, sampleId, samples, proprieteId, block, nonce: state.nonce + 1 };
  emit();
};

export const closeSampleCore = () => {
  state = { ...state, open: false };
  emit();
};

export const focusSampleCore = (sampleId: string, block?: SoilBlockId) => {
  state = { ...state, sampleId, block, nonce: state.nonce + 1 };
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSampleDrawer = (): SampleDrawerState =>
  useSyncExternalStore(subscribe, () => state, () => EMPTY);
