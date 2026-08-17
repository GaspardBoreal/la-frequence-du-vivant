/**
 * Moteur de lecture des sondes — onglet « Analyses ».
 *
 * Tout est calculé en mémoire à partir des mesures déjà en base : agrégats,
 * rythmes jour/nuit, budget d'eau, fenêtres de plantation, concordance avec la
 * palette végétale. Aucune valeur n'est inventée : quand une grandeur manque,
 * le résultat le dit explicitement (`missing`), il ne se tait pas.
 */

import {
  GRANDEURS,
  expectedSlots,
  fmtProfondeur,
  grandeurMeta,
  sensorProfile,
  type SensorProfile,
} from './grandeurs';

export interface Mesure {
  capteur_id: string;
  grandeur: string;
  valeur: number;
  unite?: string | null;
  profondeur_m?: number | null;
  mesure_at: string;
}

export type Trend = 'up' | 'down' | 'flat';

export interface SerieStats {
  key: string;
  grandeur: string;
  profondeur_m: number | null;
  label: string;
  unite: string;
  digits: number;
  color: string;
  count: number;
  min: number;
  max: number;
  mean: number;
  last: number;
  lastAt: string;
  /** Pente sur la fenêtre, en unité / jour. */
  slopePerDay: number;
  trend: Trend;
  /** Amplitude moyenne jour ↔ nuit (max - min quotidien). */
  dailyAmplitude: number | null;
  points: Array<{ t: number; v: number }>;
}

export const serieKey = (g: string, p?: number | null) =>
  p == null ? g : `${g}@${p}`;

export const serieLabel = (g: string, p?: number | null) => {
  const meta = grandeurMeta(g);
  const prof = fmtProfondeur(p ?? null);
  return prof ? `${meta.label} · ${prof}` : meta.label;
};

const round = (v: number, d = 2) => Number(v.toFixed(d));

/* ── Agrégats de séries ───────────────────────────────────────────────── */

function linearSlopePerDay(pts: Array<{ t: number; v: number }>): number {
  if (pts.length < 3) return 0;
  const t0 = pts[0].t;
  const xs = pts.map((p) => (p.t - t0) / 86_400_000);
  const ys = pts.map((p) => p.v);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);

function dailyAmplitude(pts: Array<{ t: number; v: number }>): number | null {
  const byDay = new Map<string, { min: number; max: number }>();
  pts.forEach((p) => {
    const k = dayKey(p.t);
    const cur = byDay.get(k);
    if (!cur) byDay.set(k, { min: p.v, max: p.v });
    else {
      cur.min = Math.min(cur.min, p.v);
      cur.max = Math.max(cur.max, p.v);
    }
  });
  const amps = [...byDay.values()].map((d) => d.max - d.min);
  if (amps.length === 0) return null;
  return round(amps.reduce((a, b) => a + b, 0) / amps.length, 2);
}

export function buildSeries(mesures: Mesure[]): SerieStats[] {
  const groups = new Map<string, Mesure[]>();
  mesures.forEach((m) => {
    if (!Number.isFinite(m.valeur)) return;
    const k = serieKey(m.grandeur, m.profondeur_m);
    const arr = groups.get(k);
    if (arr) arr.push(m);
    else groups.set(k, [m]);
  });

  const out: SerieStats[] = [];
  groups.forEach((rows, key) => {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.mesure_at).getTime() - new Date(b.mesure_at).getTime(),
    );
    const pts = sorted.map((m) => ({ t: new Date(m.mesure_at).getTime(), v: m.valeur }));
    const values = pts.map((p) => p.v);
    const meta = grandeurMeta(sorted[0].grandeur);
    const slope = linearSlopePerDay(pts);
    const seuil = Math.max(Math.abs(meta.range ? (meta.range[1] - meta.range[0]) * 0.01 : 0.05), 0.02);
    out.push({
      key,
      grandeur: sorted[0].grandeur,
      profondeur_m: sorted[0].profondeur_m ?? null,
      label: serieLabel(sorted[0].grandeur, sorted[0].profondeur_m),
      unite: sorted[0].unite || meta.unite,
      digits: meta.digits,
      color: meta.color,
      count: pts.length,
      min: round(Math.min(...values), 2),
      max: round(Math.max(...values), 2),
      mean: round(values.reduce((a, b) => a + b, 0) / values.length, 2),
      last: pts[pts.length - 1].v,
      lastAt: sorted[sorted.length - 1].mesure_at,
      slopePerDay: round(slope, 3),
      trend: slope > seuil ? 'up' : slope < -seuil ? 'down' : 'flat',
      dailyAmplitude: dailyAmplitude(pts),
      points: pts,
    });
  });

  return out.sort((a, b) => a.label.localeCompare(b.label));
}

/* ── Qualité de la donnée ─────────────────────────────────────────────── */

export interface QualityNote {
  level: 'ok' | 'warn' | 'bad';
  text: string;
}

export interface DataQuality {
  /** Intervalle médian entre deux relevés, en minutes. */
  cadenceMin: number | null;
  /** Nombre de trous > 3 × la cadence observée. */
  gaps: number;
  /** Part du temps couverte, 0 → 1. */
  coverage: number | null;
  notes: QualityNote[];
}

export function assessQuality(
  mesures: Mesure[],
  series: SerieStats[],
  windowDays: number,
  profile?: SensorProfile | null,
): DataQuality {
  const notes: QualityNote[] = [];
  if (mesures.length === 0) {
    return { cadenceMin: null, gaps: 0, coverage: 0, notes: [{ level: 'bad', text: 'Aucune mesure sur la fenêtre choisie.' }] };
  }

  const times = [...new Set(mesures.map((m) => new Date(m.mesure_at).getTime()))].sort((a, b) => a - b);
  const deltas = times.slice(1).map((t, i) => t - times[i]).filter((d) => d > 0);
  const median = deltas.length
    ? [...deltas].sort((a, b) => a - b)[Math.floor(deltas.length / 2)]
    : null;
  const cadenceMin = median ? round(median / 60_000, 1) : null;
  const gaps = median ? deltas.filter((d) => d > median * 3).length : 0;
  const expectedPoints = median ? (windowDays * 86_400_000) / median : null;
  const coverage = expectedPoints ? Math.min(1, times.length / expectedPoints) : null;

  if (cadenceMin) {
    notes.push({
      level: 'ok',
      text: `Cadence observée : un relevé toutes les ${cadenceMin < 90 ? `${Math.round(cadenceMin)} min` : `${(cadenceMin / 60).toFixed(1)} h`}.`,
    });
  }
  if (gaps > 0) {
    notes.push({ level: 'warn', text: `${gaps} interruption${gaps > 1 ? 's' : ''} de transmission détectée${gaps > 1 ? 's' : ''} sur la fenêtre.` });
  }
  if (coverage != null && coverage < 0.7) {
    notes.push({ level: 'warn', text: `Couverture partielle : ${Math.round(coverage * 100)} % des relevés attendus.` });
  }

  // Valeurs hors plage plausible (anomalies connues de la chaîne fabricant).
  series.forEach((s) => {
    const range = GRANDEURS[s.grandeur]?.range;
    if (!range) return;
    const out = s.points.filter((p) => p.v < range[0] || p.v > range[1]).length;
    if (out > 0) {
      notes.push({
        level: 'bad',
        text: `${s.label} : ${out} valeur${out > 1 ? 's' : ''} hors plage plausible (${range[0]} → ${range[1]} ${s.unite}) — anomalie de chaîne, non interprétée.`,
      });
    }
  });

  // Cases attendues par le modèle mais jamais transmises.
  const attendues = expectedSlots(profile?.profondeurs ?? null, profile?.expected ?? null);
  attendues.forEach((slot) => {
    const has = series.some(
      (s) => s.grandeur === slot.grandeur && s.profondeur_m != null && Math.abs(s.profondeur_m - slot.profondeur_m) < 1e-6,
    );
    if (!has) {
      notes.push({
        level: 'warn',
        text: `${serieLabel(slot.grandeur, slot.profondeur_m)} : annoncée par le modèle mais jamais transmise sur la fenêtre.`,
      });
    }
  });


  return { cadenceMin, gaps, coverage, notes };
}

/* ── Lectures agronomiques ────────────────────────────────────────────── */

const pick = (series: SerieStats[], grandeur: string) =>
  series.filter((s) => s.grandeur === grandeur);

/** Humidité de surface (la plus faible profondeur) et de fond (la plus grande). */
export function moistureLayers(series: SerieStats[]) {
  const m = pick(series, 'soil_moisture').sort(
    (a, b) => (a.profondeur_m ?? 0) - (b.profondeur_m ?? 0),
  );
  return { surface: m[0] ?? null, deep: m.length > 1 ? m[m.length - 1] : null, all: m };
}

export interface LightReading {
  hoursPerDay: number;
  classe: 'soleil' | 'mi_ombre' | 'ombre';
  label: string;
  days: Array<{ day: string; hours: number }>;
}

/** Heures d'éclairement utile par jour (seuil 2 000 lx) → classe d'exposition. */
export function lightReading(series: SerieStats[]): LightReading | null {
  const lux = pick(series, 'luminosity')[0];
  if (!lux || lux.points.length < 6) return null;
  const byDay = new Map<string, Set<number>>();
  lux.points.forEach((p) => {
    if (p.v < 2000) return;
    const k = dayKey(p.t);
    const set = byDay.get(k) ?? new Set<number>();
    set.add(new Date(p.t).getUTCHours());
    byDay.set(k, set);
  });
  const days = [...byDay.entries()]
    .map(([day, hrs]) => ({ day, hours: hrs.size }))
    .sort((a, b) => a.day.localeCompare(b.day));
  if (days.length === 0) return { hoursPerDay: 0, classe: 'ombre', label: 'Ombre', days: [] };
  const hoursPerDay = round(days.reduce((a, d) => a + d.hours, 0) / days.length, 1);
  const classe = hoursPerDay >= 6 ? 'soleil' : hoursPerDay >= 3 ? 'mi_ombre' : 'ombre';
  return {
    hoursPerDay,
    classe,
    label: classe === 'soleil' ? 'Plein soleil' : classe === 'mi_ombre' ? 'Mi-ombre' : 'Ombre',
    days,
  };
}

export interface WaterBudget {
  /** Pluie cumulée sur 7 jours glissants, mm. */
  rain7d: number | null;
  /** Pluie cumulée sur la fenêtre, mm. */
  rainWindow: number | null;
  /** Assèchement moyen de la surface pendant les séquences sans recharge, %/jour. */
  dryingPerDay: number | null;
  /** Jours depuis la dernière recharge nette du sol (+2 points d'humidité). */
  daysSinceRecharge: number | null;
  /** Jours estimés avant d'atteindre le seuil de réserve juste (20 %). */
  daysToThreshold: number | null;
}

export function waterBudget(series: SerieStats[]): WaterBudget {
  const rain = pick(series, 'rainfall')[0] ?? null;
  const { surface } = moistureLayers(series);
  const now = Date.now();

  const rainWindow = rain
    ? round(rain.points.reduce((a, p) => a + Math.max(0, p.v), 0), 1)
    : null;
  const rain7d = rain
    ? round(
        rain.points.filter((p) => p.t >= now - 7 * 86_400_000).reduce((a, p) => a + Math.max(0, p.v), 0),
        1,
      )
    : null;

  let dryingPerDay: number | null = null;
  let daysSinceRecharge: number | null = null;
  let daysToThreshold: number | null = null;

  if (surface && surface.points.length > 4) {
    // Recharge = hausse nette d'au moins 2 points entre deux relevés voisins.
    let lastRecharge: number | null = null;
    const drops: number[] = [];
    for (let i = 1; i < surface.points.length; i += 1) {
      const a = surface.points[i - 1];
      const b = surface.points[i];
      const dt = (b.t - a.t) / 86_400_000;
      if (dt <= 0) continue;
      const d = b.v - a.v;
      if (d >= 2) lastRecharge = b.t;
      else if (d < 0 && dt < 1) drops.push((-d) / dt);
    }
    if (drops.length > 2) {
      const sorted = [...drops].sort((x, y) => x - y);
      dryingPerDay = round(sorted[Math.floor(sorted.length / 2)], 2);
    }
    if (lastRecharge) daysSinceRecharge = round((now - lastRecharge) / 86_400_000, 1);
    if (dryingPerDay && dryingPerDay > 0.05 && surface.last > 20) {
      daysToThreshold = round((surface.last - 20) / dryingPerDay, 1);
    }
  }

  return { rain7d, rainWindow, dryingPerDay, daysSinceRecharge, daysToThreshold };
}

/** Somme des degrés-jours (base 6 °C) sur la fenêtre, air puis sol en repli. */
export function growingDegreeDays(series: SerieStats[], base = 6): { total: number; source: string; days: number } | null {
  const s = pick(series, 'air_temperature')[0] ?? pick(series, 'soil_temperature')[0];
  if (!s) return null;
  const byDay = new Map<string, { min: number; max: number }>();
  s.points.forEach((p) => {
    const k = dayKey(p.t);
    const cur = byDay.get(k);
    if (!cur) byDay.set(k, { min: p.v, max: p.v });
    else {
      cur.min = Math.min(cur.min, p.v);
      cur.max = Math.max(cur.max, p.v);
    }
  });
  let total = 0;
  byDay.forEach((d) => {
    total += Math.max(0, (d.max + d.min) / 2 - base);
  });
  return { total: round(total, 1), source: s.label, days: byDay.size };
}

/* ── Verdict simple : que planter, maintenant ? ───────────────────────── */

export type VerdictKey = 'planter' | 'arroser' | 'attendre' | 'pailler' | 'inconnu';

export interface SimpleVerdict {
  key: VerdictKey;
  title: string;
  detail: string;
  action: string;
  color: string;
  /** Ce qui manque pour conclure, le cas échéant. */
  missing: string[];
}

export function simpleVerdict(series: SerieStats[], quality: DataQuality): SimpleVerdict {
  const { surface, deep } = moistureLayers(series);
  const soilT = pick(series, 'soil_temperature')[0] ?? null;
  const budget = waterBudget(series);
  const missing: string[] = [];
  if (!surface) missing.push("humidité du sol (aucune profondeur transmise)");
  if (!soilT) missing.push('température du sol');
  if (budget.rain7d == null) missing.push('pluviométrie');

  if (!surface) {
    return {
      key: 'inconnu',
      title: 'Lecture impossible',
      detail:
        'Cette sonde ne transmet pas d’humidité de sol sur la fenêtre choisie : impossible de conclure sur une plantation.',
      action: 'Vérifier la sonde ou choisir une fenêtre plus large',
      color: '#6b7f8f',
      missing,
    };
  }

  const h = surface.last;
  const froid = soilT != null && soilT.last < 8;

  if (h >= 38) {
    return {
      key: 'attendre',
      title: 'Sol saturé',
      detail: `Surface à ${h.toFixed(0)} % : la terre est gorgée, planter maintenant tasserait le sol et asphyxierait les racines.`,
      action: 'Attendre le ressuyage — ne pas marcher sur la zone',
      color: '#2f6f8f',
      missing,
    };
  }
  if (h < 12) {
    return {
      key: 'arroser',
      title: 'Sol sec en surface',
      detail: `Surface à ${h.toFixed(0)} %${deep ? `, fond à ${deep.last.toFixed(0)} %` : ''}${
        budget.daysSinceRecharge != null ? ` · dernière recharge il y a ${budget.daysSinceRecharge} j` : ''
      }. La réserve de surface est épuisée.`,
      action: 'Arroser longuement puis pailler avant toute plantation',
      color: '#b4553a',
      missing,
    };
  }
  if (h < 20) {
    return {
      key: 'pailler',
      title: 'Réserve juste',
      detail: `Surface à ${h.toFixed(0)} %${
        budget.daysToThreshold != null ? ` · seuil critique atteint dans ~${budget.daysToThreshold} j au rythme actuel` : ''
      }. La plante commencerait sa vie en tirant sur ses réserves.`,
      action: 'Pailler et arroser à la plantation, plutôt en fin de journée',
      color: '#c9a24a',
      missing,
    };
  }
  if (froid) {
    return {
      key: 'attendre',
      title: 'Sol frais mais froid',
      detail: `Humidité favorable (${h.toFixed(0)} %) mais sol à ${soilT!.last.toFixed(1)} °C : sous 8 °C l’enracinement est quasi nul.`,
      action: 'Réserver aux plantations en racines nues, attendre le réchauffement pour le reste',
      color: '#5b8fa0',
      missing,
    };
  }
  return {
    key: 'planter',
    title: 'Fenêtre favorable',
    detail: `Surface à ${h.toFixed(0)} %${soilT ? `, sol à ${soilT.last.toFixed(1)} °C` : ''}${
      quality.coverage != null && quality.coverage < 0.7 ? ' — lecture partielle, couverture incomplète' : ''
    }. Conditions réunies pour planter et pour la vie du sol.`,
    action: 'Planter cette semaine, arroser au trou puis pailler',
    color: '#3f7f52',
    missing,
  };
}

/* ── Fenêtres de plantation ───────────────────────────────────────────── */

export interface PlantingWindow {
  start: string;
  end: string;
  days: number;
  reason: string;
}

/**
 * Créneaux passés où humidité et température du sol étaient simultanément
 * favorables (12 % ≤ h < 38 %, sol ≥ 8 °C) — la mémoire des bons moments.
 */
export function plantingWindows(series: SerieStats[]): PlantingWindow[] {
  const { surface } = moistureLayers(series);
  if (!surface) return [];
  const soilT = pick(series, 'soil_temperature')[0] ?? null;

  const tempAt = (t: number): number | null => {
    if (!soilT) return null;
    let best: { d: number; v: number } | null = null;
    soilT.points.forEach((p) => {
      const d = Math.abs(p.t - t);
      if (!best || d < best.d) best = { d, v: p.v };
    });
    return best && best.d < 6 * 3_600_000 ? best.v : null;
  };

  const ok = (v: number, t: number) => {
    if (v < 12 || v >= 38) return false;
    const temp = tempAt(t);
    return temp == null ? true : temp >= 8;
  };

  const out: PlantingWindow[] = [];
  let start: number | null = null;
  let prev: number | null = null;
  surface.points.forEach((p) => {
    const good = ok(p.v, p.t);
    if (good && start == null) start = p.t;
    if (!good && start != null) {
      out.push({
        start: new Date(start).toISOString(),
        end: new Date(prev ?? p.t).toISOString(),
        days: round(((prev ?? p.t) - start) / 86_400_000, 1),
        reason: 'Humidité et température du sol simultanément favorables',
      });
      start = null;
    }
    prev = p.t;
  });
  if (start != null && prev != null) {
    out.push({
      start: new Date(start).toISOString(),
      end: new Date(prev).toISOString(),
      days: round((prev - start) / 86_400_000, 1),
      reason: 'Fenêtre encore ouverte à ce jour',
    });
  }
  return out.filter((w) => w.days >= 0.5).slice(-8).reverse();
}

/* ── Tapis d'humidité : matrice jour × heure ──────────────────────────── */

export interface CarpetRow {
  key: string;
  label: string;
  cells: Array<{ day: string; hour: number; v: number | null }>;
  days: string[];
  min: number;
  max: number;
}

export function moistureCarpet(series: SerieStats[], maxDays = 21): CarpetRow[] {
  const { all } = moistureLayers(series);
  return all.map((s) => {
    const days = [...new Set(s.points.map((p) => dayKey(p.t)))].sort().slice(-maxDays);
    const acc = new Map<string, { sum: number; n: number }>();
    s.points.forEach((p) => {
      const d = dayKey(p.t);
      if (!days.includes(d)) return;
      const k = `${d}|${new Date(p.t).getUTCHours()}`;
      const cur = acc.get(k) ?? { sum: 0, n: 0 };
      cur.sum += p.v;
      cur.n += 1;
      acc.set(k, cur);
    });
    const cells: CarpetRow['cells'] = [];
    days.forEach((d) => {
      for (let h = 0; h < 24; h += 1) {
        const c = acc.get(`${d}|${h}`);
        cells.push({ day: d, hour: h, v: c ? round(c.sum / c.n, 1) : null });
      }
    });
    const vals = cells.map((c) => c.v).filter((v): v is number => v != null);
    return {
      key: s.key,
      label: s.label,
      cells,
      days,
      min: vals.length ? Math.min(...vals) : 0,
      max: vals.length ? Math.max(...vals) : 1,
    };
  });
}

/* ── Lecture d'une station météo : le climat, jamais la plantation ────── */

export interface ClimateSummary {
  air: SerieStats | null;
  humidity: SerieStats | null;
  dew: SerieStats | null;
  /** Amplitude jour-nuit moyenne de l'air, °C. */
  amplitude: number | null;
  frostDays: number;
  hotDays: number;
  days: number;
}

export function climateSummary(series: SerieStats[]): ClimateSummary {
  const air = pick(series, 'air_temperature')[0] ?? null;
  const humidity = pick(series, 'air_humidity')[0] ?? null;
  const dew = pick(series, 'dew_point')[0] ?? null;

  let frostDays = 0;
  let hotDays = 0;
  let days = 0;
  if (air) {
    const byDay = new Map<string, { min: number; max: number }>();
    air.points.forEach((p) => {
      const k = dayKey(p.t);
      const cur = byDay.get(k);
      if (!cur) byDay.set(k, { min: p.v, max: p.v });
      else {
        cur.min = Math.min(cur.min, p.v);
        cur.max = Math.max(cur.max, p.v);
      }
    });
    days = byDay.size;
    byDay.forEach((d) => {
      if (d.min <= 0) frostDays += 1;
      if (d.max >= 30) hotDays += 1;
    });
  }

  return { air, humidity, dew, amplitude: air?.dailyAmplitude ?? null, frostDays, hotDays, days };
}

/** Verdict d'une station météo : on parle de l'air, jamais du sol. */
export function weatherVerdict(series: SerieStats[], climate: ClimateSummary): SimpleVerdict {
  const missing: string[] = [];
  if (!climate.air) missing.push("température de l'air");
  if (!climate.humidity) missing.push("humidité de l'air");
  if (!pick(series, 'rainfall')[0]) missing.push('pluviométrie (non transmise par cette station)');

  if (!climate.air && !climate.humidity) {
    return {
      key: 'inconnu',
      title: 'Station silencieuse',
      detail: "Cette station n'a transmis ni température ni humidité de l'air sur la fenêtre choisie.",
      action: 'Vérifier la station ou élargir la fenêtre',
      color: '#6b7f8f',
      missing,
    };
  }

  const t = climate.air?.mean ?? null;
  const h = climate.humidity?.mean ?? null;
  const doux = t == null ? '' : t >= 22 ? 'Air chaud' : t >= 12 ? 'Air doux' : t >= 4 ? 'Air frais' : 'Air froid';
  const hum = h == null ? '' : h >= 75 ? 'et humide' : h >= 50 ? 'et modérément humide' : 'et sec';
  const amp =
    climate.amplitude == null
      ? ''
      : climate.amplitude > 12
        ? ' Forte amplitude jour-nuit : site ouvert, gelées tardives à surveiller.'
        : ' Amplitude jour-nuit modérée : ambiance tamponnée.';

  return {
    key: 'planter',
    title: [doux, hum].filter(Boolean).join(' ') || 'Climat du lieu',
    detail:
      `${t != null ? `Moyenne ${t.toFixed(1)} °C (min ${climate.air!.min} / max ${climate.air!.max})` : ''}` +
      `${h != null ? `${t != null ? ' · ' : ''}humidité de l'air ${h.toFixed(0)} %` : ''}` +
      `${climate.days ? ` sur ${climate.days} jours` : ''}.` +
      `${climate.frostDays ? ` ${climate.frostDays} jour(s) de gel.` : ''}` +
      `${climate.hotDays ? ` ${climate.hotDays} jour(s) ≥ 30 °C.` : ''}` +
      amp,
    action: 'Climat de référence du lieu — le choix des espèces se décide sonde de sol par sonde de sol',
    color: '#5b8fa0',
    missing,
  };
}

/* ── Analyse complète d'une sonde ─────────────────────────────────────── */

export interface SensorAnalysis {
  capteurId: string;
  windowDays: number;
  profile: SensorProfile;
  series: SerieStats[];
  quality: DataQuality;
  verdict: SimpleVerdict;
  climate: ClimateSummary | null;
  light: LightReading | null;
  water: WaterBudget;
  gdd: { total: number; source: string; days: number } | null;
  windows: PlantingWindow[];
  carpet: CarpetRow[];
}

export function analyseSensor(
  capteurId: string,
  mesures: Mesure[],
  windowDays: number,
  profileOrType?: SensorProfile | Parameters<typeof sensorProfile>[0],
): SensorAnalysis {
  const profile: SensorProfile =
    profileOrType && 'famille' in (profileOrType as any) && 'isSoil' in (profileOrType as any)
      ? (profileOrType as SensorProfile)
      : sensorProfile(profileOrType as any);

  const own = mesures.filter((m) => m.capteur_id === capteurId);
  const series = buildSeries(own);
  const quality = assessQuality(own, series, windowDays, profile);
  const climate = profile.isWeather ? climateSummary(series) : null;

  return {
    capteurId,
    windowDays,
    profile,
    series,
    quality,
    verdict: climate ? weatherVerdict(series, climate) : simpleVerdict(series, quality),
    climate,
    light: lightReading(series),
    water: waterBudget(series),
    gdd: growingDegreeDays(series),
    windows: profile.isWeather ? [] : plantingWindows(series),
    carpet: profile.isWeather ? [] : moistureCarpet(series),
  };
}


/* ── Pont vers la palette végétale ────────────────────────────────────── */

/** Classe hydrique mesurée, traduite dans le vocabulaire de l'étape 4. */
export function measuredHumidity(analysis: SensorAnalysis): 'humide' | 'moyen' | 'sec' | null {
  const { surface } = moistureLayers(analysis.series);
  if (!surface) return null;
  if (surface.mean >= 30) return 'humide';
  if (surface.mean < 16) return 'sec';
  return 'moyen';
}

/** Exposition mesurée, traduite dans le vocabulaire de l'étape 4. */
export function measuredExposure(analysis: SensorAnalysis): 'soleil' | 'mi_ombre' | 'ombre' | null {
  return analysis.light ? analysis.light.classe : null;
}
