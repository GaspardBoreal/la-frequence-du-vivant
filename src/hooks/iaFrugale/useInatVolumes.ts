import { useQuery } from '@tanstack/react-query';
import { INAT_REPLI } from '@/content/iaFrugale/inaturalistReel';

export interface InatVolumes {
  observationsMonde: number;
  /** true = l'API n'a pas répondu, on affiche la valeur relevée à la main. */
  repli: boolean;
}

/**
 * Volumes réels d'iNaturalist, en direct.
 *
 * L'API ne renvoie aucune donnée d'énergie : on ne lui demande donc que ce
 * qu'elle sait faire, le nombre d'observations (`total_results`). Si elle ne
 * répond pas, on retombe sur la valeur relevée et datée.
 */
export function useInatVolumes() {
  return useQuery<InatVolumes>({
    queryKey: ['inat-volumes-monde'],
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      try {
        const res = await fetch('https://api.inaturalist.org/v1/observations?per_page=0');
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        const total = Number(json?.total_results);
        if (!Number.isFinite(total) || total <= 0) throw new Error('total absent');
        return { observationsMonde: total, repli: false };
      } catch {
        return { observationsMonde: INAT_REPLI.observationsMonde, repli: true };
      }
    },
  });
}
