import React, { useState, useEffect } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'impact-how-it-works-collapsed';

const HowItWorksBanner: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {}
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch {}
  };

  return (
    <div className="w-full max-w-[320px] bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left text-white/85 hover:bg-white/[0.04] transition-colors"
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-emerald-300" />
          Comment ça marche ?
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ul className="px-3 pb-3 pt-1 space-y-1.5 text-[11px] leading-snug text-white/75">
              <li>
                <span className="text-emerald-200 font-semibold">🌿 Détections précieuses</span>
                <span className="text-white/50"> · jusqu'à 40 pts</span>
                <div className="text-white/55">Bio-indicateurs, auxiliaires, espèces invasives. Le cœur du score.</div>
              </li>
              <li>
                <span className="text-emerald-200 font-semibold">🪶 Variété des gestes</span>
                <span className="text-white/50"> · 20 pts</span>
                <div className="text-white/55">5 piliers : photo, son, texte, témoignage, espèce sensible.</div>
              </li>
              <li>
                <span className="text-emerald-200 font-semibold">📸 Volume</span>
                <span className="text-white/50"> · 20 pts</span>
                <div className="text-white/55">Plus vous documentez, plus ça monte (en racine carrée).</div>
              </li>
              <li>
                <span className="text-emerald-200 font-semibold">🦋 Diversité d'espèces</span>
                <span className="text-white/50"> · 20 pts</span>
                <div className="text-white/55">Chaque nouvelle espèce compte, jusqu'à 20.</div>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HowItWorksBanner;
