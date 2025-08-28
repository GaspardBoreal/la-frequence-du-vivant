import { useState, useCallback, useMemo } from 'react';
import type { MarcheTexte } from '@/hooks/useMarcheTextes';
import { getTextTypeInfo, type TextTypeInfo } from '@/types/textTypes';

export function useTextNavigation(texts: MarcheTexte[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFamily, setSelectedFamily] = useState<TextTypeInfo['family'] | 'all'>('all');

  // Filter texts by selected family
  const filteredTexts = useMemo(() => {
    if (selectedFamily === 'all') return texts;
    
    const typesByFamily = {
      poetique: ['haiku', 'haibun', 'poeme', 'fragment'],
      narrative: ['texte-libre', 'fable', 'prose', 'correspondance', 'manifeste'],
      terrain: ['essai-bref', 'carnet', 'glossaire'],
      hybride: ['dialogue-polyphonique', 'carte-poetique', 'protocole', 'synthese', 'recit-donnees']
    };
    
    const familyTypes = typesByFamily[selectedFamily] || [];
    return texts.filter(text => familyTypes.includes(text.type_texte));
  }, [texts, selectedFamily]);

  // Reset index when family changes
  const handleFamilyChange = useCallback((family: TextTypeInfo['family'] | 'all') => {
    setSelectedFamily(family);
    setCurrentIndex(0);
  }, []);

  // Navigate to specific index
  const navigateToIndex = useCallback((index: number) => {
    if (index >= 0 && index < filteredTexts.length) {
      setCurrentIndex(index);
    }
  }, [filteredTexts.length]);

  // Navigation helpers
  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < filteredTexts.length - 1;
  
  const navigatePrev = useCallback(() => {
    if (canNavigatePrev) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [canNavigatePrev]);

  const navigateNext = useCallback(() => {
    if (canNavigateNext) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canNavigateNext]);

  // Current text
  const currentText = filteredTexts[currentIndex];

  // Text statistics
  const stats = useMemo(() => {
    const textsByFamily = texts.reduce((acc, text) => {
      const typesByFamily = {
        poetique: ['haiku', 'haibun', 'poeme', 'fragment'],
        narrative: ['texte-libre', 'fable', 'prose', 'correspondance', 'manifeste'],
        terrain: ['essai-bref', 'carnet', 'glossaire'],
        hybride: ['dialogue-polyphonique', 'carte-poetique', 'protocole', 'synthese', 'recit-donnees']
      };
      
      const family = Object.entries(typesByFamily).find(([_, types]) => 
        types.includes(text.type_texte)
      )?.[0] as TextTypeInfo['family'] || 'hybride';
      
      acc[family] = (acc[family] || 0) + 1;
      return acc;
    }, {} as Record<TextTypeInfo['family'], number>);

    return {
      total: texts.length,
      byFamily: textsByFamily,
      filtered: filteredTexts.length
    };
  }, [texts, filteredTexts]);

  return {
    // Current state
    currentIndex,
    currentText,
    selectedFamily,
    
    // Filtered data
    filteredTexts,
    
    // Navigation
    navigateToIndex,
    navigatePrev,
    navigateNext,
    canNavigatePrev,
    canNavigateNext,
    
    // Family filtering
    handleFamilyChange,
    
    // Statistics
    stats
  };
}