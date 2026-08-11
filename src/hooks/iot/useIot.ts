import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ── Types ────────────────────────────────────────────────────────────── */

export interface IotFournisseur {
  id: string;
  nom: string;
  website: string | null;
  pays: string | null;
  logo_url: string | null;
  notes: string | null;
}

export interface IotTypeCapteur {
  id: string;
  fournisseur_id: string;
  modele: string;
  famille: string;
  description: string | null;
  profondeurs_m: number[];
  grandeurs: string[];
  fournisseur?: IotFournisseur | null;
}

export interface IotCapteur {
  id: string;
  propriete_id: string;
  type_id: string;
  serial_number: string;
  nom: string;
  emplacement: string | null;
  lat: number | null;
  lng: number | null;
  actif: boolean;
  open_data: boolean;
  battery_pct: number | null;
  rssi: number | null;
  snr: number | null;
  last_seen_at: string | null;
  silence_alert_hours: number;
  battery_alert_pct: number;
  notes: string | null;
  type?: IotTypeCapteur | null;
}

export interface IotMesure {
  id: string;
  capteur_id: string;
  grandeur: string;
  valeur: number;
  unite: string;
  profondeur_m: number | null;
  mesure_at: string;
  source: string;
}

const db = supabase as any;

/* ── Catalogue (admin) ────────────────────────────────────────────────── */

export function useIotFournisseurs() {
  return useQuery<IotFournisseur[]>({
    queryKey: ['iot-fournisseurs'],
    queryFn: async () => {
      const { data, error } = await db.from('iot_fournisseurs').select('*').order('nom');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useIotTypes() {
  return useQuery<IotTypeCapteur[]>({
    queryKey: ['iot-types'],
    queryFn: async () => {
      const { data, error } = await db
        .from('iot_types_capteurs')
        .select('*, fournisseur:iot_fournisseurs(*)')
        .order('modele');
      if (error) throw error;
      return (data ?? []).map((t: any) => ({
        ...t,
        profondeurs_m: (t.profondeurs_m ?? []).map(Number),
        grandeurs: t.grandeurs ?? [],
      }));
    },
  });
}

function crud<T extends { id?: string }>(table: string, keys: string[], label: string) {
  return () => {
    const qc = useQueryClient();
    const invalidate = () => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    return useMutation({
      mutationFn: async (input: { action: 'create' | 'update' | 'delete'; values?: any; id?: string }) => {
        if (input.action === 'delete') {
          const { error } = await db.from(table).delete().eq('id', input.id);
          if (error) throw error;
          return null;
        }
        if (input.action === 'update') {
          const { data, error } = await db.from(table).update(input.values).eq('id', input.id).select().single();
          if (error) throw error;
          return data;
        }
        const { data, error } = await db.from(table).insert(input.values).select().single();
        if (error) throw error;
        return data;
      },
      onSuccess: (_d, v) => {
        invalidate();
        toast.success(
          v.action === 'delete' ? `${label} supprimé` : v.action === 'update' ? `${label} mis à jour` : `${label} créé`,
        );
      },
      onError: (e: any) => toast.error(e?.message ?? 'Opération impossible'),
    });
  };
}

export const useFournisseurMutation = crud('iot_fournisseurs', ['iot-fournisseurs', 'iot-types'], 'Fournisseur');
export const useTypeMutation = crud('iot_types_capteurs', ['iot-types'], 'Type de capteur');

/* ── Capteurs d'une propriété ─────────────────────────────────────────── */

export function useIotCapteurs(proprieteId?: string) {
  return useQuery<IotCapteur[]>({
    queryKey: ['iot-capteurs', proprieteId],
    enabled: !!proprieteId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await db
        .from('iot_capteurs')
        .select('*, type:iot_types_capteurs(*, fournisseur:iot_fournisseurs(*))')
        .eq('propriete_id', proprieteId)
        .order('nom');
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        lat: c.lat == null ? null : Number(c.lat),
        lng: c.lng == null ? null : Number(c.lng),
        battery_pct: c.battery_pct == null ? null : Number(c.battery_pct),
        type: c.type
          ? { ...c.type, profondeurs_m: (c.type.profondeurs_m ?? []).map(Number), grandeurs: c.type.grandeurs ?? [] }
          : null,
      }));
    },
  });
}

export function useCapteurMutation(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { action: 'create' | 'update' | 'delete'; values?: any; id?: string }) => {
      if (input.action === 'delete') {
        const { error } = await db.from('iot_capteurs').delete().eq('id', input.id);
        if (error) throw error;
        return null;
      }
      if (input.action === 'update') {
        const { data, error } = await db.from('iot_capteurs').update(input.values).eq('id', input.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await db
        .from('iot_capteurs')
        .insert({ ...input.values, propriete_id: proprieteId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['iot-capteurs', proprieteId] });
      qc.invalidateQueries({ queryKey: ['iot-mesures'] });
      toast.success(v.action === 'delete' ? 'Capteur retiré' : v.action === 'update' ? 'Capteur mis à jour' : 'Capteur ajouté');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Opération impossible'),
  });
}

/** Déplacement GPS chirurgical : seules lat/lng sont réécrites. */
export function useMoveCapteur(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, lat, lng }: { id: string; lat: number; lng: number }) => {
      const { error } = await db.from('iot_capteurs').update({ lat, lng }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, lat, lng }) => {
      const key = ['iot-capteurs', proprieteId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<IotCapteur[]>(key);
      qc.setQueryData<IotCapteur[]>(key, (old) => (old ?? []).map((c) => (c.id === id ? { ...c, lat, lng } : c)));
      return { prev, key };
    },
    onError: (e: any, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
      toast.error(e?.message ?? 'Position non enregistrée');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iot-capteurs', proprieteId] }),
  });
}

/* ── Mesures ──────────────────────────────────────────────────────────── */

/** Dernière mesure par (grandeur, profondeur) pour chaque capteur de la propriété. */
export function useLatestMesures(capteurIds: string[]) {
  const ids = [...capteurIds].sort();
  return useQuery<Record<string, IotMesure[]>>({
    queryKey: ['iot-mesures', 'latest', ids.join(',')],
    enabled: ids.length > 0,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await db
        .from('iot_mesures')
        .select('*')
        .in('capteur_id', ids)
        .order('mesure_at', { ascending: false })
        .limit(1500);
      if (error) throw error;
      const out: Record<string, IotMesure[]> = {};
      const seen = new Set<string>();
      (data ?? []).forEach((m: any) => {
        const k = `${m.capteur_id}|${m.grandeur}|${m.profondeur_m ?? ''}`;
        if (seen.has(k)) return;
        seen.add(k);
        const row: IotMesure = {
          ...m,
          valeur: Number(m.valeur),
          profondeur_m: m.profondeur_m == null ? null : Number(m.profondeur_m),
        };
        (out[m.capteur_id] ??= []).push(row);
      });
      Object.values(out).forEach((rows) =>
        rows.sort((a, b) => (a.profondeur_m ?? -1) - (b.profondeur_m ?? -1) || a.grandeur.localeCompare(b.grandeur)),
      );
      return out;
    },
  });
}

/** Série temporelle d'un capteur (30 derniers jours par défaut). */
export function useMesureSeries(capteurId?: string, days = 30) {
  return useQuery<IotMesure[]>({
    queryKey: ['iot-mesures', 'series', capteurId, days],
    enabled: !!capteurId,
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const { data, error } = await db
        .from('iot_mesures')
        .select('*')
        .eq('capteur_id', capteurId)
        .gte('mesure_at', since)
        .order('mesure_at', { ascending: true })
        .limit(3000);
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        ...m,
        valeur: Number(m.valeur),
        profondeur_m: m.profondeur_m == null ? null : Number(m.profondeur_m),
      }));
    },
  });
}

/** Journal des livraisons du webhook (diagnostic). */
export function useWebhookDeliveries(capteurIds: string[]) {
  const ids = [...capteurIds].sort();
  return useQuery<any[]>({
    queryKey: ['iot-deliveries', ids.join(',')],
    enabled: ids.length > 0,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await db
        .from('iot_webhook_deliveries')
        .select('*')
        .in('capteur_id', ids)
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });
}
