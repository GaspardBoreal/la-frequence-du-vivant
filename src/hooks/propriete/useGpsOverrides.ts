import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type GpsOverrideStatus = 'repositioned' | 'excluded' | 'validated';
export type GpsOverrideKind = 'observation' | 'snapshot_attr';

export interface GpsOverride {
  id: string;
  target_kind: GpsOverrideKind;
  target_key: string;
  status: GpsOverrideStatus;
  lat: number | null;
  lon: number | null;
  original_lat: number | null;
  original_lon: number | null;
  reason: string | null;
  propriete_id: string | null;
  curated_by: string | null;
  created_at: string;
}

export const overrideKeyOf = (kind: GpsOverrideKind, key: string) => `${kind}:${key}`;

/**
 * Corrections GPS éditoriales (lecture publique).
 * Surcouche locale : la donnée iNaturalist d'origine n'est jamais modifiée
 * chez le fournisseur, seulement conservée dans `original_lat/lon`.
 */
export function useGpsOverrides() {
  const query = useQuery({
    queryKey: ['observation-gps-overrides'],
    staleTime: 60_000,
    queryFn: async (): Promise<GpsOverride[]> => {
      const { data, error } = await (supabase as any)
        .from('observation_gps_overrides')
        .select('*');
      if (error) throw error;
      return (data ?? []) as GpsOverride[];
    },
  });

  const map = useMemo(() => {
    const m = new Map<string, GpsOverride>();
    for (const o of query.data ?? []) m.set(overrideKeyOf(o.target_kind, o.target_key), o);
    return m;
  }, [query.data]);

  return { ...query, overrides: map };
}

export interface SetOverrideInput {
  kind: GpsOverrideKind;
  key: string;
  status: GpsOverrideStatus;
  lat?: number | null;
  lon?: number | null;
  originalLat?: number | null;
  originalLon?: number | null;
  reason?: string | null;
  proprieteId?: string | null;
}

export function useSetGpsOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetOverrideInput) => {
      const { error } = await (supabase as any).rpc('set_observation_gps_override', {
        _target_kind: input.kind,
        _target_key: input.key,
        _status: input.status,
        _lat: input.lat ?? null,
        _lon: input.lon ?? null,
        _original_lat: input.originalLat ?? null,
        _original_lon: input.originalLon ?? null,
        _reason: input.reason ?? null,
        _propriete_id: input.proprieteId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['observation-gps-overrides'] });
      qc.invalidateQueries({ queryKey: ['exploration-species-pool-rpc'] });
    },
    onError: (e: any) => {
      const msg = String(e?.message || e);
      if (msg.includes('FORBIDDEN')) toast.error('Droits de curation insuffisants');
      else if (msg.includes('INVALID_COORDS')) toast.error('Coordonnées invalides');
      else toast.error('Échec de l’enregistrement', { description: msg });
    },
  });
}

/**
 * Curation groupée : applique la même correction à N observations.
 * Boucle séquentielle sur la RPC existante (clés UUID marcheur ou URL iNaturalist),
 * un seul toast et une seule invalidation de cache en fin de lot.
 */
export function useSetGpsOverridesBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: SetOverrideInput[]) => {
      let ok = 0;
      const errors: string[] = [];
      for (const input of inputs) {
        const { error } = await (supabase as any).rpc('set_observation_gps_override', {
          _target_kind: input.kind,
          _target_key: input.key,
          _status: input.status,
          _lat: input.lat ?? null,
          _lon: input.lon ?? null,
          _original_lat: input.originalLat ?? null,
          _original_lon: input.originalLon ?? null,
          _reason: input.reason ?? null,
          _propriete_id: input.proprieteId ?? null,
        });
        if (error) errors.push(String(error.message || error));
        else ok++;
      }
      return { ok, errors };
    },
    onSuccess: ({ ok, errors }) => {
      qc.invalidateQueries({ queryKey: ['observation-gps-overrides'] });
      qc.invalidateQueries({ queryKey: ['exploration-species-pool-rpc'] });
      if (errors.length) {
        toast.warning(`${ok} corrigée(s), ${errors.length} en échec`, { description: errors[0] });
      } else {
        toast.success(`${ok} observation${ok > 1 ? 's' : ''} mise${ok > 1 ? 's' : ''} à jour`);
      }
    },
    onError: (e: any) => toast.error('Échec du lot', { description: String(e?.message || e) }),
  });
}

export function useClearGpsOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, key }: { kind: GpsOverrideKind; key: string }) => {
      const { error } = await (supabase as any).rpc('clear_observation_gps_override', {
        _target_kind: kind,
        _target_key: key,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['observation-gps-overrides'] });
      qc.invalidateQueries({ queryKey: ['exploration-species-pool-rpc'] });
      toast.success('Correction annulée');
    },
    onError: (e: any) => toast.error('Échec', { description: String(e?.message || e) }),
  });
}
