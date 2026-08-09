import React from 'react';

/** Bascule le body en mode impression « feuille de route partenaire » le temps du print. */
export function usePartnerRoadmapPrint() {
  return React.useCallback(() => {
    const cls = 'partner-roadmap-print-mode';
    document.body.classList.add(cls);
    const cleanup = () => {
      document.body.classList.remove(cls);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.setTimeout(() => {
      window.print();
      window.setTimeout(cleanup, 800);
    }, 60);
  }, []);
}
