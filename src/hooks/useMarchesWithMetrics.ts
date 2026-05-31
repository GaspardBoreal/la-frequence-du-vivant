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
      const { data: marchesData, error } = await supabase
        .from('marches')
        .select('id, ville, nom_marche, region');
      if (error) throw error;

      const marcheIds = (marchesData || []).map((m) => m.id);
      let speciesCountByMarche: Record<string, number> = {};

      if (marcheIds.length > 0) {
        // ✅ Canonical per-marche count via batch RPC (respects each marche's radius)
        const { data: counts } = await supabase.rpc('get_marches_species_counts', {
          p_marche_ids: marcheIds,
        });
        speciesCountByMarche = ((counts as any[]) || []).reduce((acc, row) => {
          acc[row.marche_id] = row.species_count || 0;
          return acc;
        }, {} as Record<string, number>);
      }

      return (marchesData || [])
        .map((marche) => {
          const total = speciesCountByMarche[marche.id] || 0;
          return {
            id: marche.id,
            ville: marche.ville || 'Non défini',
            nom_marche: marche.nom_marche,
            region: marche.region || 'Non défini',
            total_species: total,
            display_name: `${marche.ville || 'Non défini'}${marche.nom_marche ? ` - ${marche.nom_marche}` : ''} (${total} espèces)`,
          };
        })
        .sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
};
