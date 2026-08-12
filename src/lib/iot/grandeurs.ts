/**
 * Dictionnaire des grandeurs mesurées par les objets connectés.
 * Le stockage est toujours normalisé (SI ou unité d'usage explicite) :
 * °C, %, Pa, lx, mm, V. L'affichage se contente de mettre en forme.
 */

export type Grandeur =
  | 'soil_moisture'
  | 'soil_temperature'
  | 'soil_capacitance'
  | 'air_temperature'
  | 'air_humidity'
  | 'dew_point'
  | 'pressure'
  | 'luminosity'
  | 'infrared'
  | 'uv_index'
  | 'rainfall'
  | 'wind_speed'
  | 'battery_voltage';

export interface GrandeurMeta {
  label: string;
  /** Unité de stockage, jamais convertie à l'écran. */
  unite: string;
  /** Nombre de décimales à l'affichage. */
  digits: number;
  color: string;
  /** Plage de lecture usuelle, pour les jauges. */
  range?: [number, number];
}

export const GRANDEURS: Record<string, GrandeurMeta> = {
  soil_moisture: { label: 'Humidité du sol', unite: '%', digits: 0, color: '#2f6f8f', range: [0, 60] },
  soil_temperature: { label: 'Température du sol', unite: '°C', digits: 1, color: '#a4622d', range: [-5, 40] },
  soil_capacitance: { label: 'Capacitance du sol', unite: 'V', digits: 2, color: '#6b7f8f' },
  air_temperature: { label: "Température de l'air", unite: '°C', digits: 1, color: '#c2703d', range: [-10, 45] },
  air_humidity: { label: "Humidité de l'air", unite: '%', digits: 0, color: '#4a8fa8', range: [0, 100] },
  dew_point: { label: 'Point de rosée', unite: '°C', digits: 1, color: '#5b8fa0' },
  pressure: { label: 'Pression atmosphérique', unite: 'Pa', digits: 0, color: '#7a7f6b' },
  luminosity: { label: 'Luminosité', unite: 'lx', digits: 0, color: '#c9a24a' },
  infrared: { label: 'Infrarouge', unite: 'lx', digits: 0, color: '#9c6b4a' },
  uv_index: { label: 'Indice UV', unite: 'index', digits: 1, color: '#8e6ea8' },
  rainfall: { label: 'Pluviométrie', unite: 'mm', digits: 1, color: '#3d7ea6' },
  wind_speed: { label: 'Vitesse du vent', unite: 'm/s', digits: 1, color: '#6f8f8a' },
  battery_voltage: { label: 'Tension batterie', unite: 'V', digits: 2, color: '#7f8f5b' },
};

export const grandeurMeta = (g: string): GrandeurMeta =>
  GRANDEURS[g] ?? { label: g, unite: '', digits: 1, color: '#6b7f6b' };

export const fmtMesure = (valeur: number, grandeur: string, unite?: string | null) => {
  const meta = grandeurMeta(grandeur);
  const u = unite ?? meta.unite;
  const v = valeur.toFixed(meta.digits);
  // Pression : on donne aussi l'hectopascal, plus parlant au jardin.
  if (grandeur === 'pressure') return `${v} Pa · ${(valeur / 100).toFixed(0)} hPa`;
  return u ? `${v} ${u}` : v;
};

export const fmtProfondeur = (m?: number | null) =>
  m == null ? null : m < 1 ? `${Math.round(m * 100)} cm` : `${m.toFixed(2)} m`;

/* ── Lecture agronomique très simple de l'humidité du sol ─────────────── */

export type MoistureVerdict = 'sec' | 'juste' | 'confortable' | 'sature';

export const moistureVerdict = (pct: number): { key: MoistureVerdict; label: string; color: string; conseil: string } => {
  if (pct < 12)
    return {
      key: 'sec',
      label: 'Sol sec',
      color: '#b4553a',
      conseil: "Réserve épuisée à cette profondeur : arrosage long et espacé, paillage à renforcer.",
    };
  if (pct < 20)
    return {
      key: 'juste',
      label: 'Réserve juste',
      color: '#c9a24a',
      conseil: "La plante commence à puiser sur ses réserves : surveillez, un arrosage sera bientôt utile.",
    };
  if (pct < 38)
    return {
      key: 'confortable',
      label: 'Réserve confortable',
      color: '#3f7f52',
      conseil: 'Humidité favorable à la vie du sol et à la croissance : rien à faire.',
    };
  return {
    key: 'sature',
    label: 'Sol saturé',
    color: '#2f6f8f',
    conseil: "Excès d'eau : suspendez l'arrosage, vérifiez le drainage et le tassement.",
  };
};

/* ── Santé d'un capteur ───────────────────────────────────────────────── */

export type SensorHealth = 'green' | 'amber' | 'red' | 'unknown';

export interface HealthInput {
  actif: boolean;
  last_seen_at?: string | null;
  battery_pct?: number | null;
  silence_alert_hours: number;
  battery_alert_pct: number;
}

export interface HealthResult {
  status: SensorHealth;
  label: string;
  reasons: string[];
  hoursSilent: number | null;
}

export function sensorHealth(c: HealthInput, now = Date.now()): HealthResult {
  const reasons: string[] = [];
  if (!c.actif) return { status: 'unknown', label: 'Hors service', reasons: ['Capteur désactivé'], hoursSilent: null };

  const hours = c.last_seen_at ? (now - new Date(c.last_seen_at).getTime()) / 3_600_000 : null;
  let status: SensorHealth = 'green';

  if (hours == null) {
    status = 'unknown';
    reasons.push('Aucune donnée reçue à ce jour');
  } else if (hours > c.silence_alert_hours * 3) {
    status = 'red';
    reasons.push(`Silencieux depuis ${fmtDuree(hours)}`);
  } else if (hours > c.silence_alert_hours) {
    status = 'amber';
    reasons.push(`Dernier signal il y a ${fmtDuree(hours)}`);
  }

  // Une batterie à 0 % signifie « champ non renseigné par la passerelle » (cas BRAD),
  // pas une batterie vide : on n'alerte pas là-dessus.
  if (typeof c.battery_pct === 'number' && c.battery_pct > 0) {
    if (c.battery_pct <= Math.max(5, Math.round(c.battery_alert_pct / 2))) {
      status = 'red';
      reasons.push(`Batterie critique · ${Math.round(c.battery_pct)} %`);
    } else if (c.battery_pct <= c.battery_alert_pct) {
      if (status !== 'red') status = 'amber';
      reasons.push(`Batterie faible · ${Math.round(c.battery_pct)} %`);
    }
  }

  const label =
    status === 'green' ? 'En veille active' : status === 'amber' ? 'À surveiller' : status === 'red' ? 'En défaut' : 'Sans nouvelle';
  return { status, label, reasons, hoursSilent: hours };
}

export const HEALTH_COLOR: Record<SensorHealth, string> = {
  green: '#3f7f52',
  amber: '#c9a24a',
  red: '#b4553a',
  unknown: '#8a8f85',
};

export function fmtDuree(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} jours`;
}

export const fmtHorodatage = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
