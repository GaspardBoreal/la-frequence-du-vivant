import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useMarcheTextes } from '@/hooks/useMarcheTextes';
import { useTextNavigation } from '@/hooks/useTextNavigation';
import TextTypeNavigator from './TextTypeNavigator';
import AdaptiveTextRenderer from './AdaptiveTextRenderer';
import TextNavigationControls from './TextNavigationControls';
import type { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import type { RegionalTheme } from '@/utils/regionalThemes';

interface TextualExplorationSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

export default function TextualExplorationSection({ marche, theme }: TextualExplorationSectionProps) {
  const { data: texts = [], isLoading } = useMarcheTextes(marche.id);
  
  // DEBUG LOGS
  console.log('🔍 TextualExplorationSection DEBUG:', {
    marcheId: marche.id,
    marcheName: marche.ville,
    isLoading,
    textsCount: texts.length,
    texts: texts.map(t => ({ id: t.id, titre: t.titre, type: t.type_texte })),
    fallbackContent: {
      poeme: !!marche.poeme,
      descriptifLong: !!marche.descriptifLong,
      descriptifCourt: !!marche.descriptifCourt
    }
  });
  
  const {
    currentIndex,
    currentText,
    selectedFamily,
    filteredTexts,
    navigateToIndex,
    handleFamilyChange,
    stats
  } = useTextNavigation(texts);

  // Fallback to legacy content if no texts
  const hasTexts = texts.length > 0;
  const fallbackContent = marche.poeme || marche.descriptifLong || marche.descriptifCourt;
  
  console.log('🎯 Rendering decision:', { hasTexts, hasFallback: !!fallbackContent });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement des textes...</p>
        </div>
      </div>
    );
  }

  if (!hasTexts && !fallbackContent) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl h-full flex flex-col justify-center">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-gray-600 mb-2">
          Textes en préparation
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Les textes littéraires pour {marche.ville} seront bientôt disponibles. 
          Revenez explorer cette dimension prochainement.
        </p>
      </div>
    );
  }

  // Fallback to legacy content
  if (!hasTexts && fallbackContent) {
    return (
      <div className="space-y-4 h-full">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-crimson font-bold flex items-center justify-center gap-3">
            <BookOpen className="h-6 w-6 text-purple-600" />
            Univers Poétique
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="bg-background p-6 rounded-lg border shadow-sm"
        >
          <div className="prose prose-sm max-w-none">
            {fallbackContent.split('\n').map((line, index) => (
              <p key={index} className={line.trim() ? 'mb-3' : 'mb-1'}>
                {line}
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Rich textual interface
  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-crimson font-bold flex items-center justify-center gap-3">
          <BookOpen className="h-6 w-6 text-purple-600" />
          Exploration Textuelle
        </h2>
      </motion.div>

      {/* Type Navigator - 30px */}
      <TextTypeNavigator
        texts={texts}
        selectedFamily={selectedFamily}
        onFamilyChange={handleFamilyChange}
      />

      {/* Text Display - flexible height */}
      <div className="flex-1 min-h-0">
        {filteredTexts.length > 0 && currentText ? (
          <AdaptiveTextRenderer
            text={currentText}
            isActive={true}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucun texte dans cette catégorie</p>
          </div>
        )}
      </div>

      {/* Navigation Controls - 46px */}
      {filteredTexts.length > 0 && (
        <TextNavigationControls
          texts={filteredTexts}
          currentIndex={currentIndex}
          onNavigate={navigateToIndex}
          selectedFamily={selectedFamily}
        />
      )}
    </div>
  );
}