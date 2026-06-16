import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, BookOpen, TreePine, Headphones, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';

const ROLE_GRADIENT: Record<CommunityRoleKey, [string, string]> = {
  marcheur_en_devenir: ['#6ee7b7', '#34d399'],
  marcheur: ['#34d399', '#10b981'],
  eclaireur: ['#2dd4bf', '#14b8a6'],
  ambassadeur: ['#38bdf8', '#0ea5e9'],
  sentinelle: ['#fbbf24', '#f59e0b'],
};

type Categorie = 'geopoetique' | 'biodiversite' | 'bioacoustique';

type Citation = {
  id: string;
  texte: string;
  auteur: string;
  oeuvre: string;
  url: string;
  shown_count: number;
  viewed_count: number;
  categorie: Categorie;
};

const FALLBACK_CITATIONS: Record<Categorie, Citation> = {
  geopoetique: {
    id: '', texte: "Dans chaque promenade avec la nature, on reçoit bien plus que ce qu'on cherche.",
    auteur: "John Muir", oeuvre: "Unpublished Journals (1938)",
    url: "https://vault.sierraclub.org/john_muir_exhibit/writings/",
    shown_count: 0, viewed_count: 0, categorie: 'geopoetique',
  },
  biodiversite: {
    id: '', texte: "Chaque espèce est un chef-d'œuvre de l'évolution, un trésor d'informations génétiques accumulées sur des millions d'années.",
    auteur: "E.O. Wilson", oeuvre: "The Diversity of Life (1992)",
    url: "https://www.worldcat.org/title/26073442",
    shown_count: 0, viewed_count: 0, categorie: 'biodiversite',
  },
  bioacoustique: {
    id: '', texte: "Un paysage sonore intact est le signe d'un écosystème en bonne santé.",
    auteur: "Bernie Krause", oeuvre: "The Great Animal Orchestra (2012)",
    url: "https://www.worldcat.org/title/769756568",
    shown_count: 0, viewed_count: 0, categorie: 'bioacoustique',
  },
};

const TABS: { key: Categorie; icon: React.ElementType; label: string; tint: string }[] = [
  { key: 'geopoetique', icon: BookOpen, label: 'Géopoétique', tint: '#34d399' },
  { key: 'biodiversite', icon: TreePine, label: 'Biodiversité', tint: '#2dd4bf' },
  { key: 'bioacoustique', icon: Headphones, label: 'Bioacoustique', tint: '#fbbf24' },
];

const DISCOVERED_KEY = 'freq_discovered_all_v1';

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function getCitationDuJour(citations: Citation[], catOffset: number): Citation | null {
  if (!citations.length) return null;
  const seed = new Date().getFullYear() * 366 + getDayOfYear() + catOffset;
  return citations[seed % citations.length];
}

interface FrequenceWaveProps {
  totalFrequences: number;
  role: CommunityRoleKey;
}

const FrequenceWave: React.FC<FrequenceWaveProps> = ({ totalFrequences, role }) => {
  const [, c2] = ROLE_GRADIENT[role];
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [visited, setVisited] = useState<Set<Categorie>>(new Set(['geopoetique']));
  const [discovered, setDiscovered] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DISCOVERED_KEY) === '1';
  });
  const [interacted, setInteracted] = useState(false);
  const incrementedRef = useRef<Set<string>>(new Set());

  const activeTab = TABS[activeIndex].key;

  const { data: allCitations = [] } = useQuery({
    queryKey: ['frequence-citations-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('frequence_citations')
        .select('id, texte, auteur, oeuvre, url, shown_count, viewed_count, categorie')
        .eq('active', true)
        .order('id');
      if (error) throw error;
      return data as Citation[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const byCategorie: Record<Categorie, Citation[]> = {
    geopoetique: allCitations.filter(c => c.categorie === 'geopoetique'),
    biodiversite: allCitations.filter(c => c.categorie === 'biodiversite'),
    bioacoustique: allCitations.filter(c => c.categorie === 'bioacoustique'),
  };

  const catOffsets: Record<Categorie, number> = { geopoetique: 0, biodiversite: 137, bioacoustique: 271 };
  const citation = getCitationDuJour(byCategorie[activeTab], catOffsets[activeTab]) || FALLBACK_CITATIONS[activeTab];

  const goTo = useCallback((idx: number, dir?: 1 | -1) => {
    const target = (idx + TABS.length) % TABS.length;
    setDirection(dir ?? (target > activeIndex ? 1 : -1));
    setActiveIndex(target);
    setInteracted(true);
    setVisited(prev => {
      const next = new Set(prev);
      next.add(TABS[target].key);
      if (next.size === TABS.length && !discovered) {
        localStorage.setItem(DISCOVERED_KEY, '1');
        setDiscovered(true);
      }
      return next;
    });
  }, [activeIndex, discovered]);

  const next = useCallback(() => goTo(activeIndex + 1, 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1, -1), [activeIndex, goTo]);

  // Auto-rotation lente, stoppée à la première interaction
  useEffect(() => {
    if (interacted || discovered) return;
    const id = setInterval(() => {
      setDirection(1);
      setActiveIndex(i => {
        const nextIdx = (i + 1) % TABS.length;
        setVisited(prev => {
          const n = new Set(prev);
          n.add(TABS[nextIdx].key);
          if (n.size === TABS.length) {
            localStorage.setItem(DISCOVERED_KEY, '1');
            setDiscovered(true);
          }
          return n;
        });
        return nextIdx;
      });
    }, 12000);
    return () => clearInterval(id);
  }, [interacted, discovered]);

  // Compteurs de vue
  useEffect(() => {
    if (!citation.id || incrementedRef.current.has(citation.id)) return;
    incrementedRef.current.add(citation.id);

    const todayKey = getTodayKey();
    const sessionKey = `freq_viewed_${citation.id}`;
    const shownKey = `freq_shown_${citation.id}_${todayKey}`;

    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      supabase.rpc('increment_citation_counter', { _id: citation.id, _kind: 'viewed' }).then(() => {});
    }

    if (!localStorage.getItem(shownKey)) {
      localStorage.setItem(shownKey, '1');
      supabase.rpc('increment_citation_counter', { _id: citation.id, _kind: 'shown' }).then(() => {});
    }

  }, [citation.id, citation.viewed_count, citation.shown_count]);

  const bars = 16;
  const heights = Array.from({ length: bars }, (_, i) => {
    const x = i / (bars - 1);
    const base = Math.sin(x * Math.PI) * 0.7 + 0.3;
    const noise = Math.sin(x * 7) * 0.15 + Math.cos(x * 13) * 0.1;
    return Math.max(0.15, Math.min(1, base + noise));
  });

  const activeTint = TABS[activeIndex].tint;
  const showHint = !discovered;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-emerald-600 dark:bg-emerald-900 p-6 md:p-8 shadow-xl shadow-emerald-900/20 dark:shadow-black/30">
      {/* Conic ambient halo — teinte selon catégorie */}
      <motion.div
        aria-hidden
        className="absolute -inset-[60%] opacity-20 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
        style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${activeTint} 180deg, transparent 360deg)` }}
      />

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px] h-10 px-3 opacity-15 pointer-events-none">
        {heights.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-full origin-bottom"
            style={{ background: `linear-gradient(to top, ${activeTint}, ${c2})` }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [h * 0.6, h, h * 0.75, h * 0.9, h * 0.6] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.07 }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        {/* Eyebrow + compteur 1/3 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
              Ma Fréquence du jour
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
            <span className="tabular-nums opacity-70">{activeIndex + 1} / {TABS.length}</span>
            <span className="opacity-30">·</span>
            <span style={{ color: activeTint }}>{TABS[activeIndex].label}</span>
          </div>
        </div>

        {/* Citation + flèches */}
        <div className="relative">
          {/* Flèche prev */}
          <button
            onClick={prev}
            aria-label="Fréquence précédente"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 items-center justify-center w-9 h-9 rounded-full text-emerald-100/40 hover:text-white hover:bg-white/10 hover:-translate-x-3 transition-all duration-300 z-20"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {/* Flèche next + pulse onboarding */}
          <motion.button
            onClick={next}
            aria-label="Fréquence suivante"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 items-center justify-center w-9 h-9 rounded-full text-emerald-100/40 hover:text-white hover:bg-white/10 hover:translate-x-3 transition-all duration-300 z-20"
            animate={showHint ? { scale: [1, 1.12, 1], boxShadow: [
              '0 0 0 0 rgba(110,231,183,0)',
              '0 0 0 8px rgba(110,231,183,0.18)',
              '0 0 0 0 rgba(110,231,183,0)',
            ] } : {}}
            transition={showHint ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : {}}
          >
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          </motion.button>

          {/* Zone draggable mobile */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50) next();
              else if (info.offset.x > 50) prev();
            }}
            className="md:px-10 cursor-grab active:cursor-grabbing"
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.blockquote
                key={`${activeTab}-${citation.texte}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -24 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="space-y-4"
              >
                <p
                  className="text-xl md:text-2xl italic leading-snug text-white"
                  style={{ fontFamily: "'Crimson Text', 'Libre Baskerville', serif" }}
                >
                  « {citation.texte} »
                </p>
                <footer className="flex items-center justify-end gap-2 text-emerald-100/70 text-xs">
                  <span className="h-px w-8 bg-emerald-300/40" />
                  <span className="inline-flex items-center gap-1">
                    — {citation.auteur}
                    {citation.url && (
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-200/50 hover:text-emerald-100 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Vérifier la source"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </span>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Indicateur progression : 3 traits style stories */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="flex items-center justify-center gap-2 w-full max-w-xs">
            {TABS.map(({ key, icon: Icon, label, tint }, idx) => {
              const isActive = idx === activeIndex;
              const wasVisited = visited.has(key);
              return (
                <button
                  key={key}
                  onClick={() => goTo(idx)}
                  aria-label={label}
                  className="group flex-1 flex flex-col items-center gap-1.5 py-1"
                >
                  <div className="relative w-full h-[3px] rounded-full bg-white/15 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: isActive
                        ? `linear-gradient(to right, ${tint}, #ffffff)`
                        : wasVisited ? tint : 'transparent' }}
                      initial={false}
                      animate={{ width: isActive ? '100%' : wasVisited ? '100%' : '0%', opacity: isActive ? 1 : wasVisited ? 0.5 : 0 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}>
                    <Icon className="w-3 h-3 text-white" strokeWidth={1.8} />
                    <span className="text-[10px] uppercase tracking-wider text-white hidden sm:inline">{label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Légende d'invitation, disparaît une fois découvert */}
          <AnimatePresence>
            {showHint && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.4 }}
                className="text-[10px] tracking-wide text-emerald-100/70 italic"
              >
                <span className="md:hidden">← glissez pour découvrir vos 3 fréquences →</span>
                <span className="hidden md:inline">Faites défiler vos 3 fréquences du jour</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FrequenceWave;
