import React from 'react';

/** Bascule le body en mode impression « dossier partenaire » le temps du print. */
export function usePartnerOfferPrint() {
  return React.useCallback(() => {
    const cls = 'partner-offer-print-mode';
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
