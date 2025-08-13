import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TerritorialMetrics {
  region: string;
  department?: string;
  // Métriques de densité
  marketDensity: number; // marchés par 100km²
  speciesDensity: number; // espèces par marché
  observationDensity: number; // observations par km²
  
  // Indicateurs de performance territoriale
  biodiversityIndex: number; // 0-100
  dataMaturity: number; // 0-100 (qualité des données)
  territorialCoverage: number; // % territoire couvert
  
  // Potentiel et recommandations
  expansionPotential: 'faible' | 'moyen' | 'fort';
  missingDataAreas: string[];
  recommendedActions: string[];
  
  // Métriques temporelles
  dataFreshness: number; // jours depuis dernière collecte
  collectionTrend: 'croissant' | 'stable' | 'décroissant';
  
  // Données brutes pour calculs
  totalMarkets: number;
  totalSpecies: number;
  totalObservations: number;
  surfaceKm2?: number;
}

export const useTerritorialAnalysis = () => {
  return useQuery({
    queryKey: ['territorial-analysis'],
    queryFn: async (): Promise<TerritorialMetrics[]> => {
      // Récupérer d'abord les marchés
      const { data: marchesData, error: marchesError } = await supabase
        .from('marches')
        .select('id, region, departement, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (marchesError) throw marchesError;

      // Récupérer les snapshots de biodiversité séparément
      const { data: snapshotsData, error: snapshotsError } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, total_species, recent_observations, created_at');

      if (snapshotsError) throw snapshotsError;

      if (!marchesData || marchesData.length === 0) return [];

      // Créer un index des snapshots par marche_id
      const snapshotsByMarche: Record<string, any[]> = {};
      (snapshotsData || []).forEach(snapshot => {
        if (!snapshotsByMarche[snapshot.marche_id]) {
          snapshotsByMarche[snapshot.marche_id] = [];
        }
        snapshotsByMarche[snapshot.marche_id].push(snapshot);
      });

      // Grouper et calculer les métriques par région
      const territorialData: Record<string, TerritorialMetrics> = {};

      marchesData.forEach(marche => {
        const region = marche.region || 'Non défini';
        const snapshots = snapshotsByMarche[marche.id] || [];
        
        if (!territorialData[region]) {
          territorialData[region] = {
            region,
            marketDensity: 0,
            speciesDensity: 0,
            observationDensity: 0,
            biodiversityIndex: 0,
            dataMaturity: 0,
            territorialCoverage: 0,
            expansionPotential: 'moyen',
            missingDataAreas: [],
            recommendedActions: [],
            dataFreshness: 0,
            collectionTrend: 'stable',
            totalMarkets: 0,
            totalSpecies: 0,
            totalObservations: 0,
          };
        }

        const metrics = territorialData[region];
        metrics.totalMarkets += 1;

        // Calculer métriques par snapshot
        snapshots.forEach(snapshot => {
          metrics.totalSpecies += snapshot.total_species || 0;
          metrics.totalObservations += snapshot.recent_observations || 0;
          
          // Fraîcheur des données (jours depuis la collecte)
          const daysOld = Math.floor(
            (Date.now() - new Date(snapshot.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          metrics.dataFreshness = Math.max(metrics.dataFreshness, daysOld);
        });
      });

      // Calculer les métriques dérivées et recommandations
      return Object.values(territorialData).map(metrics => {
        // Densité d'espèces par marché
        metrics.speciesDensity = metrics.totalMarkets > 0 
          ? Math.round(metrics.totalSpecies / metrics.totalMarkets) 
          : 0;

        // Index de biodiversité (basé sur le nombre d'espèces et observations)
        const maxSpecies = Math.max(...Object.values(territorialData).map(m => m.totalSpecies));
        metrics.biodiversityIndex = maxSpecies > 0 
          ? Math.round((metrics.totalSpecies / maxSpecies) * 100) 
          : 0;

        // Maturité des données (basée sur fraîcheur et densité)
        metrics.dataMaturity = Math.max(0, 100 - metrics.dataFreshness * 2);
        if (metrics.totalMarkets < 3) metrics.dataMaturity -= 30;
        if (metrics.speciesDensity < 20) metrics.dataMaturity -= 20;

        // Potentiel d'expansion
        if (metrics.totalMarkets < 5 && metrics.biodiversityIndex > 60) {
          metrics.expansionPotential = 'fort';
        } else if (metrics.totalMarkets < 10 && metrics.biodiversityIndex > 40) {
          metrics.expansionPotential = 'moyen';
        } else {
          metrics.expansionPotential = 'faible';
        }

        // Recommandations automatiques
        metrics.recommendedActions = [];
        if (metrics.dataFreshness > 30) {
          metrics.recommendedActions.push('Actualiser les données de biodiversité');
        }
        if (metrics.totalMarkets < 5) {
          metrics.recommendedActions.push('Développer le réseau de marchés');
        }
        if (metrics.speciesDensity < 30) {
          metrics.recommendedActions.push('Améliorer la qualité des collectes');
        }
        if (metrics.biodiversityIndex < 40) {
          metrics.recommendedActions.push('Identifier des zones à potentiel');
        }

        // Zones manquantes (simplifié)
        metrics.missingDataAreas = [];
        if (metrics.totalMarkets < 3) {
          metrics.missingDataAreas.push('Zones rurales');
        }
        if (metrics.dataFreshness > 60) {
          metrics.missingDataAreas.push('Données récentes');
        }

        return metrics;
      }).sort((a, b) => b.biodiversityIndex - a.biodiversityIndex);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 4, // 4 heures
    retry: 2,
  });
};