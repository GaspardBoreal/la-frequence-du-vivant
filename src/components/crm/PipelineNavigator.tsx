import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanColumn, OpportunityStatus, CrmOpportunity } from '@/types/crm';

interface Props {
  scrollRef: React.RefObject<HTMLDivElement>;
  columns: readonly KanbanColumn[];
  opportunitiesByStatus: Record<OpportunityStatus, CrmOpportunity[]>;
}

export const PipelineNavigator: React.FC<Props> = ({ scrollRef, columns, opportunitiesByStatus }) => {
  const [progress, setProgress] = React.useState(0);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);
  const [activeIds, setActiveIds] = React.useState<Set<string>>(new Set());

  const update = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  }, [scrollRef]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [scrollRef, update]);

  // Track which columns are currently visible
  React.useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const targets = columns
      .map((c) => root.querySelector<HTMLElement>(`[data-col-id="${c.id}"]`))
      .filter((n): n is HTMLElement => !!n);
    if (!targets.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        setActiveIds((prev) => {
          const next = new Set(prev);
          for (const e of entries) {
            const id = e.target.getAttribute('data-col-id');
            if (!id) continue;
            if (e.intersectionRatio >= 0.5) next.add(id);
            else next.delete(id);
          }
          return next;
        });
      },
      { root, threshold: [0, 0.5, 1] }
    );
    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, [scrollRef, columns]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 296, behavior: 'smooth' }); // 280 + gap
  };

  const scrollToColumn = (id: string) => {
    const el = scrollRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-col-id="${id}"]`);
    if (!target) return;
    const left = target.offsetLeft - (el.clientWidth - target.clientWidth) / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  };

  return (
    <div className="sticky top-0 z-20 -mx-1 mb-3 rounded-xl border bg-card/80 backdrop-blur-md px-2 py-2 shadow-sm">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Colonne précédente"
          onClick={() => scrollBy(-1)}
          disabled={!canLeft}
          className={cn(
            'h-8 w-8 shrink-0 rounded-full border bg-background flex items-center justify-center transition',
            canLeft ? 'hover:bg-muted text-foreground' : 'opacity-40 cursor-not-allowed text-muted-foreground'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 min-w-max px-0.5">
            {columns.map((col) => {
              const count = opportunitiesByStatus[col.id]?.length ?? 0;
              const active = activeIds.has(col.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => scrollToColumn(col.id)}
                  className={cn(
                    'group inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs font-medium border transition whitespace-nowrap',
                    active
                      ? 'bg-primary/10 border-primary/40 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', col.color)} />
                  <span>{col.title}</span>
                  <span
                    className={cn(
                      'ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold',
                      active ? 'bg-primary/20 text-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          aria-label="Colonne suivante"
          onClick={() => scrollBy(1)}
          disabled={!canRight}
          className={cn(
            'h-8 w-8 shrink-0 rounded-full border bg-background flex items-center justify-center transition',
            canRight ? 'hover:bg-muted text-foreground' : 'opacity-40 cursor-not-allowed text-muted-foreground'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-1.5 h-[3px] w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-[width] duration-150"
          style={{ width: `${Math.max(8, progress * 100)}%` }}
        />
      </div>
    </div>
  );
};
