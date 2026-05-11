import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, BookOpen, TreePine, Headphones } from 'lucide-react';
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

const TABS: { key: Categorie; icon: React.ElementType; label: string }[] = [
  { key: 'geopoetique', icon: BookOpen, label: 'Géopoétique' },
  { key: 'biodiversite', icon: TreePine, label: 'Biodiversité' },
  { key: 'bioacoustique', icon: Headphones, label: 'Bioacoustique' },
];

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
  const [c1, c2] = ROLE_GRADIENT[role];
  const [activeTab, setActiveTab] = useState<Categorie>('geopoetique');
  const incrementedRef = useRef<Set<string>>(new Set());

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

  // Group by categorie
  const byCategorie: Record<Categorie, Citation[]> = {
    geopoetique: allCitations.filter(c => c.categorie === 'geopoetique'),
    biodiversite: allCitations.filter(c => c.categorie === 'biodiversite'),
    bioacoustique: allCitations.filter(c => c.categorie === 'bioacoustique'),
  };

  const catOffsets: Record<Categorie, number> = { geopoetique: 0, biodiversite: 137, bioacoustique: 271 };

  const citation = getCitationDuJour(byCategorie[activeTab], catOffsets[activeTab]) || FALLBACK_CITATIONS[activeTab];

  // Increment counters once per session/day per citation
  useEffect(() => {
    if (!citation.id || incrementedRef.current.has(citation.id)) return;
    incrementedRef.current.add(citation.id);

    const todayKey = getTodayKey();
    const sessionKey = `freq_viewed_${citation.id}`;
    const shownKey = `freq_shown_${citation.id}_${todayKey}`;

    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      supabase
        .from('frequence_citations')
        .update({ viewed_count: citation.viewed_count + 1 })
        .eq('id', citation.id)
        .then(() => {});
    }

    if (!localStorage.getItem(shownKey)) {
      localStorage.setItem(shownKey, '1');
      supabase
        .from('frequence_citations')
        .update({ shown_count: citation.shown_count + 1 })
        .eq('id', citation.id)
        .then(() => {});
    }
  }, [citation.id, citation.viewed_count, citation.shown_count]);

  const bars = 16;
  const heights = Array.from({ length: bars }, (_, i) => {
    const x = i / (bars - 1);
    const base = Math.sin(x * Math.PI) * 0.7 + 0.3;
    const noise = Math.sin(x * 7) * 0.15 + Math.cos(x * 13) * 0.1;
    return Math.max(0.15, Math.min(1, base + noise));
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-emerald-600 dark:bg-emerald-900 p-6 md:p-8 shadow-xl shadow-emerald-900/20 dark:shadow-black/30">
      {/* Conic ambient halo */}
      <motion.div
        aria-hidden
        className="absolute -inset-[60%] opacity-20 pointer-events-none"
        style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${c2} 180deg, transparent 360deg)` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
      />

      {/* Subtle wave at bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px] h-10 px-3 opacity-15 pointer-events-none">
        {heights.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-full origin-bottom"
            style={{ background: `linear-gradient(to top, ${c1}, ${c2})` }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [h * 0.6, h, h * 0.75, h * 0.9, h * 0.6] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.07 }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        {/* Eyebrow */}
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
            Ma Fréquence du jour
          </span>
        </div>

        {/* Citation hero */}
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={`${activeTab}-${citation.texte}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
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

        {/* Discreet category tabs */}
        <div className="flex justify-end gap-1 pt-1">
          {TABS.map(({ key, icon: Icon, label }) => {
            const isActive = activeTab === key;
            const hasContent = byCategorie[key].length > 0;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                disabled={!hasContent && key !== activeTab}
                className={`p-1.5 rounded-md transition-all ${
                  isActive
                    ? 'bg-white/20 ring-1 ring-white/30'
                    : hasContent
                      ? 'hover:bg-white/10 opacity-50 hover:opacity-90'
                      : 'opacity-20 cursor-not-allowed'
                }`}
                title={label}
                aria-label={label}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-100/70'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FrequenceWave;
