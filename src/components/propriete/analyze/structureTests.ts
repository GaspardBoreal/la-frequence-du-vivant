export type StructureTestId = 'beche' | 'stabilite';
export type StructureResultId = 'compacte' | 'grumeleuse' | 'particulaire';

export const RESULT_LABELS: Record<StructureResultId, string> = {
  compacte: 'Compacte',
  grumeleuse: 'Grumeleuse',
  particulaire: 'Très meuble (particulaire)',
};

export const RESULT_SHORT: Record<StructureResultId, string> = {
  compacte: 'Compacte',
  grumeleuse: 'Grumeleuse',
  particulaire: 'Très meuble',
};

export const RESULT_ORDER: StructureResultId[] = ['compacte', 'grumeleuse', 'particulaire'];

export interface StructureTest {
  id: StructureTestId;
  letter: 'A' | 'B';
  title: string;
  subtitle: string;
  steps: string[];
  /** Liens vidéo (1 à 3). Laisser vide : les boutons ▶ sont masqués tant qu'aucune URL n'est fournie. */
  videos: { label: string; url: string }[];
}

export const STRUCTURE_TESTS: StructureTest[] = [
  {
    id: 'beche',
    letter: 'A',
    title: 'Test de la bêche',
    subtitle: 'Lire la rupture de la motte',
    steps: [
      'Prélever un bloc de terre à la bêche sur ~20 cm de profondeur, sans le casser.',
      'Le laisser tomber d’environ 1 m sur un sol dur, ou l’ouvrir doucement à la main.',
      'Observer comment il se rompt : bloc massif, agrégats nets, ou effondrement en grains.',
    ],
    videos: [],
  },
  {
    id: 'stabilite',
    letter: 'B',
    title: 'Test de stabilité',
    subtitle: 'Bocal d’eau claire — tenue des agrégats',
    steps: [
      'Prendre un agrégat sec de la taille d’une noix sur le prélèvement.',
      'L’immerger délicatement dans un bocal d’eau claire, sans remuer.',
      'Observer 10 min : bulles d’air (= porosité), tenue de l’agrégat ou dispersion totale.',
    ],
    videos: [],
  },
];

export const TEST_LABELS: Record<StructureTestId, string> = {
  beche: 'Test de la bêche (A)',
  stabilite: 'Test de stabilité (B)',
};

export const dominantResult = (
  results: (StructureResultId | null | undefined)[]
): { dominant: StructureResultId | null; counts: Record<StructureResultId, number>; filled: number; contrasted: boolean } => {
  const counts: Record<StructureResultId, number> = { compacte: 0, grumeleuse: 0, particulaire: 0 };
  let filled = 0;
  results.forEach((r) => {
    if (r && counts[r] !== undefined) {
      counts[r] += 1;
      filled += 1;
    }
  });
  if (filled === 0) return { dominant: null, counts, filled, contrasted: false };
  const max = Math.max(...RESULT_ORDER.map((r) => counts[r]));
  const top = RESULT_ORDER.filter((r) => counts[r] === max);
  return { dominant: top[0], counts, filled, contrasted: top.length > 1 };
};

export const READING: Record<StructureResultId, string> = {
  compacte: 'Sol majoritairement compact : la circulation de l’eau et des racines est freinée. Priorité au décompactage biologique (racines pivotantes, couverts) plutôt qu’au travail mécanique profond.',
  grumeleuse: 'Sol majoritairement grumeleux : structure vivante, agrégats stables et porosité active. Objectif : préserver cet équilibre (couverture permanente, peu de perturbation).',
  particulaire: 'Sol majoritairement très meuble : peu de cohésion, l’eau et les nutriments filent vite. Priorité à la matière organique et à la couverture du sol.',
};
