import { useEffect, useState } from 'react';

/**
 * Retourne le conteneur dans lequel portailler un overlay (Dialog, lightbox…)
 * de sorte qu'il reste visible quand un ancêtre est passé en Fullscreen API.
 *
 * - Hors fullscreen → document.body (comportement par défaut Radix).
 * - En fullscreen → document.fullscreenElement (l'overlay reste dans la stacking
 *   context fullscreen et n'en provoque pas la sortie au clic).
 */
export function useFullscreenPortalTarget(): HTMLElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(() =>
    typeof document !== 'undefined'
      ? (document.fullscreenElement as HTMLElement) ?? document.body
      : null,
  );

  useEffect(() => {
    const update = () => {
      setTarget((document.fullscreenElement as HTMLElement) ?? document.body);
    };
    update();
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', update);
      document.removeEventListener('webkitfullscreenchange', update as EventListener);
    };
  }, []);

  return target;
}
