import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface Ctx {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const SiteSearchCtx = createContext<Ctx | null>(null);

export const SiteSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const value = useMemo<Ctx>(() => ({
    open,
    openSearch: () => setOpen(true),
    closeSearch: () => setOpen(false),
    toggleSearch: () => setOpen(o => !o),
  }), [open]);
  return <SiteSearchCtx.Provider value={value}>{children}</SiteSearchCtx.Provider>;
};

/** Sûr même hors provider (pages isolées) : renvoie des actions inertes. */
export function useSiteSearch(): Ctx {
  const ctx = useContext(SiteSearchCtx);
  const noop = useCallback(() => {}, []);
  return ctx ?? { open: false, openSearch: noop, closeSearch: noop, toggleSearch: noop };
}

export function useSiteSearchAvailable(): boolean {
  return useContext(SiteSearchCtx) !== null;
}
