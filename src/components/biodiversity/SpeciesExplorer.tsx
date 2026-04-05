import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, Bird, TreePine, Flower, Leaf, Database, MapPin, Grid3X3, LayoutList } from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { EnhancedSpeciesCard } from '../audio/EnhancedSpeciesCard';
import SpeciesDetailModal from './SpeciesDetailModal';
import SpeciesGalleryDetailModal from './SpeciesGalleryDetailModal';
import { useSpeciesTranslationBatch } from '@/hooks/useSpeciesTranslation';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';

// Utility to identify birds
const isBirdSpecies = (species: BiodiversitySpecies): boolean => {
  return species.source === 'ebird' ||
    species.family === 'Aves' ||
    species.family?.toLowerCase().includes('aves') ||
    species.family?.toLowerCase().includes('idae') ||
    false;
};

interface SpeciesExplorerProps {
  species: BiodiversitySpecies[];
  compact?: boolean;
  showMap?: boolean;
  mapContent?: React.ReactNode;
  className?: string;
  explorationId?: string;
  allEventMarches?: SpeciesMarcheData[];
  /** When species have no attributions, show this count as fallback participant info */
  fallbackParticipantCount?: number;
}

const SpeciesExplorer: React.FC<SpeciesExplorerProps> = ({
  species,
  compact = false,
  showMap = false,
  mapContent,
  className = '',
  explorationId,
  allEventMarches,
  fallbackParticipantCount = 0,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<'all' | 'gbif' | 'inaturalist' | 'ebird'>('all');
  const [hasAudioFilter, setHasAudioFilter] = useState<'all' | 'with-audio' | 'without-audio'>('all');
  const [selectedContributor, setSelectedContributor] = useState<string>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<BiodiversitySpecies | null>(null);
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

  // Contributors grouped by source
  const contributorsBySource = useMemo(() => {
    const sourceGroups = {
      eBird: new Map<string, number>(),
      iNaturalist: new Map<string, number>(),
      gbif: new Map<string, number>(),
    };
    species.forEach(sp => {
      sp.attributions?.forEach(attr => {
        const name = (attr.observerName || '').trim();
        if (!name) return; // Skip empty names
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

  // Deduplicate contributors across sources by normalized name
  const totalContributors = useMemo(() => {
    const uniqueNames = new Set<string>();
    [...contributorsBySource.eBird, ...contributorsBySource.iNaturalist, ...contributorsBySource.gbif]
      .forEach(c => uniqueNames.add(c.name.toLowerCase().trim()));
    return uniqueNames.size;
  }, [contributorsBySource]);

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

  // Filtered species
  const filteredSpecies = useMemo(() => {
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
      filtered = filtered.filter(s =>
        s.commonName.toLowerCase().includes(term) ||
        s.scientificName.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => b.observations - a.observations);
  }, [species, selectedCategory, selectedContributor, selectedSource, hasAudioFilter, searchTerm]);

  const gridCols = compact
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  const renderSpeciesGrid = (list: BiodiversitySpecies[]) => (
    <div className={`grid gap-3 ${gridCols}`}>
      {list.map((sp, i) => (
        <EnhancedSpeciesCard
          key={`${sp.id}-${i}`}
          species={sp}
          onSpeciesClick={setSelectedSpecies}
          translation={translationMap.get(sp.scientificName)}
        />
      ))}
      {list.length === 0 && (
        <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
          Aucune espèce ne correspond aux filtres sélectionnés
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
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

          {/* Filter dropdowns */}
          <div className={`grid gap-3 ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
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

            <Select value={selectedContributor} onValueChange={(v: any) => setSelectedContributor(v)}>
              <SelectTrigger>
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="truncate flex-1"><SelectValue placeholder="Contributeurs" /></div>
                  {totalContributors > 0 && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">{totalContributors}</Badge>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="all" className="font-medium">Tous ({totalContributors})</SelectItem>
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
            {mapContent}
          </TabsContent>
        )}

        <TabsContent value="all">{renderSpeciesGrid(filteredSpecies)}</TabsContent>
        <TabsContent value="faune">{renderSpeciesGrid(filteredSpecies.filter(s => s.kingdom === 'Animalia'))}</TabsContent>
        <TabsContent value="plants">{renderSpeciesGrid(filteredSpecies.filter(s => s.kingdom === 'Plantae'))}</TabsContent>
        <TabsContent value="fungi">{renderSpeciesGrid(filteredSpecies.filter(s => s.kingdom === 'Fungi'))}</TabsContent>
        <TabsContent value="others">{renderSpeciesGrid(filteredSpecies.filter(s => s.kingdom !== 'Plantae' && s.kingdom !== 'Fungi' && s.kingdom !== 'Animalia'))}</TabsContent>
      </Tabs>

      {explorationId ? (
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
          isOpen={!!selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
        />
      ) : (
        <SpeciesDetailModal
          species={selectedSpecies}
          isOpen={!!selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
        />
      )}
    </div>
  );
};

export default SpeciesExplorer;
