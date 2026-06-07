import React, { useEffect, useMemo, useState } from 'react';
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
import SpeciesGalleryDetailModal from '@/components/biodiversity/SpeciesGalleryDetailModal';
import { useExplorationAllMarches } from '@/hooks/useExplorationAllMarches';
import { CATEGORIES, getCatStyle, getCatLabel } from './curationCategories';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
import { chatPageContext, useChatTabSnapshot } from '@/hooks/useChatPageContext';
import {
  useMarcheurSpeciesTags,
  indexTagsBySpecies,
  type MarcheurSpeciesTag,
} from '@/hooks/useMarcheurSpeciesTags';
import MarcheurSpeciesTagDots from '@/components/community/tags/MarcheurSpeciesTagDots';
import MarcheurTagsFilterBar, {
  matchesTagFilter,
  type TagFilterState,
} from '@/components/community/tags/MarcheurTagsFilterBar';

const normSci = (s?: string | null) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

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
  const [hasUserPickedView, setHasUserPickedView] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<TagFilterState>({ labels: [], mode: 'and' });
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<{
    name: string;
    scientificName: string;
    count: number;
    kingdom: string;
    photos?: string[];
  } | null>(null);
  const { data: allEventMarches } = useExplorationAllMarches(explorationId);
  // Phase 3 — sheet partagée pour exposer les évidences sourcées
  const [evidenceFor, setEvidenceFor] = useState<{
    curation: ExplorationCuration;
    displayName: string;
    scientificName: string | null;
    entityId: string | null;
  } | null>(null);

  const handleOpenEvidence = React.useCallback(
    (curation: ExplorationCuration, displayName: string) => {
      const species =
        curation.entity_id && pool
          ? pool.find((s) => s.key.toLowerCase() === curation.entity_id!.toLowerCase())
          : undefined;
      setEvidenceFor({
        curation,
        displayName,
        scientificName: species?.scientificName ?? null,
        entityId: curation.entity_id,
      });
    },
    [pool],
  );

  // Apply category filter on a list of {species, curation}
  // Une espèce correspond si la catégorie est sa primaire OU dans ses secondaires.
  const matchesCategory = (curation: ExplorationCuration | undefined, cat: string): boolean => {
    if (!curation) return false;
    if (curation.category === cat) return true;
    const secondaries = (curation.secondary_categories as string[] | undefined) || [];
    return secondaries.includes(cat);
  };
  const applyCategoryFilter = <T extends { curation?: ExplorationCuration }>(items: T[]): T[] => {
    if (!categoryFilter) return items;
    return items.filter(x => matchesCategory(x.curation, categoryFilter));
  };

  // ─── Tags-Marcheurs (privés, par espèce) ───
  const allSciNames = useMemo(
    () => pool.map(s => s.scientificName).filter(Boolean) as string[],
    [pool],
  );
  const { data: rawTags = [] } = useMarcheurSpeciesTags(allSciNames);
  // Scope = global only (exploration multi-marches)
  const tagsByScientific = useMemo(
    () => indexTagsBySpecies(rawTags as MarcheurSpeciesTag[], null),
    [rawTags],
  );
  const getSpeciesTags = (sci?: string | null): MarcheurSpeciesTag[] =>
    tagsByScientific.get(normSci(sci)) || [];

  const applyTagFilter = <T extends { species: { scientificName: string | null } }>(
    items: T[],
  ): T[] => {
    if (tagFilter.labels.length === 0) return items;
    return items.filter(x =>
      matchesTagFilter(getSpeciesTags(x.species.scientificName).map(t => t.label), tagFilter),
    );
  };
  // For the pinned/pool grids that use raw species items
  const applyTagFilterToSpecies = <T extends { scientificName: string | null }>(
    items: T[],
  ): T[] => {
    if (tagFilter.labels.length === 0) return items;
    return items.filter(s =>
      matchesTagFilter(getSpeciesTags(s.scientificName).map(t => t.label), tagFilter),
    );
  };

  // Wrap setView so that switching tab clears the category filter — avoids
  // hiding the entire grid when the active category has no items in the new tab.
  const handleViewChange = (next: View) => {
    setView(next);
    setHasUserPickedView(true);
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
    const g = (species.group || '').toLowerCase();
    const kingdom =
      g === 'animalia' ? 'Animalia' :
      g === 'plantae' ? 'Plantae' :
      g === 'fungi' ? 'Fungi' : 'Other';
    setSelectedSpecies({
      name: displayName || species.commonName || species.scientificName || '',
      scientificName: species.scientificName || '',
      count: species.count,
      kingdom,
      photos,
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
  React.useEffect(() => {
    pinnedRef.current = pinnedSpecies.map(s => ({ scientificName: s.scientificName, key: s.key }));
  }, [pinnedSpecies]);


  const aiSuggestions = useMemo(
    () =>
      pool
        .map(s => ({ species: s, curation: curationByKey.get(s.key.toLowerCase()) }))
        .filter(x => x.curation?.source === 'ai')
        .sort((a, b) => (b.curation?.ai_score || 0) - (a.curation?.ai_score || 0)),
    [pool, curationByKey]
  );

  // Phase 3 — espèces dont la classification automatique attend une validation humaine
  const reviewItems = useMemo(
    () =>
      pool
        .map(s => ({ species: s, curation: curationByKey.get(s.key.toLowerCase()) }))
        .filter(x => !!x.curation?.needs_review)
        .sort(
          (a, b) =>
            (a.curation?.classification_confidence ?? 0) -
            (b.curation?.classification_confidence ?? 0),
        ),
    [pool, curationByKey],
  );

  // Garde la sheet d'évidences synchronisée avec les données fraîches
  // après une validation curateur (needs_review → false).
  React.useEffect(() => {
    if (!evidenceFor) return;
    const fresh = curations.find(c => c.id === evidenceFor.curation.id);
    if (fresh && fresh !== evidenceFor.curation) {
      setEvidenceFor({ ...evidenceFor, curation: fresh });
    }
  }, [curations, evidenceFor]);

  // Helper : matching FR + Latin (+ original commonName si présent)
  const matchesSearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return () => true;
    return (sp: { scientificName?: string | null; commonName?: string | null }) => {
      if (!sp) return false;
      const sci = (sp.scientificName || '').toLowerCase();
      const cn = (sp.commonName || '').toLowerCase();
      const fr = (sp.scientificName ? translationMap.get(sp.scientificName)?.commonName || '' : '').toLowerCase();
      return sci.includes(q) || cn.includes(q) || fr.includes(q);
    };
  }, [search, translationMap]);

  const filteredPool = useMemo(() => pool.filter(matchesSearch), [pool, matchesSearch]);

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
    } else if (view === 'review') {
      source = reviewItems;
    }
    source.forEach(x => {
      const cats = new Set<string>();
      if (x.curation?.category) cats.add(x.curation.category);
      const secondaries = (x.curation?.secondary_categories as string[] | undefined) || [];
      secondaries.forEach(c => cats.add(c));
      cats.forEach(cat => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return counts;
  }, [view, pinnedSpecies, aiSuggestions, filteredPool, curationByKey]);

  const stale = isAnalysisStale(lastAnalysis);

  const handleAi = () => triggerAi.mutate(explorationId);

  // Auto-switch : si la Sélection finale est vide et que l'utilisateur n'a pas
  // choisi d'onglet manuellement, basculer sur le premier onglet non vide
  // (Terrain → Pool/Observées) pour éviter un écran vide trompeur.
  useEffect(() => {
    if (hasUserPickedView) return;
    if (view !== 'selection') return;
    if (pinnedSpecies.length > 0) return;
    if (manual.length > 0) {
      setView('terrain');
    } else if (pool.length > 0) {
      setView('pool');
    }
  }, [hasUserPickedView, view, pinnedSpecies.length, manual.length, pool.length]);

  // ─── Snapshot Chat IA : ce qui est RÉELLEMENT visible dans la grille ───
  // Reproduit la même logique de filtrage que les vues SpeciesGrid plus bas
  // pour que l'IA reçoive la liste exacte affichée à l'écran.
  const visibleSpecies = useMemo(() => {
    let source: { species: CuratedSpeciesItem; curation?: ExplorationCuration }[] = [];
    if (view === 'selection') {
      source = pinnedSpecies.map(s => ({ species: s, curation: curationByKey.get(s.key.toLowerCase()) }));
    } else if (view === 'suggestions') {
      const q = search.trim().toLowerCase();
      source = aiSuggestions.filter(x => {
        if (!q) return true;
        return (
          x.species.scientificName?.toLowerCase().includes(q) ||
          x.species.commonName?.toLowerCase().includes(q)
        );
      });
    } else if (view === 'pool') {
      source = filteredPool.map(s => ({ species: s, curation: curationByKey.get(s.key.toLowerCase()) }));
    } else if (view === 'review') {
      source = reviewItems;
    }
    if (categoryFilter && view !== 'terrain') {
      source = source.filter(x => matchesCategory(x.curation, categoryFilter));
    }
    if (tagFilter.labels.length > 0 && view !== 'terrain') {
      source = source.filter(x =>
        matchesTagFilter(getSpeciesTags(x.species.scientificName).map(t => t.label), tagFilter),
      );
    }
    return source;
  }, [view, categoryFilter, search, tagFilter, pinnedSpecies, aiSuggestions, filteredPool, reviewItems, curationByKey, tagsByScientific]);

  // Publie les filtres dans pageState (lus directement par l'edge function)
  useEffect(() => {
    chatPageContext.setPageState({
      filters: {
        oeilView: view,
        oeilCategory: categoryFilter || undefined,
        oeilSearch: search.trim() || undefined,
        oeilTagFilter: tagFilter.labels.length > 0
          ? { mode: tagFilter.mode, labels: tagFilter.labels }
          : undefined,
        oeilVisibleCount: visibleSpecies.length,
      },
    });
  }, [view, categoryFilter, search, tagFilter, visibleSpecies.length]);

  // Publie la liste précise des espèces visibles (max 30, payload léger)
  useChatTabSnapshot(
    'apprendre.oeil.especesVisibles',
    visibleSpecies.length > 0
      ? {
          view,
          categorie: categoryFilter,
          recherche: search.trim() || undefined,
          total: visibleSpecies.length,
          tronquee: visibleSpecies.length > 30,
          items: visibleSpecies.slice(0, 30).map(({ species, curation }) => ({
            nom_fr: species.displayName || species.commonName || species.scientificName,
            nom_sci: species.scientificName,
            categorie: curation?.category || null,
            categories_secondaires: (curation?.secondary_categories as string[] | undefined) || undefined,
            observations: species.count,
            epinglee: !!curation && curation.display_order < 9999,
          })),
        }
      : null,
  );


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

        {/* Recherche globale (au-dessus des onglets) — nom français OU latin */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher une espèce (nom français ou latin)…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-9 h-9 text-sm"
            aria-label="Rechercher une espèce par nom français ou latin"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border">
          {[
            { id: 'selection' as View, label: 'Sélection finale', count: pinnedSpecies.length },
            { id: 'suggestions' as View, label: 'Suggestions IA', count: aiSuggestions.length, hidden: !isCurator },
            {
              id: 'review' as View,
              label: 'À réviser',
              count: reviewItems.length,
              hidden: !isCurator,
              icon: <AlertCircle className="w-3 h-3" />,
              tone: reviewItems.length > 0 ? 'amber' : undefined,
            },
            { id: 'terrain' as View, label: 'Terrain', count: manual.length, icon: <Hand className="w-3 h-3" /> },
            { id: 'pool' as View, label: isCurator ? 'Pool observé' : 'Observées', count: pool.length },
          ]
            .filter(t => !t.hidden)
            .map(t => {
              const isAmber = (t as any).tone === 'amber' && view !== t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleViewChange(t.id)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
                    view === t.id
                      ? 'border-primary text-primary'
                      : isAmber
                      ? 'border-transparent text-amber-700 dark:text-amber-400 hover:text-amber-800'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.icon}
                  {t.label}
                  <span
                    className={`text-[10px] ${
                      isAmber ? 'text-amber-600 font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    ({t.count})
                  </span>
                </button>
              );
            })}
        </div>


        {/* Filtres par catégorie d'espèces */}
        {(pool.length > 0 || curations.length > 0) && (view !== 'terrain') && (
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
            <button
              onClick={() => setCategoryFilter(null)}
              data-chat-chip
              data-chat-active={categoryFilter === null ? 'true' : 'false'}
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
                  data-chat-chip
                  data-chat-active={isActive ? 'true' : 'false'}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition flex items-center gap-1 ${
                    isActive
                      ? `${cat.color} ring-1 ring-current/40`
                      : count === 0
                      ? 'bg-card text-muted-foreground/50 border-border/50 hover:text-muted-foreground'
                      : `${cat.color} opacity-70 hover:opacity-100`
                  }`}
                  title={cat.label}
                >
                  <span>{cat.label} {count > 0 ? `(${count})` : ''}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filtre par tags-marcheurs (privés) */}
        {(pool.length > 0) && (view !== 'terrain') && (
          <MarcheurTagsFilterBar
            state={tagFilter}
            onChange={setTagFilter}
            className="px-1"
          />
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
          <>
            {pinnedSpecies.length === 0 && (pool.length > 0 || manual.length > 0) && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm space-y-2">
                <p className="text-foreground">
                  {isCurator
                    ? "Aucune espèce épinglée pour l'instant."
                    : "L'ambassadeur n'a pas encore sélectionné d'espèces remarquables."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {pool.length > 0 && (
                    <Button size="sm" variant="outline" onClick={() => handleViewChange('pool')}>
                      Voir les {pool.length} espèce{pool.length > 1 ? 's' : ''} {isCurator ? 'du pool' : 'observées'}
                    </Button>
                  )}
                  {manual.length > 0 && (
                    <Button size="sm" variant="outline" onClick={() => handleViewChange('terrain')}>
                      <Hand className="w-3.5 h-3.5 mr-1.5" />
                      Voir les {manual.length} observation{manual.length > 1 ? 's' : ''} terrain
                    </Button>
                  )}
                  {isCurator && pool.length > 0 && (
                    <Button size="sm" onClick={handleAi} disabled={triggerAi.isPending}>
                      {triggerAi.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
                      Lancer l'analyse IA
                    </Button>
                  )}
                </div>
              </div>
            )}
            <SpeciesGrid
              items={applyTagFilter(applyCategoryFilter(pinnedSpecies.filter(matchesSearch).map(s => ({ species: s, curation: curationByKey.get(s.key.toLowerCase()) }))))}
              tagsByScientific={tagsByScientific}
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
              onOpenEvidence={handleOpenEvidence}
            />
          </>
        )}

        {/* Vue Suggestions IA */}
        {view === 'suggestions' && (
          <SpeciesGrid
            items={applyTagFilter(applyCategoryFilter(aiSuggestions).filter(x => matchesSearch(x.species)))}
            tagsByScientific={tagsByScientific}
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
            items={applyTagFilter(applyCategoryFilter(filteredPool.map(s => ({ species: s, curation: curationByKey.get(s.key.toLowerCase()) }))))}
            tagsByScientific={tagsByScientific}
            isCurator={isCurator}
            explorationId={explorationId}
            emptyMessage="Aucune espèce dans le pool."
            upsert={upsert}
            translationMap={translationMap}
            onSpeciesClick={handleSpeciesClick}
            onOpenEvidence={handleOpenEvidence}
          />
        )}

        {/* Vue À réviser — classifications automatiques en attente de validation */}
        {view === 'review' && (
          <div className="space-y-3">
            {reviewItems.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  Ces espèces ont une classification automatique à confirmer.
                  Cliquez sur un badge pour voir les sources, puis validez ou
                  corrigez. Triées de la confiance la plus faible à la plus
                  élevée.
                </p>
              </div>
            )}
            <SpeciesGrid
              items={applyTagFilter(applyCategoryFilter(reviewItems.filter(x => matchesSearch(x.species))))}
              tagsByScientific={tagsByScientific}
              isCurator={isCurator}
              explorationId={explorationId}
              emptyMessage="Aucune classification en attente — bravo, tout est à jour !"
              upsert={upsert}
              translationMap={translationMap}
              onSpeciesClick={handleSpeciesClick}
              onOpenEvidence={handleOpenEvidence}
            />
          </div>
        )}

        {/* Vue Terrain */}
        {view === 'terrain' && (
          <ManualSpeciesGrid
            items={manual.filter(m => matchesSearch({ scientificName: m.scientific_name, commonName: m.common_name }))}
            isCurator={isCurator}
            onAdd={() => setShowManualModal(true)}
          />
        )}

        <ManualSpeciesModal
          open={showManualModal}
          onClose={() => setShowManualModal(false)}
          explorationId={explorationId}
        />

        <SpeciesGalleryDetailModal
          species={selectedSpecies}
          explorationId={explorationId}
          allEventMarches={allEventMarches}
          isOpen={!!selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
        />

        {/* Sheet partagée — sources auditables d'une classification */}
        <ClassificationEvidenceSheet
          open={!!evidenceFor}
          onClose={() => setEvidenceFor(null)}
          curation={evidenceFor?.curation ?? null}
          displayName={evidenceFor?.displayName}
          scientificName={evidenceFor?.scientificName ?? null}
          entityId={evidenceFor?.entityId ?? null}
          isCurator={isCurator}
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
  tagsByScientific?: Map<string, MarcheurSpeciesTag[]>;
  onSpeciesClick: (species: CuratedSpeciesItem, displayName: string, photos: string[]) => void;
  onOpenEvidence?: (curation: ExplorationCuration, displayName: string) => void;
}> = ({
  items,
  isCurator,
  explorationId,
  emptyMessage,
  showAiBadges,
  upsert,
  translationMap,
  tagsByScientific,
  onSpeciesClick,
  onOpenEvidence,
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
        const speciesTags = species.scientificName && tagsByScientific
          ? (tagsByScientific.get(normSci(species.scientificName)) || [])
          : [];

        return (
          <div key={species.key} className="relative">
            {species.scientificName && (
              <MarcheurSpeciesTagDots
                scientificName={species.scientificName}
                marcheId={null}
                tags={speciesTags}
                overlay
              />
            )}
            <CuratedSpeciesCard
              species={species}
              curation={curation}
              isCurator={isCurator}
              explorationId={explorationId}
              translation={translation}
              showAiBadges={showAiBadges}
              onClick={onSpeciesClick}
              onOpenEvidence={onOpenEvidence}
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
                        entity_id: species.scientificName || species.key,
                        category: cat,
                      });
                    }}
                  />
                ) : null
              }
            />
          </div>
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
