import React from 'react';
import { cn } from '@/lib/utils';
import { getTagColor, useMarcheurTagSuggestions } from '@/hooks/useMarcheurSpeciesTags';
import MyTagsFilterPicker from './MyTagsFilterPicker';

export type TagFilterMode = 'and' | 'or' | 'not';

export interface TagFilterState {
  labels: string[]; // normalized (lowercased)
  mode: TagFilterMode;
}

interface Props {
  state: TagFilterState;
  onChange: (state: TagFilterState) => void;
  className?: string;
  compact?: boolean;
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const MarcheurTagsFilterBar: React.FC<Props> = ({ state, onChange, className }) => {
  const { data: suggestions = [], isLoading } = useMarcheurTagSuggestions(200);
  const tags = suggestions.map((s) => ({
    key: norm(s.label),
    label: s.label,
    color: getTagColor(s.color_hash),
    count: s.count,
  }));
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <MyTagsFilterPicker
        tags={tags}
        labels={state.labels}
        mode={state.mode}
        loading={isLoading}
        onChange={onChange}
      />
    </div>
  );
};

export function matchesTagFilter(speciesTagLabels: string[], filter: TagFilterState): boolean {
  if (filter.labels.length === 0) return true;
  const present = new Set(speciesTagLabels.map(norm));
  if (filter.mode === 'and') return filter.labels.every((l) => present.has(l));
  if (filter.mode === 'or') return filter.labels.some((l) => present.has(l));
  return !filter.labels.some((l) => present.has(l));
}

export default MarcheurTagsFilterBar;
