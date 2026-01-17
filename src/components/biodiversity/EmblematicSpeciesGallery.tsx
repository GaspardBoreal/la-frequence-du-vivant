import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, X, Bird, TreePine, Flower2, Bug, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { MarcheurFilterPills } from './MarcheurFilterPills';
import type { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';

interface SpeciesData {
  marcheId: string;
  marcheName: string;
  speciesCount: number;
}

interface TopSpecies {
  name: string;
  scientificName: string;
  count: number;
  kingdom: string;
  photos?: string[];
}

interface EmblematicSpeciesGalleryProps {
  speciesByMarche: SpeciesData[];
  topSpecies: TopSpecies[];
  marcheurs?: ExplorationMarcheur[];
  selectedMarcheurIds?: string[];
  onMarcheurSelectionChange?: (ids: string[]) => void;
}

const EmblematicSpeciesGallery: React.FC<EmblematicSpeciesGalleryProps> = ({
  speciesByMarche = [],
  topSpecies = [],
  marcheurs = [],
  selectedMarcheurIds = [],
  onMarcheurSelectionChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKingdom, setSelectedKingdom] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [localSelectedMarcheurs, setLocalSelectedMarcheurs] = useState<string[]>([]);

  // Use external state if provided, otherwise use local state
  const activeMarcheurIds = onMarcheurSelectionChange ? selectedMarcheurIds : localSelectedMarcheurs;
  const handleMarcheurChange = onMarcheurSelectionChange || setLocalSelectedMarcheurs;

  // Kingdom counts for filter buttons
  const kingdomCounts = useMemo(() => {
    return {
      Animalia: topSpecies.filter(s => s.kingdom === 'Animalia').length,
      Plantae: topSpecies.filter(s => s.kingdom === 'Plantae').length,
      Fungi: topSpecies.filter(s => s.kingdom === 'Fungi').length,
      Other: topSpecies.filter(s => !['Animalia', 'Plantae', 'Fungi'].includes(s.kingdom)).length,
    };
  }, [topSpecies]);

  const kingdoms = [
    { key: 'Animalia', label: 'Faune', icon: Bird, color: 'bg-sky-500', count: kingdomCounts.Animalia },
    { key: 'Plantae', label: 'Flore', icon: TreePine, color: 'bg-emerald-500', count: kingdomCounts.Plantae },
    { key: 'Fungi', label: 'Champignons', icon: Flower2, color: 'bg-violet-500', count: kingdomCounts.Fungi },
    { key: 'Other', label: 'Autres', icon: Bug, color: 'bg-amber-500', count: kingdomCounts.Other },
  ];

  // Build set of species observed by selected marcheurs
  const marcheurSpeciesSet = useMemo(() => {
    if (activeMarcheurIds.length === 0) return null; // null = no filter
    const speciesSet = new Set<string>();
    marcheurs
      .filter(m => activeMarcheurIds.includes(m.id))
      .forEach(m => m.speciesObserved.forEach(s => speciesSet.add(s.toLowerCase())));
    return speciesSet;
  }, [activeMarcheurIds, marcheurs]);

  const filteredSpecies = useMemo(() => {
    return topSpecies.filter(sp => {
      const matchesSearch = searchQuery === '' || 
        sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sp.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesKingdom = selectedKingdom === null || sp.kingdom === selectedKingdom;
      
      const matchesMarcheur = marcheurSpeciesSet === null || 
        marcheurSpeciesSet.has(sp.scientificName.toLowerCase());
      
      return matchesSearch && matchesKingdom && matchesMarcheur;
    });
  }, [topSpecies, searchQuery, selectedKingdom, marcheurSpeciesSet]);

  // Limit displayed species for performance
  const displayedSpecies = useMemo(() => {
    return filteredSpecies.slice(0, displayLimit);
  }, [filteredSpecies, displayLimit]);

  const hasMoreSpecies = filteredSpecies.length > displayLimit;

  const getKingdomColor = (kingdom: string) => {
    switch (kingdom) {
      case 'Animalia': return 'from-sky-500 to-cyan-600';
      case 'Plantae': return 'from-emerald-500 to-green-600';
      case 'Fungi': return 'from-violet-500 to-purple-600';
      default: return 'from-amber-500 to-orange-600';
    }
  };

  const getKingdomEmoji = (kingdom: string) => {
    switch (kingdom) {
      case 'Animalia': return '🐦';
      case 'Plantae': return '🌿';
      case 'Fungi': return '🍄';
      default: return '🔬';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedKingdom(null);
    setDisplayLimit(50);
    handleMarcheurChange([]);
  };

  const hasActiveFilters = searchQuery !== '' || selectedKingdom !== null || activeMarcheurIds.length > 0;

  const loadMore = () => {
    setDisplayLimit(prev => prev + 50);
  };

  return (
    <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-cyan-950 via-slate-900 to-slate-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            🦋 Galerie des espèces emblématiques
          </h2>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
            Explorez la richesse de la biodiversité le long de la Dordogne
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher une espèce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Kingdom filters */}
            <div className="flex flex-wrap gap-2">
              {kingdoms.map(k => (
                <Button
                  key={k.key}
                  variant={selectedKingdom === k.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedKingdom(selectedKingdom === k.key ? null : k.key)}
                  className={`gap-2 ${selectedKingdom === k.key 
                    ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500' 
                    : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <k.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{k.label}</span>
                  <span className="text-xs opacity-70">({k.count})</span>
                </Button>
              ))}
              
            {/* Clear filters */}
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters} 
                  className="gap-2 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Effacer</span>
                </Button>
              )}
            </div>

            {/* Marcheur filter pills */}
            {marcheurs.length > 0 && (
              <MarcheurFilterPills
                marcheurs={marcheurs}
                selectedMarcheurIds={activeMarcheurIds}
                onSelectionChange={handleMarcheurChange}
                totalSpeciesCount={topSpecies.length}
              />
            )}

            {/* Results count */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Filter className="h-4 w-4" />
              <span>{displayedSpecies.length} / {filteredSpecies.length} espèces affichées</span>
            </div>
          </div>
        </motion.div>

        {/* Species grid - Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          <AnimatePresence mode="popLayout">
            {displayedSpecies.map((species, index) => (
              <motion.div
                key={species.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.02 }}
                className="group"
              >
                <div className={`relative bg-gradient-to-br ${getKingdomColor(species.kingdom)} 
                  rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300
                  hover:scale-105 cursor-pointer`}
                >
                  {/* Photo or placeholder */}
                  <div className="aspect-square relative">
                    {species.photos?.[0] ? (
                      <img
                        src={species.photos[0]}
                        alt={species.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/20">
                        <span className="text-4xl md:text-6xl opacity-80">{getKingdomEmoji(species.kingdom)}</span>
                      </div>
                    )}
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 text-white">
                      <h3 className="font-bold text-xs md:text-sm truncate">{species.name}</h3>
                      <p className="text-[10px] md:text-xs text-white/70 italic truncate">{species.scientificName}</p>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/20 backdrop-blur-sm text-white text-[10px] md:text-xs">
                        {species.count} obs.
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Load more button */}
        {hasMoreSpecies && (
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              variant="outline"
              onClick={loadMore}
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
            >
              Voir plus ({filteredSpecies.length - displayLimit} restantes)
            </Button>
          </motion.div>
        )}

        {/* Empty state */}
        {filteredSpecies.length === 0 && (
          <motion.div
            className="text-center py-12 md:py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Search className="h-12 w-12 md:h-16 md:w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-slate-400 mb-2">Aucune espèce trouvée</h3>
            <p className="text-slate-500">Essayez de modifier vos filtres de recherche</p>
            <Button 
              variant="outline" 
              onClick={clearFilters} 
              className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Réinitialiser les filtres
            </Button>
          </motion.div>
        )}

        {/* By marche stats */}
        <motion.div
          className="mt-12 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-400" />
            Répartition par étape
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
            {speciesByMarche.slice(0, 12).map((marche, index) => (
              <motion.div
                key={marche.marcheId}
                className="bg-slate-800/50 rounded-xl p-3 md:p-4 border border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="text-xl md:text-2xl font-bold text-emerald-400">
                  {marche.speciesCount > 1000 ? `${(marche.speciesCount / 1000).toFixed(1)}k` : marche.speciesCount}
                </div>
                <div className="text-xs text-slate-400 truncate">{marche.marcheName.split(' - ')[0]}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EmblematicSpeciesGallery;
