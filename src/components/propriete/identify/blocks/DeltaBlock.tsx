import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';

const DAYS = 30;

export const DeltaBlock: React.FC<{ proprieteId?: string; index?: number }> = ({
  proprieteId,
  index = 0,
}) => {
  const { species, isLoading } = usePropertySpeciesPool(proprieteId);

  const { recent, reconfirmed, latest } = useMemo(() => {
    const cutoff = Date.now() - DAYS * 24 * 3600 * 1000;
    const recent = species.filter((s) => {
      const t = s.lastSeen ? new Date(s.lastSeen).getTime() : 0;
      return t >= cutoff && (s.observations || 0) === 1;
    });
    const reconfirmed = species.filter((s) => {
      const t = s.lastSeen ? new Date(s.lastSeen).getTime() : 0;
      return t >= cutoff && (s.observations || 0) > 1;
    });
    const latest = species
      .map((s) => s.lastSeen)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;
    return { recent, reconfirmed, latest };
  }, [species]);

  if (isLoading) return null;

  const latestStr = latest
    ? new Date(latest).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const empty = recent.length === 0 && reconfirmed.length === 0;

  return (
    <AnalyzeCard
      number={1}
      category="Nouveautés"
      title={`Depuis ${DAYS} jours sur votre propriété`}
      subtitle="Ce que les marcheurs ont révélé récemment sur le terrain."
      index={index}
    >
      {empty ? (
        <div className="text-center py-6 text-sm italic text-[hsl(var(--ds-forest-deep))]/60">
          <Calendar className="w-5 h-5 mx-auto mb-2 opacity-40" />
          Pas de nouvelle observation dans les {DAYS} derniers jours.
          {latestStr && (
            <div className="mt-1 text-xs">Dernière révélation : {latestStr}.</div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 p-4"
          >
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] uppercase text-emerald-700">
              <Sparkles className="w-3 h-3" /> Nouvelles espèces
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-serif text-[hsl(var(--ds-forest-deep))]">
                {recent.length}
              </span>
              <span className="text-xs text-[hsl(var(--ds-forest-deep))]/60">
                jamais vues avant
              </span>
            </div>
            {recent.slice(0, 3).length > 0 && (
              <ul className="mt-3 space-y-1">
                {recent.slice(0, 3).map((s) => (
                  <li
                    key={s.id}
                    className="text-xs text-[hsl(var(--ds-forest-deep))]/85 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="font-medium">{s.commonName || s.scientificName}</span>
                    <span className="italic text-[hsl(var(--ds-forest-deep))]/50 truncate">
                      {s.scientificName}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {recent.length > 3 && (
              <div className="mt-1.5 text-[10px] italic text-[hsl(var(--ds-forest-deep))]/50">
                +{recent.length - 3} autres…
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 p-4"
          >
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] uppercase text-amber-700">
              <TrendingUp className="w-3 h-3" /> Reconfirmées
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-serif text-[hsl(var(--ds-forest-deep))]">
                {reconfirmed.length}
              </span>
              <span className="text-xs text-[hsl(var(--ds-forest-deep))]/60">
                espèces revues
              </span>
            </div>
            {reconfirmed.slice(0, 3).length > 0 && (
              <ul className="mt-3 space-y-1">
                {reconfirmed
                  .sort((a, b) => (b.observations || 0) - (a.observations || 0))
                  .slice(0, 3)
                  .map((s) => (
                    <li
                      key={s.id}
                      className="text-xs text-[hsl(var(--ds-forest-deep))]/85 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      <span className="font-medium">{s.commonName || s.scientificName}</span>
                      <span className="text-[hsl(var(--ds-forest))]/70 text-[10px] whitespace-nowrap">
                        {s.observations}×
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </motion.div>
        </div>
      )}

      {latestStr && !empty && (
        <div className="mt-3 text-[10px] italic text-[hsl(var(--ds-forest-deep))]/50 text-center">
          Dernière observation : {latestStr}
        </div>
      )}
    </AnalyzeCard>
  );
};
