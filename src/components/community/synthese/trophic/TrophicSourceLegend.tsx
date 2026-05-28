import React, { useMemo } from 'react';
import { BookOpenCheck, Network, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TrophicChainResult } from '@/hooks/useTrophicChain';
import type { TrophicAssignment } from '@/lib/trophicClassification';

type Source = TrophicAssignment['source'];

const SEGMENTS: Array<{
  key: Source;
  icon: typeof BookOpenCheck;
  singular: string;
  plural: string;
  tip: string;
}> = [
  {
    key: 'kb',
    icon: BookOpenCheck,
    singular: 'curée',
    plural: 'curées',
    tip: 'Attribution éditoriale validée par la base de connaissances La Fréquence du Vivant.',
  },
  {
    key: 'heuristic',
    icon: Network,
    singular: 'famille',
    plural: 'famille',
    tip: 'Déduit d’une règle taxonomique (famille / genre) — fiabilité élevée.',
  },
  {
    key: 'iconic',
    icon: Sparkles,
    singular: 'taxon',
    plural: 'taxon',
    tip: 'Déduit du grand groupe iNaturalist (iconic_taxon) — niveau indicatif.',
  },
];

interface Props {
  chain: TrophicChainResult;
  className?: string;
}

export const TrophicSourceLegend: React.FC<Props> = ({ chain, className }) => {
  const counts = useMemo(() => {
    const c: Record<Source, number> = { kb: 0, heuristic: 0, iconic: 0 };
    chain.stars.forEach((s) => {
      if (s.group === 'UNCLASSIFIED') return;
      if (c[s.source] !== undefined) c[s.source] += 1;
    });
    return c;
  }, [chain.stars]);

  const visible = SEGMENTS.filter((s) => counts[s.key] > 0);
  if (visible.length === 0) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground ${className ?? ''}`}
        aria-label="Méthode d'attribution trophique"
      >
        <span className="opacity-70">Méthode d’attribution :</span>
        {visible.map((seg, i) => {
          const Icon = seg.icon;
          const n = counts[seg.key];
          const label = n > 1 ? seg.plural : seg.singular;
          return (
            <React.Fragment key={seg.key}>
              {i > 0 && <span className="opacity-30">·</span>}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 cursor-help hover:text-foreground transition">
                    <Icon className="w-3 h-3" />
                    <span>
                      {n} {label}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs leading-relaxed">
                  {seg.tip}
                </TooltipContent>
              </Tooltip>
            </React.Fragment>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default TrophicSourceLegend;
