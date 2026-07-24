import React from 'react';
import { motion } from 'framer-motion';
import { Users, Compass, Award, User } from 'lucide-react';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { usePropertyContributors } from '@/hooks/propriete/usePropertyContributors';

const ROLE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  sentinelle: { label: 'Sentinelle', color: 'bg-emerald-600', icon: <Award className="w-3 h-3" /> },
  ambassadeur: { label: 'Ambassadeur', color: 'bg-amber-600', icon: <Compass className="w-3 h-3" /> },
  eclaireur: { label: 'Éclaireur', color: 'bg-sky-600', icon: <Compass className="w-3 h-3" /> },
  marcheur: { label: 'Marcheur', color: 'bg-[hsl(var(--ds-forest))]', icon: <User className="w-3 h-3" /> },
};

export const SentinellesBlock: React.FC<{ proprieteId?: string; index?: number }> = ({
  proprieteId,
  index = 0,
}) => {
  const { contributorSummaries } = usePropertySpeciesPool(proprieteId);
  const { data: contributors, isLoading } = usePropertyContributors(contributorSummaries);

  const list = contributors || [];

  return (
    <AnalyzeCard
      number={9}
      category="Sentinelles du lieu"
      title="Ces marcheurs veillent sur votre propriété"
      subtitle="Ils ont contribué à révéler le vivant sur votre terrain — le socle humain de la Fréquence."
      index={index}
    >
      {isLoading ? (
        <div className="text-center py-6 text-sm italic text-[hsl(var(--ds-forest-deep))]/60">
          Chargement des contributeurs…
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-6 text-sm italic text-[hsl(var(--ds-forest-deep))]/60">
          <Users className="w-5 h-5 mx-auto mb-2 opacity-40" />
          Aucun marcheur identifié n'a encore contribué.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {list.map((c, i) => {
            const role = ROLE_META[(c.role || 'marcheur').toLowerCase()] || ROLE_META.marcheur;
            const fullName = [c.prenom, c.nom].filter(Boolean).join(' ') || 'Marcheur anonyme';
            const initials = ((c.prenom?.[0] || '') + (c.nom?.[0] || '')).toUpperCase() || 'M';
            const lastStr = c.lastSeen
              ? new Date(c.lastSeen).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
              : null;
            return (
              <motion.div
                key={c.marcheurId}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 6) * 0.04 }}
                className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-3 flex items-start gap-3 hover:border-[hsl(var(--ds-forest))]/50 transition-all"
              >
                <div className="relative shrink-0">
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={fullName}
                      className="w-12 h-12 rounded-full object-cover ring-2"
                      style={{ borderColor: c.couleur || undefined }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-[hsl(var(--ds-cream))] font-serif text-lg"
                      style={{ background: c.couleur || 'hsl(var(--ds-forest))' }}
                    >
                      {initials}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-white shadow ${role.color}`}
                    title={role.label}
                  >
                    {role.icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[hsl(var(--ds-forest-deep))] leading-tight truncate">
                    {fullName}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-[hsl(var(--ds-forest))]/70 mt-0.5">
                    {role.label}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-3 text-[11px] text-[hsl(var(--ds-forest-deep))]/80">
                    <span>
                      <span className="font-bold text-[hsl(var(--ds-forest-deep))]">
                        {c.speciesCount}
                      </span>{' '}
                      esp.
                    </span>
                    <span>
                      <span className="font-bold text-[hsl(var(--ds-forest-deep))]">
                        {c.observations}
                      </span>{' '}
                      obs.
                    </span>
                  </div>
                  {lastStr && (
                    <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55 mt-0.5">
                      dernière : {lastStr}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AnalyzeCard>
  );
};
