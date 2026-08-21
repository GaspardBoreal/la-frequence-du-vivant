import React from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import RuleCard from '@/components/iot/alerts/RuleCard';
import { ICONES_REGLES } from '@/components/iot/alerts/RuleConstellation';
import { REGLES, type RegleKey } from '@/lib/iot/anomalies';

interface Props {
  ouvert: boolean;
  onToggle: (v: boolean) => void;
  counts: Record<RegleKey, number>;
  /** Seuil réellement appliqué sur la période, par règle. */
  exemples?: Partial<Record<RegleKey, string>>;
}

/**
 * « Comment sont détectées les alertes » : la grille complète des veilles,
 * lisible d'un coup d'œil, sans avoir à ouvrir chaque pastille une par une.
 */
export const RulesLegend: React.FC<Props> = ({ ouvert, onToggle, counts, exemples }) => (
  <div className="rounded-xl border border-border bg-card">
    <button
      type="button"
      onClick={() => onToggle(!ouvert)}
      aria-expanded={ouvert}
      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted/40"
    >
      <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="font-medium">Comment sont détectées les alertes</span>
        <span className="ml-2 text-xs text-muted-foreground">
          {REGLES.length} veilles, leurs seuils et ce qu'elles ignorent volontairement
        </span>
      </span>
      <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-60 transition-transform', ouvert && 'rotate-180')} />
    </button>

    {ouvert && (
      <div className="grid gap-2 border-t border-border p-3 sm:grid-cols-2 xl:grid-cols-4">
        {REGLES.map((r) => {
          const Icone = ICONES_REGLES[r.key];
          const n = counts[r.key] ?? 0;
          return (
            <RuleCard
              key={r.key}
              regle={r}
              count={n}
              exemple={exemples?.[r.key] ?? null}
              icone={
                <Icone
                  className={cn(
                    'h-3.5 w-3.5',
                    n > 0
                      ? r.gravite === 'critique'
                        ? 'text-destructive'
                        : 'text-primary'
                      : 'text-muted-foreground/50',
                  )}
                />
              }
            />
          );
        })}
      </div>
    )}
  </div>
);

export default RulesLegend;
