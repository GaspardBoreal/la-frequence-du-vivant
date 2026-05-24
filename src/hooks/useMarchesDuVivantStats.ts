import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarchesDuVivantStats {
  marches: number;
  regions: number;
  departements: number;
  especes: number;
  marcheurs: number;
}

export const useMarchesDuVivantStats = () => {
  return useQuery({
    queryKey: ['mdv-public-stats'],
    queryFn: async (): Promise<MarchesDuVivantStats> => {
      const [marchesRes, marcheursRes, snapshotsRes] = await Promise.all([
        supabase.from('marches').select('id, region, departement'),
        supabase.from('community_profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('biodiversity_snapshots')
          .select('marche_id, snapshot_date, species_data')
          .order('snapshot_date', { ascending: false })
          .limit(10000),
      ]);

      const marches = marchesRes.data ?? [];
      const norm = (v: unknown) =>
        typeof v === 'string' ? v.trim() : '';
      const regions = new Set<string>();
      const departements = new Set<string>();
      marches.forEach((m: any) => {
        const r = norm(m.region);
        const d = norm(m.departement);
        if (r) regions.add(r.toLowerCase());
        if (d) departements.add(d.toLowerCase());
      });

      // Latest snapshot per marche → union of scientific names
      const latestByMarche = new Map<string, any>();
      (snapshotsRes.data ?? []).forEach((s: any) => {
        if (!s.marche_id) return;
        if (!latestByMarche.has(s.marche_id)) latestByMarche.set(s.marche_id, s);
      });

      const especesSet = new Set<string>();
      let especesFallback = 0;
      latestByMarche.forEach((snap) => {
        const arr = Array.isArray(snap.species_data) ? snap.species_data : [];
        if (arr.length > 0) {
          arr.forEach((sp: any) => {
            const sn = norm(sp?.scientificName ?? sp?.scientific_name);
            if (sn) especesSet.add(sn.toLowerCase());
          });
        } else if (typeof snap.total_species === 'number') {
          especesFallback += snap.total_species;
        }
      });

      return {
        marches: marches.length,
        regions: regions.size,
        departements: departements.size,
        especes: especesSet.size || especesFallback,
        marcheurs: marcheursRes.count ?? 0,
      };
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 1,
  });
};
