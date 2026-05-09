import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Lock } from 'lucide-react';
import EmpreinteVivante from './EmpreinteVivante';
import type { MarcheurWithStats } from '@/hooks/useExplorationParticipants';
import type { SensibleBuckets } from '@/lib/speciesClassification';
import type { BadgesResult } from '@/hooks/useMarcheurBadges';

interface ImpactTeaserCardProps {
  marcheur: MarcheurWithStats;
  sensible: SensibleBuckets;
  badgesResult: BadgesResult;
  sentinelleScore: number;
  sentinelleLabel: string;
  hasTemoignage: boolean;
  onOpen: () => void;
}

const ImpactTeaserCard: React.FC<ImpactTeaserCardProps> = ({
  marcheur, sensible, badgesResult, sentinelleScore, sentinelleLabel, hasTemoignage, onOpen,
}) => {
  const topBadges = badgesResult.badges.slice(0, 3);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="w-full mx-3 my-3 p-4 rounded-2xl text-left
                 bg-gradient-to-br from-emerald-950/80 via-slate-900/80 to-emerald-900/60
                 border border-emerald-500/20 hover:border-emerald-400/40
                 transition-all relative overflow-hidden group"
      style={{ width: 'calc(100% - 1.5rem)' }}
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 opacity-50 pointer-events-none" style={{
        background: 'radial-gradient(circle at 80% 30%, hsl(150 60% 30% / 0.4), transparent 60%)',
      }} />

      <div className="relative flex items-center gap-4">
        {/* Mini Empreinte */}
        <div className="flex-shrink-0">
          <EmpreinteVivante
            photos={marcheur.stats.photos}
            audios={marcheur.stats.sons}
            textes={marcheur.stats.textes}
            temoignages={hasTemoignage ? 1 : 0}
            bioCount={sensible.bioIndicateurs.length}
            auxCount={sensible.auxiliaires.length}
            eeeCount={sensible.eee.length}
            size={92}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80 mb-1">
            Fréquence du marcheur
          </div>
          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className="text-2xl font-bold text-white tabular-nums">{sentinelleScore}</span>
            <span className="text-xs text-white/50">/ 100</span>
          </div>
          <div className="text-xs text-emerald-200 font-medium mb-2 truncate">{sentinelleLabel}</div>

          {/* Mini progress bar */}
          <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-2.5">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${sentinelleScore}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              style={{ boxShadow: '0 0 8px hsl(150 70% 55% / 0.6)' }}
            />
          </div>

          {/* Top 3 badges mini */}
          <div className="flex items-center gap-1.5">
            {topBadges.map(b => (
              <div
                key={b.id}
                className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  b.unlocked
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/[0.03] border-white/5 opacity-40'
                }`}
                title={b.label}
              >
                {b.unlocked
                  ? <b.icon className={`w-3 h-3 ${b.color}`} />
                  : <Lock className="w-2.5 h-2.5 text-white/40" />
                }
              </div>
            ))}
            <div className="text-[10px] text-white/50 ml-1">
              {badgesResult.unlockedCount}/{badgesResult.badges.length}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-emerald-200 font-medium">Découvrir mon empreinte</span>
        <ChevronRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </motion.button>
  );
};

export default ImpactTeaserCard;
