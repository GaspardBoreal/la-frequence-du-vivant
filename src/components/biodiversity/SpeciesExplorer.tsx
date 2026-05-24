import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, Bird, TreePine, Flower, Leaf, Database, MapPin, Grid3X3, LayoutList, Users, Layers, Check } from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Card } from '../ui/card';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { EnhancedSpeciesCard } from '../audio/EnhancedSpeciesCard';
import SpeciesGalleryDetailModal from './SpeciesGalleryDetailModal';
import { useSpeciesTranslationBatch } from '@/hooks/useSpeciesTranslation';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';
import {
  useMarcheurSpeciesTags,
  indexTagsBySpecies,
  normalizeTagKey,
} from '@/hooks/useMarcheurSpeciesTags';
import MarcheurSpeciesTagDots from '@/components/community/tags/MarcheurSpeciesTagDots';
import MarcheurTagsFilterBar, { matchesTagFilter, type TagFilterState } from '@/components/community/tags/MarcheurTagsFilterBar';
import { classifyTrophic, TROPHIC_LEVELS, DECOMPOSER_META, type TrophicGroup } from '@/lib/trophicClassification';

import SpeciesPhotoModeToggle from './SpeciesPhotoModeToggle';

// Utility to identify birds
const isBirdSpecies = (species: BiodiversitySpecies): boolean => {
  return species.source === 'ebird' ||
    species.family === 'Aves' ||
    species.family?.toLowerCase().includes('aves') ||
    species.family?.toLowerCase().includes('idae') ||
    false;
};

export interface EventParticipant {
  name: string;
  source: 'community' | 'crew';
}

interface SpeciesExplorerProps {
  species: BiodiversitySpecies[];
  compact?: boolean;
  showMap?: boolean;
  mapContent?: React.ReactNode | ((filteredSpecies: BiodiversitySpecies[]) => React.ReactNode);
  className?: string;
  explorationId?: string;
  allEventMarches?: SpeciesMarcheData[];
  /** Community/crew participants to merge into the contributor filter */
  eventParticipants?: EventParticipant[];
  /** Full species pool (incl. family/iconicTaxon) for trophic classification in the species detail modal */
  trophicPool?: BiodiversitySpecies[];
}

const SpeciesExplorer: React.FC<SpeciesExplorerProps> = ({
  species,
  compact = false,
  showMap = false,
  mapContent,
  className = '',
  explorationId,
  allEventMarches,
  eventParticipants = [],
  trophicPool,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<'all' | 'gbif' | 'inaturalist' | 'ebird'>('all');
  const [hasAudioFilter, setHasAudioFilter] = useState<'all' | 'with-audio' | 'without-audio'>('all');
  const [selectedContributor, setSelectedContributor] = useState<string>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<BiodiversitySpecies | null>(null);
  const [tagFilter, setTagFilter] = useState<TagFilterState>({ labels: [], mode: 'or' });
  const [selectedTrophic, setSelectedTrophic] = useState<Set<TrophicGroup>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'immersion'>(() => {
    return (localStorage.getItem('species-explorer-view') as 'list' | 'immersion') || 'list';
  });

  const handleViewMode = (mode: 'list' | 'immersion') => {
    setViewMode(mode);
    localStorage.setItem('species-explorer-view', mode);
  };

  // Category stats
  const categoryStats = useMemo(() => {
    const stats = {
      all: species.length,
      faune: species.filter(s => s.kingdom === 'Animalia').length,
      plants: species.filter(s => s.kingdom === 'Plantae').length,
      fungi: species.filter(s => s.kingdom === 'Fungi').length,
      others: 0,
    };
    stats.others = stats.all - stats.faune - stats.plants - stats.fungi;
    return stats;
  }, [species]);

  // Contributors grouped by source (taxonomic)
  const contributorsBySource = useMemo(() => {
    const sourceGroups = {
      eBird: new Map<string, number>(),
      iNaturalist: new Map<string, number>(),
      gbif: new Map<string, number>(),
    };
    species.forEach(sp => {
      sp.attributions?.forEach(attr => {
        const name = (attr.observerName || '').trim();
        if (!name) return;
        const key = sp.source === 'ebird' ? 'eBird' : sp.source === 'inaturalist' ? 'iNaturalist' : 'gbif';
        sourceGroups[key].set(name, (sourceGroups[key].get(name) || 0) + 1);
      });
    });
    const toArray = (m: Map<string, number>, source: string) =>
      Array.from(m.entries()).map(([name, count]) => ({ name, count, source })).sort((a, b) => b.count - a.count);
    return {
      eBird: toArray(sourceGroups.eBird, 'ebird'),
      iNaturalist: toArray(sourceGroups.iNaturalist, 'inaturalist'),
      gbif: toArray(sourceGroups.gbif, 'gbif'),
    };
  }, [species]);

  // Deduplicated marcheurs from eventParticipants
  const uniqueMarcheurs = useMemo(() => {
    const seen = new Set<string>();
    return eventParticipants.filter(p => {
      const key = p.name.toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [eventParticipants]);

  // Total unique contributors across all sources
  const totalContributors = useMemo(() => {
    const uniqueNames = new Set<string>();
    // Marcheurs
    uniqueMarcheurs.forEach(m => uniqueNames.add(m.name.toLowerCase().trim()));
    // Taxonomic observers
    [...contributorsBySource.eBird, ...contributorsBySource.iNaturalist, ...contributorsBySource.gbif]
      .forEach(c => uniqueNames.add(c.name.toLowerCase().trim()));
    return uniqueNames.size;
  }, [contributorsBySource, uniqueMarcheurs]);

  // Is the selected contributor a marcheur (community/crew)?
  const isSelectedMarcheur = useMemo(() => {
    if (selectedContributor === 'all') return false;
    return uniqueMarcheurs.some(m => m.name === selectedContributor);
  }, [selectedContributor, uniqueMarcheurs]);

  // Batch translations
  const speciesForTranslation = useMemo(() =>
    species.map(s => ({ scientificName: s.scientificName, commonName: s.commonName })),
    [species]
  );
  const { data: translations } = useSpeciesTranslationBatch(speciesForTranslation);
  const translationMap = useMemo(() =>
    new Map(translations?.map(t => [t.scientificName, t]) || []),
    [translations]
  );

  // Marcheur tags (private to current user)
  const allScientificNames = useMemo(
    () => species.map((s) => s.scientificName).filter(Boolean),
    [species]
  );
  const { data: marcheurTags } = useMarcheurSpeciesTags(allScientificNames);
  const tagsBySpecies = useMemo(() => indexTagsBySpecies(marcheurTags), [marcheurTags]);

  // Trophic group per species (memoized)
  const trophicByName = useMemo(() => {
    const m = new Map<string, TrophicGroup>();
    species.forEach((s) => {
      m.set(s.scientificName, classifyTrophic(s).group);
    });
    return m;
  }, [species]);

  // Filtered species — *avant* application du filtre trophique (sert aux compteurs dynamiques)
  const filteredBeforeTrophic = useMemo(() => {
    let filtered = species;

    if (selectedCategory !== 'all' && selectedCategory !== 'map') {
      filtered = filtered.filter(s => {
        switch (selectedCategory) {
          case 'faune': return s.kingdom === 'Animalia';
          case 'plants': return s.kingdom === 'Plantae';
          case 'fungi': return s.kingdom === 'Fungi';
          case 'others': return s.kingdom !== 'Plantae' && s.kingdom !== 'Fungi' && s.kingdom !== 'Animalia';
          default: return true;
        }
      });
    }

    if (selectedContributor !== 'all') {
      filtered = filtered.filter(s =>
        s.attributions?.some(a => (a.observerName || 'Anonyme') === selectedContributor)
      );
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter(s => s.source === selectedSource);
    }

    if (hasAudioFilter !== 'all') {
      filtered = filtered.filter(s => {
        const has = s.xenoCantoRecordings && s.xenoCantoRecordings.length > 0;
        return hasAudioFilter === 'with-audio' ? has : !has;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => {
        const fr = translationMap.get(s.scientificName)?.commonName || '';
        return (
          fr.toLowerCase().includes(term) ||
          s.commonName.toLowerCase().includes(term) ||
          s.scientificName.toLowerCase().includes(term)
        );
      });
    }

    if (tagFilter.labels.length > 0) {
      filtered = filtered.filter((s) => {
        const labels = (tagsBySpecies.get(normalizeTagKey(s.scientificName)) || []).map((t) => t.label);
        return matchesTagFilter(labels, tagFilter);
      });
    }

    return filtered.sort((a, b) => b.observations - a.observations);
  }, [species, selectedCategory, selectedContributor, selectedSource, hasAudioFilter, searchTerm, translationMap, tagFilter, tagsBySpecies]);

  // Compteurs trophiques dynamiques (recalculés à partir des autres filtres)
  const trophicCounts = useMemo(() => {
    const counts: Record<TrophicGroup, number> = {
      L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, DECOMPOSER: 0, UNCLASSIFIED: 0,
    };
    filteredBeforeTrophic.forEach((s) => {
      const g = trophicByName.get(s.scientificName) || 'UNCLASSIFIED';
      counts[g] += 1;
    });
    return counts;
  }, [filteredBeforeTrophic, trophicByName]);

  // Application finale du filtre trophique
  const filteredSpecies = useMemo(() => {
    if (selectedTrophic.size === 0) return filteredBeforeTrophic;
    return filteredBeforeTrophic.filter((s) =>
      selectedTrophic.has(trophicByName.get(s.scientificName) || 'UNCLASSIFIED')
    );
  }, [filteredBeforeTrophic, selectedTrophic, trophicByName]);

  const toggleTrophic = (g: TrophicGroup) => {
    setSelectedTrophic((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const trophicEntries: Array<{ group: TrophicGroup; label: string; shortLabel: string; token: string }> = [
    ...TROPHIC_LEVELS.map((l) => ({ group: l.group, label: l.label, shortLabel: l.shortLabel, token: l.token })),
    { group: DECOMPOSER_META.group, label: DECOMPOSER_META.label, shortLabel: DECOMPOSER_META.shortLabel, token: DECOMPOSER_META.token },
  ];

  const gridCols = compact
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  const renderSpeciesGrid = (list: BiodiversitySpecies[]) => (
    <div className={`grid gap-3 ${gridCols}`}>
      {list.map((sp, i) => {
        const spTags = tagsBySpecies.get(normalizeTagKey(sp.scientificName)) || [];
        return (
          <div key={`${sp.id}-${i}`} className="relative">
            <EnhancedSpeciesCard
              species={sp}
              onSpeciesClick={setSelectedSpecies}
              translation={translationMap.get(sp.scientificName)}
            />
            <MarcheurSpeciesTagDots
              scientificName={sp.scientificName}
              tags={spTags}
              overlay
            />
          </div>
        );
      })}
      {list.length === 0 && (
        <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
          Aucune espèce ne correspond aux filtres sélectionnés
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`space-y-4 ${className}`}
      data-chat-section="species-explorer"
      data-chat-count={filteredSpecies.length}
      data-chat-active-category={selectedCategory}
    >
      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <SpeciesPhotoModeToggle />
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Rechercher une espèce..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {searchTerm && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              "{searchTerm}" : {filteredSpecies.length} résultat{filteredSpecies.length > 1 ? 's' : ''}
            </Badge>
          )}

          {/* Marcheur context banner */}
          {isSelectedMarcheur && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary flex-shrink-0" />
              <span>
                {filteredSpecies.length > 0
                  ? <>Espèces identifiées par <strong className="text-foreground">{selectedContributor}</strong></>
                  : <>Aucune identification taxonomique rattachée à <strong className="text-foreground">{selectedContributor}</strong></>
                }
              </span>
            </div>
          )}

          {/* Marcheur tags filter (private) */}
          <MarcheurTagsFilterBar state={tagFilter} onChange={setTagFilter} />

          {/* Filter dropdowns */}
          <div className={`grid gap-3 ${compact ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'}`}>
            <Select value={selectedCategory} onValueChange={v => setSelectedCategory(v)}>
              <SelectTrigger><SelectValue placeholder="Catégories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes ({categoryStats.all})</SelectItem>
                <SelectItem value="faune">Faune ({categoryStats.faune})</SelectItem>
                <SelectItem value="plants">Plantes ({categoryStats.plants})</SelectItem>
                <SelectItem value="fungi">Champignons ({categoryStats.fungi})</SelectItem>
                <SelectItem value="others">Autres ({categoryStats.others})</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSource} onValueChange={(v: any) => setSelectedSource(v)}>
              <SelectTrigger><SelectValue placeholder="Sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                <SelectItem value="gbif">GBIF</SelectItem>
                <SelectItem value="inaturalist">iNaturalist</SelectItem>
                <SelectItem value="ebird">eBird</SelectItem>
              </SelectContent>
            </Select>

            <Select value={hasAudioFilter} onValueChange={(v: any) => setHasAudioFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Audio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Avec et sans audio</SelectItem>
                <SelectItem value="with-audio">Avec audio</SelectItem>
                <SelectItem value="without-audio">Sans audio</SelectItem>
              </SelectContent>
            </Select>

            {/* Trophic levels multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Niveaux trophiques${selectedTrophic.size > 0 ? ` (${selectedTrophic.size} sélectionné${selectedTrophic.size > 1 ? 's' : ''})` : ''}`}
                  className="flex items-center justify-between gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent/50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      {selectedTrophic.size === 0
                        ? 'Niveaux trophiques'
                        : `Niveaux (${selectedTrophic.size})`}
                    </span>
                  </div>
                  {selectedTrophic.size > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {Array.from(selectedTrophic).slice(0, 5).map((g) => {
                        const meta = trophicEntries.find((e) => e.group === g);
                        if (!meta) return null;
                        return (
                          <span
                            key={g}
                            className="h-2 w-2 rounded-full ring-1 ring-background"
                            style={{ background: `hsl(var(${meta.token}))` }}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[280px] p-2">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Chaîne trophique
                  </span>
                  {selectedTrophic.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTrophic(new Set())}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Tout effacer
                    </button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {trophicEntries.map((entry) => {
                    const checked = selectedTrophic.has(entry.group);
                    const count = trophicCounts[entry.group] ?? 0;
                    const disabled = count === 0 && !checked;
                    return (
                      <button
                        key={entry.group}
                        type="button"
                        role="option"
                        aria-selected={checked}
                        disabled={disabled}
                        onClick={() => toggleTrophic(entry.group)}
                        className={`w-full flex items-center gap-3 min-h-[44px] px-2 py-2 rounded-md text-left text-sm transition-all ${
                          checked
                            ? 'bg-accent/60 border border-border'
                            : 'border border-transparent hover:bg-accent/40'
                        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-background shadow-sm"
                          style={{ background: `hsl(var(${entry.token}))` }}
                        />
                        <span
                          className="text-[10px] font-mono font-semibold w-6 text-center px-1 py-0.5 rounded flex-shrink-0"
                          style={{
                            background: `hsl(var(${entry.token}) / 0.15)`,
                            color: `hsl(var(${entry.token}))`,
                          }}
                        >
                          {entry.shortLabel}
                        </span>
                        <span className="flex-1 truncate text-foreground">{entry.label}</span>
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0 tabular-nums">
                          {count}
                        </Badge>
                        <span
                          className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            checked ? 'bg-primary border-primary' : 'border-input'
                          }`}
                        >
                          {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>


            {/* Unified contributor filter */}
            {totalContributors > 0 ? (
              <Select value={selectedContributor} onValueChange={(v: any) => setSelectedContributor(v)}>
                <SelectTrigger>
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="truncate flex-1"><SelectValue placeholder="Contributeurs" /></div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">{totalContributors}</Badge>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="all" className="font-medium">Tous ({totalContributors})</SelectItem>

                  {/* Marcheurs section */}
                  {uniqueMarcheurs.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 border-b flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        Marcheurs ({uniqueMarcheurs.length})
                      </div>
                      {uniqueMarcheurs.map(m => (
                        <SelectItem key={`marcheur-${m.name}`} value={m.name} className="pl-6">
                          <span className="truncate">{m.name}</span>
                          <Badge variant="outline" className="ml-2 text-emerald-600 border-emerald-200 text-[10px]">
                            {m.source === 'crew' ? 'équipe' : 'participant'}
                          </Badge>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* eBird section */}
                  {contributorsBySource.eBird.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 border-b">
                        eBird ({contributorsBySource.eBird.length})
                      </div>
                      {contributorsBySource.eBird.map(c => (
                        <SelectItem key={`ebird-${c.name}`} value={c.name} className="pl-6">
                          <span className="truncate">{c.name}</span>
                          <Badge variant="outline" className="ml-2 text-blue-600 border-blue-200">{c.count}</Badge>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* iNaturalist section */}
                  {contributorsBySource.iNaturalist.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 border-b">
                        iNaturalist ({contributorsBySource.iNaturalist.length})
                      </div>
                      {contributorsBySource.iNaturalist.map(c => (
                        <SelectItem key={`inat-${c.name}`} value={c.name} className="pl-6">
                          <span className="truncate">{c.name}</span>
                          <Badge variant="outline" className="ml-2 text-green-600 border-green-200">{c.count}</Badge>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* GBIF section */}
                  {contributorsBySource.gbif.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400 border-b">
                        GBIF ({contributorsBySource.gbif.length})
                      </div>
                      {contributorsBySource.gbif.map(c => (
                        <SelectItem key={`gbif-${c.name}`} value={c.name} className="pl-6">
                          <span className="truncate">{c.name}</span>
                          <Badge variant="outline" className="ml-2 text-orange-600 border-orange-200">{c.count}</Badge>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            {filteredSpecies.length} espèce{filteredSpecies.length > 1 ? 's' : ''} trouvée{filteredSpecies.length > 1 ? 's' : ''}
          </p>
        </div>
      </Card>

      {/* Category tabs + grid */}
      <Tabs value={selectedCategory} onValueChange={v => setSelectedCategory(v)} className="w-full">
        <TabsList className={`grid w-full ${showMap ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="all" className="flex items-center gap-1 text-xs">
            <Database className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Toutes</span> ({categoryStats.all})
          </TabsTrigger>
          {showMap && (
            <TabsTrigger value="map" className="flex items-center gap-1 text-xs">
              <MapPin className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Carte</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="faune" className="flex items-center gap-1 text-xs">
            <Bird className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Faune</span> ({categoryStats.faune})
          </TabsTrigger>
          <TabsTrigger value="plants" className="flex items-center gap-1 text-xs">
            <TreePine className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Flore</span> ({categoryStats.plants})
          </TabsTrigger>
          <TabsTrigger value="fungi" className="flex items-center gap-1 text-xs">
            <Flower className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Champignons</span> ({categoryStats.fungi})
          </TabsTrigger>
          <TabsTrigger value="others" className="flex items-center gap-1 text-xs">
            <Leaf className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Autres</span> ({categoryStats.others})
          </TabsTrigger>
        </TabsList>

        {showMap && mapContent && (
          <TabsContent value="map" className="space-y-4">
            {typeof mapContent === 'function' ? mapContent(filteredSpecies) : mapContent}
          </TabsContent>
        )}

        <TabsContent value="all">{renderSpeciesGrid(filteredSpecies)}</TabsContent>
        <TabsContent value="faune">{renderSpeciesGrid(filteredSpecies.filter(s => s.kingdom === 'Animalia'))}</TabsContent>
        <TabsContent value="plants">{renderSpeciesGrid(filteredSpecies.filter(s => s.kingdom === 'Plantae'))}</TabsContent>
        <TabsContent value="fungi">{renderSpeciesGrid(filteredSpecies.filter(s => s.kingdom === 'Fungi'))}</TabsContent>
        <TabsContent value="others">{renderSpeciesGrid(filteredSpecies.filter(s => s.kingdom !== 'Plantae' && s.kingdom !== 'Fungi' && s.kingdom !== 'Animalia'))}</TabsContent>
      </Tabs>

      <SpeciesGalleryDetailModal
        species={selectedSpecies ? {
          name: selectedSpecies.commonName,
          scientificName: selectedSpecies.scientificName,
          count: selectedSpecies.observations,
          kingdom: selectedSpecies.kingdom,
          photos: selectedSpecies.photoData ? [selectedSpecies.photoData.url] : undefined,
        } : null}
        explorationId={explorationId}
        allEventMarches={allEventMarches}
        trophicPool={trophicPool ?? species}
        isOpen={!!selectedSpecies}
        onClose={() => setSelectedSpecies(null)}
      />
    </div>
  );
};

export default SpeciesExplorer;
