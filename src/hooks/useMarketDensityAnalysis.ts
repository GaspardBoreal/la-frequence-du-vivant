import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketDensityData {
  lat: number;
  lng: number;
  region: string;
  marketCount: number;
  speciesRichness: number;
  proximityScore: number; // 0-100, proche des autres marchés
  isolationLevel: 'faible' | 'moyen' | 'fort';
  strategicValue: number; // 0-100
  expansionSuitability: number; // 0-100
}

export interface DensityHeatmapZone {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  intensity: number; // 0-1
  marketCount: number;
  avgBiodiversity: number;
  recommendedAction: 'maintenir' | 'développer' | 'optimiser';
}

export const useMarketDensityAnalysis = () => {
  return useQuery({
    queryKey: ['market-density-analysis'],
    queryFn: async (): Promise<{
      marketPoints: MarketDensityData[];
      heatmapZones: DensityHeatmapZone[];
      territorialGaps: Array<{
        region: string;
        gapType: 'géographique' | 'temporel' | 'qualitatif';
        priority: 'haute' | 'moyenne' | 'faible';
        description: string;
      }>;
    }> => {
      // Récupérer tous les marchés
      const { data: marketsData, error: marketsError } = await supabase
        .from('marches')
        .select('id, latitude, longitude, region')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (marketsError) throw marketsError;

      // Récupérer les snapshots de biodiversité séparément
      const { data: snapshotsData, error: snapshotsError } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, total_species, recent_observations, created_at');

      if (snapshotsError) throw snapshotsError;

      if (!marketsData || marketsData.length === 0) {
        return { marketPoints: [], heatmapZones: [], territorialGaps: [] };
      }

      // Créer un index des snapshots par marche_id
      const snapshotsByMarche: Record<string, any[]> = {};
      (snapshotsData || []).forEach(snapshot => {
        if (!snapshotsByMarche[snapshot.marche_id]) {
          snapshotsByMarche[snapshot.marche_id] = [];
        }
        snapshotsByMarche[snapshot.marche_id].push(snapshot);
      });

      // Calculer la distance entre deux points (formule de Haversine simplifiée)
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // Rayon de la Terre en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                 Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      // Analyser chaque marché
      const marketPoints: MarketDensityData[] = marketsData.map(market => {
        const snapshots = snapshotsByMarche[market.id] || [];
        const totalSpecies = snapshots.reduce((sum, s) => sum + (s.total_species || 0), 0);
        const avgSpecies = snapshots.length > 0 ? totalSpecies / snapshots.length : 0;

        // Calculer la proximité avec les autres marchés
        const nearbyMarkets = marketsData.filter(other => {
          if (other.id === market.id) return false;
          const distance = calculateDistance(
            Number(market.latitude), Number(market.longitude),
            Number(other.latitude), Number(other.longitude)
          );
          return distance < 50; // Dans un rayon de 50km
        });

        const proximityScore = Math.min(100, nearbyMarkets.length * 20);
        const isolationLevel: 'faible' | 'moyen' | 'fort' = 
          nearbyMarkets.length > 4 ? 'faible' : 
          nearbyMarkets.length > 2 ? 'moyen' : 'fort';

        // Valeur stratégique basée sur la biodiversité et la position
        const strategicValue = Math.min(100, 
          (avgSpecies / 100 * 40) + // 40% pour la biodiversité
          (proximityScore * 0.3) + // 30% pour la proximité
          (snapshots.length * 10) // 30% pour la maturité des données
        );

        // Potentiel d'expansion (inversement corrélé à la densité)
        const expansionSuitability = Math.max(0, 100 - proximityScore);

        return {
          lat: Number(market.latitude),
          lng: Number(market.longitude),
          region: market.region || 'Non défini',
          marketCount: 1,
          speciesRichness: Math.round(avgSpecies),
          proximityScore,
          isolationLevel,
          strategicValue: Math.round(strategicValue),
          expansionSuitability: Math.round(expansionSuitability)
        };
      });

      // Créer les zones de heatmap (grille 1° x 1°)
      const gridSize = 1; // 1 degré
      const gridMap: Record<string, {
        markets: MarketDensityData[];
        bounds: { north: number; south: number; east: number; west: number };
      }> = {};

      marketPoints.forEach(point => {
        const gridLat = Math.floor(point.lat / gridSize) * gridSize;
        const gridLng = Math.floor(point.lng / gridSize) * gridSize;
        const key = `${gridLat},${gridLng}`;

        if (!gridMap[key]) {
          gridMap[key] = {
            markets: [],
            bounds: {
              north: gridLat + gridSize,
              south: gridLat,
              east: gridLng + gridSize,
              west: gridLng
            }
          };
        }
        gridMap[key].markets.push(point);
      });

      const heatmapZones: DensityHeatmapZone[] = Object.values(gridMap).map(zone => {
        const marketCount = zone.markets.length;
        const avgBiodiversity = zone.markets.reduce((sum, m) => sum + m.speciesRichness, 0) / marketCount;
        const intensity = Math.min(1, marketCount / 10); // Normaliser sur 10 marchés max

        let recommendedAction: 'maintenir' | 'développer' | 'optimiser' = 'maintenir';
        if (marketCount < 2) {
          recommendedAction = 'développer';
        } else if (avgBiodiversity < 50) {
          recommendedAction = 'optimiser';
        }

        return {
          bounds: zone.bounds,
          intensity,
          marketCount,
          avgBiodiversity: Math.round(avgBiodiversity),
          recommendedAction
        };
      });

      // Identifier les lacunes territoriales
      const regionStats = marketPoints.reduce((acc, point) => {
        if (!acc[point.region]) {
          acc[point.region] = { count: 0, totalSpecies: 0, avgProximity: 0 };
        }
        acc[point.region].count += 1;
        acc[point.region].totalSpecies += point.speciesRichness;
        acc[point.region].avgProximity += point.proximityScore;
        return acc;
      }, {} as Record<string, { count: number; totalSpecies: number; avgProximity: number }>);

      const territorialGaps = Object.entries(regionStats)
        .map(([region, stats]) => {
          const gaps = [];
          
          if (stats.count < 3) {
            gaps.push({
              region,
              gapType: 'géographique' as const,
              priority: 'haute' as const,
              description: `Seulement ${stats.count} marché(s) - développer le réseau`
            });
          }
          
          if (stats.totalSpecies / stats.count < 30) {
            gaps.push({
              region,
              gapType: 'qualitatif' as const,
              priority: 'moyenne' as const,
              description: 'Biodiversité faible - améliorer les collectes'
            });
          }
          
          if (stats.avgProximity / stats.count < 30) {
            gaps.push({
              region,
              gapType: 'géographique' as const,
              priority: 'moyenne' as const,
              description: 'Marchés isolés - créer des corridors'
            });
          }
          
          return gaps;
        })
        .flat()
        .sort((a, b) => {
          const priorityOrder = { haute: 3, moyenne: 2, faible: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

      return {
        marketPoints,
        heatmapZones,
        territorialGaps
      };
    },
    staleTime: 1000 * 60 * 60, // 1 heure
    gcTime: 1000 * 60 * 60 * 6, // 6 heures
    retry: 2,
  });
};