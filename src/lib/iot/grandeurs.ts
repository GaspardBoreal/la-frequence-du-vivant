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

/** Ordre de lecture canonique : sol → air → ciel → sonde. */
export const GRANDEUR_ORDER = Object.keys(GRANDEURS);
const orderIndex = (g: string) => {
  const i = GRANDEUR_ORDER.indexOf(g);
  return i === -1 ? Number.POSITIVE_INFINITY : i;
};

/**
 * Comparateur unique pour toutes les listes de grandeurs : d'une sonde à
 * l'autre, les vignettes se lisent toujours à la même place.
 */
export const compareGrandeurs = (
  a: { grandeur: string; profondeur_m?: number | null },
  b: { grandeur: string; profondeur_m?: number | null },
) => {
  const ia = orderIndex(a.grandeur);
  const ib = orderIndex(b.grandeur);
  if (ia !== ib) return ia - ib;
  if (a.grandeur !== b.grandeur) return grandeurMeta(a.grandeur).label.localeCompare(grandeurMeta(b.grandeur).label);
  return (a.profondeur_m ?? -1) - (b.profondeur_m ?? -1);
};

/* ── Profil de lecture d'un modèle de sonde ───────────────────────────── */

/** Grandeurs qui se lisent par profondeur : le modèle en annonce la grille. */
export const DEPTH_GRANDEURS = ['soil_moisture', 'soil_temperature'] as const;

export type SensorFamille = 'sol' | 'meteo' | 'autre';

export interface SensorProfile {
  famille: SensorFamille;
  /** Grandeurs réellement déclarées au catalogue pour ce modèle. */
  expected: string[];
  profondeurs: number[];
  isSoil: boolean;
  isWeather: boolean;
  label: string;
}

/**
 * Ce qu'une sonde promet de mesurer, lu dans le catalogue (`iot_types_capteurs`).
 * Toute lecture s'y adosse : on ne réclame jamais une grandeur jamais promise.
 */
export function sensorProfile(type?: {
  famille?: string | null;
  grandeurs?: string[] | null;
  profondeurs_m?: (number | string)[] | null;
} | null): SensorProfile {
  const raw = (type?.famille ?? '').toLowerCase();
  const expected = (type?.grandeurs ?? []).filter(Boolean) as string[];
  const profondeurs = (type?.profondeurs_m ?? []).map(Number).filter((n) => Number.isFinite(n));
  const famille: SensorFamille =
    raw === 'sol' ? 'sol' : raw === 'meteo' || raw === 'météo' ? 'meteo' : profondeurs.length ? 'sol' : 'autre';
  return {
    famille,
    expected,
    profondeurs,
    isSoil: famille === 'sol',
    isWeather: famille === 'meteo',
    label: famille === 'sol' ? 'Sonde de sol' : famille === 'meteo' ? 'Station météo' : 'Sonde',
  };
}

export interface ExpectedSlot {
  grandeur: string;
  profondeur_m: number;
}

/**
 * Cases attendues d'après les profondeurs déclarées du type de capteur,
 * restreintes aux grandeurs que le modèle annonce réellement.
 */
export const expectedSlots = (
  profondeurs?: (number | string)[] | null,
  grandeursDeclarees?: string[] | null,
): ExpectedSlot[] => {
  const list = (profondeurs ?? []).map(Number).filter((n) => Number.isFinite(n));
  const allowed = DEPTH_GRANDEURS.filter(
    (g) => !grandeursDeclarees || grandeursDeclarees.length === 0 || grandeursDeclarees.includes(g),
  );
  return allowed.flatMap((g) => list.map((p) => ({ grandeur: g, profondeur_m: p })));
};

const sameDepth = (a?: number | null, b?: number | null) =>
  a != null && b != null && Math.abs(Number(a) - Number(b)) < 1e-6;

/**
 * Fusionne les mesures reçues avec la grille attendue : une case attendue mais
 * absente reste visible, marquée « non transmise », plutôt que de disparaître.
 */
export function withExpectedSlots<T extends { grandeur: string; profondeur_m?: number | null }>(
  mesures: T[],
  profondeurs?: (number | string)[] | null,
  grandeursDeclarees?: string[] | null,
): (T | (ExpectedSlot & { missing: true }))[] {
  const manquantes = expectedSlots(profondeurs, grandeursDeclarees).filter(
    (s) => !mesures.some((m) => m.grandeur === s.grandeur && sameDepth(m.profondeur_m, s.profondeur_m)),
  );
  return [...mesures, ...manquantes.map((s) => ({ ...s, missing: true as const }))].sort(compareGrandeurs);
}



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

export type SensorHealth = 'green' | 'amber' | 'red' | 'unknown' | 'paused';

/* ── État de vie d'une sonde, déclaré par l'exploitant ────────────────── */

export type CapteurEtat = 'service' | 'maintenance' | 'retire';

export const CAPTEUR_ETATS: Array<{ key: CapteurEtat; label: string; hint: string; color: string }> = [
  { key: 'service', label: 'En service', hint: 'La sonde est lue et analysée normalement.', color: '#3f7f52' },
  {
    key: 'maintenance',
    label: 'En maintenance',
    hint: 'Silence attendu : plus d’alerte, plus de verdict agronomique.',
    color: '#8a6fb0',
  },
  { key: 'retire', label: 'Retirée', hint: 'Sortie du terrain : masquée du plan et des analyses.', color: '#8a8f85' },
];

export const capteurEtat = (c?: { etat?: string | null } | null): CapteurEtat => {
  const e = (c?.etat ?? 'service') as CapteurEtat;
  return e === 'maintenance' || e === 'retire' ? e : 'service';
};

export const etatMeta = (e: CapteurEtat) => CAPTEUR_ETATS.find((x) => x.key === e)!;

export interface HealthInput {
  actif: boolean;
  etat?: string | null;
  etat_motif?: string | null;
  etat_depuis?: string | null;
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
  const etat = capteurEtat(c);

  // Une sonde déclarée en maintenance ou retirée n'alerte plus : son silence est attendu.
  if (etat !== 'service') {
    const meta = etatMeta(etat);
    const depuis = c.etat_depuis
      ? ` depuis le ${new Date(c.etat_depuis).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}`
      : '';
    return {
      status: 'paused',
      label: meta.label,
      reasons: [`${meta.label}${depuis}${c.etat_motif ? ` — ${c.etat_motif}` : ''}`],
      hoursSilent: c.last_seen_at ? (now - new Date(c.last_seen_at).getTime()) / 3_600_000 : null,
    };
  }

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
  paused: '#8a6fb0',
};


export function fmtDuree(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} jours`;
}

export const fmtHorodatage = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
