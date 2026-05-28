import React from 'react';
import { BookOpenCheck, Network, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TrophicAssignment } from '@/lib/trophicClassification';

type Source = TrophicAssignment['source'];

const META: Record<Source, { icon: typeof BookOpenCheck; label: string; tip: string }> = {
  kb: {
    icon: BookOpenCheck,
    label: 'curé',
    tip: 'Attribution éditoriale validée par la base de connaissances La Fréquence du Vivant.',
  },
  heuristic: {
    icon: Network,
    label: 'famille',
    tip: 'Déduit d’une règle taxonomique (famille / genre) — fiabilité élevée.',
  },
  iconic: {
    icon: Sparkles,
    label: 'taxon',
    tip: 'Déduit du grand groupe iNaturalist (iconic_taxon) — niveau indicatif.',
  },
};

interface Props {
  source: Source;
  variant?: 'full' | 'compact';
  className?: string;
}

export const TrophicSourceBadge: React.FC<Props> = ({ source, variant = 'full', className }) => {
  const m = META[source];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition cursor-help ${className ?? ''}`}
            aria-label={`Méthode d'attribution : ${m.label}`}
          >
            <Icon className="w-3 h-3" />
            {variant === 'full' && <span>{m.label}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-xs leading-relaxed">
          {m.tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TrophicSourceBadge;
