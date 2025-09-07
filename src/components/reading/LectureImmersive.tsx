// Phase 3.4: Immersive Reading Experience Controller
// Orchestrates the complete reading experience with all innovative features

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  BookOpen,
  Settings,
  Volume2,
  Moon,
  Sun,
  Type,
  Palette
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import { useExplorationTextStats } from '@/hooks/useMarcheTextes';
import { buildWelcomeComposition } from '@/utils/welcomeComposer';
import { TextType } from '@/types/textTypes';
import { ExplorationTextContent } from '@/types/exploration';

import ExperienceLivreWelcome from './ExperienceLivreWelcome';
import NavigationPoetique from './NavigationPoetique';
import LivingTextRenderer from './LivingTextRenderer';

type ExperienceState = 'welcome' | 'navigation' | 'reading';
type NavigationMode = 'constellation' | 'chemin-marches' | 'dialogue-interieur';
type EntryMode = 'chemin-marches' | 'archipel-themes' | 'laboratoire-formes';

interface ReadingPreferences {
  theme: 'auto' | 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  ambientSounds: boolean;
  autoScroll: boolean;
}

const LectureImmersive: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration, isLoading } = useExploration(slug || '');
  const { data: marches = [] } = useExplorationMarches(exploration?.id || '');
  
  const [experienceState, setExperienceState] = useState<ExperienceState>('welcome');
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('constellation');
  const [selectedTextId, setSelectedTextId] = useState<string | undefined>();
  const [preferences, setPreferences] = useState<ReadingPreferences>({
    theme: 'auto',
    fontSize: 'medium',
    ambientSounds: true,
    autoScroll: false,
  });
  const [readerNotes, setReaderNotes] = useState<Record<string, string[]>>({});
  const [textContent, setTextContent] = useState<ExplorationTextContent[]>([]);

  // Generate text content from exploration data
  useEffect(() => {
    if (!exploration) return;
    
    // Create sample text content - this would normally come from your database
    const sampleTexts: ExplorationTextContent[] = [
      {
        id: '1',
        title: 'Fragment d\'éveil',
        content: 'Dans la brume matinale, les marchés s\'éveillent comme des organismes vivants...',
        type: 'fragment' as TextType,
        tags: ['éveil', 'marché', 'matin'],
        order: 1
      },
      {
        id: '2', 
        title: 'Haiku du marché',
        content: 'Fruits colorés\nSur l\'étal du vendeur\nLa vie qui danse',
        type: 'haiku' as TextType,
        tags: ['haiku', 'fruits', 'couleurs'],
        order: 2
      }
    ];
    
    setTextContent(sampleTexts);
  }, [exploration]);

  // Handle entry mode selection from welcome screen
  const handleEntryMode = (mode: EntryMode) => {
    const navMode: NavigationMode = 
      mode === 'chemin-marches' ? 'chemin-marches' :
      mode === 'archipel-themes' ? 'constellation' :
      'dialogue-interieur';
    
    setNavigationMode(navMode);
    setExperienceState('navigation');
  };

  // Handle text selection from navigation
  const handleTextSelect = (textId: string) => {
    setSelectedTextId(textId);
    setExperienceState('reading');
  };

  // Get current text
  const currentText = selectedTextId 
    ? textContent.find(t => t.id === selectedTextId)
    : undefined;

  const textStats = useExplorationTextStats(exploration?.id || '');

  // Build welcome composition with accurate text count including literary texts
  const welcomeComposition = exploration && marches.length > 0 
    ? (() => {
        const composition = buildWelcomeComposition(exploration, marches, { marcheViewModel: 'elabore' });
        // Calculate actual text content from marches data including literary texts
        const legacyTextCount = marches.reduce((acc, marche) => {
          const etudes = marche.marche?.etudes?.length || 0;
          const documents = marche.marche?.documents?.length || 0;
          return acc + etudes + documents;
        }, 0);
        
        // Add literary texts count
        const literaryTextCount = textStats.data?.totalTexts || 0;
        
        // Total includes both legacy content and new literary texts
        composition.stats.texts = Math.max(legacyTextCount + literaryTextCount, textContent.length);
        return composition;
      })()
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Préparation de l'expérience littéraire...</p>
        </motion.div>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Exploration non trouvée</h2>
          <Link to="/galerie-fleuve">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la galerie
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      
      {/* Header with navigation */}
      <motion.div 
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {experienceState !== 'welcome' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (experienceState === 'reading') {
                      setExperienceState('navigation');
                    } else {
                      setExperienceState('welcome');
                    }
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {experienceState === 'reading' ? 'Navigation' : 'Accueil'}
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h1 className="font-semibold">Lecture Immersive</h1>
              </div>
            </div>

            {/* Reading preferences */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreferences(prev => ({ 
                  ...prev, 
                  theme: prev.theme === 'dark' ? 'light' : 'dark' 
                }))}
              >
                {preferences.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreferences(prev => ({ 
                  ...prev, 
                  ambientSounds: !prev.ambientSounds 
                }))}
              >
                <Volume2 className={`h-4 w-4 ${preferences.ambientSounds ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
              
              <Link to="/galerie-fleuve">
                <Button variant="outline" size="sm">
                  Quitter la lecture
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {experienceState === 'welcome' && welcomeComposition && (
          <ExperienceLivreWelcome
            exploration={exploration}
            marches={marches}
            composition={welcomeComposition}
            onEnterMode={handleEntryMode}
          />
        )}

        {experienceState === 'navigation' && (
          <NavigationPoetique
            exploration={exploration}
            marches={marches}
            textContent={textContent}
            currentMode={navigationMode}
            onModeChange={setNavigationMode}
            onTextSelect={handleTextSelect}
            selectedTextId={selectedTextId}
          />
        )}

        {experienceState === 'reading' && currentText && (
          <div className="max-w-4xl mx-auto">
            <LivingTextRenderer
              text={currentText}
              ambientSounds={preferences.ambientSounds}
              readerNotes={readerNotes[currentText.id] || []}
              onBookmark={() => {
                // TODO: Implement bookmark functionality
                console.log('Bookmark text:', currentText.id);
              }}
              onShare={() => {
                // TODO: Implement share functionality
                console.log('Share text:', currentText.id);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LectureImmersive;