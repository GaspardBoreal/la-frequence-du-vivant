import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface BentoKpiTileProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  to?: string;
  hint?: string;
  comingSoon?: boolean;
  accent?: 'violet' | 'emerald' | 'amber' | 'rose' | 'sky';
  span?: 'col-1' | 'col-2' | 'col-3';
  loading?: boolean;
}

const ACCENTS: Record<NonNullable<BentoKpiTileProps['accent']>, string> = {
  violet: 'text-[hsl(var(--crm-accent))] bg-[hsl(var(--crm-accent-soft))]',
  emerald: 'text-emerald-300 bg-emerald-500/10',
  amber: 'text-amber-300 bg-amber-500/10',
  rose: 'text-rose-300 bg-rose-500/10',
  sky: 'text-sky-300 bg-sky-500/10',
};

const SPANS: Record<NonNullable<BentoKpiTileProps['span']>, string> = {
  'col-1': 'md:col-span-3',
  'col-2': 'md:col-span-6',
  'col-3': 'md:col-span-12',
};

export const BentoKpiTile: React.FC<BentoKpiTileProps> = ({
  label,
  value,
  icon: Icon,
  to,
  hint,
  comingSoon,
  accent = 'violet',
  span = 'col-1',
  loading,
}) => {
  const content = (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={[
        'group relative h-full rounded-xl crm-surface p-5 overflow-hidden',
        to ? 'crm-glow cursor-pointer' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3 mb-6">
        <span className="text-[11px] uppercase tracking-wider crm-muted font-medium">{label}</span>
        <div className={['h-8 w-8 rounded-lg flex items-center justify-center shrink-0', ACCENTS[accent]].join(' ')}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        {loading ? (
          <div className="h-10 w-20 rounded bg-[hsl(var(--crm-surface-2))] animate-pulse" />
        ) : (
          <span className="text-4xl md:text-5xl font-semibold crm-num text-[hsl(var(--crm-text))]">
            {value}
          </span>
        )}
        {comingSoon && (
          <span className="ml-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[hsl(var(--crm-surface-2))] crm-muted">
            Bientôt
          </span>
        )}
      </div>

      {hint && <p className="mt-2 text-xs crm-muted">{hint}</p>}

      {to && (
        <ArrowUpRight className="absolute top-4 right-4 h-3.5 w-3.5 crm-muted opacity-0 group-hover:opacity-100 transition-opacity" style={{ top: 56 }} />
      )}
    </motion.div>
  );

  if (to && !comingSoon) {
    return (
      <Link to={to} className={SPANS[span] + ' col-span-12'}>
        {content}
      </Link>
    );
  }

  return <div className={SPANS[span] + ' col-span-12'}>{content}</div>;
};
