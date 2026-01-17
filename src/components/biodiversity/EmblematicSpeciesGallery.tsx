import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, X, Bird, TreePine, Flower2, Bug, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

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
}

const EmblematicSpeciesGallery: React.FC<EmblematicSpeciesGalleryProps> = ({
  speciesByMarche,
  topSpecies,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKingdom, setSelectedKingdom] = useState<string | null>(null);
  const [selectedMarche, setSelectedMarche] = useState<string | null>(null);

  const kingdoms = [
    { key: 'Animalia', label: 'Faune', icon: Bird, color: 'bg-blue-500' },
    { key: 'Plantae', label: 'Flore', icon: TreePine, color: 'bg-green-500' },
    { key: 'Fungi', label: 'Champignons', icon: Flower2, color: 'bg-purple-500' },
    { key: 'Other', label: 'Autres', icon: Bug, color: 'bg-amber-500' },
  ];

  const filteredSpecies = useMemo(() => {
    return topSpecies.filter(sp => {
      const matchesSearch = searchQuery === '' || 
        sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sp.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesKingdom = selectedKingdom === null || sp.kingdom === selectedKingdom;
      
      return matchesSearch && matchesKingdom;
    });
  }, [topSpecies, searchQuery, selectedKingdom]);

  const getKingdomColor = (kingdom: string) => {
    switch (kingdom) {
      case 'Animalia': return 'from-blue-400 to-cyan-500';
      case 'Plantae': return 'from-green-400 to-emerald-500';
      case 'Fungi': return 'from-purple-400 to-violet-500';
      default: return 'from-amber-400 to-orange-500';
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
    setSelectedMarche(null);
  };

  const hasActiveFilters = searchQuery !== '' || selectedKingdom !== null || selectedMarche !== null;

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-amber-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            🦋 Galerie des espèces emblématiques
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explorez la richesse de la biodiversité le long de la Dordogne
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher une espèce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
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
                  className="gap-2"
                >
                  <k.icon className="h-4 w-4" />
                  {k.label}
                </Button>
              ))}
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Effacer
              </Button>
            )}
          </div>

          {/* Results count */}
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <Filter className="h-4 w-4" />
            <span>{filteredSpecies.length} espèces affichées</span>
          </div>
        </motion.div>

        {/* Species grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredSpecies.map((species, index) => (
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
                  rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300
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
                        <span className="text-6xl opacity-80">{getKingdomEmoji(species.kingdom)}</span>
                      </div>
                    )}
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h3 className="font-bold text-sm truncate">{species.name}</h3>
                      <p className="text-xs text-white/70 italic truncate">{species.scientificName}</p>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/20 backdrop-blur-sm text-white text-xs">
                        {species.count} obs.
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {filteredSpecies.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Aucune espèce trouvée</h3>
            <p className="text-slate-500">Essayez de modifier vos filtres de recherche</p>
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Réinitialiser les filtres
            </Button>
          </motion.div>
        )}

        {/* By marche stats */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Répartition par étape
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {speciesByMarche.slice(0, 12).map((marche, index) => (
              <motion.div
                key={marche.marcheId}
                className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-slate-100"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedMarche(marche.marcheId)}
              >
                <div className="text-2xl font-bold text-emerald-600">
                  {marche.speciesCount > 1000 ? `${(marche.speciesCount / 1000).toFixed(1)}k` : marche.speciesCount}
                </div>
                <div className="text-xs text-slate-600 truncate">{marche.marcheName.split(' - ')[0]}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EmblematicSpeciesGallery;
