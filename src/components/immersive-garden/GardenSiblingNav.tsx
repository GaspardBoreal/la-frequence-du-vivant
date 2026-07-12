import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react';

interface Props {
  index: number;
  total: number;
  categoryLabel: string;
  hasPrev: boolean;
  hasNext: boolean;
  onNavigate: (direction: 'prev' | 'next', origin: { x: number; y: number }) => void;
  onBack: () => void;
}

const btnBase =
  'group pointer-events-auto relative flex items-center justify-center w-14 h-14 rounded-full ' +
  'bg-black/40 backdrop-blur-md border border-[#c9a24a]/40 text-[#f4ecd4] ' +
  'shadow-[0_10px_40px_-10px_rgba(201,162,74,0.5)] transition ' +
  'hover:bg-black/60 hover:border-[#c9a24a] hover:scale-105 ' +
  'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100';

const GardenSiblingNav: React.FC<Props> = ({
  index, total, categoryLabel, hasPrev, hasNext, onNavigate, onBack,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = document.activeElement?.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigate('prev', { x: 80, y: window.innerHeight / 2 });
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate('next', { x: window.innerWidth - 80, y: window.innerHeight / 2 });
      } else if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasPrev, hasNext, onNavigate, onBack]);

  if (total <= 1) return null;

  const handleClick = (dir: 'prev' | 'next') => (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onNavigate(dir, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="fixed bottom-6 left-0 right-0 z-40 pointer-events-none flex items-center justify-between px-4 md:px-8"
    >
      <button
        type="button"
        onClick={handleClick('prev')}
        disabled={!hasPrev}
        aria-label="Jardin précédent"
        className={btnBase}
      >
        <ChevronLeft className="w-6 h-6" />
        <span className="absolute inset-0 rounded-full ring-1 ring-[#c9a24a]/20 group-hover:ring-[#c9a24a]/70 transition" />
      </button>

      <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-[#c9a24a]/30 text-[#f4ecd4] text-xs tracking-[0.25em] uppercase font-serif italic shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)]">
        <Leaf className="w-3.5 h-3.5 text-[#c9a24a]" />
        <span className="text-[#c9a24a] font-bold not-italic">{index + 1}</span>
        <span className="opacity-50">/</span>
        <span className="opacity-80 not-italic">{total}</span>
        <span className="opacity-40">·</span>
        <span className="opacity-90">{categoryLabel}</span>
      </div>

      <button
        type="button"
        onClick={handleClick('next')}
        disabled={!hasNext}
        aria-label="Jardin suivant"
        className={btnBase}
      >
        <ChevronRight className="w-6 h-6" />
        <span className="absolute inset-0 rounded-full ring-1 ring-[#c9a24a]/20 group-hover:ring-[#c9a24a]/70 transition" />
      </button>
    </motion.div>
  );
};

export default GardenSiblingNav;
