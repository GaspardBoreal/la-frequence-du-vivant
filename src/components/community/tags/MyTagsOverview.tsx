import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useMyMarcheurTagsOverview, getTagColor, type MyTagOverviewEntry } from '@/hooks/useMarcheurSpeciesTags';
import { SpeciesName } from '@/components/species/SpeciesName';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MyTagsOverview: React.FC = () => {
  const { data: tags, isLoading } = useMyMarcheurTagsOverview();
  const [open, setOpen] = useState<boolean | null>(null); // null = auto
  const [selected, setSelected] = useState<MyTagOverviewEntry | null>(null);

  if (isLoading) return null;

  const list = tags || [];
  const isOpen = open === null ? list.length > 0 && list.length <= 6 : open;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-card/60 border border-border dark:bg-white/5 dark:border-white/10 hover:bg-card transition-colors"
      >
        <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
        <h2 className="text-sm font-semibold text-foreground">Mes tags</h2>
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          <Lock className="w-2.5 h-2.5" /> privé
        </span>
        <span className="text-muted-foreground text-xs ml-auto mr-1">({list.length})</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2.5 px-1">
              {list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border dark:border-white/10 p-4 text-center">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Vous n'avez encore créé aucun tag.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1.5 italic">
                    Ouvrez n'importe quelle fiche espèce dans Apprendre → L'Œil pour commencer votre vocabulaire personnel.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {list.map((t) => {
                    const color = getTagColor(t.color_hash);
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setSelected(t)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border dark:border-white/10 bg-card hover:scale-[1.03] transition-transform text-xs"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="font-medium text-foreground">{t.label}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{t.speciesCount}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              {selected && (
                <>
                  <span className="w-3 h-3 rounded-full" style={{ background: getTagColor(selected.color_hash) }} />
                  <span>{selected.label}</span>
                </>
              )}
            </DrawerTitle>
            <DrawerDescription>
              {selected
                ? `${selected.speciesCount} espèce${selected.speciesCount > 1 ? 's' : ''} taggée${selected.speciesCount > 1 ? 's' : ''} · ${selected.total} marquage${selected.total > 1 ? 's' : ''}`
                : ''}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto">
            {selected && (() => {
              const bySpecies = new Map<string, { sci: string; latest: string; count: number }>();
              selected.species.forEach((s) => {
                const k = s.scientific_name.toLowerCase();
                const ex = bySpecies.get(k);
                if (ex) {
                  ex.count++;
                  if (s.tagged_at > ex.latest) ex.latest = s.tagged_at;
                } else {
                  bySpecies.set(k, { sci: s.scientific_name, latest: s.tagged_at, count: 1 });
                }
              });
              const rows = Array.from(bySpecies.values()).sort((a, b) => b.latest.localeCompare(a.latest));
              return (
                <ul className="space-y-1.5">
                  {rows.map((r) => (
                    <li key={r.sci} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <SpeciesName scientificName={r.sci} showScientific size="sm" truncate />
                      </div>
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.latest), 'dd MMM yy', { locale: fr })}
                        {r.count > 1 && <span className="ml-1.5">×{r.count}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MyTagsOverview;
