import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlobalSearchOverlay } from './GlobalSearchOverlay';
import { cn } from '@/lib/utils';

interface Props {
  eventId?: string | null;
  marcheId?: string | null;
  scope?: 'global' | 'event' | 'admin';
  className?: string;
}

/**
 * Trigger discret intégré au header (visible ≥ md).
 * Faux input → ouvre le GlobalSearchOverlay au clic ou via ⌘/Ctrl+K.
 */
export const HeaderSearchTrigger: React.FC<Props> = ({
  eventId,
  marcheId,
  scope,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        aria-label="Ouvrir la recherche"
        role="search"
        className={cn(
          'hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-full',
          'bg-background/60 backdrop-blur-md border border-primary/15',
          'text-muted-foreground hover:text-foreground hover:border-primary/30',
          'hover:bg-background/80 transition-all',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
          'w-56 lg:w-72',
          className
        )}
      >
        <Search className="w-4 h-4 text-primary/70 shrink-0" strokeWidth={2.2} />
        <span className="flex-1 text-left text-xs truncate">
          Rechercher espèce, marche, marcheur…
        </span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/60 border border-border text-muted-foreground">
          {isMac ? '⌘' : 'Ctrl'}<span>K</span>
        </kbd>
      </motion.button>

      <GlobalSearchOverlay
        open={open}
        onClose={() => setOpen(false)}
        eventId={eventId}
        marcheId={marcheId}
        scope={scope}
      />
    </>
  );
};

export default HeaderSearchTrigger;
