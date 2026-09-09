import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SitePagesSearchOverlay } from './SitePagesSearchOverlay';
import { useSiteSearch } from './SiteSearchContext';

/**
 * Monté une seule fois dans l'application : gère le raccourci ⌘K / Ctrl+K
 * et affiche la fenêtre de recherche des pages publiques.
 *
 * Sur l'espace marcheur et l'admin, ⌘K reste réservé à la recherche de contenus
 * déjà en place ; le bouton loupe du bandeau public continue de fonctionner.
 */
export const SiteSearchMount: React.FC = () => {
  const { open, closeSearch, toggleSearch } = useSiteSearch();
  const { pathname } = useLocation();
  const hotkeyOwnedElsewhere =
    pathname.startsWith('/marches-du-vivant/mon-espace') || pathname.startsWith('/admin');

  useEffect(() => {
    if (hotkeyOwnedElsewhere) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSearch, hotkeyOwnedElsewhere]);


  return <SitePagesSearchOverlay open={open} onClose={closeSearch} />;
};

export default SiteSearchMount;
