import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Tag as TagIcon, Lock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  MarcheurSpeciesTag,
  getTagColor,
  useUpsertMarcheurTag,
  useDeleteMarcheurTag,
  useMarcheurTagSuggestions,
} from '@/hooks/useMarcheurSpeciesTags';

interface Props {
  scientificName: string;
  marcheId?: string | null;
  /** Tags currently associated with this species (already filtered by scope upstream) */
  tags: MarcheurSpeciesTag[];
  /** Compact mode: show only dots, popover on click */
  compact?: boolean;
  /** Position the dots overlay (absolute) — useful on photo cards */
  overlay?: boolean;
  className?: string;
}

/**
 * Pastilles de tags-marcheurs (privées) en coin de vignette espèce.
 * - 1 à 3 dots colorés au repos (+N si plus)
 * - Click → popover de gestion : ajout, suppression, choix portée global/observation
 * - Visible uniquement par le marcheur connecté
 */
const MarcheurSpeciesTagDots: React.FC<Props> = ({
  scientificName,
  marcheId,
  tags,
  compact = true,
  overlay = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [scopeIsMarche, setScopeIsMarche] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upsert = useUpsertMarcheurTag();
  const del = useDeleteMarcheurTag();
  const { data: suggestions = [] } = useMarcheurTagSuggestions(6);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const visible = tags.slice(0, 3);
  const more = Math.max(0, tags.length - 3);

  const handleAdd = (label: string) => {
    const v = label.trim();
    if (!v) return;
    upsert.mutate({
      scientificName,
      label: v,
      marcheId: scopeIsMarche ? marcheId ?? null : null,
    });
    setInput('');
  };

  const trigger = (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      className={cn(
        'group inline-flex items-center gap-1 rounded-full transition-all',
        overlay
          ? 'absolute top-1.5 right-1.5 z-10 bg-background/80 backdrop-blur-sm px-1.5 py-1 shadow-sm border border-border/40'
          : 'px-1 py-0.5 hover:bg-muted/40',
        className
      )}
      aria-label="Mes tags"
    >
      {tags.length === 0 ? (
        <TagIcon className="h-3 w-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
      ) : (
        <>
          {visible.map((t) => (
            <span
              key={t.id}
              className="inline-block h-2 w-2 rounded-full ring-1 ring-background/60"
              style={{ backgroundColor: getTagColor(t.color_hash) }}
              title={t.label}
            />
          ))}
          {more > 0 && (
            <span className="text-[9px] font-bold text-muted-foreground leading-none">+{more}</span>
          )}
        </>
      )}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs">Mes tags</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-72 p-3 z-50"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mes tags
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70">
              <Lock className="h-2.5 w-2.5" /> Privé
            </span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence>
                {tags.map((t) => (
                  <motion.span
                    key={t.id}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="inline-flex items-center gap-1 rounded-full pl-2 pr-1 py-0.5 text-[11px] font-medium text-white shadow-sm"
                    style={{ backgroundColor: getTagColor(t.color_hash) }}
                  >
                    {t.marche_id && <span className="opacity-60">📍</span>}
                    {t.label}
                    <button
                      type="button"
                      onClick={() => del.mutate(t.id)}
                      className="rounded-full hover:bg-black/20 p-0.5 transition-colors"
                      aria-label={`Supprimer ${t.label}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 40))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAdd(input); }
                  if (e.key === 'Escape') setOpen(false);
                }}
                placeholder="Ajouter un tag…"
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                maxLength={40}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => handleAdd(input)}
                disabled={!input.trim() || upsert.isPending}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {marcheId && (
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1">
                <Label htmlFor={`scope-${scientificName}`} className="text-[10px] text-muted-foreground cursor-pointer">
                  {scopeIsMarche ? '📍 Cette observation' : '🌍 Toujours pour cette espèce'}
                </Label>
                <Switch
                  id={`scope-${scientificName}`}
                  checked={scopeIsMarche}
                  onCheckedChange={setScopeIsMarche}
                  className="scale-75"
                />
              </div>
            )}

            {suggestions.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1">
                  Tes tags récents
                </p>
                <div className="flex flex-wrap gap-1">
                  {suggestions
                    .filter((s) => !tags.some((t) => t.label.toLowerCase() === s.label.toLowerCase()))
                    .slice(0, 5)
                    .map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => handleAdd(s.label)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] hover:bg-muted transition-colors"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: getTagColor(s.color_hash) }}
                        />
                        {s.label}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MarcheurSpeciesTagDots;
