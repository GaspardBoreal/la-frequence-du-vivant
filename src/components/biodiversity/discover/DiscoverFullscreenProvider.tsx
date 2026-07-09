import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import DiscoverFullscreen, { type DiscoverMode } from './DiscoverFullscreen';

export interface OpenDiscoverArgs {
  species: BiodiversitySpecies[];
  explorationId?: string;
  filtersLabel?: string;
  initialMode?: DiscoverMode;
}

interface DiscoverFullscreenContextValue {
  openDiscover: (args: OpenDiscoverArgs) => void;
  close: () => void;
  isOpen: boolean;
}

const DiscoverFullscreenContext = createContext<DiscoverFullscreenContextValue | null>(null);

export const useDiscoverFullscreen = (): DiscoverFullscreenContextValue => {
  const ctx = useContext(DiscoverFullscreenContext);
  if (!ctx) {
    throw new Error(
      'useDiscoverFullscreen must be used within a <DiscoverFullscreenProvider>. Mount it near your app root.',
    );
  }
  return ctx;
};

export const DiscoverFullscreenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OpenDiscoverArgs | null>(null);

  const openDiscover = useCallback((args: OpenDiscoverArgs) => setState(args), []);
  const close = useCallback(() => setState(null), []);

  const value = useMemo<DiscoverFullscreenContextValue>(
    () => ({ openDiscover, close, isOpen: state !== null }),
    [openDiscover, close, state],
  );

  return (
    <DiscoverFullscreenContext.Provider value={value}>
      {children}
      <DiscoverFullscreen
        open={state !== null}
        onClose={close}
        species={state?.species ?? []}
        filtersLabel={state?.filtersLabel}
        explorationId={state?.explorationId}
        initialMode={state?.initialMode}
      />
    </DiscoverFullscreenContext.Provider>
  );
};

export default DiscoverFullscreenProvider;
