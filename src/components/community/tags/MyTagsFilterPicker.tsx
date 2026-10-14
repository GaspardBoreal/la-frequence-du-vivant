import React, { useMemo, useState } from 'react';
import { Tag as TagIcon, X, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export type PickerTagMode = 'and' | 'or' | 'not';
export interface PickerTag {
  key: string; // normalized
  label: string;
  color: string;
  count: number;
}

interface Props {
  tags: PickerTag[];
  labels: string[];
  mode: PickerTagMode;
  onChange: (next: { labels: string[]; mode: PickerTagMode }) => void;
  loading?: boolean;
  /** Bouton déclencheur personnalisé (reçoit le nombre de tags actifs). */
  trigger?: (activeCount: number) => React.ReactElement;
  countLabel?: string;
}

const MODES: { value: PickerTagMode; label: string; help: string }[] = [
  { value: 'or', label: 'Au moins un', help: 'Espèces portant au moins un des tags choisis.' },
  { value: 'and', label: 'Tous', help: 'Espèces portant tous les tags choisis.' },
  { value: 'not', label: 'Sauf', help: 'Masque les espèces portant un des tags choisis.' },
];

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const PickerBody: React.FC<Omit<Props, 'trigger'>> = ({ tags, labels, mode, onChange, loading, countLabel }) => {
  const [q, setQ] = useState('');
  const shown = useMemo(() => (q ? tags.filter((t) => norm(t.label).includes(norm(q))) : tags), [tags, q]);
  const toggle = (k: string) =>
    onChange({ mode, labels: labels.includes(k) ? labels.filter((l) => l !== k) : [...labels, k] });
  const byKey = new Map(tags.map((t) => [t.key, t]));

  return (
    <div className="space-y-3">
      <div>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange({ labels, mode: m.value })}
              className={cn(
                'rounded-full px-2 py-1.5 text-xs transition-colors',
                mode === m.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">{MODES.find((m) => m.value === mode)?.help}</p>
      </div>

      {tags.length > 8 && (
        <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher un tag"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      )}

      {labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {labels.map((k) => {
            const t = byKey.get(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggle(k)}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-primary-foreground"
                style={{ backgroundColor: t?.color }}
              >
                {t?.label ?? k} <X className="h-3 w-3" />
              </button>
            );
          })}
          <button type="button" onClick={() => onChange({ labels: [], mode })} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            Tout effacer
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs italic text-muted-foreground">Lecture de vos tags…</p>
      ) : tags.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">
          Vous n'avez pas encore créé de tag. Touchez l'étiquette sur une fiche espèce pour en ajouter.
        </p>
      ) : (
        <div className="flex max-h-64 flex-wrap gap-1.5 overflow-auto">
          {shown.map((t) => {
            const on = labels.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => toggle(t.key)}
                className={cn(
                  'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all',
                  on ? 'border-transparent text-primary-foreground shadow-sm' : 'border-border bg-background hover:bg-muted',
                  t.count === 0 && !on && 'opacity-45',
                )}
                style={on ? { backgroundColor: t.color } : undefined}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: on ? 'currentColor' : t.color }} />
                {t.label}
                <span className="text-[10px] opacity-60">{t.count}</span>
              </button>
            );
          })}
        </div>
      )}
      {countLabel && <p className="text-[10px] text-muted-foreground">{countLabel}</p>}
    </div>
  );
};

const MyTagsFilterPicker: React.FC<Props> = (props) => {
  const isMobile = useIsMobile();
  const active = props.labels.length;
  const trigger = props.trigger ? (
    props.trigger(active)
  ) : (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors',
        active ? 'border-primary text-primary' : 'border-border hover:bg-muted',
      )}
    >
      <TagIcon className="h-3.5 w-3.5" /> Mes tags
      {active > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{active}</span>}
    </button>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="px-0">
            <DrawerTitle className="flex items-center gap-2 text-base"><TagIcon className="h-4 w-4" /> Mes tags</DrawerTitle>
          </DrawerHeader>
          <PickerBody {...props} />
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="z-[1100] w-80 p-3" align="start">
        <PickerBody {...props} />
      </PopoverContent>
    </Popover>
  );
};

export default MyTagsFilterPicker;
