import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Leaf, Bird, TreeDeciduous, Microscope, Search, Sparkles, ExternalLink } from 'lucide-react';

interface PrincipalMarcheurObservationsViewerProps {
  marcheur: ExplorationMarcheur;
  explorationId: string;
}

type KingdomFilter = 'all' | 'Animalia' | 'Plantae' | 'Fungi' | 'other';

const kingdomConfig: Record<KingdomFilter, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: 'Toutes', icon: <Sparkles className="h-3.5 w-3.5" />, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  Animalia: { label: 'Faune', icon: <Bird className="h-3.5 w-3.5" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  Plantae: { label: 'Flore', icon: <TreeDeciduous className="h-3.5 w-3.5" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  Fungi: { label: 'Champignons', icon: <Microscope className="h-3.5 w-3.5" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  other: { label: 'Autres', icon: <Leaf className="h-3.5 w-3.5" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

export default function PrincipalMarcheurObservationsViewer({ 
  marcheur, 
  explorationId 
}: PrincipalMarcheurObservationsViewerProps) {
  const [search, setSearch] = useState('');
  const [kingdomFilter, setKingdomFilter] = useState<KingdomFilter>('all');
  const [displayLimit, setDisplayLimit] = useState(50);

  // Fetch species translations for the observed species
  const { data: speciesDetails, isLoading } = useQuery({
    queryKey: ['principal-species-details', marcheur.id, marcheur.speciesObserved.length],
    queryFn: async () => {
      if (!marcheur.speciesObserved || marcheur.speciesObserved.length === 0) {
        return [];
      }

      // Fetch translations in batches (Supabase has limits on IN clause)
      const batchSize = 500;
      const allDetails: Array<{
        scientific_name: string;
        common_name_fr: string | null;
      }> = [];

      for (let i = 0; i < marcheur.speciesObserved.length; i += batchSize) {
        const batch = marcheur.speciesObserved.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('species_translations')
          .select('scientific_name, common_name_fr')
          .in('scientific_name', batch);

        if (!error && data) {
          allDetails.push(...data);
        }
      }

      return allDetails;
    },
    enabled: marcheur.speciesObserved.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create a map for quick lookup
  const translationsMap = useMemo(() => {
    const map = new Map<string, string>();
    speciesDetails?.forEach(s => {
      if (s.common_name_fr) {
        map.set(s.scientific_name, s.common_name_fr);
      }
    });
    return map;
  }, [speciesDetails]);

  // Infer kingdom from scientific name patterns (heuristic)
  const inferKingdom = (scientificName: string): string => {
    const lower = scientificName.toLowerCase();
    // Common plant suffixes/patterns
    if (lower.includes('quercus') || lower.includes('acer') || lower.includes('pinus') || 
        lower.includes('rosa') || lower.includes('carex') || lower.includes('salix') ||
        lower.endsWith('aceae') || lower.includes('phyllum')) {
      return 'Plantae';
    }
    // Common fungi patterns
    if (lower.includes('boletus') || lower.includes('agaricus') || lower.includes('amanita') ||
        lower.includes('mycena') || lower.includes('cortinarius') || lower.includes('russula')) {
      return 'Fungi';
    }
    // Assume most others are animals (birds, insects, mammals)
    return 'Animalia';
  };

  // Build enriched species list
  const enrichedSpecies = useMemo(() => {
    return marcheur.speciesObserved.map(scientificName => ({
      scientificName,
      commonName: translationsMap.get(scientificName) || null,
      kingdom: inferKingdom(scientificName),
    }));
  }, [marcheur.speciesObserved, translationsMap]);

  // Calculate kingdom counts
  const kingdomCounts = useMemo(() => {
    const counts = { Animalia: 0, Plantae: 0, Fungi: 0, other: 0 };
    enrichedSpecies.forEach(s => {
      if (s.kingdom === 'Animalia') counts.Animalia++;
      else if (s.kingdom === 'Plantae') counts.Plantae++;
      else if (s.kingdom === 'Fungi') counts.Fungi++;
      else counts.other++;
    });
    return counts;
  }, [enrichedSpecies]);

  // Filter species
  const filteredSpecies = useMemo(() => {
    return enrichedSpecies.filter(s => {
      // Kingdom filter
      if (kingdomFilter !== 'all') {
        if (kingdomFilter === 'other') {
          if (['Animalia', 'Plantae', 'Fungi'].includes(s.kingdom)) return false;
        } else if (s.kingdom !== kingdomFilter) {
          return false;
        }
      }
      
      // Search filter
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchesScientific = s.scientificName.toLowerCase().includes(term);
        const matchesCommon = s.commonName?.toLowerCase().includes(term);
        if (!matchesScientific && !matchesCommon) return false;
      }
      
      return true;
    });
  }, [enrichedSpecies, kingdomFilter, search]);

  const displayedSpecies = filteredSpecies.slice(0, displayLimit);
  const hasMore = filteredSpecies.length > displayLimit;

  return (
    <div className="space-y-6 py-4">
      {/* Header with stats */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 rounded-xl p-6 border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Observations héritées de l'exploration</h3>
            <p className="text-sm text-muted-foreground">
              Espèces automatiquement agrégées depuis les relevés de biodiversité
            </p>
          </div>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {marcheur.observationsCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total espèces</div>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-amber-400">{kingdomCounts.Animalia.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Bird className="h-3 w-3" /> Faune
            </div>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-emerald-400">{kingdomCounts.Plantae.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <TreeDeciduous className="h-3 w-3" /> Flore
            </div>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-400">{kingdomCounts.Fungi.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Microscope className="h-3 w-3" /> Champignons
            </div>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-400">{kingdomCounts.other.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Leaf className="h-3 w-3" /> Autres
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom scientifique ou vernaculaire..."
            className="pl-10"
          />
        </div>
        
        {/* Kingdom filters */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(kingdomConfig) as KingdomFilter[]).map(key => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => setKingdomFilter(key)}
              className={`gap-1.5 ${kingdomFilter === key ? kingdomConfig[key].color : ''}`}
            >
              {kingdomConfig[key].icon}
              {kingdomConfig[key].label}
              {key !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  ({key === 'other' ? kingdomCounts.other : kingdomCounts[key as keyof typeof kingdomCounts]})
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredSpecies.length.toLocaleString()} espèce{filteredSpecies.length > 1 ? 's' : ''} trouvée{filteredSpecies.length > 1 ? 's' : ''}
        {search && ` pour "${search}"`}
      </div>

      {/* Species grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : displayedSpecies.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedSpecies.map((species, idx) => (
              <div
                key={species.scientificName + idx}
                className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    species.kingdom === 'Animalia' ? 'bg-amber-500/20 text-amber-400' :
                    species.kingdom === 'Plantae' ? 'bg-emerald-500/20 text-emerald-400' :
                    species.kingdom === 'Fungi' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {species.kingdom === 'Animalia' ? <Bird className="h-4 w-4" /> :
                     species.kingdom === 'Plantae' ? <TreeDeciduous className="h-4 w-4" /> :
                     species.kingdom === 'Fungi' ? <Microscope className="h-4 w-4" /> :
                     <Leaf className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate italic">
                      {species.scientificName}
                    </p>
                    {species.commonName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {species.commonName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setDisplayLimit(prev => prev + 50)}
              >
                Voir plus ({filteredSpecies.length - displayLimit} restantes)
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune espèce ne correspond à votre recherche</p>
        </div>
      )}

      {/* Footer link */}
      <div className="pt-4 border-t">
        <a 
          href={`/e/frequence-riviere-dordogne`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Voir la galerie publique de biodiversité
        </a>
      </div>
    </div>
  );
}
