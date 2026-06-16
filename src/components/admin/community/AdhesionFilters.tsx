import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Heart, CircleDot, CircleSlash } from 'lucide-react';

export type AdhesionFilter = 'all' | 'yes' | 'no';
export type CollegeFilter = 'all' | 'fondateurs' | 'actifs' | 'partenaires_mecenes';

interface Props {
  filter: AdhesionFilter;
  onFilterChange: (v: AdhesionFilter) => void;
  college: CollegeFilter;
  onCollegeChange: (v: CollegeFilter) => void;
  total: number;
  adherents: number;
  nonAdherents: number;
  collegeCounts: Record<'fondateurs' | 'actifs' | 'partenaires_mecenes', number>;
}

const Pill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ active, onClick, children, className }) => (
  <motion.button
    type="button"
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-all',
      active
        ? cn('border-transparent ring-2', className)
        : 'border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground',
    )}
  >
    {children}
  </motion.button>
);

export const AdhesionFilters: React.FC<Props> = ({
  filter, onFilterChange, college, onCollegeChange,
  total, adherents, nonAdherents, collegeCounts,
}) => {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Heart className="h-3.5 w-3.5 text-rose-500" />
        Adhésion à l'association
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Pill
          active={filter === 'all'}
          onClick={() => { onFilterChange('all'); onCollegeChange('all'); }}
          className="ring-primary/40 bg-primary/10 text-primary"
        >
          <CircleDot className="h-3 w-3" /> Tous · {total}
        </Pill>
        <Pill
          active={filter === 'yes'}
          onClick={() => onFilterChange('yes')}
          className="ring-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-300"
        >
          <Heart className="h-3 w-3 fill-current" /> Adhérent·e · {adherents}
        </Pill>
        <Pill
          active={filter === 'no'}
          onClick={() => { onFilterChange('no'); onCollegeChange('all'); }}
          className="ring-slate-500/40 bg-slate-500/15 text-slate-600 dark:text-slate-300"
        >
          <CircleSlash className="h-3 w-3" /> Non adhérent·e · {nonAdherents}
        </Pill>

        {filter === 'yes' && (
          <>
            <span className="mx-1 h-5 w-px bg-border/60" />
            <Pill
              active={college === 'all'}
              onClick={() => onCollegeChange('all')}
              className="ring-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
            >
              Tous collèges · {adherents}
            </Pill>
            <Pill
              active={college === 'actifs'}
              onClick={() => onCollegeChange('actifs')}
              className="ring-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            >
              Actifs · {collegeCounts.actifs}
            </Pill>
            <Pill
              active={college === 'fondateurs'}
              onClick={() => onCollegeChange('fondateurs')}
              className="ring-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
            >
              Fondateurs · {collegeCounts.fondateurs}
            </Pill>
            <Pill
              active={college === 'partenaires_mecenes'}
              onClick={() => onCollegeChange('partenaires_mecenes')}
              className="ring-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300"
            >
              Partenaires &amp; Mécènes · {collegeCounts.partenaires_mecenes}
            </Pill>
          </>
        )}
      </div>
    </div>
  );
};

export default AdhesionFilters;
