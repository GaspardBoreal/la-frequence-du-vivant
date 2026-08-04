import React from 'react';

/** Bascule le body en mode impression « audit partenaire » le temps du print. */
export function usePartnerAuditPrint() {
  return React.useCallback(() => {
    const cls = 'partner-audit-print-mode';
    document.body.classList.add(cls);
    const cleanup = () => {
      document.body.classList.remove(cls);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    // Laisse le navigateur appliquer les styles avant d'ouvrir la boîte d'impression
    window.setTimeout(() => {
      window.print();
      window.setTimeout(cleanup, 800);
    }, 60);
  }, []);
}
