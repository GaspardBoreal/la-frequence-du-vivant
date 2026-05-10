import React, { useMemo, useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScienceAccountSuggestions } from '@/hooks/useScienceAccountSuggestions';
import { NETWORK_META, type ScienceNetwork } from '@/types/scienceAccounts';
import SuggestionsDrawer from './SuggestionsDrawer';

export const SuggestionsBanner: React.FC = () => {
  const { data: suggestions = [], isLoading } = useScienceAccountSuggestions();
  const [open, setOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Partial<Record<ScienceNetwork, number>> = {};
    for (const s of suggestions) c[s.network] = (c[s.network] || 0) + 1;
    return c;
  }, [suggestions]);

  if (isLoading || suggestions.length === 0) return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-left rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.04] to-transparent px-4 py-3 flex items-center gap-3 hover:from-amber-500/[0.12] transition-colors group"
      >
        <div className="h-9 w-9 rounded-full bg-amber-500/15 ring-1 ring-amber-500/40 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">
            {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} de comptes sciences participatives
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
            {Object.entries(counts).map(([net, n]) => {
              const meta = NETWORK_META[net as ScienceNetwork];
              const Icon = meta.icon;
              return (
                <span key={net} className="inline-flex items-center gap-1">
                  <Icon className={`h-3 w-3 ${meta.badgeText}`} />
                  {meta.short}: {n}
                </span>
              );
            })}
          </div>
        </div>
        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Tout voir <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </motion.button>
      <SuggestionsDrawer open={open} onOpenChange={setOpen} />
    </>
  );
};

export default SuggestionsBanner;
