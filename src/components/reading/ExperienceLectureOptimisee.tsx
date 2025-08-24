import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Palette, 
  Bookmark, 
  Share2,
  Shuffle,
  Clock,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useExplorationTextsOptimized } from '@/hooks/useExplorationTextsOptimized';
import TexteRendererAdaptatif from './TexteRendererAdaptatif';
import NavigationLitteraire from './NavigationLitteraire';
import TextTypeSelector from './TextTypeSelector';
import { getTextTypeInfo, TextType } from '@/types/textTypes';
import { AppearanceMode, ReadingMode } from '@/types/readingTypes';

export default function ExperienceLectureOptimisee() {
  const { slug, textId } = useParams<{ slug: string; textId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Load exploration and texts
  const { data, isLoading, error } = useExplorationTextsOptimized(slug || '');
  const { exploration, texts } = data || { exploration: null, texts: [] };
  
  // States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>('system');
  const [readingMode, setReadingMode] = useState<ReadingMode>('rich');
  
  // Apply theme class to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      if (appearanceMode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', appearanceMode === 'dark');
      }
    };

    applyTheme();
    
    if (appearanceMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [appearanceMode]);
  
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
        const newMode: ReadingMode = readingMode === 'focus' ? 'rich' : 'focus';
        setReadingMode(newMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext, readingMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-2"
        >
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Chargement des textes...
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !exploration || texts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center space-y-4">
          <p className="text-slate-600 dark:text-slate-400">Aucun texte trouvé pour cette exploration</p>
          <Button asChild variant="outline">
            <Link to={`/galerie-fleuve/exploration/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'exploration
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isFocusMode = readingMode === 'focus';

  // Helper function to get button variant
  const getButtonVariant = (mode: ReadingMode): 'default' | 'ghost' => {
    return readingMode === mode ? 'default' : 'ghost';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      {!isFocusMode && (
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl"
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Back + Type Selector */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild className="text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                  <Link to={`/galerie-fleuve/exploration/${slug}`}>
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
                {/* Appearance Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-800 dark:text-slate-300">
                      <Palette className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-xs">Apparence</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60">
                    <DropdownMenuItem
                      onClick={() => setAppearanceMode('light')}
                      className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-300"
                    >
                      <Sun className="h-4 w-4" />
                      <span>Clair</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setAppearanceMode('system')}
                      className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-300"
                    >
                      <Monitor className="h-4 w-4" />
                      <span>Système</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setAppearanceMode('dark')}
                      className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-300"
                    >
                      <Moon className="h-4 w-4" />
                      <span>Sombre</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast({ title: "Marquer", description: "Prochainement disponible" })}
                  className="h-8 gap-1.5 text-slate-800 dark:text-slate-300"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 gap-1.5 text-slate-800 dark:text-slate-300"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.header>
      )}

      {/* Main Content */}
      <main className="relative">
        {currentText && (
          <TexteRendererAdaptatif 
            texte={currentText} 
            readingMode={readingMode}
          />
        )}
        
        {/* Focus mode toggle button */}
        {isFocusMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setReadingMode('rich')}
            className="fixed top-6 right-6 z-50 p-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Palette className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </motion.button>
        )}
      </main>

      {/* Bottom Navigation */}
      {!isFocusMode && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="flex gap-3 p-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-lg">
            {/* Reading Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <Button
                onClick={() => setReadingMode('standard')}
                variant={getButtonVariant('standard')}
                size="sm"
                className="rounded-lg px-3 py-2 text-xs font-medium h-auto text-slate-800 dark:text-slate-300"
              >
                Simple
              </Button>
              <Button
                onClick={() => setReadingMode('rich')}
                variant={getButtonVariant('rich')}
                size="sm"
                className="rounded-lg px-3 py-2 text-xs font-medium h-auto text-slate-800 dark:text-slate-300"
              >
                Enrichi
              </Button>
              <Button
                onClick={() => setReadingMode('focus')}
                variant={getButtonVariant('focus')}
                size="sm"
                className="rounded-lg px-3 py-2 text-xs font-medium h-auto text-slate-800 dark:text-slate-300"
              >
                Focus
              </Button>
            </div>
            
            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
            
            <Button
              onClick={handleChronologicalNext}
              variant="default"
              size="sm"
              className="rounded-xl px-4 py-2 text-xs font-medium h-auto bg-emerald-600 hover:bg-emerald-700"
            >
              <Clock className="h-3.5 w-3.5 mr-2" />
              Poursuivre
            </Button>
            
            <Button
              onClick={handleRandomText}
              variant="outline"
              size="sm"
              className="rounded-xl px-4 py-2 text-xs font-medium h-auto border-slate-200 dark:border-slate-700"
            >
              <Shuffle className="h-3.5 w-3.5 mr-2" />
              Hasard
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}