import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { filtrerMesuresLisibles } from '@/lib/iot/grandeurs';
import { capteurInScope, useIotConsole } from '@/components/iot/console/IotConsoleContext';
import {
  analyserAnomalies,
  type AnomalyReport,
  type LivraisonLite,
  type MesureLite,
} from '@/lib/iot/anomalies';
import { TEST_SERIALS } from '@/hooks/iot/useIotTelemetry';

const db = supabase as any;

const PAGE = 1000;
/** Plafond de lecture par sonde : au-delà, on garde le plus récent et on le dit. */
const MAX_ROWS_PER_SENSOR = 6000;
/** Période « Tout » : on borne l'analyse, sinon la lecture serait sans fin. */
const DEFAUT_JOURS = 30;

export interface AnomalyFilters {
  since: string | null;
  until: string | null;
  fournisseur: string;
  serial: string;
}

export interface AnomalyResult extends AnomalyReport {
  /** Vrai si au moins une sonde a atteint le plafond de lecture. */
  truncated: boolean;
  since: string;
  until: string;
}

/**
 * Analyse des « valeurs bizarres » sur la période du journal.
 *
 * Lecture seule : relevés paginés du plus récent au plus ancien (l'API plafonne
 * à 1 000 lignes) plus les livraisons de la même fenêtre, puis application des
 * détecteurs purs de `src/lib/iot/anomalies.ts`.
 */
export function useIotAnomalies(f: AnomalyFilters) {
  const { scope, scopeKey } = useIotConsole();

  return useQuery<AnomalyResult>({
    queryKey: ['iot-anomalies', f, scopeKey],
    staleTime: 120_000,
    refetchInterval: 300_000,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const since = f.since ?? new Date(Date.now() - DEFAUT_JOURS * 86_400_000).toISOString();
      const until = f.until ?? new Date().toISOString();

      /* Sondes du périmètre. */
      const { data: rawCapteurs, error: errC } = await db
        .from('iot_capteurs')
        .select('id, nom, serial_number, etat, propriete_id, type:iot_types_capteurs(fournisseur_id)')
        .order('nom');
      if (errC) throw errC;

      let capteurs = (rawCapteurs ?? []).filter((c: any) => capteurInScope(c, scope));
      if (f.serial) capteurs = capteurs.filter((c: any) => c.serial_number === f.serial);

      /* Relevés, sonde par sonde, du plus récent au plus ancien. */
      let truncated = false;
      const mesures: MesureLite[] = [];

      await Promise.all(
        capteurs.map(async (c: any) => {
          const rows: any[] = [];
          for (let offset = 0; ; offset += PAGE) {
            const { data, error } = await db
              .from('iot_mesures')
              .select('capteur_id, grandeur, valeur, unite, profondeur_m, mesure_at')
              .eq('capteur_id', c.id)
              .eq('rejected', false)
              .not('grandeur', 'in', '("soil_capacitance")')
              .neq('source', 'webhook_test')
              .gte('mesure_at', since)
              .lte('mesure_at', until)
              .order('mesure_at', { ascending: false })
              .range(offset, offset + PAGE - 1);
            if (error) throw error;
            const page = data ?? [];
            rows.push(...page);
            if (page.length < PAGE) break;
            if (rows.length >= MAX_ROWS_PER_SENSOR) {
              truncated = true;
              break;
            }
          }
          filtrerMesuresLisibles(rows).forEach((m: any) =>
            mesures.push({
              capteur_id: m.capteur_id,
              grandeur: m.grandeur,
              valeur: Number(m.valeur),
              unite: m.unite,
              profondeur_m: m.profondeur_m == null ? null : Number(m.profondeur_m),
              mesure_at: m.mesure_at,
            }),
          );
        }),
      );

      /* Livraisons de la même fenêtre (essais exclus). */
      let q = db
        .from('iot_webhook_deliveries')
        .select('id, serial_number, signature_valid, error, created_at, payload')
        .gte('created_at', since)
        .lte('created_at', until)
        .not('serial_number', 'in', `(${TEST_SERIALS.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (scope.fournisseurKeys?.length) q = q.in('fournisseur', scope.fournisseurKeys);
      if (f.fournisseur) q = q.eq('fournisseur', f.fournisseur);
      if (f.serial) q = q.eq('serial_number', f.serial);
      const { data: livraisons, error: errL } = await q;
      if (errL) throw errL;

      const report = analyserAnomalies(
        mesures,
        capteurs.map((c: any) => ({ id: c.id, nom: c.nom, serial_number: c.serial_number, etat: c.etat })),
        (livraisons ?? []) as LivraisonLite[],
      );

      return { ...report, truncated, since, until };
    },
  });
}
