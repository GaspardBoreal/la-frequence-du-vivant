import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarcheWithMetrics {
  id: string;
  ville: string;
  nom_marche: string | null;
  region: string;
  total_species: number;
  display_name: string;
}

export const useMarchesWithMetrics = () => {
  return useQuery({
    queryKey: ['marches-with-metrics'],
    queryFn: async (): Promise<MarcheWithMetrics[]> => {
      // Get marches and calculate species count
      const [marchesResult, biodiversityResult] = await Promise.all([
        supabase.from('marches').select('id, ville, nom_marche, region'),
        supabase.from('biodiversity_snapshots').select('marche_id, total_species')
      ]);

      if (marchesResult.error) throw marchesResult.error;
      if (biodiversityResult.error) throw biodiversityResult.error;

      const marchesData = marchesResult.data || [];
      const biodiversityData = biodiversityResult.data || [];

      // Calculate species count per marche
      const speciesCountByMarche = biodiversityData.reduce((acc, snapshot) => {
        if (!acc[snapshot.marche_id]) {
          acc[snapshot.marche_id] = 0;
        }
        acc[snapshot.marche_id] += snapshot.total_species || 0;
        return acc;
      }, {} as Record<string, number>);

      return marchesData.map(marche => ({
        id: marche.id,
        ville: marche.ville || 'Non défini',
        nom_marche: marche.nom_marche,
        region: marche.region || 'Non défini',
        total_species: speciesCountByMarche[marche.id] || 0,
        display_name: `${marche.ville || 'Non défini'}${marche.nom_marche ? ` - ${marche.nom_marche}` : ''} (${speciesCountByMarche[marche.id] || 0} espèces)`
      })).sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 2,
  });
};