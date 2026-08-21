/**
 * Lecture partagée du rythme des réceptions (frise « vitalité »).
 * Utilisé par l'Atlas vivant du parc et par la fiche d'une sonde : même calcul,
 * mêmes mots, quel que soit l'écran.
 */

export interface VitalityStats {
  /** Réception la plus ancienne de la fenêtre (ISO), ou null. */
  first: string | null;
  /** Réception la plus récente de la fenêtre (ISO), ou null. */
  last: string | null;
  /** Nombre de réceptions. */
  count: number;
  /** Intervalle moyen entre deux réceptions, en minutes (null si < 2 valeurs). */
  regularityMin: number | null;
  /** Plus long silence observé, en minutes (null si < 2 valeurs). */
  longestSilenceMin: number | null;
}

const MIN = 60_000;

/** Statistiques de rythme pour une série d'horodatages (ordre indifférent). */
export function vitalityStats(timestamps: string[]): VitalityStats {
  const times = timestamps
    .map((t) => new Date(t).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);

  if (times.length === 0) {
    return { first: null, last: null, count: 0, regularityMin: null, longestSilenceMin: null };
  }

  const first = new Date(times[0]).toISOString();
  const last = new Date(times[times.length - 1]).toISOString();

  if (times.length < 2) {
    return { first, last, count: times.length, regularityMin: null, longestSilenceMin: null };
  }

  let longest = 0;
  for (let i = 1; i < times.length; i += 1) {
    longest = Math.max(longest, times[i] - times[i - 1]);
  }
  const span = times[times.length - 1] - times[0];

  return {
    first,
    last,
    count: times.length,
    regularityMin: Math.round(span / (times.length - 1) / MIN),
    longestSilenceMin: Math.round(longest / MIN),
  };
}

/**
 * Régularité moyenne d'un ensemble de sondes : moyenne des intervalles moyens.
 * Les sondes avec moins de deux réceptions sont ignorées.
 */
export function averageRegularity(perSensor: string[][]): { minutes: number | null; sensors: number } {
  const values = perSensor
    .map((ts) => vitalityStats(ts).regularityMin)
    .filter((v): v is number => v != null);
  if (values.length === 0) return { minutes: null, sensors: 0 };
  return {
    minutes: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    sensors: values.length,
  };
}

/** Mise en mots d'une durée en minutes : « 48 min », « 2 h 10 ». */
export function fmtDuree(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 1) return 'moins d’une minute';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

/** Ancienneté d'écoute depuis une date d'origine : « 16 jours d'écoute ». */
export function fmtAnciennete(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const jours = Math.floor(ms / 86_400_000);
  if (jours < 1) return 'depuis aujourd’hui';
  if (jours === 1) return '1 jour d’écoute';
  return `${jours} jours d’écoute`;
}

/** Plus ancienne date d'un ensemble d'ISO (null si vide). */
export function earliest(isos: (string | null | undefined)[]): string | null {
  const valid = isos.filter((v): v is string => !!v && Number.isFinite(new Date(v).getTime()));
  if (!valid.length) return null;
  return valid.reduce((a, b) => (new Date(b) < new Date(a) ? b : a));
}

const PARIS = 'Europe/Paris';

/** Date + heure de Paris, format court et lisible. */
export function fmtReception(iso: string | null): string {
  if (!iso) return 'Aucune';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: PARIS,
  }).format(new Date(iso));
}
