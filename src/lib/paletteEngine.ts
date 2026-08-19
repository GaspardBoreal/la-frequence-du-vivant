/**
 * Moteur de recommandation — Étape 5 « Palette végétale ».
 *
 * Croise le profil du site (sol mesuré à l'étape 2 + cortège identifié à
 * l'étape 3 + sélecteurs de l'étape 4) avec les optima de `plantPaletteKb`.
 * Aucune API externe : tout est calculé en mémoire, de façon déterministe.
 */

import {
  PALETTE_KB,
  PALETTE_BLACKLIST,
  STRATE_ORDER,
  type PaletteSpecies,
  type PaletteStrate,
} from './plantPaletteKb';
import type { SoilLite, PoleScore } from './plantIndicatorKb';

export interface SiteProfile {
  eau: number;
  texture: number;
  nutrition: number;
  ph: number;
  lumiere: number;
  /** 0 → 1 : part des axes réellement documentés. */
  confidence: number;
  /** Ce sur quoi le profil s'appuie, affiché pour la transparence. */
  basis: string[];
  known: Record<Axis, boolean>;
}

type Axis = 'eau' | 'texture' | 'nutrition' | 'ph' | 'lumiere';

export type ZoneAmbiance = 'neutre' | 'ensoleille' | 'mi_ombre' | 'ombre' | 'humide' | 'sec';

export const ZONE_AMBIANCES: Array<{ id: ZoneAmbiance; label: string; hint: string }> = [
  { id: 'neutre', label: 'Comme le site', hint: 'Reprend le profil général de la propriété' },
  { id: 'ensoleille', label: 'Plein soleil', hint: 'Exposition sud, réverbération, sol chaud' },
  { id: 'mi_ombre', label: 'Mi-ombre', hint: 'Lisière, pied de mur, ombre portée l’après-midi' },
  { id: 'ombre', label: 'Ombre', hint: 'Sous couvert, nord de bâtiment' },
  { id: 'humide', label: 'Fond humide', hint: 'Point bas, suintement, bord de mare' },
  { id: 'sec', label: 'Point sec', hint: 'Talus, remblai, sol superficiel' },
];

const AMBIANCE_SHIFT: Record<ZoneAmbiance, Partial<Record<Axis, number>>> = {
  neutre: {},
  ensoleille: { lumiere: +1.5, eau: -0.5 },
  mi_ombre: { lumiere: -1.5 },
  ombre: { lumiere: -3 },
  humide: { eau: +2, texture: +0.5 },
  sec: { eau: -2, nutrition: -0.5 },
};

const clamp = (v: number, min = -3, max = 3) => Math.max(min, Math.min(max, v));

/* ── Profil du site ───────────────────────────────────────────────────────── */

const TEXTURE_MAP: Record<string, number> = {
  sable_limon: -2,
  limon_moyen: 0,
  limon_argile: 2,
};

const poleOf = (scores: PoleScore[] | undefined, key: string) =>
  scores?.find((s) => s.pole.key === key)?.ratio ?? 0;

export function buildSiteProfile(input: {
  soil?: SoilLite | null;
  poleScores?: PoleScore[];
  exposure?: string | null;
  humidity?: string | null;
}): SiteProfile {
  const { soil, poleScores, exposure, humidity } = input;
  const basis: string[] = [];
  const known: Record<Axis, boolean> = {
    eau: false,
    texture: false,
    nutrition: false,
    ph: false,
    lumiere: false,
  };

  // Eau : flore observée d'abord, sélecteur d'étape 4 ensuite.
  let eau = 0;
  const frais = poleOf(poleScores, 'eau_frais');
  const sec = poleOf(poleScores, 'eau_sec');
  if (frais > 0 || sec > 0) {
    eau = clamp((frais - sec) * 4);
    known.eau = true;
    basis.push('cortège végétal observé (étape 3)');
  } else if (humidity) {
    eau = humidity === 'humide' ? 2 : humidity === 'sec' ? -2 : 0;
    known.eau = true;
    basis.push('ambiance hydrique déclarée (étape 4)');
  }

  // Texture : mesure de sol prioritaire.
  let texture = 0;
  if (soil?.texture && TEXTURE_MAP[soil.texture] !== undefined) {
    texture = TEXTURE_MAP[soil.texture];
    known.texture = true;
    basis.push('test du boudin (étape 2)');
  } else {
    const arg = poleOf(poleScores, 'tex_argile_limon');
    const lim = poleOf(poleScores, 'tex_limon_sable');
    if (arg > 0 || lim > 0) {
      texture = clamp((arg - lim) * 4);
      known.texture = true;
      basis.push('texture déduite du cortège');
    }
  }

  // Nutrition : cortège + signes de vie.
  let nutrition = 0;
  const riche = poleOf(poleScores, 'nutri_riche');
  const pauvre = poleOf(poleScores, 'nutri_pauvre');
  if (riche > 0 || pauvre > 0) {
    nutrition = clamp((riche - pauvre) * 4);
    known.nutrition = true;
    basis.push('trophie lue dans la flore');
  }
  if ((soil?.life_signs?.length ?? 0) >= 3) {
    nutrition = clamp(nutrition + 0.5);
    known.nutrition = true;
  }

  // pH : mesuré.
  let ph = 0;
  if (soil?.ph != null) {
    ph = clamp(((soil.ph as number) - 6.8) * 1.4);
    known.ph = true;
    basis.push(`pH mesuré ${Number(soil.ph).toFixed(1)} (étape 2)`);
  } else {
    const calc = poleOf(poleScores, 'ph_calcaire');
    const acid = poleOf(poleScores, 'ph_acide');
    if (calc > 0 || acid > 0) {
      ph = clamp((calc - acid) * 4);
      known.ph = true;
      basis.push('pH déduit du cortège');
    }
  }

  // Lumière : sélecteur d'exposition.
  let lumiere = 1;
  if (exposure) {
    lumiere = exposure === 'soleil' ? 2.5 : exposure === 'ombre' ? -2 : 0.5;
    known.lumiere = true;
    basis.push('exposition déclarée (étape 4)');
  }

  const confidence =
    (Object.values(known).filter(Boolean).length as number) / 5;

  return { eau, texture, nutrition, ph, lumiere, confidence, basis, known };
}

export function zoneProfile(site: SiteProfile, ambiance: ZoneAmbiance): SiteProfile {
  const shift = AMBIANCE_SHIFT[ambiance] ?? {};
  return {
    ...site,
    eau: clamp(site.eau + (shift.eau ?? 0)),
    texture: clamp(site.texture + (shift.texture ?? 0)),
    nutrition: clamp(site.nutrition + (shift.nutrition ?? 0)),
    ph: clamp(site.ph + (shift.ph ?? 0)),
    lumiere: clamp(site.lumiere + (shift.lumiere ?? 0)),
  };
}

/* ── Scoring ──────────────────────────────────────────────────────────────── */

const WEIGHTS: Record<Axis, number> = { eau: 1.15, texture: 0.85, nutrition: 0.7, ph: 1.2, lumiere: 1 };

export interface ScoredSpecies {
  species: PaletteSpecies;
  /** 0 → 100 : adéquation au profil. */
  score: number;
  /** Axe le plus contraignant, pour justifier le refus. */
  worstAxis: Axis;
  worstGap: number;
}

export function scoreSpecies(profile: SiteProfile, sp: PaletteSpecies): ScoredSpecies {
  let weighted = 0;
  let totalW = 0;
  let worstAxis: Axis = 'eau';
  let worstGap = -1;

  (Object.keys(WEIGHTS) as Axis[]).forEach((axis) => {
    if (!profile.known[axis]) return;
    const target = (profile as any)[axis] as number;
    const opt = (sp.optima as any)[axis === 'nutrition' ? 'nutrition' : axis] as number;
    const gap = Math.abs(target - opt);
    const w = WEIGHTS[axis];
    weighted += gap * w;
    totalW += w;
    if (gap > worstGap) {
      worstGap = gap;
      worstAxis = axis;
    }
  });

  if (totalW === 0) return { species: sp, score: 50, worstAxis: 'eau', worstGap: 0 };
  const meanGap = weighted / totalW; // 0 → 6
  const score = Math.round(Math.max(0, 100 - (meanGap / 4.5) * 100));
  return { species: sp, score, worstAxis, worstGap };
}

export const AXIS_LABEL: Record<Axis, string> = {
  eau: 'humidité',
  texture: 'texture',
  nutrition: 'richesse',
  ph: 'pH',
  lumiere: 'lumière',
};

export interface StrateRecommendation {
  strate: PaletteStrate;
  species: ScoredSpecies[];
}

/** Palette d'une zone : les meilleurs candidats répartis en strates. */
export function recommendForZone(
  profile: SiteProfile,
  opts?: { perStrate?: Partial<Record<PaletteStrate, number>>; exclude?: string[] },
): StrateRecommendation[] {
  const perStrate = {
    arbre: 2,
    arbuste: 4,
    grimpante: 1,
    herbacee: 5,
    couvre_sol: 2,
    ...(opts?.perStrate ?? {}),
  } as Record<PaletteStrate, number>;
  const excluded = new Set(opts?.exclude ?? []);

  const scored = PALETTE_KB.filter((s) => !excluded.has(s.id)).map((s) => scoreSpecies(profile, s));

  return STRATE_ORDER.map((strate) => ({
    strate,
    species: scored
      .filter((s) => s.species.strate === strate)
      .sort((a, b) => b.score - a.score || (a.species.origin === 'indigene' ? -1 : 1))
      .slice(0, perStrate[strate] ?? 3),
  })).filter((r) => r.species.length > 0);
}

/* ── Règle du site ────────────────────────────────────────────────────────── */

const qualify = (v: number, low: string, mid: string, high: string) =>
  v <= -1.2 ? low : v >= 1.2 ? high : mid;

/** Une phrase qui vaut filtre : ce qui entre au jardin doit y répondre. */
export function buildSiteRule(p: SiteProfile): string {
  if (p.confidence === 0) {
    return 'Complétez les étapes 2 et 3 : la règle du site se déduit du sol mesuré et du cortège observé.';
  }
  const eau = qualify(p.eau, 'sèche l’été', 'à humidité moyenne', 'fraîche toute l’année');
  const sol = qualify(p.texture, 'un sol léger et filtrant', 'un sol limoneux équilibré', 'un sol lourd qui retient l’eau');
  const acide = qualify(p.ph, 'acide', 'neutre', 'calcaire');
  const lum = qualify(p.lumiere, 'à l’ombre', 'en lumière partagée', 'en plein soleil');
  const nut = qualify(p.nutrition, 'pauvre', 'moyennement pourvu', 'riche en azote');
  return `Ici, on ne plante que ce qui accepte ${sol} ${acide}, ${nut}, une terre ${eau}, ${lum} — et rien qui réclame l’arrosage passé la deuxième année.`;
}

/* ── Ce que l'on écarte ───────────────────────────────────────────────────── */

export interface Exclusion {
  fr: string;
  latin: string;
  why: string;
  kind: 'principe' | 'site';
}

/** Trois refus argumentés : invasives de principe + inadaptations du site. */
export function buildExclusions(profile: SiteProfile, seed = 0): Exclusion[] {
  const out: Exclusion[] = [];
  const principle = PALETTE_BLACKLIST[seed % PALETTE_BLACKLIST.length];
  out.push({ ...principle, kind: 'principe' });

  if (profile.confidence > 0) {
    const worst = PALETTE_KB.map((s) => scoreSpecies(profile, s))
      .sort((a, b) => a.score - b.score)
      .filter((s) => s.score < 45)
      .slice(0, 6);
    for (const w of worst) {
      if (out.length >= 3) break;
      const axis = AXIS_LABEL[w.worstAxis];
      const optima = (w.species.optima as any)[w.worstAxis] as number;
      const target = (profile as any)[w.worstAxis] as number;
      const sens = optima > target ? 'davantage' : 'nettement moins';
      out.push({
        fr: w.species.fr,
        latin: w.species.latin,
        why: `Écartée : elle demande ${sens} de ${axis} que ce que le site offre réellement (adéquation ${w.score} / 100). La planter, c’est s’engager à corriger le milieu tous les ans.`,
        kind: 'site',
      });
    }
  }

  let i = 1;
  while (out.length < 3) {
    const extra = PALETTE_BLACKLIST[(seed + i) % PALETTE_BLACKLIST.length];
    if (!out.some((o) => o.latin === extra.latin)) out.push({ ...extra, kind: 'principe' });
    i += 1;
  }
  return out.slice(0, 3);
}

/* ── Mise en œuvre ────────────────────────────────────────────────────────── */

export interface ImplementationStep {
  period: string;
  title: string;
  detail: string;
}

export function buildImplementation(profile: SiteProfile, zoneCount: number): ImplementationStep[] {
  const lourd = profile.texture >= 1;
  const sec = profile.eau <= -1;
  return [
    {
      period: 'Août – septembre',
      title: 'Préparer sans retourner',
      detail: lourd
        ? 'Décompacter à la grelinette hors période humide, ne jamais travailler la terre lourde détrempée, puis couvrir de 5 cm de compost mûr.'
        : 'Faucher ras, laisser la matière sur place et couvrir de 5 cm de compost mûr : le sol léger se structure par le haut.',
    },
    {
      period: 'Octobre – novembre',
      title: 'Planter à racines nues',
      detail: `Plantation des ligneux des ${zoneCount || 1} zone${zoneCount > 1 ? 's' : ''} en racines nues (moins cher, meilleur enracinement), pralinage systématique, collet au niveau du sol.`,
    },
    {
      period: 'À la plantation',
      title: 'Pailler puis oublier',
      detail: sec
        ? 'Cuvette d’arrosage + 10 cm de paillage (BRF ou paille) : deux arrosages copieux par mois la première année, aucun ensuite.'
        : '8 cm de paillage sur sol ressuyé, sans contact avec le collet. Un arrosage à la plantation, puis en cas de canicule seulement.',
    },
    {
      period: 'Mars',
      title: 'Semer les strates basses',
      detail: 'Semis des herbacées et couvre-sol sur sol ressuyé, sans apport : la fertilisation favorise les rudérales et perd la prairie fleurie.',
    },
    {
      period: 'Année 1 à 3',
      title: 'Observer avant de corriger',
      detail: 'Une fauche tardive annuelle (après le 15 juillet), export du foin, aucun désherbage sélectif. On ne remplace un sujet qu’après deux étés d’observation.',
    },
  ];
}

/* ── Triptyque d'usage ────────────────────────────────────────────────────── */

import { POTAGER_KB, type PaletteUsage } from './plantPaletteKb';

export interface UsagePick extends ScoredSpecies {
  /** Note ajustée : pour le potager, la fenêtre thermique mesurée compte aussi. */
  fit: number;
  /** Une ligne de justification, formulée pour le propriétaire. */
  why: string;
}

/**
 * Les meilleures espèces d'une famille d'usage pour un profil donné.
 * Le potager tient compte de la température mesurée : une culture dont la
 * fenêtre de semis n'est pas ouverte est proposée plus bas, avec sa fenêtre.
 */
export function topByUsage(
  profile: SiteProfile,
  usage: PaletteUsage,
  n = 5,
  opts?: { soilTempC?: number | null; airMeanC?: number | null; exclude?: string[] },
): UsagePick[] {
  const excluded = new Set(opts?.exclude ?? []);
  const source = usage === 'potager' ? POTAGER_KB : PALETTE_KB.filter((s) => s.usages.includes(usage));
  const temp = opts?.soilTempC ?? opts?.airMeanC ?? null;

  return source
    .filter((s) => !s.caution && !excluded.has(s.id))
    .map((s) => {
      const scored = scoreSpecies(profile, s);
      let fit = scored.score;
      let why = s.reason;

      if (usage === 'potager' && s.sowing) {
        if (temp == null) {
          why = `${s.reason} · ${s.sowing.window}.`;
        } else if (temp < s.sowing.soilMinC) {
          fit -= 18;
          why = `Fenêtre pas encore ouverte : il lui faut ${s.sowing.soilMinC} °C, le lieu mesure ${temp.toFixed(0)} °C. ${s.sowing.window}.`;
        } else if (temp > s.sowing.airMaxC) {
          fit -= 22;
          why = `Décroche au-delà de ${s.sowing.airMaxC} °C ; le lieu mesure ${temp.toFixed(0)} °C — à décaler ou à ombrer.`;
        } else {
          fit += 8;
          why = `Fenêtre ouverte ici (${temp.toFixed(0)} °C mesurés). ${s.sowing.window}.`;
        }
      }

      return { ...scored, fit: Math.max(0, Math.min(100, Math.round(fit))), why };
    })
    .sort((a, b) => b.fit - a.fit || (a.species.origin === 'indigene' ? -1 : 1))
    .slice(0, n);
}
