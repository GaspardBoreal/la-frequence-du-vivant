import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlobalSearchOverlay } from './GlobalSearchOverlay';
import { cn } from '@/lib/utils';

interface Props {
  eventId?: string | null;
  marcheId?: string | null;
  scope?: 'global' | 'event' | 'admin';
  /** Tailwind className override for position (default: bottom-20 right-4) */
  className?: string;
}

export const GlobalSearchFab: React.FC<Props> = ({ eventId, marcheId, scope, className }) => {
  const [open, setOpen] = useState(false);

  // Cmd/Ctrl + K shortcut
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
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.4 }}
        aria-label="Rechercher"
        className={cn(
          'fixed bottom-20 right-4 z-[150] md:bottom-6',
          'w-12 h-12 rounded-full',
          'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
          'shadow-[0_8px_30px_-4px_rgba(13,107,88,0.6)] ring-2 ring-emerald-300/40',
          'flex items-center justify-center',
          'before:absolute before:inset-0 before:rounded-full before:bg-emerald-400/40 before:animate-ping before:opacity-40',
          'hover:shadow-[0_12px_40px_-4px_rgba(45,212,168,0.8)] transition-shadow',
          className
        )}
      >
        <Search className="w-5 h-5 relative z-10" strokeWidth={2.5} />
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

export default GlobalSearchFab;
