// Couche d'accès à l'API Weenat V3 (https://dev.weenat.com/v3).
// Weenat ne pousse rien : c'est nous qui allons chercher la donnée avec une
// clé API propre à chaque propriété. Les mesures sont ramenées au vocabulaire
// interne de La Fréquence du Vivant (°C, %, mm, kPa, W/m²…).

export const WEENAT_BASE = 'https://api-prod.weenat.com';

/** Correspondance des métriques Weenat vers nos grandeurs normalisées. */
type Norm = { grandeur: string; unite: string; convert?: (v: number) => number };

const METRICS: Record<string, Norm> = {
  // Air / ciel
  T: { grandeur: 'air_temperature', unite: '°C' },
  T_AIR: { grandeur: 'air_temperature', unite: '°C' },
  T_WET: { grandeur: 'air_temperature', unite: '°C' },
  U: { grandeur: 'air_humidity', unite: '%' },
  RH: { grandeur: 'air_humidity', unite: '%' },
  RR: { grandeur: 'rainfall', unite: 'mm' },
  T_DEW: { grandeur: 'dew_point', unite: '°C' },
  FF: { grandeur: 'wind_speed', unite: 'm/s' },
  FF_MAX: { grandeur: 'wind_speed', unite: 'm/s' },
  DD: { grandeur: 'wind_direction', unite: '°' },
  RG: { grandeur: 'solar_radiation', unite: 'W/m²' },
  SSI: { grandeur: 'solar_radiation', unite: 'W/m²' },
  PAR: { grandeur: 'par', unite: 'µmol/m²/s' },
  ETP: { grandeur: 'etp', unite: 'mm' },
  VPD: { grandeur: 'vpd', unite: 'kPa' },
  // Sol
  HPOT: { grandeur: 'soil_potential', unite: 'kPa' },
  U_CAPA: { grandeur: 'soil_moisture', unite: '%' },
  SF_CAPA: { grandeur: 'soil_moisture', unite: '%' },
  T_CAPA: { grandeur: 'soil_temperature', unite: '°C' },
  T_SOIL_BY_HORIZON: { grandeur: 'soil_temperature', unite: '°C' },
  T_SOIL: { grandeur: 'soil_temperature', unite: '°C' },
  T_CAL: { grandeur: 'soil_temperature', unite: '°C' },
};

/** Bornes physiques de plausibilité : au-delà, la mesure est écartée. */
export const BOUNDS: Record<string, [number, number]> = {
  soil_moisture: [0, 100],
  soil_potential: [0, 250],
  soil_temperature: [-40, 80],
  air_temperature: [-40, 80],
  air_humidity: [0, 100],
  dew_point: [-60, 60],
  rainfall: [0, 500],
  wind_speed: [0, 120],
  wind_direction: [0, 360],
  solar_radiation: [0, 1600],
  par: [0, 4000],
  etp: [0, 30],
  vpd: [0, 12],
};

export interface ParsedMetric {
  grandeur: string;
  unite: string;
  profondeur_m: number | null;
}

/**
 * `SF_CAPA-20`, `T_CAPA-60`, `HPOT-30`, `T`… : le suffixe numérique est une
 * profondeur en centimètres, rendue ici en mètres.
 */
export function parseMetric(key: string): ParsedMetric | null {
  const m = key.match(/^([A-Z_]+?)(?:-(\d+(?:\.\d+)?))?$/);
  if (!m) return null;
  const norm = METRICS[m[1]];
  if (!norm) return null;
  return {
    grandeur: norm.grandeur,
    unite: norm.unite,
    profondeur_m: m[2] === undefined ? null : Number(m[2]) / 100,
  };
}

export interface WeenatDevice {
  id: number;
  serial_number: string;
  model: string;
  model_label: string | null;
  available_metrics: string[];
  location: [number, number] | null;
  location_text: string | null;
  latest_measurement_broadcast: string | null;
}

export interface WeenatPlot {
  id: number;
  name: string;
  location: [number, number] | null;
  location_text: string | null;
  available_metrics: string[];
  device_count: number;
  meteo_vision: boolean;
  organization?: { id: number; name: string } | null;
}

async function call<T>(apiKey: string, path: string): Promise<T> {
  const res = await fetch(`${WEENAT_BASE}${path}`, {
    headers: { Authorization: `Weenat-Api-Key ${apiKey}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Weenat ${res.status} sur ${path} : ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export const listDevices = (apiKey: string) =>
  call<{ results: WeenatDevice[] }>(apiKey, '/v3/devices').then((d) => d.results ?? []);

export const listPlots = (apiKey: string) =>
  call<{ results: WeenatPlot[] }>(apiKey, '/v3/plots').then((d) => d.results ?? []);

/** Séries horaires d'un appareil ou d'une parcelle (station météo virtuelle). */
export function fetchData(
  apiKey: string,
  kind: 'device' | 'plot',
  externalId: string,
  start: Date,
  end: Date,
): Promise<Record<string, number | string>[]> {
  const qs = `timespan=hour&start=${start.toISOString()}&end=${end.toISOString()}`;
  const path = kind === 'plot' ? `/v3/data/plots/${externalId}?${qs}` : `/v3/data/devices/${externalId}?${qs}`;
  return call<Record<string, number | string>[]>(apiKey, path).then((r) => (Array.isArray(r) ? r : []));
}

export interface NormalizedMesure {
  grandeur: string;
  valeur: number;
  unite: string;
  profondeur_m: number | null;
  mesure_at: string;
}

/**
 * Traduit les points horaires Weenat en mesures internes, en écartant les
 * valeurs physiquement impossibles.
 */
export function normalize(
  rows: Record<string, number | string>[],
  fallbackDepths: number[] = [],
): { mesures: NormalizedMesure[]; rejected: number } {
  const out: NormalizedMesure[] = [];
  let rejected = 0;

  for (const row of rows) {
    const at = typeof row.datetime === 'string' ? row.datetime : null;
    if (!at) continue;
    const mesureAt = new Date(at).toISOString();

    for (const [key, raw] of Object.entries(row)) {
      if (key === 'datetime') continue;
      const value = typeof raw === 'string' ? Number(raw) : raw;
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      const parsed = parseMetric(key);
      if (!parsed) continue;

      const bounds = BOUNDS[parsed.grandeur];
      if (bounds && (value < bounds[0] || value > bounds[1])) {
        rejected += 1;
        continue;
      }

      // Une sonde de sol sans suffixe de profondeur (tensiomètre simple) hérite
      // de la profondeur unique déclarée au catalogue.
      const depth =
        parsed.profondeur_m ??
        (['soil_moisture', 'soil_temperature', 'soil_potential'].includes(parsed.grandeur) && fallbackDepths.length === 1
          ? fallbackDepths[0]
          : null);

      out.push({
        grandeur: parsed.grandeur,
        valeur: value,
        unite: parsed.unite,
        profondeur_m: depth,
        mesure_at: mesureAt,
      });
    }
  }

  return { mesures: out, rejected };
}
