import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, CircleSlash, CircleDot } from 'lucide-react';
import { NETWORK_META, NETWORK_ORDER, type ScienceNetwork } from '@/types/scienceAccounts';

export type NetworkFilterMode = 'or' | 'and';
export type SpecialFilter = 'none' | 'any' | 'empty';

interface Props {
  selected: ScienceNetwork[];
  onSelectedChange: (next: ScienceNetwork[]) => void;
  mode: NetworkFilterMode;
  onModeChange: (m: NetworkFilterMode) => void;
  special: SpecialFilter;
  onSpecialChange: (s: SpecialFilter) => void;
  counts: Record<ScienceNetwork, number>;
  totalWithAny: number;
  totalWithoutAny: number;
}

const Pill: React.FC<{
  active: boolean; onClick: () => void; children: React.ReactNode;
  ringClass?: string; bgClass?: string; textClass?: string;
}> = ({ active, onClick, children, ringClass, bgClass, textClass }) => (
  <motion.button
    type="button"
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-all',
      active
        ? cn('border-transparent ring-2', ringClass, bgClass, textClass)
        : 'border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground',
    )}
  >
    {children}
  </motion.button>
);

export const NetworkFilters: React.FC<Props> = ({
  selected, onSelectedChange, mode, onModeChange, special, onSpecialChange,
  counts, totalWithAny, totalWithoutAny,
}) => {
  const toggle = (k: ScienceNetwork) => {
    if (selected.includes(k)) onSelectedChange(selected.filter(s => s !== k));
    else onSelectedChange([...selected, k]);
    if (special !== 'none') onSpecialChange('none');
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Comptes sciences participatives
        </div>
        {selected.length > 1 && (
          <button
            type="button"
            onClick={() => onModeChange(mode === 'or' ? 'and' : 'or')}
            className="text-[11px] px-2 py-0.5 rounded-full border border-border/60 hover:border-primary/50 text-muted-foreground hover:text-primary transition"
          >
            Mode : <span className="font-semibold">{mode === 'or' ? 'au moins un' : 'tous cochés'}</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Pill
          active={selected.length === 0 && special === 'none'}
          onClick={() => { onSelectedChange([]); onSpecialChange('none'); }}
          ringClass="ring-primary/40" bgClass="bg-primary/10" textClass="text-primary"
        >
          <CircleDot className="h-3 w-3" /> Tous
        </Pill>

        {NETWORK_ORDER.map(k => {
          const meta = NETWORK_META[k];
          const Icon = meta.icon;
          const active = selected.includes(k);
          const c = counts[k] ?? 0;
          return (
            <Pill
              key={k}
              active={active}
              onClick={() => toggle(k)}
              ringClass={meta.badgeRing}
              bgClass={meta.badgeBg}
              textClass={meta.badgeText}
            >
              <Icon className="h-3 w-3" />
              <span>{meta.short}</span>
              <span className="opacity-70">· {c}</span>
            </Pill>
          );
        })}

        <span className="mx-1 h-5 w-px bg-border/60" />

        <Pill
          active={special === 'any'}
          onClick={() => { onSpecialChange(special === 'any' ? 'none' : 'any'); onSelectedChange([]); }}
          ringClass="ring-emerald-500/40" bgClass="bg-emerald-500/15" textClass="text-emerald-600 dark:text-emerald-300"
        >
          <CircleDot className="h-3 w-3" /> Avec ≥ 1 compte · {totalWithAny}
        </Pill>
        <Pill
          active={special === 'empty'}
          onClick={() => { onSpecialChange(special === 'empty' ? 'none' : 'empty'); onSelectedChange([]); }}
          ringClass="ring-slate-500/40" bgClass="bg-slate-500/15" textClass="text-slate-600 dark:text-slate-300"
        >
          <CircleSlash className="h-3 w-3" /> Sans aucun · {totalWithoutAny}
        </Pill>
      </div>
    </div>
  );
};

export default NetworkFilters;
