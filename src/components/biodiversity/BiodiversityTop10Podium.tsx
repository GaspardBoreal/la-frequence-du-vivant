import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Medal, Play, Volume2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TopSpecies {
  name: string;
  scientificName: string;
  count: number;
  kingdom: string;
  photos?: string[];
}

interface BiodiversityTop10PodiumProps {
  species: TopSpecies[];
}

const BiodiversityTop10Podium: React.FC<BiodiversityTop10PodiumProps> = ({ species }) => {
  const [selectedSpecies, setSelectedSpecies] = useState<TopSpecies | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getKingdomColor = (kingdom: string) => {
    switch (kingdom) {
      case 'Animalia': return 'from-blue-500 to-cyan-500';
      case 'Plantae': return 'from-green-500 to-emerald-500';
      case 'Fungi': return 'from-purple-500 to-violet-500';
      default: return 'from-gray-500 to-slate-500';
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

  const getRankStyle = (index: number) => {
    if (index === 0) return { scale: 1.15, zIndex: 30 };
    if (index === 1) return { scale: 1.08, zIndex: 20 };
    if (index === 2) return { scale: 1.04, zIndex: 10 };
    return { scale: 1, zIndex: 0 };
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-amber-400" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-300" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold text-white/60">#{index + 1}</span>;
  };

  // Reorder for podium: 2nd, 1st, 3rd (then 4-10)
  const podiumOrder = species.length >= 3 
    ? [species[1], species[0], species[2], ...species.slice(3)]
    : species;

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Top 10 des espèces emblématiques
          </h2>
          <p className="text-lg text-gray-400">
            Les espèces les plus fréquemment observées le long du fleuve
          </p>
        </motion.div>

        {/* Podium - Top 3 */}
        <div className="flex justify-center items-end gap-4 mb-12">
          {podiumOrder.slice(0, 3).map((sp, displayIndex) => {
            const actualIndex = displayIndex === 1 ? 0 : displayIndex === 0 ? 1 : 2;
            const rankStyle = getRankStyle(actualIndex);
            const heightClass = actualIndex === 0 ? 'h-48' : actualIndex === 1 ? 'h-40' : 'h-36';
            
            return (
              <motion.div
                key={sp.name}
                className={`relative ${heightClass} w-40 md:w-48`}
                style={{ zIndex: rankStyle.zIndex }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: actualIndex * 0.2 }}
                onHoverStart={() => setHoveredIndex(actualIndex)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                <motion.div
                  className={`h-full bg-gradient-to-t ${getKingdomColor(sp.kingdom)} rounded-t-2xl cursor-pointer
                    flex flex-col items-center justify-end p-4 shadow-2xl`}
                  animate={{ 
                    scale: hoveredIndex === actualIndex ? rankStyle.scale * 1.05 : rankStyle.scale 
                  }}
                  onClick={() => setSelectedSpecies(sp)}
                >
                  {/* Rank icon */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 rounded-full p-2">
                    {getRankIcon(actualIndex)}
                  </div>
                  
                  {/* Species photo or emoji */}
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 overflow-hidden">
                    {sp.photos?.[0] ? (
                      <img 
                        src={sp.photos[0]} 
                        alt={sp.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">{getKingdomEmoji(sp.kingdom)}</span>
                    )}
                  </div>
                  
                  {/* Species name */}
                  <div className="text-center">
                    <div className="font-bold text-white text-sm md:text-base truncate max-w-full">
                      {sp.name}
                    </div>
                    <div className="text-white/70 text-xs italic truncate max-w-full">
                      {sp.scientificName}
                    </div>
                    <Badge className="mt-2 bg-white/20 text-white text-xs">
                      {sp.count} obs.
                    </Badge>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Remaining species (4-10) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {species.slice(3).map((sp, index) => (
            <motion.div
              key={sp.name}
              className={`bg-gradient-to-br ${getKingdomColor(sp.kingdom)} rounded-xl p-3 cursor-pointer
                hover:scale-105 transition-transform shadow-lg`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index + 3) * 0.05 }}
              onClick={() => setSelectedSpecies(sp)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/60 font-bold text-sm">#{index + 4}</span>
                <span className="text-lg">{getKingdomEmoji(sp.kingdom)}</span>
              </div>
              <div className="text-white font-medium text-sm truncate">{sp.name}</div>
              <div className="text-white/60 text-xs">{sp.count} obs.</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSpecies && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSpecies(null)}
          >
            <motion.div
              className={`bg-gradient-to-br ${getKingdomColor(selectedSpecies.kingdom)} rounded-2xl p-6 max-w-md w-full shadow-2xl`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Photo */}
              <div className="w-32 h-32 rounded-full bg-white/20 mx-auto mb-4 overflow-hidden flex items-center justify-center">
                {selectedSpecies.photos?.[0] ? (
                  <img 
                    src={selectedSpecies.photos[0]} 
                    alt={selectedSpecies.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">{getKingdomEmoji(selectedSpecies.kingdom)}</span>
                )}
              </div>

              <div className="text-center text-white">
                <h3 className="text-2xl font-bold mb-1">{selectedSpecies.name}</h3>
                <p className="text-white/70 italic mb-4">{selectedSpecies.scientificName}</p>
                
                <div className="flex justify-center gap-4 mb-6">
                  <Badge className="bg-white/20 text-white">
                    {selectedSpecies.count} observations
                  </Badge>
                  <Badge className="bg-white/20 text-white">
                    {selectedSpecies.kingdom === 'Animalia' ? 'Faune' : 
                     selectedSpecies.kingdom === 'Plantae' ? 'Flore' :
                     selectedSpecies.kingdom === 'Fungi' ? 'Champignon' : 'Autre'}
                  </Badge>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Play className="h-4 w-4" />
                    Écouter sur Xeno-Canto
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-white/60 hover:text-white"
                onClick={() => setSelectedSpecies(null)}
              >
                ✕
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default BiodiversityTop10Podium;
