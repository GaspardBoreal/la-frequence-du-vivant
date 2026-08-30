import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const db = supabase as any;

/** Raccordement d'une propriété au compte d'un fournisseur (clé API, parcelle). */
export interface IotIntegration {
  id: string;
  propriete_id: string;
  fournisseur_id: string;
  fournisseur_nom?: string | null;
  label: string | null;
  external_farm_id: string | null;
  external_plot_id: string | null;
  actif: boolean;
  /** La clé n'est jamais renvoyée en clair : on n'affiche que sa présence. */
  has_key?: boolean;
  last_pull_at: string | null;
  last_pull_status: string | null;
}

export interface WeenatCandidate {
  external_id: string;
  external_kind: 'device' | 'plot';
  nom?: string | null;
  serial_number?: string | null;
  model?: string | null;
  model_label?: string | null;
  metrics: string[];
  lat: number | null;
  lng: number | null;
  location_text?: string | null;
  last_seen_at?: string | null;
  meteo_vision?: boolean;
  organisation?: string | null;
}

/** Intégrations déclarées sur une propriété (lecture réservée aux administrateurs). */
export function useIotIntegrations(proprieteId?: string) {
  return useQuery<IotIntegration[]>({
    queryKey: ['iot-integrations', proprieteId ?? 'all'],
    queryFn: async () => {
      const { data, error } = await db.rpc('admin_list_iot_integrations', {
        p_propriete_id: proprieteId ?? null,
      });
      if (error) throw error;
      return (data ?? []) as IotIntegration[];
    },
  });
}

/** Création ou mise à jour d'une intégration ; la clé n'est envoyée que si elle change. */
export function useUpsertIotIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      id?: string | null;
      propriete_id: string;
      fournisseur_id: string;
      api_key?: string | null;
      label?: string | null;
      external_farm_id?: string | null;
      external_plot_id?: string | null;
      actif?: boolean;
    }) => {
      const { data, error } = await db.rpc('admin_upsert_iot_integration', {
        p_id: v.id ?? null,
        p_propriete_id: v.propriete_id,
        p_fournisseur_id: v.fournisseur_id,
        p_api_key: v.api_key ?? null,
        p_label: v.label ?? null,
        p_external_farm_id: v.external_farm_id ?? null,
        p_external_plot_id: v.external_plot_id ?? null,
        p_actif: v.actif ?? true,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['iot-integrations'] });
      toast.success('Raccordement fournisseur enregistré');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Raccordement impossible'),
  });
}

/** Interroge le compte Weenat pour lister les sondes et parcelles disponibles. */
export function useDiscoverWeenat() {
  return useMutation({
    mutationFn: async (v: { integration_id?: string; api_key?: string }) => {
      const { data, error } = await supabase.functions.invoke('iot-weenat-discover', { body: v });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const devices = ((data as any)?.devices ?? []) as WeenatCandidate[];
      const plots = ((data as any)?.plots ?? []) as WeenatCandidate[];
      return [...plots, ...devices];
    },
    onError: (e: any) => toast.error(e?.message ?? 'Découverte Weenat impossible'),
  });
}

/** Déclenche une collecte immédiate des mesures Weenat. */
export function usePullWeenat(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hours: number = 24) => {
      const { data, error } = await supabase.functions.invoke('iot-pull-weenat', {
        body: { propriete_id: proprieteId, hours },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { inserted: number; integrations: number };
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['iot-mesures'] });
      qc.invalidateQueries({ queryKey: ['iot-capteurs'] });
      qc.invalidateQueries({ queryKey: ['iot-integrations'] });
      toast.success(`${d?.inserted ?? 0} mesures relevées chez Weenat`);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Collecte Weenat impossible'),
  });
}
