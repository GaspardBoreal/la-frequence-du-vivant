// Phase 3.2: Adaptive Text Renderer with contextual styling
// Creates immersive reading experiences based on text type and content

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Volume2, 
  VolumeX, 
  BookmarkPlus, 
  Share2, 
  MapPin,
  Tag,
  Clock,
  User,
  Brain
} from 'lucide-react';
import { getTextTypeInfo } from '@/types/textTypes';
import type { ExplorationTextContent } from '@/types/exploration';

interface Props {
  text: ExplorationTextContent;
  onPlayAudio?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  isAudioPlaying?: boolean;
  ambientSounds?: boolean;
  readerNotes?: string[];
}

interface ReadingMetrics {
  estimatedReadTime: number;
  complexity: 'simple' | 'medium' | 'complex';
  emotionalTone: string[];
}

const LivingTextRenderer: React.FC<Props> = ({ 
  text, 
  onPlayAudio, 
  onBookmark, 
  onShare,
  isAudioPlaying,
  ambientSounds = false,
  readerNotes = []
}) => {
  const typeInfo = getTextTypeInfo(text.type);

  // Calculate reading metrics
  const metrics = useMemo((): ReadingMetrics => {
    const wordCount = text.content.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    // Simple complexity analysis
    const avgWordLength = text.content.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / wordCount;
    const complexity = avgWordLength > 6 ? 'complex' : avgWordLength > 4 ? 'medium' : 'simple';

    // Emotional tone detection (simplified)
    const emotionalWords = {
      'mélancolie': ['automne', 'crépuscule', 'nostalgie', 'silence', 'brume'],
      'joie': ['soleil', 'lumière', 'rire', 'danse', 'printemps'],
      'mystère': ['ombre', 'secret', 'énigme', 'murmure', 'profondeur'],
      'nature': ['arbre', 'rivière', 'oiseau', 'vent', 'terre'],
    };
    
    const emotionalTone = Object.keys(emotionalWords).filter(emotion =>
      emotionalWords[emotion].some(word => 
        text.content.toLowerCase().includes(word)
      )
    );

    return { estimatedReadTime, complexity, emotionalTone };
  }, [text.content]);

  // Adaptive styling based on text type
  const getAdaptiveStyles = () => {
    const baseStyles = "prose max-w-none";
    const typeStyles = typeInfo.adaptiveStyle;
    
    let additionalStyles = "";
    
    // Style variations based on content analysis
    if (metrics.complexity === 'complex') {
      additionalStyles += " leading-loose text-base";
    }
    
    if (typeInfo.family === 'poetique') {
      additionalStyles += " text-center";
    }
    
    if (text.type === 'correspondance') {
      additionalStyles += " border-l-4 border-primary/30 pl-6";
    }
    
    if (text.type === 'carnet') {
      additionalStyles += " bg-amber-50/30 dark:bg-amber-950/20 p-4 rounded border-dashed border-2";
    }

    return `${baseStyles} ${typeStyles.fontSize} ${typeStyles.lineHeight} ${additionalStyles}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          duration: typeInfo.family === 'poetique' ? 0.8 : 0.5,
          ease: "easeOut"
        }
      }}
      className="space-y-6"
    >
      {/* Enhanced Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <span className="text-3xl">{typeInfo.icon}</span>
                {text.title}
              </CardTitle>
              
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge variant="outline" className="flex items-center gap-1">
                  <span>{typeInfo.label}</span>
                </Badge>
                
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {metrics.estimatedReadTime} min
                </Badge>
                
                <Badge variant="secondary" className={
                  metrics.complexity === 'complex' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' :
                  metrics.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' :
                  'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                }>
                  <Brain className="h-3 w-3 mr-1" />
                  {metrics.complexity === 'complex' ? 'Complexe' : 
                   metrics.complexity === 'medium' ? 'Moyen' : 'Simple'}
                </Badge>

                {text.marcheName && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {text.marcheName}
                  </Badge>
                )}
              </div>

              {/* Emotional tone indicators */}
              {metrics.emotionalTone.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {metrics.emotionalTone.map(tone => (
                    <Badge key={tone} variant="secondary" className="text-xs capitalize">
                      {tone}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {onPlayAudio && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPlayAudio}
                  className="hover-scale"
                >
                  {isAudioPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              )}
              {onBookmark && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBookmark}
                  className="hover-scale"
                >
                  <BookmarkPlus className="h-4 w-4" />
                </Button>
              )}
              {onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShare}
                  className="hover-scale"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Adaptive Content Display */}
      <Card>
        <CardContent className="p-8">
          <motion.div
            className={getAdaptiveStyles()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* Special rendering for correspondance type */}
            {text.type === 'correspondance' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <User className="h-4 w-4" />
                  <span>Correspondance Laurent TRIPIED ↔ Gaspard Boréal</span>
                </div>
                <div className="whitespace-pre-line leading-relaxed font-serif">
                  {text.content}
                </div>
              </div>
            ) : text.type === 'haiku' ? (
              <div className="text-center">
                <div className="whitespace-pre-line leading-loose text-xl font-serif italic">
                  {text.content}
                </div>
              </div>
            ) : text.type === 'carnet' ? (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Carnet de Terrain — Observations
                </div>
                <div className="whitespace-pre-line leading-normal font-mono text-sm">
                  {text.content}
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-line leading-relaxed">
                {text.content}
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Tags and Metadata */}
      {text.tags.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {text.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs hover-scale cursor-pointer">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reader Notes Section */}
      {readerNotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BookmarkPlus className="h-4 w-4" />
                Vos notes de lecture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {readerNotes.map((note, index) => (
                  <div key={index} className="text-sm p-2 bg-background/50 rounded border-l-2 border-accent">
                    {note}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LivingTextRenderer;