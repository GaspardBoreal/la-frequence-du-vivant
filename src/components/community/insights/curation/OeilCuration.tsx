import React, { useMemo, useState } from 'react';
import { Eye, Search, Sparkles, ImageOff, X } from 'lucide-react';
import { useExplorationSpeciesPool } from '@/hooks/useExplorationSpeciesPool';
import {
  useExplorationCurations,
  useUpsertCuration,
  type ExplorationCuration,
} from '@/hooks/useExplorationCurations';
import PinToggle from './PinToggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  explorationId: string;
  isCurator: boolean;
}

const CATEGORIES = [
  { value: 'emblematique', label: 'Emblématique', color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
  { value: 'parapluie', label: 'Parapluie', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'eee', label: 'EEE', color: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
  { value: 'auxiliaire', label: 'Auxiliaire', color: 'text-sky-600 bg-sky-500/10 border-sky-500/30' },
  { value: 'protegee', label: 'Protégée', color: 'text-violet-600 bg-violet-500/10 border-violet-500/30' },
];

const getCatStyle = (value?: string | null) =>
  CATEGORIES.find(c => c.value === value)?.color ?? 'text-muted-foreground bg-muted/40 border-border';

const getCatLabel = (value?: string | null) =>
  CATEGORIES.find(c => c.value === value)?.label ?? value ?? '';

const OeilCuration: React.FC<Props> = ({ explorationId, isCurator }) => {
  const { data: pool = [], isLoading } = useExplorationSpeciesPool(explorationId);
  const { data: curations = [] } = useExplorationCurations(explorationId, 'oeil');
  const upsert = useUpsertCuration();

  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Index curations by entity_id (scientific name preferred)
  const curationByKey = useMemo(() => {
    const m = new Map<string, ExplorationCuration>();
    curations.forEach(c => {
      if (c.entity_id) m.set(c.entity_id.toLowerCase(), c);
    });
    return m;
  }, [curations]);

  const pinnedSpecies = useMemo(
    () => pool.filter(s => curationByKey.has(s.key.toLowerCase())),
    [pool, curationByKey]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter(
      s =>
        s.scientificName?.toLowerCase().includes(q) ||
        s.commonName?.toLowerCase().includes(q)
    );
  }, [pool, search]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Chargement des espèces…
      </div>
    );
  }

  if (pool.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Eye className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          Aucune espèce observée pour cette exploration pour l'instant.
        </p>
      </div>
    );
  }

  // Display: pinned first, then optionally the rest
  const visibleList = showAll || !isCurator ? filtered : pinnedSpecies;

  return (
    <div className="space-y-4">
      {/* Header sélection ambassadeur */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">
            Sélection de l'ambassadeur
          </h3>
          <span className="text-xs text-muted-foreground">
            ({pinnedSpecies.length}/{pool.length})
          </span>
        </div>
        {isCurator && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {showAll ? 'Voir la sélection' : 'Voir toutes les espèces'}
          </button>
        )}
      </div>

      {/* Bandeau pédagogique non-curator */}
      {!isCurator && pinnedSpecies.length === 0 && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
          <p className="text-xs text-muted-foreground italic">
            L'ambassadeur de la marche n'a pas encore sélectionné d'espèces remarquables.
          </p>
        </div>
      )}

      {/* Recherche en mode "voir toutes" */}
      {isCurator && showAll && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher une espèce…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Grille espèces */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {visibleList.map(species => {
          const curation = curationByKey.get(species.key.toLowerCase());
          const isPinned = !!curation;

          return (
            <div
              key={species.key}
              className={`relative rounded-xl border overflow-hidden bg-card group transition ${
                isPinned ? 'border-amber-500/50 shadow-sm' : 'border-border'
              }`}
            >
              {/* Image */}
              <div className="aspect-square bg-muted relative">
                {species.imageUrl ? (
                  <img
                    src={species.imageUrl}
                    alt={species.commonName || species.scientificName || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                    <ImageOff className="w-8 h-8" />
                  </div>
                )}
                {/* Pin toggle (curator only) */}
                {isCurator && (
                  <div className="absolute top-1.5 right-1.5">
                    <PinToggle
                      explorationId={explorationId}
                      sense="oeil"
                      entityType="species"
                      entityId={species.key}
                      existing={curation}
                      category={curation?.category}
                    />
                  </div>
                )}
                {/* Compteur observations */}
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm">
                  {species.count} obs.
                </div>
              </div>

              {/* Infos */}
              <div className="p-2 space-y-1">
                <p className="text-xs font-semibold text-foreground line-clamp-1">
                  {species.commonName || species.scientificName}
                </p>
                {species.commonName && species.scientificName && (
                  <p className="text-[10px] text-muted-foreground italic line-clamp-1">
                    {species.scientificName}
                  </p>
                )}

                {/* Catégorie */}
                {isPinned && (
                  <CategoryControl
                    isCurator={isCurator}
                    curation={curation!}
                    explorationId={explorationId}
                    onSetCategory={async (cat) => {
                      await upsert.mutateAsync({
                        id: curation!.id,
                        exploration_id: explorationId,
                        sense: 'oeil',
                        entity_type: 'species',
                        entity_id: species.key,
                        category: cat,
                      });
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visibleList.length === 0 && search && (
        <p className="text-center text-xs text-muted-foreground py-6">
          Aucune espèce ne correspond à « {search} »
        </p>
      )}
    </div>
  );
};

const CategoryControl: React.FC<{
  isCurator: boolean;
  curation: ExplorationCuration;
  explorationId: string;
  onSetCategory: (cat: string | null) => Promise<void>;
}> = ({ isCurator, curation, onSetCategory }) => {
  const [open, setOpen] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const cat = curation.category;
  const style = getCatStyle(cat);
  const label = cat ? getCatLabel(cat) : 'Catégoriser';

  if (!isCurator) {
    if (!cat) return null;
    return (
      <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${style}`}>
        {label}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`w-full px-1.5 py-0.5 rounded-md text-[10px] font-medium border text-left ${style}`}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 space-y-1">
        <p className="text-[10px] text-muted-foreground px-1.5 mb-1">Catégorie</p>
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={async () => {
              await onSetCategory(c.value);
              setOpen(false);
            }}
            className={`w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-muted ${
              cat === c.value ? 'bg-muted font-medium' : ''
            }`}
          >
            {c.label}
          </button>
        ))}
        <div className="pt-1 border-t border-border mt-1">
          <p className="text-[10px] text-muted-foreground px-1.5 mb-1">Tag libre</p>
          <div className="flex gap-1">
            <Input
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              placeholder="Ex: nocturne"
              className="h-7 text-xs"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs px-2"
              disabled={!customTag.trim()}
              onClick={async () => {
                await onSetCategory(customTag.trim());
                setCustomTag('');
                setOpen(false);
              }}
            >
              OK
            </Button>
          </div>
        </div>
        {cat && (
          <button
            onClick={async () => {
              await onSetCategory(null);
              setOpen(false);
            }}
            className="w-full text-xs px-2 py-1.5 rounded-md text-muted-foreground hover:bg-muted"
          >
            Retirer la catégorie
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default OeilCuration;
