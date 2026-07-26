export type LifeTestId = 'beche_vivante' | 'vinaigre' | 'sachet';
export type LifeSignId =
  | 'vers'
  | 'galeries'
  | 'racines'
  | 'microfaune'
  | 'mycelium'
  | 'matiere_organique'
  | 'odeur_humus'
  | 'effervescence';

export type LifeClassId = 'discrete' | 'installee' | 'foisonnante';

export interface LifeSign {
  id: LifeSignId;
  label: string;
  short: string;
  color: string;
  verb: string;
  /** Ce que l'on voit / sent sur le terrain. */
  sensory: string;
  /** Ce que cela dit du sol. */
  agronomic: string;
  /** Conduite conseillée / geste à retenir. */
  advice: string;
}

export const LIFE_SIGNS: LifeSign[] = [
  {
    id: 'vers',
    label: 'Vers de terre',
    short: 'Vers',
    color: '#c96a5a',
    verb: 'Les laboureurs du sol',
    sensory:
      'Des corps annelés, roses à brun rouge, qui se contractent à la lumière quand on émiette la bêchée.',
    agronomic:
      'Indicateur roi : ils brassent la matière organique, créent une porosité verticale durable et fabriquent des agrégats stables.',
    advice: 'Compter les individus sur une bêchée 20 × 20 × 20 cm ; sous 5, la vie est en sursis.',
  },
  {
    id: 'galeries',
    label: 'Galeries · taupinières',
    short: 'Galeries',
    color: '#8a6a3f',
    verb: 'L’architecture invisible',
    sensory:
      'Tunnels lisses tapissés de terre plus sombre, monticules en surface, cheminées à fleur de sol.',
    agronomic:
      'Preuve d’une macroporosité biologique : l’eau infiltre, l’air circule, les racines empruntent ces autoroutes.',
    advice: 'Ne pas retourner : chaque labour profond efface des années de creusement.',
  },
  {
    id: 'racines',
    label: 'Racines actives',
    short: 'Racines',
    color: '#6b9a3b',
    verb: 'Le sol tenu par le vivant',
    sensory:
      'Chevelu blanc à crème, souple, réparti dans toute la motte et non seulement en surface.',
    agronomic:
      'Exsudats racinaires = nourriture des micro-organismes. Un chevelu profond signe un sol non bloqué.',
    advice: 'Chercher jusqu’où descendent les radicelles : la limite marque souvent une semelle.',
  },
  {
    id: 'microfaune',
    label: 'Micro-faune visible',
    short: 'Micro-faune',
    color: '#3e8074',
    verb: 'Le peuple des interstices',
    sensory:
      'Cloportes, collemboles sauteurs, mille-pattes, larves : ça bouge dès que l’on ouvre la terre.',
    agronomic:
      'Deuxième maillon des décomposeurs : fragmente la litière et accélère le recyclage des nutriments.',
    advice: 'Observer 2 min sans remuer : la micro-faune fuit la lumière très vite.',
  },
  {
    id: 'mycelium',
    label: 'Mycélium · filaments',
    short: 'Mycélium',
    color: '#a58ec0',
    verb: 'Le réseau fongique',
    sensory:
      'Fils blancs à crème, en toile d’araignée, souvent le long des racines ou sous la litière.',
    agronomic:
      'Signature d’un sol vivant et peu perturbé ; les champignons prolongent le système racinaire et stabilisent l’humus.',
    advice: 'Un sol à mycélium abondant se travaille en surface, jamais en profondeur.',
  },
  {
    id: 'matiere_organique',
    label: 'Matière organique',
    short: 'Mat. organique',
    color: '#7a5c33',
    verb: 'La litière en transformation',
    sensory:
      'Débris de feuilles, brindilles, fragments en cours de fragmentation, terre plus sombre en surface.',
    agronomic:
      'Réserve de fertilité et carburant de la vie biologique ; sa présence limite battance et érosion.',
    advice: 'Maintenir une couverture permanente : sol nu = vie à l’arrêt.',
  },
  {
    id: 'odeur_humus',
    label: 'Odeur d’humus',
    short: 'Odeur',
    color: '#4f7a45',
    verb: 'Le sol qui sent la forêt',
    sensory:
      'Odeur franche de sous-bois après la pluie, sans note de vase, d’œuf pourri ou de moisi.',
    agronomic:
      'Signe d’une activité microbienne aérobie. Une odeur âcre ou soufrée trahit un excès d’eau et l’asphyxie.',
    advice: 'Sentir la motte fraîchement ouverte, à hauteur du visage, avant de l’émietter.',
  },
  {
    id: 'effervescence',
    label: 'Effervescence vinaigre',
    short: 'CO₂',
    color: '#d99a2b',
    verb: 'La terre qui pétille',
    sensory: 'Mousse fine et crépitement audible dès quelques gouttes de vinaigre sur la motte.',
    agronomic:
      'Révèle le calcaire actif : pH élevé, fer et manganèse moins disponibles, végétaux acidophiles à éviter.',
    advice: 'Croiser avec le pH du bloc 5 : l’un explique l’autre.',
  },
];

export const LIFE_SIGN_MAP: Record<LifeSignId, LifeSign> = LIFE_SIGNS.reduce(
  (acc, s) => ((acc[s.id] = s), acc),
  {} as Record<LifeSignId, LifeSign>
);

export const LIFE_SIGN_ORDER: LifeSignId[] = LIFE_SIGNS.map((s) => s.id);

export interface LifeTest {
  id: LifeTestId;
  letter: 'A' | 'B' | 'C';
  title: string;
  subtitle: string;
  steps: string[];
  optional?: boolean;
  /** Liens vidéo (1 à 3). Laisser vide : l'étagère vidéo reste masquée. */
  videos: { label: string; url: string; angle?: string }[];
}

export const LIFE_TESTS: LifeTest[] = [
  {
    id: 'beche_vivante',
    letter: 'A',
    title: 'Test de la bêche vivante',
    subtitle: 'Compter ce qui grouille dans 20 × 20 × 20 cm',
    steps: [
      'Découper un bloc de terre de 20 cm de côté et 20 cm de profondeur, sur un sol frais (ni sec ni détrempé).',
      'Le déposer sur une bâche claire et l’émietter à la main pendant 5 minutes, sans outil.',
      'Compter les vers de terre, puis cocher tous les autres indices repérés (galeries, radicelles, micro-faune, mycélium).',
    ],
    videos: [],
  },
  {
    id: 'vinaigre',
    letter: 'B',
    title: 'Test du vinaigre',
    subtitle: 'Effervescence = calcaire actif',
    steps: [
      'Prélever une petite motte sèche du même échantillon et la poser dans une coupelle.',
      'Verser quelques gouttes de vinaigre blanc directement sur la motte.',
      'Écouter et observer : mousse et crépitement = calcaire ; silence = sol décarbonaté.',
    ],
    videos: [],
  },
  {
    id: 'sachet',
    letter: 'C',
    title: 'Test du sachet de thé',
    subtitle: 'Mesurer la vitesse de dégradation',
    optional: true,
    steps: [
      'Enterrer un sachet de thé (ou un carré de coton) à 8 cm de profondeur, repéré par un piquet.',
      'Laisser en place 6 à 8 semaines, en notant la date sur votre carnet.',
      'Déterrer et comparer : plus la dégradation est avancée, plus l’activité biologique est intense.',
    ],
    videos: [],
  },
];

export const LIFE_TEST_LABELS: Record<LifeTestId, string> = {
  beche_vivante: 'Bêche vivante (A)',
  vinaigre: 'Vinaigre · CO₂ (B)',
  sachet: 'Sachet de thé (C)',
};

export interface LifeClass {
  id: LifeClassId;
  label: string;
  color: string;
  verb: string;
  reading: string;
  advice: string;
}

export const LIFE_CLASSES: LifeClass[] = [
  {
    id: 'discrete',
    label: 'Vie discrète',
    color: '#c07a4a',
    verb: 'Le sol respire à peine',
    reading:
      'Peu d’indices, très peu de vers : sol tassé, appauvri en matière organique ou trop souvent mis à nu.',
    advice:
      'Couvrir en permanence, apporter du compost mûr, suspendre tout travail profond une saison entière.',
  },
  {
    id: 'installee',
    label: 'Vie installée',
    color: '#8aa63b',
    verb: 'La dynamique est là',
    reading:
      'Indices variés et population de vers correcte : les cycles fonctionnent, sans être encore optimaux.',
    advice: 'Entretenir : mulch régulier, rotations, limitation du passage d’engins.',
  },
  {
    id: 'foisonnante',
    label: 'Vie foisonnante',
    color: '#2f7d4f',
    verb: 'Un sol en pleine activité',
    reading:
      'Nombreux indices simultanés et forte densité de vers : porosité biologique et fertilité auto-entretenues.',
    advice: 'Ne rien perturber : observer, documenter, et transposer ces pratiques aux zones plus pauvres.',
  },
];

export const LIFE_CLASS_MAP: Record<LifeClassId, LifeClass> = LIFE_CLASSES.reduce(
  (acc, c) => ((acc[c.id] = c), acc),
  {} as Record<LifeClassId, LifeClass>
);

export const LIFE_CLASS_ORDER: LifeClassId[] = ['discrete', 'installee', 'foisonnante'];

/** Barème vers de terre pour une bêchée 20 × 20 × 20 cm. */
export const WORM_MAX = 30;
export const wormClass = (n: number): LifeClassId =>
  n < 5 ? 'discrete' : n <= 15 ? 'installee' : 'foisonnante';

export interface LifeScore {
  /** 0 → 100 */
  score: number;
  klass: LifeClassId;
  signCount: number;
  wormCount: number | null;
}

/**
 * Indice de vie d'un prélèvement : moitié diversité d'indices,
 * moitié densité de vers (plafonnée à 20 individus).
 */
export const scoreLife = (signs: string[] | null | undefined, worms: number | null | undefined): LifeScore => {
  const list = (signs ?? []).filter((s) => LIFE_SIGN_ORDER.includes(s as LifeSignId));
  const signCount = list.length;
  const diversity = Math.min(signCount / 5, 1);
  const wormCount = typeof worms === 'number' && Number.isFinite(worms) ? worms : null;
  const density = wormCount != null ? Math.min(wormCount / 20, 1) : diversity;
  const score = Math.round((diversity * 0.5 + density * 0.5) * 100);
  const klass: LifeClassId = score < 34 ? 'discrete' : score < 67 ? 'installee' : 'foisonnante';
  return { score, klass, signCount, wormCount };
};

export interface LifeAggregate {
  /** nombre de prélèvements renseignés (au moins un indice ou un comptage) */
  filled: number;
  /** occurrences par indice */
  signCounts: Record<LifeSignId, number>;
  /** union des indices présents sur le site */
  union: LifeSignId[];
  /** répartition des classes de vitalité */
  classCounts: Record<LifeClassId, number>;
  dominant: LifeClassId | null;
  averageScore: number | null;
  minScore: number | null;
  maxScore: number | null;
  /** moyenne de vers sur les prélèvements comptés */
  averageWorms: number | null;
  wormSamples: number;
  contrasted: boolean;
}

export const aggregateLife = (
  rows: { signs?: string[] | null; worms?: number | null }[]
): LifeAggregate => {
  const signCounts = LIFE_SIGN_ORDER.reduce(
    (acc, id) => ((acc[id] = 0), acc),
    {} as Record<LifeSignId, number>
  );
  const classCounts: Record<LifeClassId, number> = { discrete: 0, installee: 0, foisonnante: 0 };
  const scores: number[] = [];
  const worms: number[] = [];
  let filled = 0;

  rows.forEach((r) => {
    const list = (r.signs ?? []).filter((s) => LIFE_SIGN_ORDER.includes(s as LifeSignId)) as LifeSignId[];
    const hasWorms = typeof r.worms === 'number' && Number.isFinite(r.worms);
    if (list.length === 0 && !hasWorms) return;
    filled += 1;
    list.forEach((id) => (signCounts[id] += 1));
    if (hasWorms) worms.push(r.worms as number);
    const s = scoreLife(list, r.worms ?? null);
    scores.push(s.score);
    classCounts[s.klass] += 1;
  });

  if (filled === 0) {
    return {
      filled: 0,
      signCounts,
      union: [],
      classCounts,
      dominant: null,
      averageScore: null,
      minScore: null,
      maxScore: null,
      averageWorms: null,
      wormSamples: 0,
      contrasted: false,
    };
  }

  const max = Math.max(...LIFE_CLASS_ORDER.map((c) => classCounts[c]));
  const top = LIFE_CLASS_ORDER.filter((c) => classCounts[c] === max);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const dominant =
    top.length === 1
      ? top[0]
      : averageScore < 34
      ? 'discrete'
      : averageScore < 67
      ? 'installee'
      : 'foisonnante';

  return {
    filled,
    signCounts,
    union: LIFE_SIGN_ORDER.filter((id) => signCounts[id] > 0),
    classCounts,
    dominant,
    averageScore,
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
    averageWorms: worms.length ? worms.reduce((a, b) => a + b, 0) / worms.length : null,
    wormSamples: worms.length,
    contrasted: top.length > 1 || Math.max(...scores) - Math.min(...scores) >= 40,
  };
};
