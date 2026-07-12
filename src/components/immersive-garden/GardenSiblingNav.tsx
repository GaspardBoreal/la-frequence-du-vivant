import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

interface Props {
  index: number;
  total: number;
  categoryLabel: string;
  hasPrev: boolean;
  hasNext: boolean;
  backHref: string;
  onNavigate: (direction: 'prev' | 'next', origin: { x: number; y: number }) => void;
  onBack: () => void;
}

const chevronBase =
  'group relative flex items-center justify-center w-8 h-8 rounded-full text-[#f4ecd4] ' +
  'transition hover:bg-[#c9a24a]/20 hover:text-[#f8e3a8] ' +
  'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent';

const GardenSiblingNav: React.FC<Props> = ({
  index, total, categoryLabel, hasPrev, hasNext, backHref, onNavigate, onBack,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = document.activeElement?.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigate('prev', { x: window.innerWidth / 2 - 40, y: 40 });
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate('next', { x: window.innerWidth / 2 + 40, y: 40 });
      } else if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasPrev, hasNext, onNavigate, onBack]);

  const handleClick = (dir: 'prev' | 'next') => (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onNavigate(dir, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  const showCounter = total > 1;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 pl-2 pr-2 py-1.5
                 rounded-full bg-black/45 backdrop-blur-xl border border-[#c9a24a]/35
                 shadow-[0_10px_40px_-12px_rgba(201,162,74,0.35)]
                 hover:border-[#c9a24a]/55 hover:shadow-[0_14px_50px_-10px_rgba(201,162,74,0.5)] transition"
      aria-label="Navigation entre jardins"
    >
      <Link
        to={backHref}
        className="group flex items-center gap-2 h-8 pl-2.5 pr-3 rounded-full text-[#f4ecd4]
                   hover:bg-[#c9a24a]/15 hover:text-[#f8e3a8] transition"
        aria-label="Retour à la carte"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline font-serif text-[11px] tracking-[0.22em] uppercase">
          Retour
        </span>
      </Link>

      {showCounter && (
        <>
          <span aria-hidden className="mx-1 h-5 w-px bg-[#c9a24a]/25" />

          <button
            type="button"
            onClick={handleClick('prev')}
            disabled={!hasPrev}
            aria-label="Jardin précédent"
            className={chevronBase}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-baseline gap-1.5 px-2 font-serif italic text-[11px] tracking-[0.22em] uppercase text-[#f4ecd4]/85 whitespace-nowrap">
            <span className="text-[#c9a24a] font-bold not-italic">{index + 1}</span>
            <span className="opacity-40">/</span>
            <span className="opacity-70 not-italic">{total}</span>
            <span className="opacity-30 mx-0.5">·</span>
            <span className="opacity-90">{categoryLabel}</span>
          </div>

          <button
            type="button"
            onClick={handleClick('next')}
            disabled={!hasNext}
            aria-label="Jardin suivant"
            className={chevronBase}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </motion.nav>
  );
};

export default GardenSiblingNav;
