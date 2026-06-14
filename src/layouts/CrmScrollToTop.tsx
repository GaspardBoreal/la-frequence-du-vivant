import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll-restoration scoped to the CRM shell.
 * Resets window scroll to top on every pathname change inside /admin/crm/*.
 * Query-string changes (filters, tabs via ?param) do NOT trigger a re-scroll.
 */
const CrmScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
};

export default CrmScrollToTop;
