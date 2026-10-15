import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export interface SearchableOption {
  id: string;
  /** Texte principal (ex. nom du jardin, titre de l'article). */
  label: string;
  /** Texte secondaire discret (ex. commune, type). */
  sub?: string;
  /** Icône ou emoji affiché à gauche. */
  icon?: React.ReactNode;
}

interface Props {
  options: SearchableOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Titre affiché dans le tiroir mobile. */
  title?: string;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Sélecteur avec recherche « contient » (insensible à la casse et aux accents).
 * Popover sur desktop, tiroir par le bas sur mobile.
 */
const SearchableSelect: React.FC<Props> = ({
  options, value, onChange, placeholder,
  searchPlaceholder = 'Rechercher…', emptyLabel = 'Aucun résultat', title,
}) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const selected = options.find((o) => o.id === value);
  const shown = useMemo(() => {
    const nq = norm(q);
    if (!nq) return options;
    return options.filter((o) => norm(`${o.label} ${o.sub ?? ''}`).includes(nq));
  }, [options, q]);

  const pick = (id: string) => { onChange(id); setOpen(false); setQ(''); };

  const body = (
    <div className="space-y-2">
      <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="Effacer la recherche" className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>
      <ul className="max-h-72 overflow-y-auto -mx-1 px-1">
        {shown.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => pick(o.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                o.id === value ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-muted',
              )}
            >
              {o.icon && <span className="shrink-0">{o.icon}</span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{o.label}</span>
                {o.sub && <span className="block truncate text-xs text-muted-foreground">{o.sub}</span>}
              </span>
              {o.id === value && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          </li>
        ))}
        {!shown.length && (
          <li className="px-2.5 py-4 text-center text-sm text-muted-foreground">
            {emptyLabel}{q ? ` pour « ${q} »` : ''}
          </li>
        )}
      </ul>
    </div>
  );

  const trigger = (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className={cn('min-w-0 flex-1 truncate text-left', !selected && 'text-muted-foreground')}>
        {selected ? selected.label : placeholder}
      </span>
      {selected && (
        <span
          role="button"
          aria-label="Effacer la sélection"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); onChange(''); }}
        >
          <X className="h-3.5 w-3.5" />
        </span>
      )}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(''); }}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-sm">{title ?? placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(''); }}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-2">
        {body}
      </PopoverContent>
    </Popover>
  );
};

export default SearchableSelect;
