import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { speciesKey, type SpeciesStatus } from '@/lib/chantierIcg';

const KEY = (id?: string | null) => ['propriete-chantier-species-phases', id];

/**
 * Le tri du cortège, persistant : un statut posé à la main par espèce et par
 * chantier. La clé est le nom scientifique normalisé — jamais l'identifiant
 * d'une observation, qui bougerait à chaque re-relevé.
 */
export function useChantierSpeciesPhases(chantierId?: string | null) {
  const qc = useQueryClient();

  const query = useQuery<Record<string, SpeciesStatus>>({
    queryKey: KEY(chantierId),
    enabled: !!chantierId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('propriete_chantier_species_phases')
        .select('scientific_name, statut')
        .eq('chantier_id', chantierId);
      if (error) throw error;
      const map: Record<string, SpeciesStatus> = {};
      ((data ?? []) as any[]).forEach((r) => {
        map[speciesKey(r.scientific_name)] = r.statut as SpeciesStatus;
      });
      return map;
    },
  });

  /** Enregistre un lot de statuts en une fois (validation du brouillon). */
  const commit = useCallback(
    async (changes: Record<string, SpeciesStatus | null>) => {
      if (!chantierId) return false;
      const rows = Object.entries(changes)
        .filter(([, v]) => v != null)
        .map(([name, statut]) => ({
          chantier_id: chantierId,
          scientific_name: name,
          statut,
        }));
      const cleared = Object.entries(changes)
        .filter(([, v]) => v == null)
        .map(([name]) => name);

      if (rows.length) {
        const { error } = await (supabase as any)
          .from('propriete_chantier_species_phases')
          .upsert(rows, { onConflict: 'chantier_id,scientific_name' });
        if (error) {
          toast.error('Tri non enregistré', { description: error.message });
          return false;
        }
      }
      if (cleared.length) {
        const { error } = await (supabase as any)
          .from('propriete_chantier_species_phases')
          .delete()
          .eq('chantier_id', chantierId)
          .in('scientific_name', cleared);
        if (error) {
          toast.error('Réinitialisation refusée', { description: error.message });
          return false;
        }
      }
      await qc.invalidateQueries({ queryKey: KEY(chantierId) });
      return true;
    },
    [chantierId, qc],
  );

  /** Efface tout le tri manuel : on revient à la lecture des dates. */
  const resetAll = useCallback(async () => {
    if (!chantierId) return;
    await (supabase as any)
      .from('propriete_chantier_species_phases')
      .delete()
      .eq('chantier_id', chantierId);
    await qc.invalidateQueries({ queryKey: KEY(chantierId) });
  }, [chantierId, qc]);

  return { statuses: query.data ?? {}, loading: query.isLoading, commit, resetAll };
}

export default useChantierSpeciesPhases;
