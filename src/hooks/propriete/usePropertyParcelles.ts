import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProprieteParcelle {
  id: string;
  parcel_id: string;
  commune_code: string | null;
  commune_nom: string | null;
  section: string | null;
  numero: string | null;
  prefix: string | null;
  contenance_m2: number | null;
  geometry: any | null;
  centroid_lat: number | null;
  centroid_lng: number | null;
  note: string | null;
  created_at: string;
}

export function useProprieteParcelles(proprieteId?: string) {
  return useQuery<ProprieteParcelle[]>({
    queryKey: ['propriete-parcelles', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_propriete_parcelles' as any, {
        _propriete_id: proprieteId!,
      });
      if (error) throw error;
      return (data as any) ?? [];
    },
    staleTime: 60_000,
  });
}

export function useCanCurateParcelles(proprieteId?: string) {
  return useQuery<boolean>({
    queryKey: ['can-curate-parcelles', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('can_curate_propriete_parcelles' as any, {
        _propriete_id: proprieteId!,
      });
      if (error) return false;
      return !!data;
    },
    staleTime: 5 * 60_000,
  });
}

export interface UpsertParcelleInput {
  parcelId: string;
  communeCode?: string | null;
  communeNom?: string | null;
  section?: string | null;
  numero?: string | null;
  prefix?: string | null;
  contenanceM2?: number | null;
  geometry?: any;
  centroidLat?: number | null;
  centroidLng?: number | null;
  note?: string | null;
}

export function useUpsertParcelle(proprieteId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertParcelleInput) => {
      if (!proprieteId) throw new Error('Missing propriete id');
      const { data, error } = await supabase.rpc('upsert_propriete_parcelle' as any, {
        _propriete_id: proprieteId,
        _parcel_id: input.parcelId,
        _commune_code: input.communeCode ?? null,
        _commune_nom: input.communeNom ?? null,
        _section: input.section ?? null,
        _numero: input.numero ?? null,
        _prefix: input.prefix ?? null,
        _contenance_m2: input.contenanceM2 ?? null,
        _geometry: input.geometry ?? null,
        _centroid_lat: input.centroidLat ?? null,
        _centroid_lng: input.centroidLng ?? null,
        _note: input.note ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propriete-parcelles', proprieteId] });
    },
    onError: (e: any) => {
      toast.error('Impossible d’enregistrer la parcelle', { description: e?.message });
    },
  });
}

export function useDeleteParcelle(proprieteId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_propriete_parcelle' as any, { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propriete-parcelles', proprieteId] });
    },
  });
}

export function useUpdateParcelleNote(proprieteId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { error } = await supabase.rpc('update_propriete_parcelle_note' as any, {
        _id: id,
        _note: note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propriete-parcelles', proprieteId] });
    },
  });
}

/** Centroid moyen des parcelles retenues (fallback null si aucune). */
export function centroidOfParcelles(parcelles: ProprieteParcelle[]): [number, number] | null {
  const pts = parcelles
    .map((p) => (p.centroid_lat != null && p.centroid_lng != null ? [p.centroid_lat, p.centroid_lng] as [number, number] : null))
    .filter(Boolean) as Array<[number, number]>;
  if (pts.length === 0) return null;
  const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [lat, lng];
}
