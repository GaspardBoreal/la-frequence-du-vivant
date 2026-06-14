import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OPPORTUNITY_ACTIONS, type OpportunityActionCode } from '@/lib/crmOpportunityActions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OpportunityActionsBadgesProps {
  value: readonly (OpportunityActionCode | string)[] | null | undefined;
  size?: 'xs' | 'sm';
  className?: string;
  /** Affiche un anneau doré + label si les 4 jalons sont cochés */
  celebrateComplete?: boolean;
}

/**
 * Rangée compacte de 4 mini-pastilles numérotées montrant l'avancement.
 * Saturée si action faite, outline sinon. Tooltip au survol.
 */
export const OpportunityActionsBadges: React.FC<OpportunityActionsBadgesProps> = ({
  value,
  size = 'sm',
  className,
  celebrateComplete = true,
}) => {
  const set = new Set(value ?? []);
  const done = set.size;
  const total = OPPORTUNITY_ACTIONS.length;
  const allDone = done === total;
  const dim = size === 'xs' ? 'h-4 w-4 text-[9px]' : 'h-5 w-5 text-[10px]';
  const iconDim = size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors',
          celebrateComplete && allDone && 'bg-amber-400/15 ring-1 ring-amber-400/50',
          className
        )}
        aria-label={`Actions réalisées : ${done} sur ${total}`}
      >
        {OPPORTUNITY_ACTIONS.map((a, idx) => {
          const Icon = a.icon;
          const selected = set.has(a.code);
          return (
            <Tooltip key={a.code}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'flex items-center justify-center rounded-full font-semibold tabular-nums transition-all',
                    dim,
                    selected
                      ? 'text-background'
                      : 'border border-border bg-background text-muted-foreground/60'
                  )}
                  style={selected ? { backgroundColor: `hsl(${a.hue})` } : undefined}
                >
                  {selected ? <Icon className={iconDim} strokeWidth={3} /> : idx + 1}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <span className="font-medium">{a.label}</span>
                <span className="ml-1.5 text-muted-foreground">
                  {selected ? '✓ fait' : '— à faire'}
                </span>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {celebrateComplete && allDone && (
          <span className="ml-1 text-[10px] font-semibold text-amber-600 dark:text-amber-300">
            ✨
          </span>
        )}
      </div>
    </TooltipProvider>
  );
};
