import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, Clock, MapPin, Sparkles, Heart, AlertTriangle, Eye } from 'lucide-react';
import { GaspardBorealNarrative } from '../../types/biodiversityIntelligence';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface GaspardBorealNarrativesProps {
  narratives: GaspardBorealNarrative[];
  onNarrativeSelect?: (narrative: GaspardBorealNarrative) => void;
}

const GaspardBorealNarratives: React.FC<GaspardBorealNarrativesProps> = ({
  narratives,
  onNarrativeSelect
}) => {
  const [selectedNarrative, setSelectedNarrative] = useState<GaspardBorealNarrative | null>(null);
  const [filter, setFilter] = useState<'all' | 'species_portrait' | 'future_chronicle' | 'ecosystem_story'>('all');

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'hopeful': return 'text-green-600 bg-green-50 border-green-200';
      case 'concerning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'inspiring': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'hopeful': return <Sparkles className="h-4 w-4" />;
      case 'concerning': return <AlertTriangle className="h-4 w-4" />;
      case 'inspiring': return <Heart className="h-4 w-4" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'species_portrait': return '🦋';
      case 'future_chronicle': return '🔮';
      case 'ecosystem_story': return '🌿';
      case 'citizen_spotlight': return '👥';
      default: return '📖';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'species_portrait': return 'Portrait d\'Espèce';
      case 'future_chronicle': return 'Chronique du Futur';
      case 'ecosystem_story': return 'Histoire d\'Écosystème';
      case 'citizen_spotlight': return 'Focus Citoyen';
      default: return type;
    }
  };

  const filteredNarratives = filter === 'all' 
    ? narratives 
    : narratives.filter(n => n.type === filter);

  const handleNarrativeClick = (narrative: GaspardBorealNarrative) => {
    setSelectedNarrative(narrative);
    onNarrativeSelect?.(narrative);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-8 border-2 border-amber-200/50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-amber-600" />
          <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text">
            Chroniques de Gaspard Boréal
          </h2>
        </div>
        <p className="text-amber-700 text-lg">
          Récits immersifs et prospectifs pour comprendre les transformations du vivant
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          Tous
        </Button>
        <Button
          variant={filter === 'species_portrait' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('species_portrait')}
          className={filter === 'species_portrait' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          🦋 Portraits
        </Button>
        <Button
          variant={filter === 'future_chronicle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('future_chronicle')}
          className={filter === 'future_chronicle' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          🔮 Futur
        </Button>
        <Button
          variant={filter === 'ecosystem_story' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('ecosystem_story')}
          className={filter === 'ecosystem_story' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          🌿 Écosystèmes
        </Button>
      </div>

      {/* Narratives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredNarratives.map((narrative, index) => (
          <motion.div
            key={narrative.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`p-6 h-full cursor-pointer transition-all hover:shadow-lg ${getMoodColor(narrative.mood)}`}
              onClick={() => handleNarrativeClick(narrative)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getTypeIcon(narrative.type)}</span>
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(narrative.type)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {getMoodIcon(narrative.mood)}
                  <div className="text-xs opacity-70">
                    {narrative.readingTime} min
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-3 line-clamp-2">
                {narrative.title}
              </h3>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mb-4 text-xs opacity-70">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {narrative.location}
                </div>
                {narrative.futureYear && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {narrative.futureYear}
                  </div>
                )}
                {narrative.species && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Espèce focale
                  </div>
                )}
              </div>

              {/* Story Preview */}
              <p className="text-sm opacity-80 line-clamp-3 mb-4">
                {narrative.story.slice(0, 150)}...
              </p>

              {/* Call to Action */}
              {narrative.callToAction && (
                <div className="border-t pt-3 mt-3">
                  <div className="text-xs font-medium mb-1">
                    Action suggérée:
                  </div>
                  <div className="text-xs opacity-70">
                    {narrative.callToAction.message}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredNarratives.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-amber-800 mb-2">
            Aucune chronique disponible
          </h3>
          <p className="text-amber-600">
            Les récits de Gaspard Boréal sont en cours de génération...
          </p>
        </div>
      )}

      {/* Detailed Narrative Modal */}
      <AnimatePresence>
        {selectedNarrative && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedNarrative(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`p-6 border-b ${getMoodColor(selectedNarrative.mood)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getTypeIcon(selectedNarrative.type)}</span>
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {getTypeLabel(selectedNarrative.type)}
                        </Badge>
                        <h2 className="text-2xl font-bold">
                          {selectedNarrative.title}
                        </h2>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm opacity-70">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedNarrative.location}
                      </div>
                      {selectedNarrative.futureYear && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Horizon {selectedNarrative.futureYear}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {selectedNarrative.readingTime} min de lecture
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getMoodIcon(selectedNarrative.mood)}
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <div className="prose prose-amber max-w-none">
                  {selectedNarrative.story.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Call to Action */}
                {selectedNarrative.callToAction && (
                  <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      🌱 Passez à l'action
                    </h4>
                    <p className="text-amber-700 mb-3">
                      {selectedNarrative.callToAction.message}
                    </p>
                    <Button 
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {selectedNarrative.callToAction.actionType === 'observe' && '👁️ Observer'}
                      {selectedNarrative.callToAction.actionType === 'protect' && '🛡️ Protéger'}
                      {selectedNarrative.callToAction.actionType === 'advocate' && '📢 Sensibiliser'}
                      {selectedNarrative.callToAction.actionType === 'adapt' && '🔄 S\'adapter'}
                      {selectedNarrative.callToAction.actionType === 'research' && '🔬 Rechercher'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Généré le {new Date(selectedNarrative.generatedAt).toLocaleDateString('fr-FR')}
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedNarrative(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GaspardBorealNarratives;