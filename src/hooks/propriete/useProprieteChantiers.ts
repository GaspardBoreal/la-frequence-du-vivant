import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { MediaPhase } from '@/lib/chantierIcg';
import type { OuvrageScenario } from './useOuvrageScenarios';

export interface ProprieteChantier {
  id: string;
  propriete_id: string;
  nom: string;
  objet_ids: string[];
  date_travaux: string | null;
  statut: 'projet' | 'en_cours' | 'realise';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChantierMediaPhase {
  id: string;
  chantier_id: string;
  photo_id: string;
  phase: MediaPhase;
}

const KEY = (id?: string) => ['propriete-chantiers', id];
const PHASE_KEY = (id?: string | null) => ['propriete-chantier-phases', id];

/** Lots de chantier d'une propriété : création, édition, suppression. */
export function useProprieteChantiers(proprieteId?: string) {
  const qc = useQueryClient();

  const query = useQuery<ProprieteChantier[]>({
    queryKey: KEY(proprieteId),
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('propriete_chantiers')
        .select('*')
        .eq('propriete_id', proprieteId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        ...r,
        objet_ids: Array.isArray(r.objet_ids) ? r.objet_ids : [],
      })) as ProprieteChantier[];
    },
  });

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: KEY(proprieteId) }),
    [qc, proprieteId],
  );

  const create = useCallback(
    async (input: { nom: string; objet_ids: string[]; date_travaux?: string | null }) => {
      if (!proprieteId) return null;
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('propriete_chantiers')
        .insert({
          propriete_id: proprieteId,
          nom: input.nom,
          objet_ids: input.objet_ids,
          date_travaux: input.date_travaux ?? null,
          created_by: auth?.user?.id ?? null,
        })
        .select('*')
        .single();
      if (error) {
        toast.error('Chantier non créé', { description: error.message });
        return null;
      }
      await invalidate();
      return data as ProprieteChantier;
    },
    [proprieteId, invalidate],
  );

  const patch = useCallback(
    async (id: string, values: Partial<ProprieteChantier>) => {
      const { error } = await (supabase as any)
        .from('propriete_chantiers')
        .update(values)
        .eq('id', id);
      if (error) {
        toast.error('Modification refusée', { description: error.message });
        return;
      }
      await invalidate();
    },
    [invalidate],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from('propriete_chantiers').delete().eq('id', id);
      if (error) {
        toast.error('Suppression refusée', { description: error.message });
        return;
      }
      await invalidate();
    },
    [invalidate],
  );

  return { chantiers: query.data ?? [], loading: query.isLoading, create, patch, remove, refetch: query.refetch };
}

/** Surcharges manuelles de phase pour les médias d'un chantier. */
export function useChantierMediaPhases(chantierId?: string | null) {
  const qc = useQueryClient();

  const query = useQuery<Record<string, MediaPhase>>({
    queryKey: PHASE_KEY(chantierId),
    enabled: !!chantierId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('propriete_chantier_media_phases')
        .select('photo_id, phase')
        .eq('chantier_id', chantierId);
      if (error) throw error;
      const map: Record<string, MediaPhase> = {};
      ((data ?? []) as any[]).forEach((r) => {
        map[r.photo_id] = r.phase as MediaPhase;
      });
      return map;
    },
  });

  const setPhase = useCallback(
    async (photoId: string, phase: MediaPhase) => {
      if (!chantierId) return;
      const { error } = await (supabase as any)
        .from('propriete_chantier_media_phases')
        .upsert({ chantier_id: chantierId, photo_id: photoId, phase }, { onConflict: 'chantier_id,photo_id' });
      if (error) {
        toast.error('Étiquette non enregistrée', { description: error.message });
        return;
      }
      await qc.invalidateQueries({ queryKey: PHASE_KEY(chantierId) });
    },
    [chantierId, qc],
  );

  const clearPhase = useCallback(
    async (photoId: string) => {
      if (!chantierId) return;
      await (supabase as any)
        .from('propriete_chantier_media_phases')
        .delete()
        .eq('chantier_id', chantierId)
        .eq('photo_id', photoId);
      await qc.invalidateQueries({ queryKey: PHASE_KEY(chantierId) });
    },
    [chantierId, qc],
  );

  return { overrides: query.data ?? {}, setPhase, clearPhase };
}

/** Scénographies existantes sur les ouvrages du lot. */
export function useChantierScenarios(proprieteId?: string, objetIds: string[] = []) {
  return useQuery<OuvrageScenario[]>({
    queryKey: ['propriete-chantier-scenarios', proprieteId, [...objetIds].sort().join(',')],
    enabled: !!proprieteId && objetIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_ouvrage_scenarios')
        .select('*')
        .eq('propriete_id', proprieteId!)
        .in('objet_id', objetIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        ...r,
        plantings: Array.isArray(r.plantings) ? r.plantings : [],
      })) as OuvrageScenario[];
    },
  });
}
