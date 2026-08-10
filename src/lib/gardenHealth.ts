import type { Consultation } from '@/hooks/propriete/useGardenClinique';

export interface CliniqueAggregates {
  /** hypothèses (nom courant) par consultation */
  hypothesesByConsultation: Record<string, string[]>;
  actionsTotal: number;
  actionsDone: number;
  lastMediaAt: string | null;
}

export interface GardenHealth {
  observation: number;
  traitement: number;
  gueri: number;
  perdu: number;
  /** consultations actives (observation + traitement) */
  active: number;
  totalEver: number;
  severityMean: number | null;
  worst: { label: string; severity: number } | null;
  recoveryRate: number | null;
  /** délai moyen de rétablissement en jours */
  healingDays: number | null;
  actionsTotal: number;
  actionsDone: number;
  actionsRatio: number | null;
  /** pathogènes cités par au moins 2 consultations actives */
  recurring: Array<{ name: string; count: number }>;
  daysSinceLastMedia: number | null;
  /** 0 → 100 : pouls du lieu (100 = jardin sain) */
  pulse: number;
  verdict: string;
  tone: 'sain' | 'surveille' | 'soigne' | 'tendu';
}

const DAY = 1000 * 60 * 60 * 24;

export const HEALTH_TONE: Record<GardenHealth['tone'], string> = {
  sain: 'hsl(var(--ds-forest))',
  surveille: 'hsl(var(--ds-gold))',
  soigne: 'hsl(28 78% 48%)',
  tendu: 'hsl(4 68% 48%)',
};

function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}

export function computeGardenHealth(
  consultations: Consultation[] | undefined,
  agg: CliniqueAggregates | undefined,
): GardenHealth {
  const list = consultations ?? [];
  const observation = list.filter((c) => c.status === 'observation').length;
  const traitement = list.filter((c) => c.status === 'traitement').length;
  const gueri = list.filter((c) => c.status === 'gueri').length;
  const perdu = list.filter((c) => c.status === 'perdu').length;
  const active = observation + traitement;
  const totalEver = list.length;

  const actives = list.filter((c) => c.status === 'observation' || c.status === 'traitement');
  const severities = actives.map((c) => c.severity ?? 0).filter((n) => n > 0);
  const severityMean = severities.length
    ? Math.round((severities.reduce((a, b) => a + b, 0) / severities.length) * 10) / 10
    : null;
  const worstC = actives.slice().sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0))[0];
  const worst = worstC ? { label: worstC.subject_label, severity: worstC.severity ?? 0 } : null;

  const closed = list.filter((c) => c.status === 'gueri' && c.closed_at);
  const healingDays = closed.length
    ? Math.round(
        closed.reduce(
          (a, c) => a + (new Date(c.closed_at!).getTime() - new Date(c.opened_at).getTime()) / DAY,
          0,
        ) / closed.length,
      )
    : null;

  const recoveryRate = totalEver > 0 ? Math.round((gueri / totalEver) * 100) : null;

  const actionsTotal = agg?.actionsTotal ?? 0;
  const actionsDone = agg?.actionsDone ?? 0;
  const actionsRatio = actionsTotal > 0 ? Math.round((actionsDone / actionsTotal) * 100) : null;

  // Foyers récurrents : sur les consultations actives uniquement
  const counter = new Map<string, number>();
  const byC = agg?.hypothesesByConsultation ?? {};
  actives.forEach((c) => {
    const names = Array.from(new Set(byC[c.id] ?? []));
    names.forEach((n) => counter.set(n, (counter.get(n) ?? 0) + 1));
  });
  const recurring = Array.from(counter.entries())
    .filter(([, n]) => n >= 2)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const daysSinceLastMedia = agg?.lastMediaAt
    ? Math.max(0, Math.floor((Date.now() - new Date(agg.lastMediaAt).getTime()) / DAY))
    : null;

  // Pouls : on part de 100, on retire le poids de sévérité des sujets actifs,
  // on pénalise l'inaction, on crédite les rétablissements.
  let pulse = 100;
  actives.forEach((c) => { pulse -= 6 + (c.severity ?? 0) * 3; });
  if (actionsTotal > 0 && actionsDone === 0 && active > 0) pulse -= 8;
  if (recurring.length) pulse -= 5 * recurring.length;
  if (perdu) pulse -= 4 * perdu;
  if (gueri) pulse += Math.min(10, gueri * 3);
  pulse = Math.max(0, Math.min(100, Math.round(pulse)));

  const tone: GardenHealth['tone'] =
    active === 0 ? 'sain' : pulse >= 70 ? 'surveille' : pulse >= 45 ? 'soigne' : 'tendu';

  let verdict: string;
  if (active === 0) {
    verdict = gueri > 0
      ? `Aucun sujet en soin — ${plural(gueri, 'rétablissement', 'rétablissements')} au compteur.`
      : 'Aucun sujet en soin aujourd’hui : le jardin va bien.';
  } else if (traitement === 0) {
    verdict = `${plural(observation, 'sujet sous surveillance', 'sujets sous surveillance')}, aucun traitement engagé.`;
  } else if (observation === 0) {
    verdict = `${plural(traitement, 'sujet en traitement', 'sujets en traitement')} : les gestes sont en cours.`;
  } else {
    verdict = `${plural(observation, 'sujet sous surveillance', 'sujets sous surveillance')} · ${plural(traitement, 'en traitement', 'en traitement')}.`;
  }

  return {
    observation, traitement, gueri, perdu, active, totalEver,
    severityMean, worst, recoveryRate, healingDays,
    actionsTotal, actionsDone, actionsRatio,
    recurring, daysSinceLastMedia, pulse, verdict, tone,
  };
}
