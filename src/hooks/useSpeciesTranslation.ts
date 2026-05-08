import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFrenchSpeciesNamesAuto } from '@/hooks/useFrenchSpeciesNamesAuto';

export interface SpeciesTranslation {
  scientificName: string;
  commonName: string;
  originalCommonName?: string;
  source: 'local' | 'api' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * @deprecated Préférer `<SpeciesName />` ou `useFrenchSpeciesNamesAuto`.
 * Conservé pour la compat de quelques composants. Utilise désormais le
 * résolveur centralisé sous le capot (avec auto-fill via edge function).
 */
export const useSpeciesTranslation = (scientificName: string, originalCommonName?: string) => {
  return useQuery({
    queryKey: ['species-translation', scientificName],
    queryFn: async (): Promise<SpeciesTranslation> => {
      // Note: la langue UI ne pilote plus l'affichage des noms d'espèces.
      // On retourne toujours le meilleur nom FR connu.

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

/**
 * Batch translation hook — alias autour de `useFrenchSpeciesNamesAuto`.
 *
 * Garantit que toutes les espèces affichées dans l'app voient leur nom FR
 * auto-rempli en arrière-plan (edge function `translate-species`), même pour
 * les écrans qui n'ont pas encore migré vers `<SpeciesName />`.
 *
 * Signature publique inchangée : retourne un tableau `SpeciesTranslation[]`
 * dans le même ordre que l'entrée.
 */
export const useSpeciesTranslationBatch = (
  species: Array<{ scientificName: string; commonName?: string }>
) => {
  // NOTE: la langue UI ne pilote PLUS l'affichage des noms d'espèces.
  // Les écrans métier (Marches, Vivant, Synthèse, L'œil...) doivent
  // toujours afficher le meilleur nom FR disponible — sinon l'utilisateur
  // voit de l'anglais alors que la traduction existe en base.
  const auto = useFrenchSpeciesNamesAuto(species);

  const data = useMemo<SpeciesTranslation[] | undefined>(() => {
    if (!auto.data) return undefined;

    return species.map(s => {
      const resolved = auto.data!.get(s.scientificName);
      const fr = resolved?.commonNameFr;
      if (fr) {
        return {
          scientificName: s.scientificName,
          commonName: fr,
          originalCommonName: s.commonName,
          source: 'local' as const,
          confidence: 'high' as const,
        };
      }
      return {
        scientificName: s.scientificName,
        commonName: s.commonName || s.scientificName,
        originalCommonName: s.commonName,
        source: 'fallback' as const,
        confidence: 'low' as const,
      };
    });
  }, [species, auto.data]);

  return {
    data,
    isLoading: auto.isLoading,
    isError: auto.isError,
    error: auto.error,
    isFetching: auto.isFetching,
    refetch: auto.refetch,
  } as {
    data: SpeciesTranslation[] | undefined;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    isFetching: boolean;
    refetch: typeof auto.refetch;
  };
};
