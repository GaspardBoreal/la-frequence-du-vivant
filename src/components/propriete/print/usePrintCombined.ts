import { useEffect, useRef } from 'react';

/**
 * Orchestre l'impression d'un portail body : attente images + window.print + cleanup.
 * bodyClass isole l'impression (masque le reste de l'app via CSS @media print).
 */
export function usePrintCombined(opts: {
  active: boolean;
  portalId: string;
  bodyClass: string;
  onDone: () => void;
}) {
  const { active, portalId, bodyClass, onDone } = opts;
  const portalRef = useRef<HTMLDivElement | null>(null);

  if (typeof document !== 'undefined' && !portalRef.current) {
    const existing = document.getElementById(portalId) as HTMLDivElement | null;
    portalRef.current =
      existing ?? Object.assign(document.createElement('div'), { id: portalId });
    if (!existing) document.body.appendChild(portalRef.current);
  }

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    document.body.classList.add(bodyClass);

    const run = async () => {
      const node = portalRef.current;
      if (!node) return;
      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>((res) => {
                const done = () => res();
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
              }),
        ),
      );
      await new Promise((r) => setTimeout(r, 200));
      if (!cancelled) window.print();
    };
    run();

    const onAfter = () => onDone();
    window.addEventListener('afterprint', onAfter);
    return () => {
      cancelled = true;
      document.body.classList.remove(bodyClass);
      window.removeEventListener('afterprint', onAfter);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return portalRef;
}
