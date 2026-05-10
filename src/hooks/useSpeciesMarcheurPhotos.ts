import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarcheurSpeciesPhoto {
  id: string;
  url: string;
  observerName: string;
  observationDate?: string;
  marcheId?: string;
  marcheName?: string;
  ville?: string;
  marcheurId: string;
}

/**
 * Récupère les photos prises par les marcheurs (table marcheur_observations)
 * pour une espèce donnée, restreint aux marches d'une exploration.
 */
export function useSpeciesMarcheurPhotos(
  scientificName: string | undefined,
  explorationId: string | undefined,
) {
  return useQuery({
    queryKey: ['species-marcheur-photos', scientificName, explorationId],
    queryFn: async (): Promise<MarcheurSpeciesPhoto[]> => {
      if (!scientificName || !explorationId) return [];

      // 1. marches de l'exploration (+ infos)
      const { data: em } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches (id, nom_marche, ville)')
        .eq('exploration_id', explorationId);
      const marcheIds = (em || []).map((x: any) => x.marche_id).filter(Boolean);
      if (marcheIds.length === 0) return [];

      const marcheInfo = new Map<string, { name: string; ville: string }>();
      (em || []).forEach((row: any) => {
        if (row.marches) {
          marcheInfo.set(row.marche_id, {
            name: row.marches.nom_marche || row.marches.ville || '',
            ville: row.marches.ville || '',
          });
        }
      });

      // 2. marcheurs éditoriaux de l'exploration (pour le nom)
      const { data: crew } = await supabase
        .from('exploration_marcheurs')
        .select('id, prenom, nom')
        .eq('exploration_id', explorationId);
      const nameByCrewId = new Map<string, string>();
      (crew || []).forEach((c: any) => {
        const full = `${c.prenom || ''} ${c.nom || ''}`.trim();
        nameByCrewId.set(c.id, full || 'Marcheur');
      });
      const crewIds = (crew || []).map((c: any) => c.id);
      if (crewIds.length === 0) return [];

      // 3. observations de l'espèce avec photo
      const { data: obs } = await supabase
        .from('marcheur_observations')
        .select('id, marcheur_id, marche_id, photo_url, observation_date')
        .in('marcheur_id', crewIds)
        .in('marche_id', marcheIds)
        .ilike('species_scientific_name', scientificName)
        .not('photo_url', 'is', null);

      const out: MarcheurSpeciesPhoto[] = [];
      (obs || []).forEach((o: any) => {
        if (!o.photo_url) return;
        const info = marcheInfo.get(o.marche_id);
        out.push({
          id: o.id,
          url: o.photo_url,
          observerName: nameByCrewId.get(o.marcheur_id) || 'Marcheur',
          observationDate: o.observation_date || undefined,
          marcheId: o.marche_id,
          marcheName: info?.name,
          ville: info?.ville,
          marcheurId: o.marcheur_id,
        });
      });

      // tri date desc
      out.sort((a, b) => {
        const da = a.observationDate ? new Date(a.observationDate).getTime() : 0;
        const db = b.observationDate ? new Date(b.observationDate).getTime() : 0;
        return db - da;
      });
      return out;
    },
    enabled: !!scientificName && !!explorationId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
}
