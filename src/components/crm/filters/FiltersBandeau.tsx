import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FiltersBandeauProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filtersButton?: React.ReactNode;
  actions?: React.ReactNode;
  chips?: FilterChip[];
  onClearAll?: () => void;
  /** Optional secondary row (e.g. selection banner) appended below chips */
  footer?: React.ReactNode;
}

/**
 * Unified filter bandeau used across all 4 tabs of /admin/crm/annuaire.
 * Layout: single row [ search (expand) | <filters> | <actions> ] + chips row below.
 */
export const FiltersBandeau: React.FC<FiltersBandeauProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Rechercher…',
  filtersButton,
  actions,
  chips = [],
  onClearAll,
  footer,
}) => {
  return (
    <Card className="p-3 mb-3">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {filtersButton}
        {actions ? <div className="flex items-center gap-2 ml-auto flex-wrap">{actions}</div> : null}
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onRemove}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted hover:bg-accent border"
            >
              {c.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
            >
              Tout effacer
            </button>
          )}
        </div>
      )}

      {footer}
    </Card>
  );
};

export default FiltersBandeau;
