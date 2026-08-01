import React from 'react';
import { scenographeStore, useScenographeState } from './scenographeStore';
import ScenographeFullscreen from './ScenographeFullscreen';

/**
 * Point de montage unique du Scénographe pour un espace propriété.
 * Il enregistre la propriété courante (les entrées depuis le chat n'ont pas
 * d'autre moyen de la connaître) et rend la surface plein écran à la demande.
 */
export const ScenographeMount: React.FC<{ proprieteId: string }> = ({ proprieteId }) => {
  const state = useScenographeState();

  React.useEffect(() => {
    scenographeStore.registerPropriete(proprieteId);
    return () => scenographeStore.registerPropriete(null);
  }, [proprieteId]);

  if (!state.open || !state.objetId || state.proprieteId !== proprieteId) return null;

  return (
    <ScenographeFullscreen
      proprieteId={proprieteId}
      objetId={state.objetId}
      proposals={state.proposals}
      onClose={scenographeStore.close}
    />
  );
};

export default ScenographeMount;
