import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Eye, Heart, Target, ArrowRight, X } from 'lucide-react';
import { GaspardBorealNarrative } from '../../types/biodiversityIntelligence';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'hopeful': return 'from-green-500 to-emerald-600';
      case 'concerning': return 'from-orange-500 to-red-500';
      case 'inspiring': return 'from-blue-500 to-purple-600';
      case 'urgent': return 'from-red-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'hopeful': return '🌱';
      case 'concerning': return '⚠️';
      case 'inspiring': return '✨';
      case 'urgent': return '🚨';
      default: return '📖';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'species_portrait': return <Eye className="h-4 w-4" />;
      case 'ecosystem_story': return <Target className="h-4 w-4" />;
      case 'future_chronicle': return <Clock className="h-4 w-4" />;
      case 'citizen_spotlight': return <Heart className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'species_portrait': return 'Portrait d\'Espèce';
      case 'ecosystem_story': return 'Histoire d\'Écosystème';
      case 'future_chronicle': return 'Chronique Future';
      case 'citizen_spotlight': return 'Focus Citoyen';
      default: return type;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'observe': return '👁️';
      case 'protect': return '🛡️';
      case 'advocate': return '📢';
      case 'adapt': return '🔄';
      case 'research': return '🔬';
      default: return '🎯';
    }
  };

  const handleCardClick = (narrative: GaspardBorealNarrative) => {
    setSelectedNarrative(narrative);
    onNarrativeSelect?.(narrative);
  };

  const handleToggleExpand = (narrativeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCard(expandedCard === narrativeId ? null : narrativeId);
  };

  if (!narratives || narratives.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          Aucun récit disponible
        </h3>
        <p className="text-gray-500">
          Les narratives de Gaspard Boréal sont en cours de génération...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text mb-2">
          📖 Les Récits de Gaspard Boréal
        </h2>
        <p className="text-slate-400 text-base md:text-lg">
          Explorations narratives de la biodiversité et du changement climatique
        </p>
      </div>

      {/* Narratives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {narratives.map((narrative, index) => (
          <motion.div
            key={narrative.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-slate-700 hover:border-purple-500/50 bg-slate-800/50"
              onClick={() => handleCardClick(narrative)}
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${getMoodColor(narrative.mood)} p-6 text-white rounded-t-lg`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(narrative.type)}
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {getTypeLabel(narrative.type)}
                      </Badge>
                      {narrative.futureYear && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {narrative.futureYear}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 leading-tight">
                      {getMoodEmoji(narrative.mood)} {narrative.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm opacity-80">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {narrative.readingTime} min
                      </span>
                      <span>{narrative.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 md:p-6 bg-slate-900/50">
                {/* Story Preview */}
                <div className="mb-4">
                  <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                    {expandedCard === narrative.id 
                      ? narrative.story
                      : narrative.story.length > 200 
                        ? `${narrative.story.substring(0, 200)}...`
                        : narrative.story
                    }
                  </p>
                  
                  {narrative.story.length > 200 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleToggleExpand(narrative.id, e)}
                      className="mt-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      {expandedCard === narrative.id ? 'Réduire' : 'Lire plus'}
                    </Button>
                  )}
                </div>

                {/* Species Badge */}
                {narrative.species && (
                  <div className="mb-4">
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/50 bg-emerald-500/10">
                      🦋 {narrative.species}
                    </Badge>
                  </div>
                )}

                {/* Call to Action */}
                {narrative.callToAction && (
                  <div className="bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-700">
                    <div className="flex items-start gap-3">
                      <div className="text-xl md:text-2xl">
                        {getActionIcon(narrative.callToAction.actionType)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white text-sm md:text-base mb-1">
                          Passez à l'action
                        </div>
                        <p className="text-xs md:text-sm text-slate-400 mb-3">
                          {narrative.callToAction.message}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-purple-400 border-purple-500/50 hover:bg-purple-500/10 text-xs md:text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (narrative.callToAction?.link) {
                              window.open(narrative.callToAction.link, '_blank');
                            }
                          }}
                        >
                          {narrative.callToAction.actionType === 'observe' && 'Observer'}
                          {narrative.callToAction.actionType === 'protect' && 'Protéger'}
                          {narrative.callToAction.actionType === 'advocate' && 'Sensibiliser'}
                          {narrative.callToAction.actionType === 'adapt' && 'S\'adapter'}
                          {narrative.callToAction.actionType === 'research' && 'Rechercher'}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Modal */}
      <AnimatePresence>
        {selectedNarrative && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedNarrative(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`bg-gradient-to-r ${getMoodColor(selectedNarrative.mood)} p-6 text-white`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-3">
                      {getTypeIcon(selectedNarrative.type)}
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {getTypeLabel(selectedNarrative.type)}
                      </Badge>
                      {selectedNarrative.futureYear && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {selectedNarrative.futureYear}
                        </Badge>
                      )}
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-3 leading-tight">
                      {getMoodEmoji(selectedNarrative.mood)} {selectedNarrative.title}
                    </h2>
                    
                    <div className="flex items-center gap-4 text-sm opacity-80">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {selectedNarrative.readingTime} min de lecture
                      </span>
                      <span>{selectedNarrative.location}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNarrative(null)}
                    className="text-white hover:bg-white/20 -mr-2 -mt-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Species Info */}
                {selectedNarrative.species && (
                  <div className="mb-6">
                    <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                      🦋 Espèce concernée: {selectedNarrative.species}
                    </Badge>
                  </div>
                )}

                {/* Story */}
                <div className="prose prose-lg max-w-none mb-6">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedNarrative.story}
                  </div>
                </div>

                {/* Call to Action */}
                {selectedNarrative.callToAction && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">
                        {getActionIcon(selectedNarrative.callToAction.actionType)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Rejoignez le mouvement
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {selectedNarrative.callToAction.message}
                        </p>
                        <Button 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          onClick={() => {
                            if (selectedNarrative.callToAction?.link) {
                              window.open(selectedNarrative.callToAction.link, '_blank');
                            }
                          }}
                        >
                          {selectedNarrative.callToAction.actionType === 'observe' && 'Commencer à observer'}
                          {selectedNarrative.callToAction.actionType === 'protect' && 'Participer à la protection'}
                          {selectedNarrative.callToAction.actionType === 'advocate' && 'Rejoindre la sensibilisation'}
                          {selectedNarrative.callToAction.actionType === 'adapt' && 'S\'adapter ensemble'}
                          {selectedNarrative.callToAction.actionType === 'research' && 'Contribuer à la recherche'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GaspardBorealNarratives;