export type PhTestId = 'bandelette' | 'phmetre';
export type PhClassId =
  | 'tres_acide'
  | 'acide'
  | 'faiblement_acide'
  | 'neutre'
  | 'basique'
  | 'tres_basique';

export const PH_MIN = 4;
export const PH_MAX = 9;
export const PH_STEP = 0.1;

export interface PhClass {
  id: PhClassId;
  label: string;
  short: string;
  range: [number, number];
  color: string;
  verb: string;
  /** Lecture agronomique : disponibilité des éléments nutritifs. */
  nutrients: string;
  /** Végétaux adaptés / indicateurs. */
  plants: string;
  /** Conduite conseillée. */
  advice: string;
}

/** Échelle de lecture du pH — bornes agronomiques usuelles (carnet Méthode D.S.). */
export const PH_CLASSES: PhClass[] = [
  {
    id: 'tres_acide',
    label: 'Très acide',
    short: 'Très acide',
    range: [PH_MIN, 5.0],
    color: '#c94a3a',
    verb: 'Le sol brûle · nutriments bloqués',
    nutrients:
      'Phosphore, calcium et magnésium très peu disponibles ; l’aluminium et le manganèse deviennent toxiques pour les racines.',
    plants:
      'Terrain de prédilection des terres de bruyère : rhododendrons, azalées, camélias, myrtilliers, bruyères, fougères.',
    advice:
      'Ne pas chercher à tout corriger : composer avec des végétaux acidophiles, et n’envisager un chaulage léger que si l’usage l’exige.',
  },
  {
    id: 'acide',
    label: 'Acide',
    short: 'Acide',
    range: [5.0, 6.0],
    color: '#d97a2b',
    verb: 'Sol filtrant · vie ralentie',
    nutrients:
      'Disponibilité du phosphore réduite, lessivage rapide des bases ; l’activité bactérienne est freinée au profit des champignons.',
    plants:
      'Hortensias bleus, érables du Japon, pins, châtaigniers, ajoncs, digitales, genêts.',
    advice:
      'Nourrir par la matière organique (compost mûr, mulch) plutôt que par les engrais minéraux ; un amendement calcique lent peut remonter doucement le pH.',
  },
  {
    id: 'faiblement_acide',
    label: 'Faiblement acide',
    short: 'Faibl. acide',
    range: [6.0, 6.8],
    color: '#e4b64a',
    verb: 'La zone de confort du jardin',
    nutrients:
      'Optimum de disponibilité pour la grande majorité des éléments nutritifs (azote, phosphore, potasse, oligo-éléments).',
    plants:
      'La plupart des vivaces, arbustes d’ornement, rosiers, arbres fruitiers et légumes s’y développent sans contrainte.',
    advice:
      'Situation à préserver : couverture permanente du sol, apports organiques réguliers, aucune correction nécessaire.',
  },
  {
    id: 'neutre',
    label: 'Neutre',
    short: 'Neutre',
    range: [6.8, 7.2],
    color: '#6b9a3b',
    verb: 'Équilibre · disponibilité maximale',
    nutrients:
      'Équilibre idéal : nutriments et vie microbienne au maximum de leur efficacité, structure grumeleuse favorisée.',
    plants:
      'Palette la plus large possible — c’est le pH recherché par la plupart des végétaux d’ornement.',
    advice:
      'Maintenir sans intervenir : éviter le tassement et les sols nus, qui déstabilisent cet équilibre.',
  },
  {
    id: 'basique',
    label: 'Basique',
    short: 'Basique',
    range: [7.2, 8.0],
    color: '#3e8074',
    verb: 'Sol calcaire · fer moins accessible',
    nutrients:
      'Le fer, le manganèse et le zinc se bloquent progressivement : risque de chlorose (feuilles jaunissantes à nervures vertes).',
    plants:
      'Lilas, buis, cotonéasters, lavandes, sauges, viornes, cornouillers mâles, arbres de Judée.',
    advice:
      'Renoncer aux espèces acidophiles ; corriger par des apports organiques acidifiants et des chélates de fer en cas de chlorose déclarée.',
  },
  {
    id: 'tres_basique',
    label: 'Très basique',
    short: 'Très basique',
    range: [8.0, PH_MAX],
    color: '#2f5d7a',
    verb: 'Calcaire actif · carences visibles',
    nutrients:
      'Blocage marqué du fer, du phosphore et des oligo-éléments ; le calcaire actif domine la chimie du sol.',
    plants:
      'Végétaux franchement calcicoles : oliviers, amandiers, buddleias, chèvrefeuilles, iris, cistes, sedums.',
    advice:
      'Ne pas lutter contre la roche mère : bâtir la palette sur des calcicoles et travailler la réserve organique de surface.',
  },
];

export const PH_CLASS_MAP: Record<PhClassId, PhClass> = PH_CLASSES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {} as Record<PhClassId, PhClass>);

export const PH_ORDER: PhClassId[] = PH_CLASSES.map((c) => c.id);

/** Dégradé de référence de l'échelle pH (4 → 9). */
export const PH_GRADIENT =
  'linear-gradient(90deg,#c94a3a 0%,#d97a2b 22%,#e4b64a 44%,#6b9a3b 58%,#3e8074 78%,#2f5d7a 100%)';

export const classifyPh = (ph: number): PhClass => {
  const v = Math.min(PH_MAX, Math.max(PH_MIN, ph));
  for (const c of PH_CLASSES) {
    if (v >= c.range[0] && v < c.range[1]) return c;
  }
  return PH_CLASSES[PH_CLASSES.length - 1];
};

export const phPercent = (ph: number) =>
  ((Math.min(PH_MAX, Math.max(PH_MIN, ph)) - PH_MIN) / (PH_MAX - PH_MIN)) * 100;

export interface PhTest {
  id: PhTestId;
  letter: 'A' | 'B';
  title: string;
  subtitle: string;
  optional?: boolean;
  material: string;
  steps: string[];
  pitfall: string;
  /** Liens vidéo (1 à 3) — à compléter dès réception des URLs. */
  videos: { label: string; url: string; angle?: string }[];
}

export const PH_TESTS: PhTest[] = [
  {
    id: 'bandelette',
    letter: 'A',
    title: 'Bandelette / kit colorimétrique',
    subtitle: 'La terre change la couleur du papier',
    material: 'Bandelettes pH, eau déminéralisée, verre transparent, nuancier du kit.',
    steps: [
      'Prélevez une cuillère de terre humide sur l’un de vos prélèvements, sans cailloux ni racines.',
      'Mélangez-la à deux volumes d’eau déminéralisée dans un verre, remuez puis laissez reposer 10 minutes.',
      'Trempez la bandelette dans le liquide clarifié pendant quelques secondes.',
      'Comparez immédiatement la teinte au nuancier et reportez la valeur lue.',
    ],
    pitfall:
      'Jamais d’eau du robinet : elle est souvent calcaire et fait mécaniquement grimper le pH lu.',
    videos: [
      {
        label: 'Truffaut · Tester la terre de mon jardin',
        url: 'https://youtu.be/jIeS6Kfpt5g',
        angle: 'Le regard jardinier : le geste du test pH pas à pas, avec le matériel du commerce.',
      },
      {
        label: 'pH du sol : comment le connaître ?',
        url: 'https://youtu.be/ATBwDzRjMCc',
        angle: 'Le regard méthodique : les différentes façons de mesurer et leurs limites.',
      },
      {
        label: 'Tester l’acidité de votre sol avec des produits du quotidien',
        url: 'https://youtu.be/PB9HNnOItU0',
        angle: 'Le regard maison : vinaigre et bicarbonate pour un test rapide, sans matériel.',
      },
    ],
  },
  {
    id: 'phmetre',
    letter: 'B',
    title: 'pHmètre électronique',
    subtitle: 'Lecture chiffrée · plus fine — optionnel',
    optional: true,
    material: 'pHmètre de sol ou de liquide, solution de calibration, eau déminéralisée.',
    steps: [
      'Calibrez la sonde avec la solution étalon fournie, puis rincez-la à l’eau déminéralisée.',
      'Préparez une boue de terre humide (deux tiers terre, un tiers eau déminéralisée).',
      'Insérez la sonde au cœur de la boue et attendez la stabilisation de l’affichage.',
      'Notez la valeur stabilisée, rincez la sonde avant le prélèvement suivant.',
    ],
    pitfall:
      'Une sonde non rincée entre deux prélèvements transporte le pH du point précédent : le contraste entre zones disparaît.',
    videos: [],
  },
];

export const PH_TEST_LABELS: Record<PhTestId, string> = {
  bandelette: 'Bandelette / kit (A)',
  phmetre: 'pHmètre (B)',
};

export interface PhAggregate {
  counts: Record<PhClassId, number>;
  filled: number;
  average: number | null;
  min: number | null;
  max: number | null;
  amplitude: number;
  dominant: PhClassId | null;
  contrasted: boolean;
}

export const aggregatePh = (values: (number | null | undefined)[]): PhAggregate => {
  const counts = PH_ORDER.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {} as Record<PhClassId, number>);

  const nums = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  nums.forEach((v) => {
    counts[classifyPh(v).id] += 1;
  });

  if (nums.length === 0) {
    return {
      counts,
      filled: 0,
      average: null,
      min: null,
      max: null,
      amplitude: 0,
      dominant: null,
      contrasted: false,
    };
  }

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const average = nums.reduce((a, b) => a + b, 0) / nums.length;
  const best = Math.max(...PH_ORDER.map((id) => counts[id]));
  const top = PH_ORDER.filter((id) => counts[id] === best);

  return {
    counts,
    filled: nums.length,
    average,
    min,
    max,
    amplitude: max - min,
    dominant: top.length === 1 ? top[0] : classifyPh(average).id,
    contrasted: max - min > 1 || top.length > 1,
  };
};
