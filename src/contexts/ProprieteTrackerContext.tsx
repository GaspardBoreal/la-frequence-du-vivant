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

/** Garde-fou : nombre maximum de clics génériques tracés par ouverture de page. */
const MAX_CLICS = 400;

/**
 * Rend disponible le traçage d'usage du jardin à tous les écrans enfants
 * (onglets, sous-onglets, fiches, Assistant du Jardin) et enregistre en plus
 * chaque clic sur un élément interactif, pour ne rien perdre du parcours.
 */
export const ProprieteTrackerProvider: React.FC<{
  proprieteId: string | undefined;
  proprieteNom?: string | null;
  children: React.ReactNode;
}> = ({ proprieteId, proprieteNom, children }) => {
  const track = useProprieteTracker(proprieteId, proprieteNom);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const countRef = React.useRef(0);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || !proprieteId) return;

    const onClick = (e: MouseEvent) => {
      if (countRef.current >= MAX_CLICS) return;
      const el = (e.target as HTMLElement | null)?.closest(
        'button,a,[role="tab"],[role="menuitem"],[role="option"],[data-track]',
      ) as HTMLElement | null;
      if (!el || el.closest('[data-no-track]')) return;

      const label =
        el.getAttribute('data-track') ||
        el.getAttribute('aria-label') ||
        (el.textContent || '').replace(/\s+/g, ' ').trim() ||
        el.getAttribute('title') ||
        el.tagName.toLowerCase();

      countRef.current += 1;
      track('clic', 'clic', label.slice(0, 80), {
        tag: el.tagName.toLowerCase(),
        href: el.getAttribute('href') ?? null,
      });
    };

    root.addEventListener('click', onClick, { capture: true });
    return () => root.removeEventListener('click', onClick, { capture: true } as EventListenerOptions);
  }, [track, proprieteId]);

  return (
    <Ctx.Provider value={track}>
      <div ref={rootRef}>{children}</div>
    </Ctx.Provider>
  );
};

/** Traceur d'usage du jardin ; sans fournisseur, l'appel est sans effet. */
export function useProprieteTrack(): TrackFn {
  return React.useContext(Ctx);
}

export default ProprieteTrackerProvider;
