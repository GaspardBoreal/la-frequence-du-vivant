import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
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

type Citation = {
  id: string;
  texte: string;
  auteur: string;
  oeuvre: string;
  url: string;
  shown_count: number;
  viewed_count: number;
};

const FALLBACK_CITATION: Citation = {
  id: '',
  texte: "Dans chaque promenade avec la nature, on reçoit bien plus que ce qu'on cherche.",
  auteur: "John Muir",
  oeuvre: "Unpublished Journals (1938)",
  url: "https://vault.sierraclub.org/john_muir_exhibit/writings/",
  shown_count: 0,
  viewed_count: 0,
};

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function getCitationDuJour(citations: Citation[]): Citation {
  if (!citations.length) return FALLBACK_CITATION;
  const seed = new Date().getFullYear() * 366 + getDayOfYear();
  return citations[seed % citations.length];
}

interface FrequenceWaveProps {
  totalFrequences: number;
  role: CommunityRoleKey;
}

const FrequenceWave: React.FC<FrequenceWaveProps> = ({ totalFrequences, role }) => {
  const [c1, c2] = ROLE_GRADIENT[role];
  const incrementedRef = useRef(false);

  const { data: citations = [] } = useQuery({
    queryKey: ['frequence-citations-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('frequence_citations')
        .select('id, texte, auteur, oeuvre, url, shown_count, viewed_count')
        .eq('active', true)
        .order('id');
      if (error) throw error;
      return data as Citation[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const citation = getCitationDuJour(citations);

  // Increment counters once per session/day
  useEffect(() => {
    if (!citation.id || incrementedRef.current) return;
    incrementedRef.current = true;

    const todayKey = getTodayKey();
    const sessionKey = `freq_viewed_${citation.id}`;
    const shownKey = `freq_shown_${citation.id}_${todayKey}`;

    // viewed_count: +1 per session (sessionStorage)
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      supabase
        .from('frequence_citations')
        .update({ viewed_count: citation.viewed_count + 1 })
        .eq('id', citation.id)
        .then(() => {});
    }

    // shown_count: +1 per calendar day (localStorage)
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
    <div className="relative rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-white/[0.12] dark:border-white/20 backdrop-blur-lg p-3 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-transparent dark:from-white/[0.05] dark:to-transparent" />

      {/* Onde en fond absolu */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px] h-12 px-3 opacity-20">
        {heights.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-full origin-bottom"
            style={{ background: `linear-gradient(to top, ${c1}, ${c2})` }}
            initial={{ scaleY: 0 }}
            animate={{
              scaleY: [h * 0.6, h, h * 0.75, h * 0.9, h * 0.6],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.07,
            }}
          />
        ))}
      </div>

      {/* Titre */}
      <div className="relative mb-1.5">
        <span className="text-[10px] text-emerald-700 dark:text-white/60 font-medium tracking-wide uppercase">Ma Fréquence du jour</span>
      </div>

      {/* Citation pleine largeur */}
      <AnimatePresence mode="wait">
        <motion.div
          key={citation.texte}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative text-left"
        >
          <p className="italic text-foreground text-xs leading-relaxed">
            « {citation.texte} »
          </p>
          <div className="flex justify-end mt-1.5">
            <span className="text-muted-foreground text-[10px] inline-flex items-center gap-1">
              — {citation.auteur}
              {citation.url && (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground/50 hover:text-foreground/60 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Vérifier la source"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FrequenceWave;
