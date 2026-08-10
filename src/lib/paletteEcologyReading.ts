import type { AxisMatch } from '@/lib/plantIndicatorKb';

export type EcoAxisKey = 'eau' | 'texture' | 'nutrition' | 'ph';

export interface EcoAxisMeta {
  key: EcoAxisKey;
  label: string;
  low: string;
  high: string;
}

export const ECO_AXES: EcoAxisMeta[] = [
  { key: 'eau', label: 'Eau', low: 'Sec', high: 'Humide' },
  { key: 'texture', label: 'Texture', low: 'Sableux', high: 'Argileux' },
  { key: 'nutrition', label: 'Nutrition', low: 'Pauvre', high: 'Riche' },
  { key: 'ph', label: 'pH', low: 'Acide', high: 'Calcaire' },
];

export interface EcoAxisReading {
  axis: EcoAxisMeta;
  /** Cran 1..5 de l'optimum de l'espèce */
  plant: number;
  /** Cran 1..5 de la lecture du sol (null si non documenté) */
  site: number | null;
  /** Écart en crans (0 si non documenté) */
  gap: number;
  /** Sens de l'écart : le sol est en-dessous (-1) ou au-dessus (+1) de l'optimum */
  direction: -1 | 0 | 1;
  match: AxisMatch;
  verdict: string;
  /** Phrase didactique, en clair */
  sentence: string;
  /** Geste de jardin proposé quand il y a un écart */
  suggestion: string | null;
}

/** -3 → +3 ramené sur 5 crans. */
export const toCran = (v: number) => Math.max(1, Math.min(5, Math.round((v + 3) / 1.5) + 1));

const matchOf = (gap: number): AxisMatch => (gap <= 1 ? 'oui' : gap === 2 ? 'partiel' : 'non');

const VERDICT_WORD: Record<AxisMatch, string> = {
  oui: 'Accord',
  partiel: 'Nuance',
  non: 'Écart',
  na: 'Non évalué',
};

/** Phrases par axe et par sens : [sol plus bas que l'optimum, sol plus haut]. */
const SENTENCES: Record<EcoAxisKey, { low: string; high: string; ok: string }> = {
  eau: {
    ok: 'Votre sol tient l’humidité que cette plante recherche.',
    low: 'Votre sol est plus sec que ce que cette plante recherche.',
    high: 'Votre sol reste plus humide que ce que cette plante supporte.',
  },
  texture: {
    ok: 'La texture de votre sol correspond à ce que ses racines aiment.',
    low: 'Votre sol est plus léger et filtrant que sa terre de prédilection.',
    high: 'Votre sol est plus lourd et argileux que sa terre de prédilection.',
  },
  nutrition: {
    ok: 'La richesse de votre sol correspond à ses besoins.',
    low: 'Votre sol est plus pauvre que ce dont elle a besoin pour s’installer.',
    high: 'Votre sol est plus riche en azote qu’elle ne le demande : elle filera en feuilles.',
  },
  ph: {
    ok: 'Le pH de votre sol se situe dans sa plage de confort.',
    low: 'Votre sol est plus acide que sa plage de confort.',
    high: 'Votre sol est plus calcaire que sa plage de confort.',
  },
};

const SUGGESTIONS: Record<EcoAxisKey, { low: string; high: string }> = {
  eau: {
    low: 'Paillez épais et arrosez les deux premiers étés, ou choisissez un emplacement plus frais (pied de haie, exposition nord).',
    high: 'Plantez sur butte ou en bord de pente, et drainez le fond du trou de plantation.',
  },
  texture: {
    low: 'Apportez du compost mûr pour donner du corps et retenir l’eau à la plantation.',
    high: 'Décompactez à la grelinette et incorporez un amendement grossier (broyat, sable de rivière) au trou.',
  },
  nutrition: {
    low: 'Apport organique à la plantation (compost, fumier composté), puis paillage nourricier annuel.',
    high: 'Aucun apport azoté ; associez-la à des plantes gourmandes qui absorberont l’excès.',
  },
  ph: {
    low: 'Un amendement calcique léger (cendre tamisée, lithothamne) rapproche le sol de sa plage.',
    high: 'Paillage acidifiant (aiguilles de pin, écorces) et arrosage à l’eau de pluie.',
  },
};

export function buildEcoAxisReading(
  axis: EcoAxisMeta,
  plantValue: number,
  siteValue: number,
  known: boolean,
): EcoAxisReading {
  const plant = toCran(plantValue);
  if (!known) {
    return {
      axis,
      plant,
      site: null,
      gap: 0,
      direction: 0,
      match: 'na',
      verdict: VERDICT_WORD.na,
      sentence: 'Ce facteur n’est pas encore documenté pour votre sol.',
      suggestion: null,
    };
  }
  const site = toCran(siteValue);
  const delta = site - plant;
  const gap = Math.abs(delta);
  const direction: -1 | 0 | 1 = delta === 0 ? 0 : delta < 0 ? -1 : 1;
  const match = matchOf(gap);
  const sentence =
    match === 'oui'
      ? SENTENCES[axis.key].ok
      : direction < 0
        ? SENTENCES[axis.key].low
        : SENTENCES[axis.key].high;
  const suggestion =
    match === 'oui' ? null : direction < 0 ? SUGGESTIONS[axis.key].low : SUGGESTIONS[axis.key].high;

  return { axis, plant, site, gap, direction, match, verdict: VERDICT_WORD[match], sentence, suggestion };
}

export interface EcoGlobalReading {
  accords: number;
  nuances: number;
  ecarts: number;
  unknown: number;
  title: string;
  sentence: string;
  match: AxisMatch;
}

export function buildEcoGlobalReading(readings: EcoAxisReading[]): EcoGlobalReading {
  const accords = readings.filter((r) => r.match === 'oui').length;
  const nuances = readings.filter((r) => r.match === 'partiel').length;
  const ecarts = readings.filter((r) => r.match === 'non').length;
  const unknown = readings.filter((r) => r.match === 'na').length;

  if (unknown === readings.length) {
    return {
      accords,
      nuances,
      ecarts,
      unknown,
      match: 'na',
      title: 'Sol non documenté',
      sentence:
        'Complétez l’Étape 2 « J’analyse le sol » : les quatre facteurs se confronteront alors à l’exigence de cette espèce.',
    };
  }

  if (ecarts > 0) {
    return {
      accords,
      nuances,
      ecarts,
      unknown,
      match: 'non',
      title: 'Terrain contraire',
      sentence: `${ecarts} facteur${ecarts > 1 ? 's' : ''} s’oppose${ecarts > 1 ? 'nt' : ''} franchement à cette espèce : ne la plantez ici qu’en corrigeant le milieu, ou réservez-la à un autre coin du jardin.`,
    };
  }

  if (nuances > 0) {
    return {
      accords,
      nuances,
      ecarts,
      unknown,
      match: 'partiel',
      title: 'À nuancer',
      sentence: `${accords} facteur${accords > 1 ? 's' : ''} en accord, ${nuances} à surveiller : elle s’installera, avec un geste d’accompagnement à la plantation.`,
    };
  }

  return {
    accords,
    nuances,
    ecarts,
    unknown,
    match: 'oui',
    title: 'Ce sol lui convient',
    sentence:
      'Les facteurs documentés tombent dans sa plage de confort : plantation sereine, sans correction du milieu.',
  };
}

export const GAP_LABEL = (gap: number) => (gap === 0 ? 'Pile dans sa plage' : `${gap} cran${gap > 1 ? 's' : ''} d’écart`);
