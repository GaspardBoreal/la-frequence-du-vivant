import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTrophicChain, type TrophicSpeciesInput } from '@/hooks/useTrophicChain';
import { TrophicFullscreenModal, type TrophicViewKey } from './TrophicFullscreenModal';

export interface OpenTrophicFullscreenArgs {
  scientificName: string;
  commonName?: string | null;
  speciesPool: TrophicSpeciesInput[];
  initialView?: TrophicViewKey;
}

interface TrophicFullscreenContextValue {
  open: (args: OpenTrophicFullscreenArgs) => void;
  close: () => void;
  isOpen: boolean;
}

const TrophicFullscreenContext = createContext<TrophicFullscreenContextValue | null>(null);

export const useTrophicFullscreen = (): TrophicFullscreenContextValue => {
  const ctx = useContext(TrophicFullscreenContext);
  if (!ctx) {
    throw new Error(
      'useTrophicFullscreen must be used within a <TrophicFullscreenProvider>. ' +
        'Mount the provider near your app root.',
    );
  }
  return ctx;
};

/** Host mounted only when a request is active — avoids computing the trophic chain when idle. */
const TrophicFullscreenHost: React.FC<{
  state: OpenTrophicFullscreenArgs;
  onOpenChange: (open: boolean) => void;
}> = ({ state, onOpenChange }) => {
  const chain = useTrophicChain(state.speciesPool);
  return (
    <TrophicFullscreenModal
      open
      onOpenChange={onOpenChange}
      scientificName={state.scientificName}
      commonName={state.commonName ?? null}
      chain={chain}
      speciesPool={state.speciesPool as any}
      initialView={state.initialView ?? 'constellation'}
    />
  );
};

export const TrophicFullscreenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OpenTrophicFullscreenArgs | null>(null);

  const open = useCallback((args: OpenTrophicFullscreenArgs) => {
    setState(args);
  }, []);
  const close = useCallback(() => setState(null), []);

  const value = useMemo<TrophicFullscreenContextValue>(
    () => ({ open, close, isOpen: state !== null }),
    [open, close, state],
  );

  return (
    <TrophicFullscreenContext.Provider value={value}>
      {children}
      {state !== null && (
        <TrophicFullscreenHost
          state={state}
          onOpenChange={(o) => {
            if (!o) close();
          }}
        />
      )}
    </TrophicFullscreenContext.Provider>
  );
};

export default TrophicFullscreenProvider;
