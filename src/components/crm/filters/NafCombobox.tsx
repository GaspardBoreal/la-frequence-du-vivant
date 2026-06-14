import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { searchNaf, getNafLabel, formatNaf } from '@/lib/nafCatalog';
import { cn } from '@/lib/utils';

interface Props {
  value?: string;
  onChange: (code?: string, label?: string) => void;
  label?: string;
  placeholder?: string;
  hideLabel?: boolean;
  popoverClassName?: string;
}

/**
 * Combobox unique pour le code NAF/APE (référentiel INSEE rév. 2).
 * Mutualisé entre les drawers de filtre et la fiche création/édition entreprise.
 * onChange transmet le code ET le libellé pour pré-remplir d'autres champs.
 */
export const NafCombobox: React.FC<Props> = ({
  value,
  onChange,
  label = 'Activité (NAF/APE)',
  placeholder = 'Code ou libellé : "vigne", "01.21Z"…',
  hideLabel = false,
  popoverClassName,
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const results = React.useMemo(() => searchNaf(query, 50), [query]);
  const display = value ? (getNafLabel(value) ? formatNaf(value) : value) : '';

  return (
    <div>
      {!hideLabel && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal mt-1 h-auto min-h-10 py-2',
              !value && 'text-muted-foreground',
            )}
          >
            <span className="truncate text-left">{display || placeholder}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('w-[--radix-popover-trigger-width] p-0 z-[1300]', popoverClassName)}
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tapez un code ou un mot-clé…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-72">
              <CommandEmpty>Aucun code NAF correspondant.</CommandEmpty>
              <CommandGroup>
                {results.map((e) => (
                  <CommandItem
                    key={e.code}
                    value={e.code}
                    onSelect={() => {
                      onChange(e.code, e.label);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="flex items-start gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 mt-0.5 shrink-0',
                        value === e.code ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-muted-foreground">{e.code}</div>
                      <div className="text-sm leading-tight">{e.label}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined, undefined)}
          className="text-[11px] text-muted-foreground hover:text-foreground underline mt-1 inline-flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Retirer
        </button>
      )}
    </div>
  );
};

export default NafCombobox;
