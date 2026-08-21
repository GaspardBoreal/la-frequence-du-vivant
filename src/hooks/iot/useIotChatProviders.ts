import { useMemo } from 'react';
import { useAllCapteursGeo, useMesuresWindow, type CapteurGeo } from '@/hooks/iot/useIotTelemetry';
import { useLatestMesures } from '@/hooks/iot/useIot';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { soilLiteFromState } from '@/lib/soilLiteFromState';
import { sensorHealth, grandeurMeta, fmtProfondeur } from '@/lib/iot/grandeurs';
import { payloadBytes } from '@/lib/chatContextCost';
import type { ContextProvider } from '@/hooks/useChatPageContext';
import { useIotChatFocus } from '@/components/iot/chatbot/iotChatFocus';
import { useIotConsole } from '@/components/iot/console/IotConsoleContext';

const round = (v: number | null | undefined, d = 2) =>
  v == null || !Number.isFinite(v) ? null : Number(v.toFixed(d));

const hoursSince = (iso?: string | null) =>
  iso ? round((Date.now() - new Date(iso).getTime()) / 3_600_000, 1) : null;

const provider = (p: Omit<ContextProvider, 'bytes'>): ContextProvider => ({
  ...p,
  bytes: payloadBytes(p.payload),
});

/** Plages plausibles : au-delà, la valeur est signalée comme suspecte à l'IA. */
const PLAUSIBLE: Record<string, [number, number]> = {
  soil_moisture: [0, 100],
  soil_temperature: [-15, 50],
  air_temperature: [-30, 55],
  air_humidity: [0, 100],
  uv_index: [0, 15],
  luminosity: [0, 130000],
};

const suspect = (g: string, v: number) => {
  const p = PLAUSIBLE[g];
  return p ? v < p[0] || v > p[1] : false;
};

export interface IotScope {
  /** Sondes réellement dans le périmètre courant. */
  capteurs: CapteurGeo[];
  capteurIds: string[];
  capteur: CapteurGeo | null;
  proprieteId: string | null;
  proprieteNom: string | null;
  /** Nombre de propriétés couvertes par le périmètre. */
  proprieteCount: number;
  label: string;
  level: 'sonde' | 'propriete' | 'parc';
}

/** Périmètre courant de l'IA : sonde > propriété > parc entier. */
export function useIotScope(): IotScope {
  const focus = useIotChatFocus();
  const { data: all = [] } = useAllCapteursGeo();
  const { label: consoleLabel } = useIotConsole();


  return useMemo(() => {
    const capteur = focus.capteurId ? all.find((c) => c.id === focus.capteurId) ?? null : null;
    const proprieteId = capteur?.propriete_id ?? focus.proprieteId ?? null;
    const capteurs = capteur
      ? [capteur]
      : proprieteId
        ? all.filter((c) => c.propriete_id === proprieteId)
        : all;
    const proprieteNom =
      capteur?.propriete?.nom ??
      (proprieteId ? all.find((c) => c.propriete_id === proprieteId)?.propriete?.nom ?? null : null);
    const proprieteCount = new Set(capteurs.map((c) => c.propriete_id)).size;

    const level: IotScope['level'] = capteur ? 'sonde' : proprieteId ? 'propriete' : 'parc';
    const label = capteur
      ? `${capteur.nom} · ${proprieteNom ?? 'propriété'}`
      : proprieteId
        ? `${proprieteNom ?? 'Propriété'} · ${capteurs.length} sonde${capteurs.length > 1 ? 's' : ''}`
        : `${consoleLabel} · ${capteurs.length} sonde${capteurs.length > 1 ? 's' : ''} / ${proprieteCount} propriété${proprieteCount > 1 ? 's' : ''}`;

    return {
      capteurs,
      capteurIds: capteurs.map((c) => c.id),
      capteur,
      proprieteId,
      proprieteNom,
      proprieteCount,
      label,
      level,
    };
  }, [all, focus.capteurId, focus.proprieteId, consoleLabel]);
}


/**
 * Contextes IoT activables dans la Console 📎 — frugaux : agrégats et
 * dernières valeurs, jamais les points bruts.
 */
export function useIotChatProviders(): {
  providers: ContextProvider[];
  providersTitle: string;
  scope: IotScope;
} {
  const focus = useIotChatFocus();
  const scope = useIotScope();
  const { data: latest = {} } = useLatestMesures(scope.capteurIds);
  const { data: mesuresWindow } = useMesuresWindow(scope.capteurIds, focus.windowDays);
  const windowRows = mesuresWindow?.rows ?? [];
  const { state: soil } = usePropertySoil(scope.proprieteId ?? undefined, { readOnly: true });

  /* ── 📡 Santé du réseau ────────────────────────────────────────────── */
  const sante = useMemo(() => {
    const cadence = new Map<string, number>();
    const counts = new Map<string, number>();
    windowRows.forEach((m: any) => counts.set(m.capteur_id, (counts.get(m.capteur_id) ?? 0) + 1));
    scope.capteurs.forEach((c) => {
      const n = counts.get(c.id) ?? 0;
      cadence.set(c.id, n === 0 ? 0 : round((focus.windowDays * 24) / Math.max(1, n / 5), 2) ?? 0);
    });

    return {
      perimetre: scope.label,
      fenetreJours: focus.windowDays,
      sondes: scope.capteurs.map((c) => {
        const h = sensorHealth(c as any);
        return {
          nom: c.nom,
          serie: c.serial_number,
          propriete: c.propriete?.nom ?? null,
          modele: c.type?.modele ?? null,
          emplacement: c.emplacement,
          etat: h.status,
          etatLabel: h.label,
          batteriePct: c.battery_pct == null ? null : Math.round(c.battery_pct),
          rssiDbm: c.rssi,
          snr: c.snr,
          dernierSignalIlYAH: hoursSince(c.last_seen_at),
          seuilSilenceH: c.silence_alert_hours,
          seuilBatteriePct: c.battery_alert_pct,
          gps: c.lat != null && c.lng != null,
          relevesFenetre: counts.get(c.id) ?? 0,
          intervalleMoyenH: cadence.get(c.id) ?? null,
        };
      }),
      sansGps: scope.capteurs.filter((c) => c.lat == null || c.lng == null).map((c) => c.nom),
    };
  }, [scope.capteurs, scope.label, windowRows, focus.windowDays]);

  /* ── 📊 Dernières mesures ──────────────────────────────────────────── */
  const mesures = useMemo(
    () => ({
      perimetre: scope.label,
      sondes: scope.capteurs.map((c) => ({
        nom: c.nom,
        propriete: c.propriete?.nom ?? null,
        valeurs: (latest[c.id] ?? []).map((m: any) => ({
          grandeur: grandeurMeta(m.grandeur).label,
          cle: m.grandeur,
          valeur: round(m.valeur, grandeurMeta(m.grandeur).digits),
          unite: m.unite ?? grandeurMeta(m.grandeur).unite,
          profondeur: fmtProfondeur(m.profondeur_m),
          ilYAH: hoursSince(m.mesure_at),
          suspecte: suspect(m.grandeur, m.valeur) || undefined,
        })),
      })),
    }),
    [scope.capteurs, scope.label, latest],
  );

  /* ── 📈 Séries agrégées ────────────────────────────────────────────── */
  const series = useMemo(() => {
    type Acc = { n: number; sum: number; min: number; max: number; first: number; last: number; sq: number; unite: string };
    const buckets = new Map<string, Acc>();
    const byCapteurTimes = new Map<string, number[]>();

    windowRows.forEach((m: any) => {
      const key = `${m.capteur_id}|${m.grandeur}|${m.profondeur_m ?? ''}`;
      const a = buckets.get(key);
      if (!a) {
        buckets.set(key, {
          n: 1, sum: m.valeur, min: m.valeur, max: m.valeur,
          first: m.valeur, last: m.valeur, sq: m.valeur * m.valeur, unite: m.unite ?? '',
        });
      } else {
        a.n += 1; a.sum += m.valeur; a.sq += m.valeur * m.valeur;
        a.min = Math.min(a.min, m.valeur); a.max = Math.max(a.max, m.valeur); a.last = m.valeur;
      }
      const t = new Date(m.mesure_at).getTime();
      const arr = byCapteurTimes.get(m.capteur_id) ?? [];
      if (arr[arr.length - 1] !== t) arr.push(t);
      byCapteurTimes.set(m.capteur_id, arr);
    });

    const trous = (times: number[]) => {
      if (times.length < 3) return null;
      const gaps: number[] = [];
      for (let i = 1; i < times.length; i += 1) gaps.push(times[i] - times[i - 1]);
      const median = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
      return gaps.filter((g) => g > Math.max(median * 4, 2 * 3_600_000)).length;
    };

    return {
      perimetre: scope.label,
      fenetreJours: focus.windowDays,
      note: 'Agrégats seulement — aucun point brut transmis.',
      sondes: scope.capteurs.map((c) => ({
        nom: c.nom,
        propriete: c.propriete?.nom ?? null,
        trousTransmission: trous(byCapteurTimes.get(c.id) ?? []),
        grandeurs: [...buckets.entries()]
          .filter(([k]) => k.startsWith(`${c.id}|`))
          .map(([k, a]) => {
            const [, g, prof] = k.split('|');
            const meta = grandeurMeta(g);
            const moy = a.sum / a.n;
            const variance = Math.max(0, a.sq / a.n - moy * moy);
            return {
              grandeur: meta.label,
              cle: g,
              profondeur: prof ? fmtProfondeur(Number(prof)) : null,
              unite: a.unite || meta.unite,
              n: a.n,
              min: round(a.min, meta.digits),
              moy: round(moy, meta.digits),
              max: round(a.max, meta.digits),
              ecartType: round(Math.sqrt(variance), meta.digits),
              tendance: round(a.last - a.first, meta.digits),
            };
          }),
      })),
    };
  }, [windowRows, scope.capteurs, scope.label, focus.windowDays]);

  /* ── 🪨 Lecture croisée sol ────────────────────────────────────────── */
  const croiseSol = useMemo(() => {
    if (!scope.proprieteId) return null;
    const lite = soilLiteFromState(soil);
    const humidites: any[] = [];
    scope.capteurs.forEach((c) => {
      const voisines = (latest[c.id] ?? []).map((m: any) => ({
        grandeur: m.grandeur,
        valeur: m.valeur,
        profondeur_m: m.profondeur_m,
      }));
      (latest[c.id] ?? []).forEach((m: any) => {
        if (m.grandeur === 'soil_moisture' || m.grandeur === 'soil_temperature') {
          const verdict = jugerLecture(
            { grandeur: m.grandeur, valeur: m.valeur, profondeur_m: m.profondeur_m },
            voisines,
          );
          humidites.push({
            sonde: c.nom,
            grandeur: grandeurMeta(m.grandeur).label,
            valeur: round(m.valeur, 1),
            unite: m.unite ?? grandeurMeta(m.grandeur).unite,
            profondeur: fmtProfondeur(m.profondeur_m),
            suspecte: verdict.fiable ? suspect(m.grandeur, m.valeur) || undefined : verdict.motif,
          });
        }
      });
    });
    return {
      propriete: scope.proprieteNom,
      registreSol: {
        texture: lite.texture ?? null,
        structure: lite.structure ?? null,
        ph: lite.ph ?? null,
        signesDeVie: lite.life_signs ?? [],
        prelevements: (soil?.samples ?? []).length,
      },
      mesuresSol: humidites,
      note:
        humidites.length === 0
          ? "Aucune mesure de sol transmise par les sondes du périmètre : la lecture reste celle du registre de terrain."
          : 'Croiser registre de terrain et mesures continues ; en cas de désaccord, le registre fait foi sur la texture/pH.',
    };
  }, [scope.proprieteId, scope.proprieteNom, scope.capteurs, soil, latest]);

  const providers = useMemo(() => {
    const list: ContextProvider[] = [
      provider({
        id: 'iot.sante',
        group: 'Sondes',
        emoji: '📡',
        label: 'Santé du réseau',
        hint: 'Batterie, signal, silences, cadence, sondes sans GPS',
        payload: sante,
        recommended: true,
      }),
      provider({
        id: 'iot.mesures',
        group: 'Sondes',
        emoji: '📊',
        label: 'Dernières mesures',
        hint: 'Valeur courante par grandeur et profondeur, en unités SI',
        payload: mesures,
        recommended: true,
      }),
      provider({
        id: 'iot.series',
        group: 'Sondes',
        emoji: '📈',
        label: `Séries agrégées ${focus.windowDays} j`,
        hint: 'Min / moy / max, tendance, trous de transmission',
        payload: series,
      }),
    ];
    if (croiseSol) {
      list.push(
        provider({
          id: 'iot.sol',
          group: 'Sol',
          emoji: '🪨',
          label: 'Lecture agronomique croisée',
          hint: 'Registre de sol de la propriété × mesures des sondes',
          payload: croiseSol,
        }),
      );
    }
    return list;
  }, [sante, mesures, series, croiseSol, focus.windowDays]);

  return { providers, providersTitle: `Contextes des sondes — ${scope.label}`, scope };
}
