import React from 'react';
import { Tag as TagIcon, X, Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { getTagColor, useMarcheurTagSuggestions } from '@/hooks/useMarcheurSpeciesTags';

export type TagFilterMode = 'and' | 'or' | 'not';

export interface TagFilterState {
  labels: string[]; // normalized (lowercased)
  mode: TagFilterMode;
}

interface Props {
  state: TagFilterState;
  onChange: (state: TagFilterState) => void;
  className?: string;
  /** Compact display variant — single line */
  compact?: boolean;
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const MarcheurTagsFilterBar: React.FC<Props> = ({ state, onChange, className, compact }) => {
  const { data: suggestions = [] } = useMarcheurTagSuggestions(20);

  const toggle = (label: string) => {
    const k = norm(label);
    const exists = state.labels.includes(k);
    onChange({
      ...state,
      labels: exists ? state.labels.filter((l) => l !== k) : [...state.labels, k],
    });
  };

  const clear = () => onChange({ labels: [], mode: state.mode });

  if (suggestions.length === 0 && state.labels.length === 0) return null;

  const modeLabel: Record<TagFilterMode, string> = {
    and: 'Toutes',
    or: 'Au moins une',
    not: 'Sauf',
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('h-7 text-xs gap-1', state.labels.length > 0 && 'border-primary text-primary')}
          >
            <Filter className="h-3 w-3" />
            Mes tags
            {state.labels.length > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 py-0 text-[10px] font-bold">
                {state.labels.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 z-50" align="start">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Mode</p>
              <ToggleGroup
                type="single"
                value={state.mode}
                onValueChange={(v) => v && onChange({ ...state, mode: v as TagFilterMode })}
                className="justify-start"
              >
                <ToggleGroupItem value="and" className="h-6 px-2 text-[10px]">ET</ToggleGroupItem>
                <ToggleGroupItem value="or" className="h-6 px-2 text-[10px]">OU</ToggleGroupItem>
                <ToggleGroupItem value="not" className="h-6 px-2 text-[10px]">SAUF</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Tags</p>
              {suggestions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Aucun tag créé</p>
              ) : (
                <div className="flex flex-wrap gap-1 max-h-48 overflow-auto">
                  {suggestions.map((s) => {
                    const active = state.labels.includes(norm(s.label));
                    return (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => toggle(s.label)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-all',
                          active
                            ? 'border-transparent text-white shadow-sm'
                            : 'border-border bg-background hover:bg-muted'
                        )}
                        style={active ? { backgroundColor: getTagColor(s.color_hash) } : undefined}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : getTagColor(s.color_hash) }}
                        />
                        {s.label}
                        <span className="opacity-60 text-[9px]">·{s.count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {state.labels.length > 0 && (
              <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={clear}>
                Effacer le filtre
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {!compact && state.labels.length > 0 && (
        <span className="text-[10px] text-muted-foreground">
          {modeLabel[state.mode]} : {state.labels.join(', ')}
        </span>
      )}
    </div>
  );
};

/**
 * Returns true if the species (identified by tags map key) matches the filter.
 * speciesTags = MarcheurSpeciesTag[] for the species (already filtered by marche scope).
 */
export function matchesTagFilter(
  speciesTagLabels: string[],
  filter: TagFilterState
): boolean {
  if (filter.labels.length === 0) return true;
  const present = new Set(speciesTagLabels.map(norm));
  if (filter.mode === 'and') return filter.labels.every((l) => present.has(l));
  if (filter.mode === 'or') return filter.labels.some((l) => present.has(l));
  // not = exclude any species that has any of the labels
  return !filter.labels.some((l) => present.has(l));
}

export default MarcheurTagsFilterBar;
