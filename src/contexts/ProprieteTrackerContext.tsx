import React from 'react';
import { useProprieteTracker } from '@/hooks/useProprieteTracker';

export type TrackFn = (
  module: string,
  action?: string,
  cible?: string | null,
  extra?: Record<string, unknown>,
) => void;

const noop: TrackFn = () => {};

const Ctx = React.createContext<TrackFn>(noop);

/**
 * Rend disponible le traçage d'usage du jardin à tous les écrans enfants
 * (onglets, sous-onglets, fiches, Assistant du Jardin).
 */
export const ProprieteTrackerProvider: React.FC<{
  proprieteId: string | undefined;
  proprieteNom?: string | null;
  children: React.ReactNode;
}> = ({ proprieteId, proprieteNom, children }) => {
  const track = useProprieteTracker(proprieteId, proprieteNom);
  return <Ctx.Provider value={track}>{children}</Ctx.Provider>;
};

/** Traceur d'usage du jardin ; sans fournisseur, l'appel est sans effet. */
export function useProprieteTrack(): TrackFn {
  return React.useContext(Ctx);
}

export default ProprieteTrackerProvider;
