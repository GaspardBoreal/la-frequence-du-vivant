import React from 'react';
import { AlertOctagon, Activity, Ban, Gauge, Layers, Minus, MoveUpRight, VolumeX } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import RuleCard from '@/components/iot/alerts/RuleCard';
import { REGLES, type RegleKey } from '@/lib/iot/anomalies';

export const ICONES_REGLES: Record<RegleKey, React.ComponentType<{ className?: string }>> = {
  hors_domaine: AlertOctagon,
  hors_usage: Gauge,
  incoherence: Layers,
  aberrante: Activity,
  saut: MoveUpRight,
  figee: Minus,
  silence: VolumeX,
  ingestion: Ban,
};

const ICONES = ICONES_REGLES;

interface Props {
  counts: Record<RegleKey, number>;
  actif: RegleKey | null;
  onToggle: (k: RegleKey | null) => void;
  /** Seuil réellement appliqué, par règle, tiré des alertes de la période. */
  exemples?: Partial<Record<RegleKey, string>>;
}

/**
 * « Constellation des sept veilles » : une pastille par règle de détection.
 * Éteinte = règle active, rien à signaler. Allumée = anomalies détectées,
 * clic pour filtrer la liste. Le « ? » ouvre la fiche explicative.
 */
export const RuleConstellation: React.FC<Props> = ({ counts, actif, onToggle, exemples }) => (
  <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-7">
    {REGLES.map((r) => {
      const n = counts[r.key] ?? 0;
      const Icone = ICONES[r.key];
      const allume = n > 0;
      const selected = actif === r.key;
      const ton = r.gravite === 'critique' ? 'text-destructive' : r.gravite === 'surveiller' ? 'text-primary' : 'text-muted-foreground';

      return (
        <Popover key={r.key}>
          <div
            className={cn(
              'relative min-w-[132px] shrink-0 snap-start rounded-xl border bg-card p-2.5 transition-colors sm:min-w-0',
              selected ? 'border-primary ring-1 ring-primary/40' : 'border-border',
              allume ? '' : 'opacity-60',
            )}
          >
            <button
              type="button"
              onClick={() => onToggle(selected ? null : r.key)}
              disabled={!allume}
              className="w-full text-left disabled:cursor-default"
              aria-pressed={selected}
            >
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {allume && (
                    <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-70',
                      r.gravite === 'critique' ? 'bg-destructive' : 'bg-primary')} />
                  )}
                  <span className={cn('relative inline-flex h-2 w-2 rounded-full',
                    allume ? (r.gravite === 'critique' ? 'bg-destructive' : 'bg-primary') : 'bg-muted-foreground/40')} />
                </span>
                <Icone className={cn('h-3.5 w-3.5', allume ? ton : 'text-muted-foreground')} />
                <span className="text-xl font-semibold tabular-nums leading-none">{n}</span>
              </span>
              <span className="mt-1 block text-[11px] leading-tight text-muted-foreground">{r.nom}</span>
            </button>

            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Comment fonctionne la règle « ${r.nom} »`}
                className="absolute right-1.5 top-1.5 rounded-full px-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ?
              </button>
            </PopoverTrigger>
          </div>

          <PopoverContent align="start" className="w-80 p-0">
            <RuleCard regle={r} count={n} exemple={exemples?.[r.key] ?? null} />
          </PopoverContent>
        </Popover>
      );
    })}
  </div>
);

export default RuleConstellation;
