import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Activity } from 'lucide-react';
import { FAMILY_META } from '@/lib/apiMcpFamilies';
import type { ApiMcpEntry } from '@/hooks/useApiMcpRegistry';
import type { ApiMcpHealth } from '@/hooks/useApiMcpHealth';
import { formatVolume, formatFreshness } from '@/hooks/useApiMcpHealth';

interface Props {
  entry: ApiMcpEntry;
  health?: ApiMcpHealth;
  onOpen: () => void;
  showAdminBadge?: boolean;
}

const STATUS_DOT: Record<string, string> = {
  green: 'bg-emerald-400 shadow-[0_0_8px_rgba(45,212,168,0.8)]',
  orange: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
  red: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
  unknown: 'bg-white/30',
};

const ApiCard: React.FC<Props> = ({ entry, health, onOpen, showAdminBadge }) => {
  const fam = FAMILY_META[entry.family];

  return (
    <motion.button
      onClick={onOpen}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative text-left overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${fam.accent} hover:border-emerald-400/40 transition-all ${fam.glow}`}
    >
      {/* Hero */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={fam.hero}
          alt=""
          loading="lazy"
          width={1536}
          height={832}
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/40 to-transparent" />
        {entry.is_critical && (
          <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full bg-emerald-950/80 text-emerald-200 border border-emerald-400/30">
            critique
          </span>
        )}
      </div>

      {/* Body */}
      <div className="relative p-5 space-y-3 bg-emerald-950/85 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-emerald-50">{entry.name}</h3>
            <p className="text-xs text-emerald-200/70 italic mt-0.5">« {entry.tagline} »</p>
          </div>
          {showAdminBadge && (
            <span className={`mt-1 w-2.5 h-2.5 rounded-full ${STATUS_DOT[health?.status ?? 'unknown']}`} />
          )}
        </div>

        <p className="text-xs text-emerald-100/80 leading-relaxed line-clamp-3">
          {entry.simple_description}
        </p>

        {(health?.volume !== null && health?.volume !== undefined) || health?.freshness ? (
          <div className="flex items-center gap-3 pt-2 border-t border-emerald-400/10">
            {health?.volume !== null && health?.volume !== undefined && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-200/90">
                <Activity className="w-3 h-3" />
                <span className="font-semibold tabular-nums">{formatVolume(health.volume)}</span>
                <span className="text-emerald-200/50">
                  {entry.metric_queries?.volume?.label ?? 'unités'}
                </span>
              </div>
            )}
            {health?.freshness && (
              <div className="text-[11px] text-emerald-200/60 ml-auto">
                · maj {formatFreshness(health.freshness)}
              </div>
            )}
          </div>
        ) : null}

        <div className="flex items-center gap-1 text-xs text-emerald-300 group-hover:text-emerald-200 pt-1">
          <span>Découvrir l'histoire</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
};

export default ApiCard;
