/**
 * Agrégation des réponses du parcours d'accueil (`proprietes.onboarding_preferences`).
 * Fonctions pures : aucune requête, aucun état — elles se testent et se relisent.
 */

import { DEFAULT_QUESTIONS } from '@/config/onboarding/defaultSequence';
import type { OnboardingOption } from '@/config/onboarding/schema';

export interface OnboardingPropertyRow {
  id: string;
  nom: string;
  ville: string | null;
  departement: string | null;
  created_at: string;
  onboarding_preferences: unknown;
}

/** Un jardin, ses réponses aplaties et le jardin-exemple retenu. */
export interface GardenAnswers {
  id: string;
  nom: string;
  ville: string | null;
  departement: string | null;
  createdAt: string;
  answers: Record<string, string | number | string[]>;
  /** Jardin-exemple choisi (« Lequel vous ressemble le plus ? »). */
  example: {
    stableId: string | null;
    titre: string | null;
    vignette: string | null;
    refused: boolean;
  } | null;
  hasOnboarding: boolean;
}

const META_KEYS = new Set([
  'answers', 'persona', 'version', 'completed_at', 'updated_at', 'source',
  'persona_label', 'flow_source', 'flow_version', 'garden_example', 'gestures',
  'gestures_meta', 'portrait',
]);

const asString = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

/** Aplatit une ligne `proprietes` en réponses exploitables. */
export const toGardenAnswers = (row: OnboardingPropertyRow): GardenAnswers => {
  const prefs = (row.onboarding_preferences && typeof row.onboarding_preferences === 'object'
    ? row.onboarding_preferences
    : {}) as Record<string, unknown>;
  const nested = prefs.answers && typeof prefs.answers === 'object'
    ? (prefs.answers as Record<string, unknown>)
    : null;
  const source = nested ?? prefs;

  const answers: Record<string, string | number | string[]> = {};
  Object.entries(source).forEach(([k, v]) => {
    if (!nested && META_KEYS.has(k)) return;
    if (typeof v === 'string' || typeof v === 'number') answers[k] = v;
    else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) answers[k] = v as string[];
  });

  const rawExample = prefs.garden_example && typeof prefs.garden_example === 'object'
    ? (prefs.garden_example as Record<string, unknown>)
    : null;

  return {
    id: row.id,
    nom: row.nom,
    ville: row.ville,
    departement: row.departement,
    createdAt: row.created_at,
    answers,
    example: rawExample
      ? {
          stableId: asString(rawExample.stableId) ?? asString(rawExample.stable_id) ?? asString(rawExample.id),
          titre: asString(rawExample.titre),
          vignette: asString(rawExample.vignette) ?? asString(rawExample.thumbnail_url),
          refused: rawExample.refused === true,
        }
      : null,
    hasOnboarding: Object.keys(answers).length > 0,
  };
};

// ---------------------------------------------------------------------------
// Libellés : on retrouve le texte affiché à l'écran, variantes de persona incluses
// ---------------------------------------------------------------------------

const buildLabelIndex = () => {
  const index: Record<string, Record<string, string>> = {};
  const push = (qid: string, options?: OnboardingOption[]) => {
    if (!options) return;
    index[qid] = index[qid] ?? {};
    options.forEach((o) => {
      if (!index[qid][o.value]) index[qid][o.value] = o.label;
    });
  };
  DEFAULT_QUESTIONS.forEach((q) => {
    push(q.id, q.options);
    Object.values(q.variants ?? {}).forEach((v) => push(q.id, v?.options));
  });
  return index;
};

const LABELS = buildLabelIndex();

/** Libellé d'une valeur ; `null` si le code n'existe plus dans le parcours. */
export const optionLabel = (questionId: string, value: string): string | null =>
  LABELS[questionId]?.[value] ?? null;

/** Titre de la question tel qu'il est posé (variante par défaut). */
export const questionTitle = (questionId: string): string =>
  DEFAULT_QUESTIONS.find((q) => q.id === questionId)?.title ?? questionId;

// ---------------------------------------------------------------------------
// Comptages
// ---------------------------------------------------------------------------

export interface TallyItem {
  value: string;
  label: string;
  /** Le code n'a pas de libellé connu : ancienne réponse. */
  legacy: boolean;
  count: number;
  /** Part parmi les jardins ayant répondu à cette question. */
  pct: number;
  gardens: GardenAnswers[];
}

export interface TallyResult {
  questionId: string;
  title: string;
  /** Jardins ayant répondu à cette question. */
  answered: number;
  /** Jardins retenus par les filtres. */
  total: number;
  items: TallyItem[];
}

const sortDesc = (a: TallyItem, b: TallyItem) =>
  b.count - a.count || a.label.localeCompare(b.label, 'fr');

/** Répartition d'une question à choix unique ou multiple. */
export const tally = (
  gardens: GardenAnswers[],
  questionId: string,
  opts?: { title?: string },
): TallyResult => {
  const buckets = new Map<string, GardenAnswers[]>();
  let answered = 0;

  gardens.forEach((g) => {
    const raw = g.answers[questionId];
    const values = Array.isArray(raw)
      ? raw
      : typeof raw === 'string' && raw.trim()
        ? [raw]
        : [];
    if (values.length === 0) return;
    answered += 1;
    new Set(values).forEach((v) => {
      const list = buckets.get(v) ?? [];
      list.push(g);
      buckets.set(v, list);
    });
  });

  const items: TallyItem[] = [...buckets.entries()]
    .map(([value, list]) => {
      const label = optionLabel(questionId, value);
      return {
        value,
        label: label ?? value,
        legacy: label === null,
        count: list.length,
        pct: answered > 0 ? Math.round((list.length / answered) * 100) : 0,
        gardens: list,
      };
    })
    .sort(sortDesc);

  return {
    questionId,
    title: opts?.title ?? questionTitle(questionId),
    answered,
    total: gardens.length,
    items,
  };
};

/** Vignettes « Lequel vous ressemble le plus ? » (jardin-exemple retenu). */
export const tallyExamples = (gardens: GardenAnswers[]): TallyResult => {
  const buckets = new Map<string, { label: string; vignette: string | null; list: GardenAnswers[] }>();
  let answered = 0;

  gardens.forEach((g) => {
    if (!g.example) return;
    answered += 1;
    const key = g.example.refused ? '__refuse__' : (g.example.stableId ?? g.example.titre ?? '__inconnu__');
    const entry = buckets.get(key) ?? {
      label: g.example.refused ? 'Aucun ne me ressemble' : (g.example.titre ?? 'Jardin sans titre'),
      vignette: g.example.refused ? null : g.example.vignette,
      list: [],
    };
    entry.list.push(g);
    if (!entry.vignette && g.example.vignette) entry.vignette = g.example.vignette;
    buckets.set(key, entry);
  });

  const items: TallyItem[] = [...buckets.entries()]
    .map(([value, e]) => ({
      value,
      label: e.label,
      legacy: false,
      count: e.list.length,
      pct: answered > 0 ? Math.round((e.list.length / answered) * 100) : 0,
      gardens: e.list,
    }))
    .sort(sortDesc);

  const vignettes: Record<string, string | null> = {};
  buckets.forEach((e, k) => { vignettes[k] = e.vignette; });
  (items as (TallyItem & { vignette?: string | null })[]).forEach((it) => {
    it.vignette = vignettes[it.value] ?? null;
  });

  return {
    questionId: 'garden_example',
    title: 'Lequel vous ressemble le plus ?',
    answered,
    total: gardens.length,
    items,
  };
};

// ---------------------------------------------------------------------------
// Répartitions chiffrées
// ---------------------------------------------------------------------------

export interface Bucket {
  label: string;
  count: number;
  pct: number;
  gardens: GardenAnswers[];
}

export interface DistributionResult {
  title: string;
  unit: string;
  answered: number;
  total: number;
  median: number | null;
  buckets: Bucket[];
}

export const SURFACE_BREAKS = [50, 200, 500, 1000, 5000];
export const TEMPS_BREAKS = [1, 2, 5, 10];

const bucketLabel = (breaks: number[], i: number, unit: string) => {
  if (i === 0) return `moins de ${breaks[0]} ${unit}`;
  if (i === breaks.length) return `plus de ${breaks[breaks.length - 1]} ${unit}`;
  return `${breaks[i - 1]} – ${breaks[i]} ${unit}`;
};

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Répartition d'une réponse chiffrée en tranches lisibles. */
export const distribution = (
  gardens: GardenAnswers[],
  read: (g: GardenAnswers) => number | null,
  breaks: number[],
  unit: string,
  title: string,
): DistributionResult => {
  const lists: GardenAnswers[][] = Array.from({ length: breaks.length + 1 }, () => []);
  const values: number[] = [];

  gardens.forEach((g) => {
    const v = read(g);
    if (v == null || Number.isNaN(v)) return;
    values.push(v);
    let i = breaks.findIndex((b) => v < b);
    if (i === -1) i = breaks.length;
    lists[i].push(g);
  });

  const answered = values.length;
  return {
    title,
    unit,
    answered,
    total: gardens.length,
    median: median(values),
    buckets: lists.map((list, i) => ({
      label: bucketLabel(breaks, i, unit),
      count: list.length,
      pct: answered > 0 ? Math.round((list.length / answered) * 100) : 0,
      gardens: list,
    })),
  };
};

/** Surface exploitée : surface totale, sinon surface de balcon. */
export const readSurface = (g: GardenAnswers): number | null => {
  const total = g.answers.surface_totale;
  if (typeof total === 'number') return total;
  const balcon = g.answers.surface_balcon;
  if (typeof balcon === 'number') return balcon;
  return null;
};

/** Temps hebdomadaire ; le temps mensuel des sites est ramené à la semaine. */
export const readTempsSemaine = (g: GardenAnswers): number | null => {
  const semaine = g.answers.temps;
  if (typeof semaine === 'number') return semaine;
  const mois = g.answers.temps_mois;
  if (typeof mois === 'number') return Math.round((mois / 4.33) * 10) / 10;
  return null;
};

/** Budget déclaré, ramené à un montant en euros (« illimité » = 20 000). */
export const readBudget = (g: GardenAnswers): number | null => {
  const raw = g.answers.budget;
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return null;
  if (raw === 'illimite') return 20000;
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(n) ? null : n;
};

/** Export CSV du tableau de bord filtré. */
export const dashboardToCsv = (blocks: TallyResult[], distributions: DistributionResult[]): string => {
  const rows: string[][] = [['Question', 'Réponse', 'Nombre', 'Pourcentage', 'Répondants']];
  blocks.forEach((b) => {
    b.items.forEach((it) => {
      rows.push([b.title, it.label, String(it.count), `${it.pct}%`, String(b.answered)]);
    });
  });
  distributions.forEach((d) => {
    d.buckets.forEach((b) => {
      rows.push([d.title, b.label, String(b.count), `${b.pct}%`, String(d.answered)]);
    });
  });
  return rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';'))
    .join('\n');
};
