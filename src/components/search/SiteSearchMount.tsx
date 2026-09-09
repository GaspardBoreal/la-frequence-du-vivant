import React, { useEffect } from 'react';
import { SitePagesSearchOverlay } from './SitePagesSearchOverlay';
import { useSiteSearch } from './SiteSearchContext';

/**
 * Monté une seule fois dans l'application : gère le raccourci ⌘K / Ctrl+K
 * et affiche la fenêtre de recherche des pages publiques.
 */
export const SiteSearchMount: React.FC = () => {
  const { open, openSearch, closeSearch, toggleSearch } = useSiteSearch();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSearch, openSearch]);

  return <SitePagesSearchOverlay open={open} onClose={closeSearch} />;
};

export default SiteSearchMount;
