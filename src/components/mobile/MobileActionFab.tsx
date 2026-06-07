import React, { useEffect, useState } from 'react';
import { Search, MessageCircle, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlobalSearchOverlay } from '@/components/search/GlobalSearchOverlay';
import { GlobalSearchFab } from '@/components/search/GlobalSearchFab';
import { useCanUseContextualChat } from '@/hooks/useCanUseContextualChat';

interface Props {
  eventId?: string | null;
  marcheId?: string | null;
  scope?: 'global' | 'event' | 'admin';
  className?: string;
}

/**
 * FAB mobile unifié : Recherche + Compagnon du Vivant.
 *
 * - Si l'utilisateur n'a PAS accès au chatbot (visiteur, marcheur, éclaireur)
 *   → rendu strictement identique à <GlobalSearchFab /> (loupe seule).
 * - Si l'utilisateur a accès (admin / ambassadeur / sentinelle)
 *   → pastille fusionnée qui déploie un mini-menu élégant (2 actions).
 *
 * L'ouverture du chatbot se fait via un CustomEvent écouté par <ChatBot />
 * (voir `CommunityChatBotMount` qui rend ChatBot avec `hideFab={isMobile}`).
 */
const MobileActionFab: React.FC<Props> = ({ eventId, marcheId, scope = 'global', className }) => {
  const { canUse, isLoading } = useCanUseContextualChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl+K toujours dispo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Pendant le chargement des droits : ne rien rendre (évite le flash).
  if (isLoading) return null;

  // Pas d'accès chatbot → comportement existant strict (loupe seule).
  if (!canUse) {
    return <GlobalSearchFab eventId={eventId} marcheId={marcheId} scope={scope} className={cn('md:hidden', className)} />;
  }

  const openSearch = () => {
    setMenuOpen(false);
    setSearchOpen(true);
  };

  const openChatbot = () => {
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent('frequence:open-chatbot'));
  };

  return (
    <div className={cn('md:hidden', className)}>
      {/* Scrim discret */}
      <AnimatePresence>
        {menuOpen && (
          <motion.button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[149] bg-background/30 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 right-4 z-[150] flex flex-col items-end gap-3">
        {/* Items du menu : empilés au-dessus de la pastille principale */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="flex flex-col items-end gap-3"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
                closed: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
              }}
            >
              <MenuItem
                key="chat"
                label="Compagnon"
                accent
                onClick={openChatbot}
                icon={<MessageCircle className="w-5 h-5" strokeWidth={2.2} />}
              />
              <MenuItem
                key="search"
                label="Rechercher"
                onClick={openSearch}
                icon={<Search className="w-5 h-5" strokeWidth={2.4} />}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton principal */}
        <motion.button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir les actions'}
          aria-expanded={menuOpen}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.3 }}
          className={cn(
            'relative w-12 h-12 rounded-full',
            'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
            'shadow-[0_8px_30px_-4px_rgba(13,107,88,0.6)] ring-2 ring-emerald-300/40',
            'flex items-center justify-center',
            'transition-shadow hover:shadow-[0_12px_40px_-4px_rgba(45,212,168,0.8)]',
          )}
        >
          {/* Halo pulsé (caché quand le menu est ouvert) */}
          {!menuOpen && (
            <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping opacity-40 pointer-events-none" />
          )}

          <AnimatePresence mode="wait" initial={false}>
            {menuOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="relative z-10"
              >
                <X className="w-5 h-5" strokeWidth={2.6} />
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="relative z-10"
              >
                <Search className="w-5 h-5" strokeWidth={2.5} />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Badge Sparkles : signale la double fonction (caché en mode ouvert) */}
          {!menuOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-sm ring-1 ring-emerald-300/50 pointer-events-none">
              <Sparkles className="w-2.5 h-2.5 text-emerald-500" strokeWidth={2.5} />
            </span>
          )}
        </motion.button>
      </div>

      <GlobalSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        eventId={eventId}
        marcheId={marcheId}
        scope={scope}
      />
    </div>
  );
};

interface MenuItemProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, icon, onClick, accent }) => (
  <motion.div
    variants={{
      open: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 340, damping: 24 } },
      closed: { opacity: 0, y: 12, scale: 0.85, transition: { duration: 0.12 } },
    }}
    className="flex items-center gap-2"
  >
    {/* Libellé pill */}
    <span
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium',
        'bg-background/85 backdrop-blur-xl border border-primary/20 text-foreground',
        'shadow-[0_4px_16px_-4px_rgba(0,0,0,0.25)]',
      )}
    >
      {label}
    </span>

    {/* Pastille action */}
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      aria-label={label}
      className={cn(
        'relative w-11 h-11 rounded-full',
        'bg-background/85 backdrop-blur-xl border border-primary/25',
        'shadow-[0_6px_20px_-4px_rgba(0,0,0,0.35)]',
        'flex items-center justify-center',
        'transition-colors hover:bg-background/95',
        accent ? 'text-emerald-500' : 'text-primary',
      )}
    >
      {accent && (
        <span className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping opacity-50 pointer-events-none" />
      )}
      <span className="relative z-10">{icon}</span>
    </motion.button>
  </motion.div>
);

export default MobileActionFab;
