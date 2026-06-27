import { useCallback, useEffect, useState } from 'react';

/**
 * Mode d'affichage global des grilles d'espèces.
 *  - 'gallery' : grandes tuiles carrées plein cadre (style « Apprendre › L'œil »).
 *  - 'list'    : carte horizontale dense avec mini-vignette (vue analytique historique).
 *
 * Persistance localStorage + sync cross-instance via un CustomEvent.
 * Volontairement sans Provider : utilisable n'importe où sans wrapper.
 */
export type SpeciesViewMode = 'gallery' | 'list';

const STORAGE_KEY = 'lfdv.species-view-mode';
const EVENT_NAME = 'lfdv:species-view-mode-changed';

const isValid = (v: unknown): v is SpeciesViewMode =>
  v === 'gallery' || v === 'list';

function readInitial(): SpeciesViewMode {
  if (typeof window === 'undefined') return 'gallery';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (isValid(v)) return v;
  } catch {
    /* noop */
  }
  return 'gallery';
}

export function useSpeciesViewMode(): {
  mode: SpeciesViewMode;
  setMode: (m: SpeciesViewMode) => void;
  toggle: () => void;
} {
  const [mode, setLocalMode] = useState<SpeciesViewMode>(readInitial);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SpeciesViewMode>).detail;
      if (isValid(detail)) setLocalMode(detail);
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && isValid(e.newValue)) {
        setLocalMode(e.newValue);
      }
    };
    window.addEventListener(EVENT_NAME, handler as EventListener);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler as EventListener);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const setMode = useCallback((m: SpeciesViewMode) => {
    setLocalMode(m);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* noop */
    }
    window.dispatchEvent(new CustomEvent<SpeciesViewMode>(EVENT_NAME, { detail: m }));
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'gallery' ? 'list' : 'gallery');
  }, [mode, setMode]);

  return { mode, setMode, toggle };
}
