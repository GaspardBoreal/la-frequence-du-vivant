import React, { useMemo, useState } from 'react';
import { Eye, Search, Sparkles, X, Plus, Wand2, Loader2, Hand, AlertCircle } from 'lucide-react';
import ClassificationEvidenceSheet from './ClassificationEvidenceSheet';
import { useExplorationSpeciesPool } from '@/hooks/useExplorationSpeciesPool';
import {
  useExplorationCurations,
  useUpsertCuration,
  type ExplorationCuration,
} from '@/hooks/useExplorationCurations';
import {
  useLatestAiAnalysis,
  useTriggerAiAnalysis,
  isAnalysisStale,
} from '@/hooks/useExplorationAiAnalysis';
import { useExplorationManualSpecies } from '@/hooks/useExplorationManualSpecies';
import { useExplorationMarchesGpsStatus } from '@/hooks/useExplorationMarchesGpsStatus';
import { useSpeciesTranslationBatch, type SpeciesTranslation } from '@/hooks/useSpeciesTranslation';
import ManualSpeciesModal from './ManualSpeciesModal';
import CuratedSpeciesCard, { type CuratedSpeciesItem } from './CuratedSpeciesCard';
import SpeciesDetailModal from '@/components/biodiversity/SpeciesDetailModal';
import { CATEGORIES, getCatStyle, getCatLabel } from './curationCategories';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';

interface Props {
  explorationId: string;
  isCurator: boolean;
}

type View = 'selection' | 'suggestions' | 'review' | 'pool' | 'terrain';

// CATEGORIES, getCatStyle, getCatLabel are imported from ./curationCategories

const scoreToStars = (score?: number | null) => {
  if (score == null) return 0;
  return Math.max(1, Math.min(5, Math.round(score / 20)));
};

const OeilCuration: React.FC<Props> = ({ explorationId, isCurator }) => {
  const { data: pool = [], isLoading } = useExplorationSpeciesPool(explorationId);
  const { data: curations = [] } = useExplorationCurations(explorationId, 'oeil');
  const { data: manual = [] } = useExplorationManualSpecies(explorationId);
  const { data: lastAnalysis } = useLatestAiAnalysis(explorationId);
  const { data: gpsStatus } = useExplorationMarchesGpsStatus(explorationId);
  const triggerAi = useTriggerAiAnalysis();
  const upsert = useUpsertCuration();

  const [view, setView] = useState<View>('selection');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<BiodiversitySpecies | null>(null);

  // Apply category filter on a list of {species, curation}
  const applyCategoryFilter = <T extends { curation?: ExplorationCuration }>(items: T[]): T[] => {
    if (!categoryFilter) return items;
    return items.filter(x => x.curation?.category === categoryFilter);
  };

  // Wrap setView so that switching tab clears the category filter — avoids
  // hiding the entire grid when the active category has no items in the new tab.
  const handleViewChange = (next: View) => {
    setView(next);
    setCategoryFilter(null);
  };

  // Batch FR translations for the whole observed pool (single network round)
  const speciesForTranslation = useMemo(
    () =>
      pool
        .filter(s => !!s.scientificName)
        .map(s => ({
          scientificName: s.scientificName as string,
          commonName: s.commonName ?? undefined,
        })),
    [pool]
  );
  const { data: translations } = useSpeciesTranslationBatch(speciesForTranslation);
  const translationMap = useMemo(
    () => new Map((translations || []).map(t => [t.scientificName, t])),
    [translations]
  );

  const handleSpeciesClick = (
    species: CuratedSpeciesItem,
    displayName: string,
    photos: string[],
  ) => {
    const kingdom: BiodiversitySpecies['kingdom'] = (() => {
      const g = (species.group || '').toLowerCase();
      if (g === 'animalia') return 'Animalia';
      if (g === 'plantae') return 'Plantae';
      if (g === 'fungi') return 'Fungi';
      return 'Other';
    })();
    setSelectedSpecies({
      id: species.key,
      scientificName: species.scientificName || '',
      commonName: displayName || species.commonName || species.scientificName || '',
      kingdom,
      family: '',
      observations: species.count,
      lastSeen: '',
      source: 'inaturalist',
      attributions: [],
      photos,
      photoData: photos[0]
        ? { url: photos[0], source: 'inaturalist', attribution: '' }
        : undefined,
    });
  };

  const curationByKey = useMemo(() => {
    const m = new Map<string, ExplorationCuration>();
    curations.forEach(c => {
      if (c.entity_id) m.set(c.entity_id.toLowerCase(), c);
    });
    return m;
  }, [curations]);

  const pinnedSpecies = useMemo(
    () =>
      pool.filter(s => {
        const c = curationByKey.get(s.key.toLowerCase());
        return c && c.display_order < 9999;
      }),
    [pool, curationByKey]
  );

  const aiSuggestions = useMemo(
    () =>
      pool
        .map(s => ({ species: s, curation: curationByKey.get(s.key.toLowerCase()) }))
        .filter(x => x.curation?.source === 'ai')
        .sort((a, b) => (b.curation?.ai_score || 0) - (a.curation?.ai_score || 0)),
    [pool, curationByKey]
  );

  const filteredPool = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter(
      s =>
        s.scientificName?.toLowerCase().includes(q) ||
        s.commonName?.toLowerCase().includes(q)
    );
  }, [pool, search]);

  // Category counts contextual to the active tab — guarantees the chip
  // counter equals the number of cards the user will actually see.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let source: Array<{ curation?: ExplorationCuration }> = [];
    if (view === 'selection') {
      source = pinnedSpecies.map(s => ({ curation: curationByKey.get(s.key.toLowerCase()) }));
    } else if (view === 'suggestions') {
      source = aiSuggestions;
    } else if (view === 'pool') {
      source = filteredPool.map(s => ({ curation: curationByKey.get(s.key.toLowerCase()) }));
    }
    source.forEach(x => {
      const cat = x.curation?.category;
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [view, pinnedSpecies, aiSuggestions, filteredPool, curationByKey]);

  const stale = isAnalysisStale(lastAnalysis);

  const handleAi = () => triggerAi.mutate(explorationId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Chargement des espèces…
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Header actions */}
        {isCurator && (
          <div className="rounded-xl border border-border bg-gradient-to-br from-amber-500/5 to-transparent p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                {lastAnalysis ? (
                  <span className="truncate">
                    Dernière analyse :{' '}
                    <span className="font-medium text-foreground">
                      {new Date(lastAnalysis.analyzed_at).toLocaleDateString('fr-FR')}
                    </span>
                    {' · '}
                    {lastAnalysis.species_analyzed_count} espèces
                    {stale && <span className="ml-1 text-amber-600">(à actualiser)</span>}
                  </span>
                ) : (
                  <span>Aucune analyse IA effectuée pour le moment.</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAi}
                  disabled={triggerAi.isPending}
                >
                  {triggerAi.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {lastAnalysis ? 'Relancer l’analyse IA' : 'Lancer l’analyse IA'}
                </Button>
                <Button size="sm" onClick={() => setShowManualModal(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Espèce terrain
                </Button>
              </div>
            </div>

            {/* Diagnostic GPS / snapshots */}
            {gpsStatus && pool.length === 0 && (
              <div className="text-[11px] leading-relaxed text-muted-foreground border-t border-border/50 pt-2">
                {gpsStatus.total === 0 && (
                  <span>
                    Aucune marche dans cette exploration. Crée d'abord une marche dans l'onglet{' '}
                    <span className="font-medium text-foreground">Marches</span>.
                  </span>
                )}
                {gpsStatus.total > 0 && gpsStatus.withGps === 0 && (
                  <span>
                    <span className="font-medium text-amber-600">{gpsStatus.total} marche(s)</span> sans coordonnées GPS.
                    Renseigne la latitude/longitude dans l'onglet Marches pour activer l'analyse iNaturalist.
                  </span>
                )}
                {gpsStatus.total > 0 && gpsStatus.withGps > 0 && gpsStatus.withSnapshots === 0 && (
                  <span>
                    {gpsStatus.withGps} marche(s) géolocalisée(s), mais la collecte biodiversité n'a pas encore tourné.
                    Ouvre l'onglet <span className="font-medium text-foreground">Empreinte</span> ou{' '}
                    <span className="font-medium text-foreground">Carte</span> sur chaque marche pour la déclencher,
                    puis clique sur « Lancer l'analyse IA ».
                  </span>
                )}
                {gpsStatus.total > 0 && gpsStatus.withSnapshots > 0 && (
                  <span>
                    Données disponibles sur {gpsStatus.withSnapshots}/{gpsStatus.total} marches. Clique sur l'analyse IA pour la lancer.
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border">
          {[
            { id: 'selection' as View, label: 'Sélection finale', count: pinnedSpecies.length },
            { id: 'suggestions' as View, label: 'Suggestions IA', count: aiSuggestions.length, hidden: !isCurator },
            { id: 'terrain' as View, label: 'Terrain', count: manual.length, icon: <Hand className="w-3 h-3" /> },
            { id: 'pool' as View, label: 'Pool observé', count: pool.length, hidden: !isCurator },
          ]
            .filter(t => !t.hidden)
            .map(t => (
              <button
                key={t.id}
                onClick={() => handleViewChange(t.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
                  view === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon}
                {t.label}
                <span className="text-[10px] text-muted-foreground">({t.count})</span>
              </button>
            ))}
        </div>

        {/* Recherche pour pool/suggestions */}
        {(view === 'pool' || view === 'suggestions') && isCurator && (
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

        {/* Filtres par catégorie d'espèces */}
        {(pool.length > 0 || curations.length > 0) && (view !== 'terrain') && (
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                categoryFilter === null
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
              }`}
            >
              Toutes
            </button>
            {CATEGORIES.map(cat => {
              const isActive = categoryFilter === cat.value;
              const count = categoryCounts[cat.value] || 0;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(isActive ? null : cat.value)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition flex items-center gap-1 ${
                    isActive
                      ? `${cat.color} ring-1 ring-current/40`
                      : count === 0
                      ? 'bg-card text-muted-foreground/50 border-border/50 hover:text-muted-foreground'
                      : `${cat.color} opacity-70 hover:opacity-100`
                  }`}
                  title={cat.label}
                >
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span className="text-[9px] opacity-80">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty pool */}
        {pool.length === 0 && manual.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Eye className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune espèce observée pour cette exploration pour l'instant.
            </p>
            {isCurator && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Lance l'analyse IA dès que des coordonnées GPS sont renseignées sur les marches,
                ou ajoute manuellement une espèce vue sur le terrain.
              </p>
            )}
          </div>
        )}

        {/* Vue Sélection */}
        {view === 'selection' && (
          <SpeciesGrid
            items={applyCategoryFilter(pinnedSpecies.map(s => ({ species: s, curation: curationByKey.get(s.key.toLowerCase()) })))}
            isCurator={isCurator}
            explorationId={explorationId}
            emptyMessage={
              isCurator
                ? 'Aucune espèce épinglée. Lance l’analyse IA ou ajoute une espèce terrain.'
                : "L'ambassadeur n'a pas encore sélectionné d'espèces remarquables."
            }
            upsert={upsert}
            translationMap={translationMap}
            onSpeciesClick={handleSpeciesClick}
          />
        )}

        {/* Vue Suggestions IA */}
        {view === 'suggestions' && (
          <SpeciesGrid
            items={applyCategoryFilter(aiSuggestions).filter(x => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return (
                x.species.scientificName?.toLowerCase().includes(q) ||
                x.species.commonName?.toLowerCase().includes(q)
              );
            })}
            isCurator={isCurator}
            explorationId={explorationId}
            emptyMessage="Aucune suggestion IA. Lance l’analyse pour en obtenir."
            upsert={upsert}
            showAiBadges
            translationMap={translationMap}
            onSpeciesClick={handleSpeciesClick}
          />
        )}

        {/* Vue Pool */}
        {view === 'pool' && (
          <SpeciesGrid
            items={applyCategoryFilter(filteredPool.map(s => ({ species: s, curation: curationByKey.get(s.key.toLowerCase()) })))}
            isCurator={isCurator}
            explorationId={explorationId}
            emptyMessage="Aucune espèce dans le pool."
            upsert={upsert}
            translationMap={translationMap}
            onSpeciesClick={handleSpeciesClick}
          />
        )}

        {/* Vue Terrain */}
        {view === 'terrain' && (
          <ManualSpeciesGrid
            items={manual}
            isCurator={isCurator}
            onAdd={() => setShowManualModal(true)}
          />
        )}

        <ManualSpeciesModal
          open={showManualModal}
          onClose={() => setShowManualModal(false)}
          explorationId={explorationId}
        />

        <SpeciesDetailModal
          species={selectedSpecies}
          isOpen={!!selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
        />
      </div>
    </TooltipProvider>
  );
};

// ---------- Species grid (pool / IA / selection) ----------
const SpeciesGrid: React.FC<{
  items: { species: CuratedSpeciesItem; curation?: ExplorationCuration }[];
  isCurator: boolean;
  explorationId: string;
  emptyMessage: string;
  showAiBadges?: boolean;
  upsert: ReturnType<typeof useUpsertCuration>;
  translationMap: Map<string, SpeciesTranslation>;
  onSpeciesClick: (species: CuratedSpeciesItem, displayName: string, photos: string[]) => void;
}> = ({
  items,
  isCurator,
  explorationId,
  emptyMessage,
  showAiBadges,
  upsert,
  translationMap,
  onSpeciesClick,
}) => {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 border-dashed bg-card/50 p-6 text-center">
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
      {items.map(({ species, curation }) => {
        const isPinned = !!curation && curation.display_order < 9999;
        const translation = species.scientificName
          ? translationMap.get(species.scientificName)
          : undefined;

        return (
          <CuratedSpeciesCard
            key={species.key}
            species={species}
            curation={curation}
            isCurator={isCurator}
            explorationId={explorationId}
            translation={translation}
            showAiBadges={showAiBadges}
            onClick={onSpeciesClick}
            footer={
              isPinned && curation ? (
                <CategoryControl
                  isCurator={isCurator}
                  curation={curation}
                  onSetCategory={async cat => {
                    await upsert.mutateAsync({
                      id: curation.id,
                      exploration_id: explorationId,
                      sense: 'oeil',
                      entity_type: 'species',
                      entity_id: species.key,
                      category: cat,
                    });
                  }}
                />
              ) : null
            }
          />
        );
      })}
    </div>
  );

};

// ---------- Manual species (terrain) grid ----------
const ManualSpeciesGrid: React.FC<{
  items: any[];
  isCurator: boolean;
  onAdd: () => void;
}> = ({ items, isCurator, onAdd }) => {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 border-dashed bg-card/50 p-6 text-center space-y-2">
        <Hand className="w-6 h-6 mx-auto text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">
          Aucune espèce vue sur le terrain pour l'instant.
        </p>
        {isCurator && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Ajouter une observation
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
      {items.map(m => (
        <div key={m.id} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="aspect-square bg-muted">
            <img src={m.photo_url} alt={m.common_name} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="p-2 space-y-1">
            <p className="text-xs font-semibold line-clamp-1">{m.common_name}</p>
            {m.scientific_name && (
              <p className="text-[10px] italic text-muted-foreground line-clamp-1">{m.scientific_name}</p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {new Date(m.observed_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------- Category control (unchanged behavior, slightly compacted) ----------
const CategoryControl: React.FC<{
  isCurator: boolean;
  curation: ExplorationCuration;
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
        <button className={`w-full px-1.5 py-0.5 rounded-md text-[10px] font-medium border text-left ${style}`}>
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
