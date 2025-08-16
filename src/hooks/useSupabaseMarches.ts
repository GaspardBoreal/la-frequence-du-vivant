
import { useQuery } from '@tanstack/react-query';
import { fetchMarchesFromSupabase, fetchMarcheById, searchMarchesByVille, MarcheComplete } from '../utils/supabaseApi';
import { transformSupabaseToLegacyFormat } from '../utils/supabaseDataTransformer';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { useMarketDataSync } from './useMarketDataSync';

// Hook pour récupérer toutes les marches avec tri par date décroissante
export const useSupabaseMarches = () => {
  return useQuery({
    queryKey: ['marches-supabase'],
    queryFn: async () => {
      console.log('🔄 Hook: Chargement des marches depuis Supabase...');
      const marchesSupabase = await fetchMarchesFromSupabase();
      
      // Transformer au format legacy pour compatibilité
      const marchesTransformed = marchesSupabase.map(transformSupabaseToLegacyFormat);
      
      // Trier par date décroissante (plus récentes en premier)
      const marchesSorted = marchesTransformed.sort((a, b) => {
        // Convertir les dates string en objets Date pour comparaison
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB.getTime() - dateA.getTime(); // Tri décroissant
      });
      
      console.log(`🎉 Hook: ${marchesSorted.length} marches transformées et triées par date décroissante`);
      return marchesSorted;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: 1000
  });
};

// Hook pour récupérer une marche spécifique
export const useSupabaseMarche = (id: string | undefined) => {
  return useQuery({
    queryKey: ['marche-supabase', id],
    queryFn: async () => {
      if (!id) {
        console.log('❌ Hook: Aucun ID fourni pour la marche');
        throw new Error('ID manquant');
      }
      
      console.log(`🔍 Hook: Chargement de la marche ${id}...`);
      const marcheSupabase = await fetchMarcheById(id);
      
      if (!marcheSupabase) {
        console.log(`❌ Hook: Marche ${id} non trouvée`);
        throw new Error('Marche non trouvée');
      }
      
      const marcheTransformed = transformSupabaseToLegacyFormat(marcheSupabase);
      
      console.log(`✅ Hook: Marche ${marcheTransformed.ville} chargée`);
      return marcheTransformed;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3
  });
};

// Hook pour rechercher des marches par ville
export const useSupabaseMarchesByVille = (ville: string | undefined) => {
  return useQuery({
    queryKey: ['marches-search-supabase', ville],
    queryFn: async () => {
      if (!ville) {
        console.log('❌ Hook: Aucune ville fournie pour la recherche');
        return [];
      }
      
      console.log(`🔍 Hook: Recherche des marches pour "${ville}"...`);
      const marchesSupabase = await searchMarchesByVille(ville);
      
      const marchesTransformed = marchesSupabase.map(transformSupabaseToLegacyFormat);
      
      console.log(`🎉 Hook: ${marchesTransformed.length} marches trouvées pour "${ville}"`);
      return marchesTransformed;
    },
    enabled: !!ville && ville.length > 2, // Au moins 3 caractères pour lancer la recherche
    staleTime: 3 * 60 * 1000, // 3 minutes pour les recherches
    gcTime: 5 * 60 * 1000
  });
};

// Hook pour vérifier la disponibilité de Supabase
export const useSupabaseStatus = () => {
  return useQuery({
    queryKey: ['supabase-status'],
    queryFn: async () => {
      try {
        console.log('🔍 Test de connexion Supabase...');
        const marches = await fetchMarchesFromSupabase();
        
        console.log('✅ Supabase connecté avec succès');
        return { connected: true, marchesCount: marches.length };
      } catch (error) {
        console.error('💥 Erreur lors du test Supabase:', error);
        return { connected: false, error: 'Erreur de connexion' };
      }
    },
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 60 * 1000, // 1 minute
    retry: 1
  });
};
