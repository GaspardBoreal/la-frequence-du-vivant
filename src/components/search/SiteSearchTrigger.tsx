import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteSearch } from './SiteSearchContext';

interface Props {
  className?: string;
  /** 'icon' pour les bandeaux compacts, 'field' pour un faux champ de recherche. */
  variant?: 'icon' | 'field';
  iconClassName?: string;
}

/**
 * Point d'entrée du moteur de recherche des pages publiques.
 * L'ouverture est portée par SiteSearchProvider (monté une seule fois dans l'app).
 */
export const SiteSearchTrigger: React.FC<Props> = ({ className, variant = 'icon', iconClassName }) => {
  const { openSearch } = useSiteSearch();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  if (variant === 'field') {
    return (
      <button
        type="button"
        onClick={openSearch}
        aria-label="Rechercher une page du site"
        className={cn(
          'hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-full w-56 lg:w-72',
          'bg-background/60 backdrop-blur-md border border-primary/15 text-muted-foreground',
          'hover:text-foreground hover:border-primary/30 transition-all',
          className,
        )}
      >
        <Search className="w-4 h-4 shrink-0 text-primary/70" strokeWidth={2.2} />
        <span className="flex-1 text-left text-xs truncate">Rechercher une page…</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium">
          {isMac ? '⌘' : 'Ctrl'}<span>K</span>
        </kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      title="Rechercher une page du site"
      aria-label="Rechercher une page du site"
      className={className}
    >
      <Search className={cn('w-4 h-4', iconClassName)} />
    </button>
  );
};

export default SiteSearchTrigger;
