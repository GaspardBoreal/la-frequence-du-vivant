import React, { useMemo, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import SEOHead from '@/components/SEOHead';
import Footer from '@/components/Footer';
import CarnetTerrainHero from '@/components/carnets/CarnetTerrainHero';
import CarnetTerrainFilters, { type Season, type SortMode } from '@/components/carnets/CarnetTerrainFilters';
import CarnetTerrainCard from '@/components/carnets/CarnetTerrainCard';
import { useFeaturedMarches } from '@/hooks/useFeaturedMarches';
import { getSeasonFromDate } from '@/components/carnets/carnetUtils';
import { Loader2 } from 'lucide-react';

const CarnetsDeTerrainGalerie: React.FC = () => {
  const { data: marches, isLoading } = useFeaturedMarches(999, true);

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season>('all');
  const [sortMode, setSortMode] = useState<SortMode>('richesse');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique regions
  const regions = useMemo(() => {
    if (!marches) return [];
    const unique = [...new Set(marches.map(m => m.region).filter(Boolean))] as string[];
    return unique.sort();
  }, [marches]);

  // Filter and sort
  const filteredMarches = useMemo(() => {
    if (!marches) return [];
    let result = [...marches];

    // Region filter
    if (selectedRegion) {
      result = result.filter(m => m.region === selectedRegion);
    }

    // Season filter
    if (selectedSeason !== 'all') {
      result = result.filter(m => getSeasonFromDate(m.date) === selectedSeason);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        (m.nom_marche || '').toLowerCase().includes(q) ||
        m.ville.toLowerCase().includes(q) ||
        (m.departement || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortMode === 'date') {
      result.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }
    // 'richesse' is default sort from hook (completeness_score)

    return result;
  }, [marches, selectedRegion, selectedSeason, sortMode, searchQuery]);

  // Totals
  const totalSpecies = useMemo(() => (marches || []).reduce((sum, m) => sum + m.total_species, 0), [marches]);
  const totalPhotos = useMemo(() => (marches || []).reduce((sum, m) => sum + m.photos_count, 0), [marches]);

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background">
        <SEOHead
          title="Carnets de Terrain — Les Marches du Vivant"
          description="Galerie des marches géopoétiques réalisées par les marcheurs du vivant. Photos, biodiversité, captations sonores : chaque carnet est une trace sensible du territoire."
        />

        <CarnetTerrainHero
          totalMarches={marches?.length || 0}
          totalSpecies={totalSpecies}
          totalPhotos={totalPhotos}
        />

        <CarnetTerrainFilters
          regions={regions}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
          sortMode={sortMode}
          onSortChange={setSortMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500/60" />
            </div>
          ) : filteredMarches.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg font-serif italic">
                Aucun carnet ne correspond à ces critères.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarches.map((marche, i) => (
                <CarnetTerrainCard key={marche.id} marche={marche} index={i} />
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default CarnetsDeTerrainGalerie;
