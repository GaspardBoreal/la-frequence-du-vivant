import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeHtml } from '@/utils/htmlSanitizer';

interface LireDescriptionsTabProps {
  activeMarcheId?: string;
}

const PAGE_LABELS = ['Présentation', 'En détail'] as const;

const looksLikeHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s);

const LireDescriptionsTab: React.FC<LireDescriptionsTabProps> = ({ activeMarcheId }) => {
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [activeMarcheId]);

  const { data, isLoading } = useQuery({
    queryKey: ['marche-descriptions', activeMarcheId],
    queryFn: async () => {
      if (!activeMarcheId) return null;
      const { data, error } = await supabase
        .from('marches')
        .select('descriptif_court, descriptif_long')
        .eq('id', activeMarcheId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeMarcheId,
    staleTime: 5 * 60 * 1000,
  });

  const pages = useMemo(
    () => [
      { label: PAGE_LABELS[0], content: (data?.descriptif_court || '').trim() },
      { label: PAGE_LABELS[1], content: (data?.descriptif_long || '').trim() },
    ],
    [data]
  );

  const current = pages[page];
  const hasAny = pages.some(p => p.content);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse py-6">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
        <div className="h-3 w-4/6 bg-muted rounded" />
      </div>
    );
  }

  if (!hasAny) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mb-3">
          <BookOpen className="w-6 h-6 text-emerald-500/70" />
        </div>
        <p className="text-sm text-muted-foreground">Pas encore de description</p>
      </motion.div>
    );
  }

  const goPrev = () => setPage(p => (p === 0 ? pages.length - 1 : p - 1));
  const goNext = () => setPage(p => (p === pages.length - 1 ? 0 : p + 1));

  // If current page empty but other has content, jump
  useEffect(() => {
    if (!current.content && hasAny) {
      const other = pages.findIndex(p => p.content);
      if (other !== -1) setPage(other);
    }
  }, [current.content, hasAny, pages]);

  const isHtml = current.content && looksLikeHtml(current.content);

  return (
    <div className="w-full">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{current.label}</h3>
        <div className="mt-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
      </div>

      <div className="relative min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) goNext();
              else if (info.offset.x > 60) goPrev();
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            {isHtml ? (
              <div
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(current.content) }}
              />
            ) : (
              <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap">
                {current.content}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {pages.filter(p => p.content).length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={goPrev}
            aria-label="Précédent"
            className="w-11 h-11 rounded-full bg-muted/60 dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Aller à ${pages[i].label}`}
                className={`h-2 rounded-full transition-all ${
                  i === page
                    ? 'w-6 bg-emerald-500'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
          <button
            onClick={goNext}
            aria-label="Suivant"
            className="w-11 h-11 rounded-full bg-muted/60 dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LireDescriptionsTab;
