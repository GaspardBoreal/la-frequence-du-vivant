import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Hand } from 'lucide-react';
import { useMarcheurPratiques } from '@/hooks/useCurationMarcheurs';
import { sanitizeHtml } from '@/utils/htmlSanitizer';

interface Props {
  marcheurId: string;
  prenom: string;
  explorationId?: string;
}

/**
 * Bloc "Pratiques portées par {prénom}" — saveur agroécologique, ton ambré.
 * Affiché sous CitizenPlatformsCard dans le portfolio Impact.
 */
const PratiquesPorteesCard: React.FC<Props> = ({ marcheurId, prenom, explorationId }) => {
  const { data: pratiques = [], isLoading } = useMarcheurPratiques(marcheurId);

  const scoped = explorationId
    ? pratiques.filter(p => p.exploration_id === explorationId)
    : pratiques;

  if (isLoading) return null;

  return (
    <div className="mt-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-amber-500/[0.03] to-transparent p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Hand className="w-4 h-4 text-amber-600 dark:text-amber-300" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">
            Pratiques portées par {prenom}
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Gestes agroécologiques transmis et documentés
          </p>
        </div>
        {scoped.length > 0 && (
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 tabular-nums">
            {scoped.length}
          </span>
        )}
      </div>

      {scoped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-500/25 bg-amber-500/[0.02] p-4 text-center">
          <Sprout className="w-6 h-6 mx-auto text-amber-500/50 mb-1.5" />
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            Une pratique observée, c'est un savoir vivant transmis.<br />
            Demandez à un curateur de relier {prenom} à un geste de terrain.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {scoped.map((p, i) => (
            <motion.article
              key={p.curation_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-amber-500/15 bg-card/40 p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h5 className="text-sm font-semibold text-foreground flex-1">
                  {p.title || 'Pratique éditoriale'}
                </h5>
                {p.role_label && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/15 text-[10px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                    {p.role_label}
                  </span>
                )}
              </div>
              {p.description && (
                <div
                  className="text-xs text-muted-foreground line-clamp-2 [&_strong]:font-semibold [&_em]:italic"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.description) }}
                />
              )}
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
};

export default PratiquesPorteesCard;
