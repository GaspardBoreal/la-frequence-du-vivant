import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface SpeciesTranslation {
  scientificName: string;
  commonName: string;
  originalCommonName?: string;
  source: 'local' | 'api' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

export const useSpeciesTranslation = (scientificName: string, originalCommonName?: string) => {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['species-translation', scientificName, language],
    queryFn: async (): Promise<SpeciesTranslation> => {
      // For English, return original data
      if (language === 'en') {
        return {
          scientificName,
          commonName: originalCommonName || scientificName,
          originalCommonName,
          source: 'local',
          confidence: 'high'
        };
      }

      // Try to get French translation from local database first
      const { data: translation } = await supabase
        .from('species_translations')
        .select('common_name_fr, common_name_en, source, confidence_level')
        .eq('scientific_name', scientificName)
        .maybeSingle();

      if (translation?.common_name_fr) {
        return {
          scientificName,
          commonName: translation.common_name_fr,
          originalCommonName,
          source: 'local',
          confidence: translation.confidence_level as 'high' | 'medium' | 'low'
        };
      }

      // If no local translation, try to get one from edge function
      try {
        const { data, error } = await supabase.functions.invoke('translate-species', {
          body: { 
            scientificName, 
            originalCommonName,
            targetLanguage: 'fr'
          }
        });

        if (!error && data?.commonName) {
          return {
            scientificName,
            commonName: data.commonName,
            originalCommonName,
            source: data.source || 'api',
            confidence: data.confidence || 'medium'
          };
        }
      } catch (error) {
        console.log('Translation API unavailable, using fallback');
      }

      // Fallback: return original or scientific name
      return {
        scientificName,
        commonName: originalCommonName || scientificName,
        originalCommonName,
        source: 'fallback',
        confidence: 'low'
      };
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days
    enabled: !!scientificName,
    retry: 1,
  });
};

// Hook for batch translation of multiple species
export const useSpeciesTranslationBatch = (species: Array<{ scientificName: string; commonName?: string }>) => {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['species-translation-batch', species.map(s => s.scientificName).sort(), language],
    queryFn: async (): Promise<SpeciesTranslation[]> => {
      if (language === 'en') {
        return species.map(s => ({
          scientificName: s.scientificName,
          commonName: s.commonName || s.scientificName,
          originalCommonName: s.commonName,
          source: 'local' as const,
          confidence: 'high' as const
        }));
      }

      // Get all available French translations
      const scientificNames = species.map(s => s.scientificName);
      const { data: translations } = await supabase
        .from('species_translations')
        .select('scientific_name, common_name_fr, common_name_en, source, confidence_level')
        .in('scientific_name', scientificNames);

      const translationMap = new Map(
        translations?.map(t => [t.scientific_name, t]) || []
      );

      return species.map(s => {
        const translation = translationMap.get(s.scientificName);
        
        if (translation?.common_name_fr) {
          return {
            scientificName: s.scientificName,
            commonName: translation.common_name_fr,
            originalCommonName: s.commonName,
            source: 'local' as const,
            confidence: translation.confidence_level as 'high' | 'medium' | 'low'
          };
        }

        return {
          scientificName: s.scientificName,
          commonName: s.commonName || s.scientificName,
          originalCommonName: s.commonName,
          source: 'fallback' as const,
          confidence: 'low' as const
        };
      });
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    enabled: species.length > 0,
    retry: 1,
  });
};