import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Actions = React.ReactNode;

interface Ctx {
  actions: Actions;
  setActions: (a: Actions) => void;
}

const GameToolbarCtx = createContext<Ctx | null>(null);

export const GameToolbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actions, setActions] = useState<Actions>(null);
  return (
    <GameToolbarCtx.Provider value={{ actions, setActions }}>
      {children}
    </GameToolbarCtx.Provider>
  );
};

/** Slot rendu par le parent (KidsMode) : reçoit les actions poussées par le jeu actif. */
export const GameToolbarSlot: React.FC<{ className?: string }> = ({ className }) => {
  const ctx = useContext(GameToolbarCtx);
  return <div className={className}>{ctx?.actions}</div>;
};

/** Chaque jeu appelle ce hook pour injecter ses boutons dans la barre commune. */
export function useGameToolbar(actions: Actions, deps: React.DependencyList = []) {
  const ctx = useContext(GameToolbarCtx);
  const set = ctx?.setActions;
  const setStable = useCallback((a: Actions) => set?.(a), [set]);
  useEffect(() => {
    setStable(actions);
    return () => setStable(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
