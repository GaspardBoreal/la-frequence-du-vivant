import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Eye, 
  Bookmark, 
  Share2,
  BookOpen,
  Shuffle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useExplorationTextsOptimized } from '@/hooks/useExplorationTextsOptimized';
import TexteRendererAdaptatif from './TexteRendererAdaptatif';
import NavigationLitteraire from './NavigationLitteraire';
import TextTypeSelector from './TextTypeSelector';
import { getTextTypeInfo, TextType } from '@/types/textTypes';

export default function ExperienceLectureOptimisee() {
  const { slug, textId } = useParams<{ slug: string; textId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Load exploration and texts
  const { data, isLoading, error } = useExplorationTextsOptimized(slug || '');
  const { exploration, texts } = data || { exploration: null, texts: [] };
  
  // States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  
  // Find current text index from URL parameter
  useEffect(() => {
    if (textId && texts.length > 0) {
      const index = texts.findIndex(t => t.id === textId);
      if (index >= 0) {
        setCurrentIndex(index);
      }
    }
  }, [textId, texts]);
  
  // Update URL when index changes
  useEffect(() => {
    if (texts.length > 0 && texts[currentIndex]) {
      const newTextId = texts[currentIndex].id;
      const basePath = `/explorations/${slug}/lire`;
      const newUrl = `${basePath}/${newTextId}`;
      
      if (window.location.pathname !== newUrl) {
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, [currentIndex, texts, slug]);

  // Get available text types
  const availableTypes = useMemo(() => {
    const types = new Set(texts.map(t => t.type_texte));
    return Array.from(types) as TextType[];
  }, [texts]);

  // Current text and navigation
  const currentText = texts[currentIndex];
  const currentType = currentText?.type_texte;

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < texts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, texts.length]);

  const handleTypeSelect = useCallback((type: TextType) => {
    const firstTextOfType = texts.findIndex(t => t.type_texte === type);
    if (firstTextOfType >= 0) {
      setCurrentIndex(firstTextOfType);
    }
  }, [texts]);

  const handleRandomText = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * texts.length);
    setCurrentIndex(randomIndex);
  }, [texts.length]);

  const handleChronologicalNext = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleShare = useCallback(() => {
    if (currentText) {
      const url = `${window.location.origin}/explorations/${slug}/lire/${currentText.id}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Lien copié",
        description: "Le lien vers ce texte a été copié dans le presse-papiers",
      });
    }
  }, [currentText, slug, toast]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'f' || e.key === 'F') {
        setFocusMode(!focusMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext, focusMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="animate-pulse text-muted-foreground">
            Préparation de la symphonie...
          </div>
          <div className="text-sm text-muted-foreground">
            Composition de l'univers littéraire
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !exploration || texts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Aucun texte trouvé pour cette exploration</p>
          <Button asChild variant="outline">
            <Link to={`/explorations/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'exploration
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back + Type Selector */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/explorations/${slug}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              {currentType && (
                <TextTypeSelector
                  currentType={currentType}
                  availableTypes={availableTypes}
                  onTypeSelect={handleTypeSelect}
                />
              )}
            </div>

            {/* Center: Navigation */}
            <NavigationLitteraire
              currentIndex={currentIndex}
              totalTexts={texts.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFocusMode(!focusMode)}
                className="h-8 gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Focus</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast({ title: "Marquer", description: "Prochainement disponible" })}
                className="h-8 gap-1.5"
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs sr-only">Marquer</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs sr-only">Partager</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative">
        {currentText && (
          <TexteRendererAdaptatif 
            texte={currentText} 
            focusMode={focusMode}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {!focusMode && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="flex gap-3 p-3 bg-background/90 backdrop-blur-md border border-border/50 rounded-full shadow-lg">
            <Button
              onClick={handleChronologicalNext}
              variant="default"
              size="sm"
              className="rounded-full px-4 py-2 text-xs font-medium"
            >
              <Clock className="h-3.5 w-3.5 mr-2" />
              Poursuivre la lecture
            </Button>
            
            <Button
              onClick={handleRandomText}
              variant="outline"
              size="sm"
              className="rounded-full px-4 py-2 text-xs font-medium"
            >
              <Shuffle className="h-3.5 w-3.5 mr-2" />
              Faire confiance au hasard
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}