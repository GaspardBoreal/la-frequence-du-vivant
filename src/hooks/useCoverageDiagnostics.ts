import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CoverageDiagnostics {
  totalMarches: number;
  marchesCouvertes: number;
  marchesManquantes: Array<{
    id: string;
    nom_marche: string;
    ville: string;
    region: string;
  }>;
  orphanSnapshots: {
    biodiversity: number;
    weather: number;
    orphanIds: string[];
  };
}

export const useCoverageDiagnostics = () => {
  const queryClient = useQueryClient();

  const { data: diagnostics, isLoading, refetch } = useQuery({
    queryKey: ['coverage-diagnostics'],
    queryFn: async (): Promise<CoverageDiagnostics> => {
      // Get all marches
      const { data: marchesData } = await supabase
        .from('marches')
        .select('id, nom_marche, ville, region');

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
    mutationFn: async (marcheIds: string[]) => {
      const today = new Date().toISOString().split('T')[0];
      
      for (const marcheId of marcheIds) {
        // Get marche details for coordinates
        const { data: marche } = await supabase
          .from('marches')
          .select('latitude, longitude')
          .eq('id', marcheId)
          .single();

        if (marche?.latitude && marche?.longitude) {
          // Create minimal biodiversity snapshot
          await supabase
            .from('biodiversity_snapshots')
            .insert({
              marche_id: marcheId,
              latitude: marche.latitude,
              longitude: marche.longitude,
              snapshot_date: today,
              total_species: 0,
              birds_count: 0,
              plants_count: 0,
              fungi_count: 0,
              others_count: 0,
              recent_observations: 0,
              radius_meters: 500,
              species_data: [],
              sources_data: { source: 'coverage_fix', note: 'Snapshot créé pour corriger la couverture' }
            });
        }
      }
    },
    onSuccess: () => {
      toast.success('Couverture corrigée avec succès');
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
  };
};