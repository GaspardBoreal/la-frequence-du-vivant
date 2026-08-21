import { estGrandeurLisible, fmtProfondeur, grandeurMeta, sensorProfile } from '@/lib/iot/grandeurs';
import { jugerLecture } from '@/lib/iot/fiabilite';
import type { IotMesure } from '@/hooks/iot/useIot';

/** Une valeur clé retenue pour une sonde, dans une colonne de comparaison. */
export interface KeyReading {
  /** Colonne : 'humidite' ou 'temperature'. */
  axis: 'humidite' | 'temperature';
  grandeur: string;
  label: string;
  valeur: number;
  unite: string;
  digits: number;
  color: string;
  profondeurLabel: string | null;
  /** Verdict de fiabilité : une valeur douteuse s'affiche, mais sans autorité. */
  fiable: boolean;
  motif: string | null;
}

const HUMID = ['soil_moisture', 'air_humidity'];
const TEMP = ['soil_temperature', 'air_temperature'];

const pick = (rows: IotMesure[], prefer: string[]): IotMesure | null => {
  for (const g of prefer) {
    const candidates = rows
      .filter((m) => m.grandeur === g && Number.isFinite(m.valeur) && estGrandeurLisible(m.grandeur))
      .sort((a, b) => (a.profondeur_m ?? -1) - (b.profondeur_m ?? -1));
    if (candidates.length) return candidates[0];
  }
  return null;
};

const toReading = (m: IotMesure | null, axis: KeyReading['axis'], voisines: IotMesure[]): KeyReading | null => {
  if (!m) return null;
  const meta = grandeurMeta(m.grandeur);
  const verdict = jugerLecture(m as any, voisines as any);
  return {
    axis,
    grandeur: m.grandeur,
    label: meta.label,
    valeur: m.valeur,
    unite: m.unite || meta.unite,
    digits: meta.digits,
    color: meta.color,
    profondeurLabel: fmtProfondeur(m.profondeur_m) ?? null,
    fiable: verdict.fiable,
    motif: verdict.motif,
  };
};

/**
 * Les deux valeurs clés d'une sonde : humidité puis température, choisies dans
 * le sol pour une sonde de sol, dans l'air pour une station météo, avec repli
 * sur l'autre milieu quand la grandeur attendue manque.
 */
export function keyReadings(capteur: any, rows: IotMesure[]): {
  humidite: KeyReading | null;
  temperature: KeyReading | null;
} {
  const profile = sensorProfile(capteur?.type);
  const order = profile.isWeather ? 1 : 0;
  const humid = order ? [...HUMID].reverse() : HUMID;
  const temp = order ? [...TEMP].reverse() : TEMP;
  return {
    humidite: toReading(pick(rows, humid), 'humidite', rows),
    temperature: toReading(pick(rows, temp), 'temperature', rows),
  };
}

/** Échelle partagée par toutes les sondes du parc pour une colonne. */
export interface AxisScale {
  min: number;
  max: number;
  median: number;
  unite: string;
  digits: number;
  count: number;
}

export const buildScale = (values: { valeur: number; unite: string; digits: number }[]): AxisScale | null => {
  if (values.length === 0) return null;
  const nums = values.map((v) => v.valeur).sort((a, b) => a - b);
  const mid = Math.floor(nums.length / 2);
  return {
    min: nums[0],
    max: nums[nums.length - 1],
    median: nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2,
    unite: values[0].unite,
    digits: values[0].digits,
    count: nums.length,
  };
};

/** Position 0→1 d'une valeur sur l'échelle du parc (0.5 si le parc est plat). */
export const positionOnScale = (v: number, scale: AxisScale) => {
  const span = scale.max - scale.min;
  if (span <= 0) return 0.5;
  return Math.min(1, Math.max(0, (v - scale.min) / span));
};

export const fmtValue = (v: number, digits: number) =>
  v.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
