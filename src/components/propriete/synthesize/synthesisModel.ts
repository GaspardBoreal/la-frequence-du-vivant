import type { PropertyObservationState } from '@/hooks/propriete/usePropertyObservation';
import type { SoilReading } from '@/components/propriete/analyze/soilReading';
import type { ConcordanceDetail, PoleScore } from '@/lib/plantIndicatorKb';
import { ICG_BAND_LABEL, poleScore } from '@/lib/plantIndicatorKb';
import type {
  ExposureId,
  HumidityId,
  SynthesisItem,
  WindId,
} from '@/hooks/propriete/usePropertySynthesis';

/* ------------------------------------------------------------------ */
/* Sélecteurs de l'Étape 4 — Contexte du site (méthode D.S. p. 14)     */
/* ------------------------------------------------------------------ */

export const EXPOSURE_OPTIONS: { id: ExposureId; label: string; icon: string; hint: string }[] = [
  { id: 'soleil', label: 'Ensoleillé', icon: '☀️', hint: '6 h de soleil direct ou plus' },
  { id: 'mi_ombre', label: 'Mi-ombre', icon: '⛅', hint: 'Soleil filtré, 3 à 6 h directes' },
  { id: 'ombre', label: 'Ombragé', icon: '☁️', hint: 'Moins de 3 h de soleil direct' },
];

export const WIND_OPTIONS: { id: WindId; label: string; icon: string; hint: string }[] = [
  { id: 'faible', label: 'Abrité', icon: '🍃', hint: 'Site protégé, air calme' },
  { id: 'moyen', label: 'Ventilé', icon: '🌬️', hint: 'Brises régulières, pas de rafales' },
  { id: 'fort', label: 'Exposé', icon: '💨', hint: 'Vents forts ou salins fréquents' },
];

export const HUMIDITY_OPTIONS: { id: HumidityId; label: string; icon: string; hint: string }[] = [
  { id: 'sec', label: 'Sec', icon: '🔆', hint: 'Ressuie vite, réserve utile faible' },
  { id: 'frais', label: 'Frais', icon: '🌿', hint: 'Humidité équilibrée toute l’année' },
  { id: 'humide', label: 'Humide', icon: '💧', hint: 'Stagnation ou nappe proche' },
];

export interface SelectorSuggestion<T> {
  value: T | null;
  because: string | null;
}

export interface SelectorSuggestions {
  exposure: SelectorSuggestion<ExposureId>;
  wind: SelectorSuggestion<WindId>;
  humidity: SelectorSuggestion<HumidityId>;
}

/**
 * L'Étape 1 relève des *sources* (un mur, une haie, une gouttière) mais jamais
 * une intensité. L'Étape 4 déduit une proposition, que l'utilisateur confirme.
 */
export function deduceSelectors(
  obs?: PropertyObservationState | null,
  soil?: SoilReading | null,
): SelectorSuggestions {
  const a = obs?.answers ?? {};
  const has = (block: string, v: string) => (a[block] ?? []).includes(v);
  const count = (block: string) => (a[block] ?? []).length;

  // Exposition — nombre d'ombres portées + ombre permanente signalée
  let exposure: ExposureId | null = null;
  let exposureWhy: string | null = null;
  if (has('terrain', 'ombre_permanente')) {
    exposure = 'ombre';
    exposureWhy = 'ombre permanente signalée en Étape 1';
  } else if (count('sun') >= 2) {
    exposure = 'mi_ombre';
    exposureWhy = `${count('sun')} sources d’ombre portée relevées`;
  } else if (count('sun') === 1) {
    exposure = 'mi_ombre';
    exposureWhy = 'une ombre portée relevée en Étape 1';
  } else if (obs?.completed_at) {
    exposure = 'soleil';
    exposureWhy = 'aucune ombre portée relevée en Étape 1';
  }

  // Vent — brise-vents relevés, vent salin, contexte littoral / montagne
  let wind: WindId | null = null;
  let windWhy: string | null = null;
  if (has('terrain', 'vent_salin') || has('context', 'littoral')) {
    wind = 'fort';
    windWhy = has('terrain', 'vent_salin') ? 'vent salin signalé' : 'contexte littoral';
  } else if (count('wind') >= 2) {
    wind = 'faible';
    windWhy = `${count('wind')} brise-vents relevés (haies, murs, bâti)`;
  } else if (count('wind') === 1) {
    wind = 'moyen';
    windWhy = 'un seul brise-vent relevé';
  } else if (has('context', 'montagne') || has('relief', 'pentu')) {
    wind = 'moyen';
    windWhy = 'relief ouvert relevé en Étape 1';
  }

  // Humidité — eau observée, croisée avec la texture dominante des prélèvements
  let humidity: HumidityId | null = null;
  let humidityWhy: string | null = null;
  if (has('water', 'stagnation') || has('terrain', 'inondation')) {
    humidity = 'humide';
    humidityWhy = 'stagnation ou inondation relevée en Étape 1';
  } else if (has('water', 'sec') || has('terrain', 'secheresse')) {
    humidity = 'sec';
    humidityWhy = 'sécheresse relevée en Étape 1';
  } else if (has('water', 'humide')) {
    humidity = 'humide';
    humidityWhy = 'zone humide relevée en Étape 1';
  } else if (soil?.texture?.dominant === 'argile') {
    humidity = 'frais';
    humidityWhy = 'texture argileuse dominante (Étape 2)';
  } else if (soil?.texture?.dominant === 'sable') {
    humidity = 'sec';
    humidityWhy = 'texture sableuse dominante (Étape 2)';
  } else if (soil?.texture?.dominant === 'limon') {
    humidity = 'frais';
    humidityWhy = 'texture limoneuse dominante (Étape 2)';
  }

  return {
    exposure: { value: exposure, because: exposureWhy },
    wind: { value: wind, because: windWhy },
    humidity: { value: humidity, because: humidityWhy },
  };
}

export const exposureLabel = (id?: ExposureId | null) =>
  EXPOSURE_OPTIONS.find((o) => o.id === id)?.label ?? null;
export const windLabel = (id?: WindId | null) =>
  WIND_OPTIONS.find((o) => o.id === id)?.label ?? null;
export const humidityLabel = (id?: HumidityId | null) =>
  HUMIDITY_OPTIONS.find((o) => o.id === id)?.label ?? null;

/* ------------------------------------------------------------------ */
/* Carte d'identité écologique                                         */
/* ------------------------------------------------------------------ */

export interface IdentityLine {
  key: string;
  label: string;
  value: string;
  origin: string;
}

export interface SynthesisModel {
  identity: IdentityLine[];
  /** Phrase de portrait générée par règles (repli si l'IA n'a pas tourné). */
  portraitFallback: string;
  /** Propositions déterministes, servant de socle avant passage IA. */
  ruleAtouts: SynthesisItem[];
  ruleContraintes: SynthesisItem[];
  ruleVigilances: SynthesisItem[];
  /** Étapes non terminées, à signaler honnêtement. */
  missing: string[];
}

interface BuildArgs {
  propertyName: string;
  commune?: string | null;
  observation?: PropertyObservationState | null;
  soil?: SoilReading | null;
  soilCompleted?: boolean;
  floraCompleted?: boolean;
  observationCompleted?: boolean;
  observedPlants: number;
  poleScores: PoleScore[];
  concordance?: ConcordanceDetail | null;
  speciesTotal?: number | null;
  exposure?: ExposureId | null;
  wind?: WindId | null;
  humidity?: HumidityId | null;
}

const item = (text: string, because: string): SynthesisItem => ({
  text,
  because,
  source: 'rule',
});

export function buildSynthesisModel(args: BuildArgs): SynthesisModel {
  const a = args.observation?.answers ?? {};
  const has = (block: string, v: string) => (a[block] ?? []).includes(v);
  const soil = args.soil;
  const c = args.concordance;

  const identity: IdentityLine[] = [];
  const contexts = a.context ?? [];
  if (contexts.length)
    identity.push({
      key: 'context',
      label: 'Contexte',
      value: contexts.join(' · '),
      origin: 'Étape 1',
    });
  const relief = a.relief ?? [];
  if (relief.length)
    identity.push({ key: 'relief', label: 'Relief', value: relief.join(' · '), origin: 'Étape 1' });
  if (args.exposure)
    identity.push({
      key: 'exposure',
      label: 'Exposition',
      value: exposureLabel(args.exposure)!,
      origin: 'Étape 4',
    });
  if (args.wind)
    identity.push({ key: 'wind', label: 'Vent', value: windLabel(args.wind)!, origin: 'Étape 4' });
  if (args.humidity)
    identity.push({
      key: 'humidity',
      label: 'Humidité',
      value: humidityLabel(args.humidity)!,
      origin: 'Étape 4',
    });
  if (soil?.sentence && soil.readings.length)
    identity.push({ key: 'soil', label: 'Sol', value: soil.sentence.replace(/\.$/, ''), origin: 'Étape 2' });
  if (args.observedPlants > 0)
    identity.push({
      key: 'flora',
      label: 'Flore bio-indicatrice',
      value: `${args.observedPlants} plante${args.observedPlants > 1 ? 's' : ''} relevée${args.observedPlants > 1 ? 's' : ''}`,
      origin: 'Étape 3',
    });
  if (c)
    identity.push({
      key: 'icg',
      label: 'Cohérence sol/flore',
      value: `ICG ${c.icg}/100 — ${ICG_BAND_LABEL[c.band]}`,
      origin: 'Étape 3',
    });
  if (args.speciesTotal)
    identity.push({
      key: 'species',
      label: 'Biodiversité mesurée',
      value: `${args.speciesTotal} espèces observées`,
      origin: 'Science participative',
    });

  /* ---------------- Portrait de repli ---------------- */
  const bits: string[] = [];
  bits.push(
    `${args.propertyName}${args.commune ? `, à ${args.commune},` : ''} se lit d'abord par son contexte${
      contexts.length ? ` ${contexts.join(' et ')}` : ''
    }${relief.length ? ` et son relief ${relief.join(', ')}` : ''}.`,
  );
  if (args.exposure || args.wind || args.humidity) {
    const ctx = [
      args.exposure ? `une exposition ${exposureLabel(args.exposure)!.toLowerCase()}` : null,
      args.wind ? `un site ${windLabel(args.wind)!.toLowerCase()}` : null,
      args.humidity ? `une ambiance ${humidityLabel(args.humidity)!.toLowerCase()}` : null,
    ].filter(Boolean);
    bits.push(`Le site présente ${ctx.join(', ')}.`);
  }
  if (soil?.sentence && soil.readings.length) bits.push(soil.sentence);
  if (c)
    bits.push(
      `La confrontation du sol et de la flore donne un indice de cohérence globale de ${c.icg}/100 (${ICG_BAND_LABEL[c.band].toLowerCase()}), sur ${c.evaluated}/8 critères réellement évalués — fiabilité ${c.reliability} %.`,
    );
  const portraitFallback = bits.join(' ');

  /* ---------------- Atouts / contraintes / vigilances ---------------- */
  const ruleAtouts: SynthesisItem[] = [];
  const ruleContraintes: SynthesisItem[] = [];
  const ruleVigilances: SynthesisItem[] = [];

  if (soil?.structure.dominant === 'grumeleuse')
    ruleAtouts.push(item('Structure grumeleuse : sol aéré, racines à l’aise', 'test bêche, Étape 2'));
  if ((soil?.life.union?.length ?? 0) >= 2)
    ruleAtouts.push(
      item('Vie du sol active : décomposition et brassage en cours', 'signes de vie relevés, Étape 2'),
    );
  if (has('vegetation', 'dense'))
    ruleAtouts.push(item('Couvert végétal dense : sol protégé de l’érosion', 'végétation, Étape 1'));
  if (has('vegetation', 'saine'))
    ruleAtouts.push(item('Végétation en bonne santé apparente', 'végétation, Étape 1'));
  if ((a.wind ?? []).length >= 2)
    ruleAtouts.push(item('Brise-vents en place : microclimat déjà tempéré', 'vent, Étape 1'));
  if (args.speciesTotal && args.speciesTotal > 50)
    ruleAtouts.push(
      item(
        `${args.speciesTotal} espèces déjà observées ici : socle de biodiversité solide`,
        'science participative',
      ),
    );

  if (soil?.structure.dominant === 'compacte')
    ruleContraintes.push(item('Sol compact : infiltration et enracinement limités', 'test bêche, Étape 2'));
  if (soil?.structure.dominant === 'particulaire')
    ruleContraintes.push(
      item('Structure particulaire : sol battant, sensible à l’érosion', 'test bêche, Étape 2'),
    );
  if (has('terrain', 'tassement'))
    ruleContraintes.push(item('Tassement constaté sur le terrain', 'atteintes, Étape 1'));
  if (has('terrain', 'secheresse') || args.humidity === 'sec')
    ruleContraintes.push(item('Contrainte hydrique estivale', 'eau, Étape 1'));
  if (has('water', 'stagnation'))
    ruleContraintes.push(item('Stagnation d’eau : asphyxie racinaire possible', 'eau, Étape 1'));
  if (soil?.ph?.average != null && soil.ph.average <= 5.5)
    ruleContraintes.push(item('Sol acide : disponibilité réduite de certains éléments', 'pH, Étape 2'));
  if (soil?.ph?.average != null && soil.ph.average >= 7.8)
    ruleContraintes.push(item('Sol calcaire : risque de chlorose sur essences acidiphiles', 'pH, Étape 2'));

  if (has('terrain', 'pollution'))
    ruleVigilances.push(item('Suspicion de pollution : analyse en laboratoire à prévoir', 'atteintes, Étape 1'));
  if (has('terrain', 'pietinement'))
    ruleVigilances.push(item('Piétinement : canaliser les circulations', 'atteintes, Étape 1'));
  if (has('vegetation', 'malade'))
    ruleVigilances.push(item('Végétation malade : identifier le pathogène avant plantation', 'végétation, Étape 1'));
  if (has('terrain', 'sel') || has('terrain', 'vent_salin'))
    ruleVigilances.push(item('Contrainte saline : choisir des essences tolérantes', 'atteintes, Étape 1'));
  if (c && c.reliability < 75)
    ruleVigilances.push(
      item(
        `Fiabilité du diagnostic à ${c.reliability} % : compléter les tests manquants avant décision`,
        `${8 - c.evaluated} critère(s) non évalué(s)`,
      ),
    );
  if (soil && soil.incomplete.length)
    ruleVigilances.push(
      item(
        `Prélèvement(s) incomplet(s) : ${soil.incomplete.join(', ')}`,
        'Étape 2',
      ),
    );

  const missing: string[] = [];
  if (!args.observationCompleted) missing.push('Étape 1 · J’observe non scellée');
  if (!args.soilCompleted) missing.push('Étape 2 · J’analyse le sol non scellée');
  if (!args.floraCompleted) missing.push('Étape 3 · J’identifie non scellée');

  return { identity, portraitFallback, ruleAtouts, ruleContraintes, ruleVigilances, missing };
}

export const poleTop = (scores: PoleScore[], keys: string[]) =>
  keys
    .map((k) => poleScore(scores, k as any))
    .sort((x, y) => y.points - x.points)[0];
