import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Poste de contrôle de la télémétrie : livraisons du webhook, vitalité des
 * capteurs et rafraîchissement en direct (Realtime) sans recharger la page.
 */

const db = supabase as any;

export interface TelemetryDelivery {
  id: string;
  fournisseur: string;
  delivery_id: string | null;
  event: string | null;
  serial_number: string | null;
  capteur_id: string | null;
  signature_valid: boolean | null;
  mesures_count: number | null;
  error: string | null;
  payload: any;
  created_at: string;
}

export interface TelemetryPing {
  capteur_id: string;
  mesure_at: string;
  source: string;
}

/** Tous les capteurs, toutes propriétés confondues (vue admin). */
export function useAllCapteurs() {
  return useQuery<any[]>({
    queryKey: ['iot-capteurs', 'all'],
    queryFn: async () => {
      const { data, error } = await db
        .from('iot_capteurs')
        .select('id, nom, serial_number, propriete_id, last_seen_at, actif, silence_alert_hours, type:iot_types_capteurs(modele, fournisseur:iot_fournisseurs(nom))')
        .order('nom');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Journal complet des livraisons (toutes sondes). */
export function useTelemetryDeliveries(limit = 60) {
  return useQuery<TelemetryDelivery[]>({
    queryKey: ['iot-deliveries', 'all', limit],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await db
        .from('iot_webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Réceptions des dernières `hours` heures, pour la frise de vitalité. */
export function useTelemetryPings(hours = 48, capteurIds?: string[]) {
  const ids = capteurIds ? [...capteurIds].sort() : null;
  return useQuery<TelemetryPing[]>({
    queryKey: ['iot-pings', hours, ids?.join(',') ?? 'all'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - hours * 3_600_000).toISOString();
      let q = db
        .from('iot_mesures')
        .select('capteur_id, mesure_at, source')
        .gte('mesure_at', since)
        .order('mesure_at', { ascending: false })
        .limit(4000);
      if (ids && ids.length) q = q.in('capteur_id', ids);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Abonnement temps réel : rafraîchit les listes dès qu'une mesure ou une
 * livraison arrive, et renvoie l'horodatage du dernier signal reçu en direct.
 */
export function useTelemetryLive(): { lastLiveAt: number | null; live: boolean } {
  const qc = useQueryClient();
  const [lastLiveAt, setLastLiveAt] = useState<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const bump = () => {
      setLastLiveAt(Date.now());
      qc.invalidateQueries({ queryKey: ['iot-deliveries'] });
      qc.invalidateQueries({ queryKey: ['iot-pings'] });
      qc.invalidateQueries({ queryKey: ['iot-mesures'] });
      qc.invalidateQueries({ queryKey: ['iot-capteurs'] });
    };
    const channel = supabase
      .channel('iot-telemetry-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iot_mesures' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'iot_webhook_deliveries' }, bump)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Le voyant « en direct » retombe tout seul au bout de 90 secondes.
  useEffect(() => {
    if (!lastLiveAt) return;
    const t = setTimeout(() => setTick((n) => n + 1), 90_000);
    return () => clearTimeout(t);
  }, [lastLiveAt]);

  return { lastLiveAt, live: !!lastLiveAt && Date.now() - lastLiveAt < 90_000 };
}

/** Envoi d'une livraison de test signée sur une sonde donnée. */
export function useTestDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (capteurId: string) => {
      const { data, error } = await supabase.functions.invoke('iot-test-delivery', {
        body: { capteur_id: capteurId },
      });
      if (error) throw error;
      if (data && (data as any).ok === false) throw new Error((data as any).error ?? 'Livraison refusée');
      return data as any;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['iot-deliveries'] });
      qc.invalidateQueries({ queryKey: ['iot-pings'] });
      qc.invalidateQueries({ queryKey: ['iot-capteurs'] });
      toast.success(`Livraison reçue par « ${d?.capteur ?? 'la sonde'} »`, {
        description: `${d?.result?.inserted ?? 0} mesures enregistrées · signature validée`,
      });
    },
    onError: (e: any) => toast.error(e?.message ?? 'La livraison de test a échoué'),
  });
}

/** Agrégats 24 h prêts à afficher. */
export function useTelemetryCounters(deliveries: TelemetryDelivery[], capteurs: any[]) {
  return useMemo(() => {
    const since = Date.now() - 86_400_000;
    const recent = deliveries.filter((d) => new Date(d.created_at).getTime() >= since);
    const silencieux = capteurs.filter((c) => {
      if (!c.actif) return false;
      if (!c.last_seen_at) return true;
      const h = (Date.now() - new Date(c.last_seen_at).getTime()) / 3_600_000;
      return h > (c.silence_alert_hours ?? 6);
    }).length;
    return {
      acceptees: recent.filter((d) => d.signature_valid && !d.error).length,
      refusees: recent.filter((d) => d.signature_valid === false).length,
      erreurs: recent.filter((d) => !!d.error && d.signature_valid !== false).length,
      silencieux,
    };
  }, [deliveries, capteurs]);
}
