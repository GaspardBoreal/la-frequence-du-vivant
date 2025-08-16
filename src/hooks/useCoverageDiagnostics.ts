import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { geocodeAddress } from '@/utils/geocoding';
import { useState } from 'react';

interface CoverageDiagnostics {
  totalMarches: number;
  marchesCouvertes: number;
  marchesManquantes: Array<{
    id: string;
    nom_marche: string;
    ville: string;
    region: string;
    latitude?: number;
    longitude?: number;
  }>;
  orphanSnapshots: {
    biodiversity: number;
    weather: number;
    orphanIds: string[];
  };
}

interface CorrectionResult {
  corrigees: number;
  geocodees: number;
  non_corrigees: Array<{
    id: string;
    nom_marche: string;
    ville: string;
    region: string;
    raison: string;
  }>;
}

const isValidCoords = (lat?: number | null, lng?: number | null): boolean => {
  if (lat == null || lng == null) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const useCoverageDiagnostics = () => {
  const queryClient = useQueryClient();
  const [lastCorrectionResult, setLastCorrectionResult] = useState<CorrectionResult | null>(null);

  const { data: diagnostics, isLoading, refetch } = useQuery({
    queryKey: ['coverage-diagnostics'],
    queryFn: async (): Promise<CoverageDiagnostics> => {
      // Get all marches
      const { data: marchesData } = await supabase
        .from('marches')
        .select('id, nom_marche, ville, region, latitude, longitude');

      // Get all snapshots
      const [biodiversityData, weatherData] = await Promise.all([
        supabase.from('biodiversity_snapshots').select('marche_id'),
        supabase.from('weather_snapshots').select('marche_id')
      ]);

      const validMarcheIds = new Set(marchesData?.map(m => m.id) || []);
      const coveredMarcheIds = new Set();
      
      // Track orphan snapshots
      const orphanIds: string[] = [];
      let orphanBiodiversity = 0;
      let orphanWeather = 0;

      // Process biodiversity snapshots
      biodiversityData.data?.forEach(item => {
        if (validMarcheIds.has(item.marche_id)) {
          coveredMarcheIds.add(item.marche_id);
        } else {
          orphanBiodiversity++;
          if (!orphanIds.includes(item.marche_id)) {
            orphanIds.push(item.marche_id);
          }
        }
      });

      // Process weather snapshots
      weatherData.data?.forEach(item => {
        if (validMarcheIds.has(item.marche_id)) {
          coveredMarcheIds.add(item.marche_id);
        } else {
          orphanWeather++;
          if (!orphanIds.includes(item.marche_id)) {
            orphanIds.push(item.marche_id);
          }
        }
      });

      // Find missing marches
      const marchesManquantes = marchesData?.filter(marche => 
        !coveredMarcheIds.has(marche.id)
      ) || [];

      return {
        totalMarches: marchesData?.length || 0,
        marchesCouvertes: coveredMarcheIds.size,
        marchesManquantes,
        orphanSnapshots: {
          biodiversity: orphanBiodiversity,
          weather: orphanWeather,
          orphanIds
        }
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const fixCoverageMutation = useMutation({
    mutationFn: async (marcheIds: string[]): Promise<CorrectionResult> => {
      const today = new Date().toISOString().split('T')[0];
      const result: CorrectionResult = {
        corrigees: 0,
        geocodees: 0,
        non_corrigees: []
      };
      
      for (const marcheId of marcheIds) {
        // Get marche details
        const { data: marche } = await supabase
          .from('marches')
          .select('id, nom_marche, ville, region, latitude, longitude')
          .eq('id', marcheId)
          .single();

        if (!marche) continue;

        let lat = marche.latitude;
        let lng = marche.longitude;

        // Check if coordinates are valid
        if (!isValidCoords(lat, lng)) {
          // Try geocoding
          try {
            const query = `${marche.ville}, ${marche.region}, France`;
            const geocodeResult = await geocodeAddress(query);
            
            lat = geocodeResult.coordinates[0];
            lng = geocodeResult.coordinates[1];

            // Update marche with new coordinates
            await supabase
              .from('marches')
              .update({ latitude: lat, longitude: lng })
              .eq('id', marcheId);

            result.geocodees++;
          } catch (geocodeError) {
            result.non_corrigees.push({
              id: marche.id,
              nom_marche: marche.nom_marche || 'Sans nom',
              ville: marche.ville || 'Ville inconnue',
              region: marche.region || 'Région inconnue',
              raison: 'Géocodage impossible'
            });
            continue;
          }
        }

        // Create minimal biodiversity snapshot
        if (isValidCoords(lat, lng)) {
          await supabase
            .from('biodiversity_snapshots')
            .insert({
              marche_id: marcheId,
              latitude: lat,
              longitude: lng,
              snapshot_date: today,
              total_species: 0,
              birds_count: 0,
              plants_count: 0,
              fungi_count: 0,
              others_count: 0,
              recent_observations: 0,
              radius_meters: 500,
              species_data: [],
              sources_data: { 
                source: 'coverage_fix', 
                note: 'Snapshot créé pour corriger la couverture',
                geocoded: result.geocodees > result.corrigees 
              }
            });

          if (result.geocodees === result.corrigees) {
            result.corrigees++;
          }
        }
      }

      return result;
    },
    onSuccess: (result: CorrectionResult) => {
      setLastCorrectionResult(result);
      
      const total = result.corrigees + result.geocodees;
      let message = '';
      
      if (total > 0) {
        message = `${total} marche(s) corrigée(s)`;
        if (result.geocodees > 0) {
          message += ` (${result.geocodees} géocodée(s))`;
        }
      }
      
      if (result.non_corrigees.length > 0) {
        message += `. ${result.non_corrigees.length} marche(s) nécessitent une correction manuelle.`;
      }
      
      if (total > 0) {
        toast.success(message);
      } else {
        toast.warning(message || 'Aucune correction nécessaire');
      }
      
      queryClient.invalidateQueries({ queryKey: ['coverage-diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['insights-metrics'] });
      refetch();
    },
    onError: (error) => {
      console.error('Erreur lors de la correction de couverture:', error);
      toast.error('Erreur lors de la correction de couverture');
    }
  });

  const cleanupOrphansMutation = useMutation({
    mutationFn: async () => {
      // Get valid marche IDs
      const { data: marchesData } = await supabase
        .from('marches')
        .select('id');
      
      const validIds = marchesData?.map(m => m.id) || [];
      
      // Delete orphan biodiversity snapshots
      await supabase
        .from('biodiversity_snapshots')
        .delete()
        .not('marche_id', 'in', `(${validIds.map(id => `'${id}'`).join(',')})`);
      
      // Delete orphan weather snapshots
      await supabase
        .from('weather_snapshots')
        .delete()
        .not('marche_id', 'in', `(${validIds.map(id => `'${id}'`).join(',')})`);
    },
    onSuccess: () => {
      toast.success('Données orphelines supprimées');
      queryClient.invalidateQueries({ queryKey: ['coverage-diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['insights-metrics'] });
      refetch();
    },
    onError: (error) => {
      console.error('Erreur lors du nettoyage:', error);
      toast.error('Erreur lors du nettoyage des données orphelines');
    }
  });

  return {
    diagnostics,
    isLoading,
    refetch,
    fixCoverage: fixCoverageMutation.mutate,
    isFixing: fixCoverageMutation.isPending,
    cleanupOrphans: cleanupOrphansMutation.mutate,
    isCleaning: cleanupOrphansMutation.isPending,
    lastCorrectionResult,
    clearLastCorrectionResult: () => setLastCorrectionResult(null),
  };
};