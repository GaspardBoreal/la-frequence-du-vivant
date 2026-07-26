export type TextureTestId = 'boudin' | 'sedimentation';
export type TextureResultId = 'sable' | 'limon' | 'argile';
export type BoudinFormId = 'droit' | 'lune' | 'cercle';

/** Libellés exacts du carnet Méthode D.S. (page 7). */
export const TEXTURE_LABELS: Record<TextureResultId, string> = {
  sable: 'Sable à sable limoneux',
  limon: 'Limon sableux à limon moyen',
  argile: 'Limon argileux à argiles',
};

export const TEXTURE_SHORT: Record<TextureResultId, string> = {
  sable: 'Sableux',
  limon: 'Limoneux',
  argile: 'Argileux',
};

export const TEXTURE_VERB: Record<TextureResultId, string> = {
  sable: 'Fuit · granuleux',
  limon: 'Se casse · équilibré',
  argile: 'Se plie · retient',
};

export const TEXTURE_ORDER: TextureResultId[] = ['sable', 'limon', 'argile'];

/** Valeur conservée dans le champ global `texture` (compatibilité étape 3 / exports). */
export const TEXTURE_GLOBAL_VALUE: Record<TextureResultId, string> = {
  sable: 'sablo-limoneux',
  limon: 'limoneux',
  argile: 'argilo-limoneux',
};

export interface TextureTest {
  id: TextureTestId;
  letter: 'A' | 'B';
  title: string;
  subtitle: string;
  optional?: boolean;
  steps: string[];
  /** Liens vidéo (1 à 3). Laisser vide : les boutons ▶ sont masqués tant qu'aucune URL n'est fournie. */
  videos: { label: string; url: string; angle?: string }[];
}

export const TEXTURE_TESTS: TextureTest[] = [
  {
    id: 'boudin',
    letter: 'A',
    title: 'Test du boudin',
    subtitle: 'Rouler, courber, lire la terre',
    steps: [
      'Prélevez de la terre humidifiée sur l’un de vos prélèvements.',
      'Façonnez un boudin d’environ 1 cm de diamètre.',
      'Essayez de le courber doucement entre les doigts.',
      'Observez le résultat et choisissez la classe correspondante.',
    ],
    videos: [
      {
        label: 'Le Jardin Potager Du Bonheur',
        url: 'https://youtu.be/rT8PNkjz638',
        angle: 'Le regard jardinier : le geste au potager, simple et reproductible.',
      },
      {
        label: 'Les Artisans du Végétal',
        url: 'https://youtu.be/k_pBT9uRrnE',
        angle: 'Le regard professionnel : lire et nommer les classes de texture.',
      },
      {
        label: 'Potager Durable · Nicolas',
        url: 'https://youtu.be/yT2zU3gtmPs',
        angle: 'Le regard pédagogique : interpréter le résultat obtenu.',
      },
    ],
  },
  {
    id: 'sedimentation',
    letter: 'B',
    title: 'Test de sédimentation',
    subtitle: 'Bocal · strates sable / limon / argile — optionnel',
    optional: true,
    steps: [
      'Remplissez un bocal au tiers de terre, complétez d’eau claire, refermez.',
      'Agitez énergiquement puis laissez reposer 24 h sans y toucher.',
      'Lisez les strates déposées : sable au fond, limon au milieu, argile au-dessus.',
      'Reportez la classe dominante obtenue pour confirmer le test du boudin.',
    ],
    videos: [],
  },
];

export const TEXTURE_TEST_LABELS: Record<TextureTestId, string> = {
  boudin: 'Test du boudin (A)',
  sedimentation: 'Test de sédimentation (B)',
};

/** Teneur en argile estimée d'après la forme que prend le boudin. */
export const BOUDIN_FORMS: { id: BoudinFormId; label: string; clay: string }[] = [
  { id: 'droit', label: 'Boudin droit', clay: '≈ 10 % d’argile' },
  { id: 'lune', label: 'Boudin en lune', clay: '10 à 30 % d’argile' },
  { id: 'cercle', label: 'Boudin en cercle', clay: '> 30 % d’argile' },
];

export const BOUDIN_FORM_MAP: Record<BoudinFormId, { label: string; clay: string }> =
  BOUDIN_FORMS.reduce((acc, f) => {
    acc[f.id] = { label: f.label, clay: f.clay };
    return acc;
  }, {} as Record<BoudinFormId, { label: string; clay: string }>);

export const TEXTURE_READING: Record<TextureResultId, string> = {
  sable:
    'Sol majoritairement sableux : drainant, léger, il se réchauffe vite mais retient peu l’eau et les nutriments. Priorité à la matière organique, au paillage et à des végétaux sobres en eau.',
  limon:
    'Sol majoritairement limoneux : bon compromis rétention / drainage, facile à travailler. Vigilance sur la battance en surface — maintenir une couverture permanente.',
  argile:
    'Sol majoritairement argileux : forte réserve en eau et en nutriments, mais asphyxiant et lent à ressuyer. Éviter tout travail en conditions humides, favoriser racines pivotantes et amendements structurants.',
};

export const dominantTexture = (
  results: (TextureResultId | null | undefined)[]
): {
  dominant: TextureResultId | null;
  counts: Record<TextureResultId, number>;
  filled: number;
  contrasted: boolean;
} => {
  const counts: Record<TextureResultId, number> = { sable: 0, limon: 0, argile: 0 };
  let filled = 0;
  results.forEach((r) => {
    if (r && counts[r] !== undefined) {
      counts[r] += 1;
      filled += 1;
    }
  });
  if (filled === 0) return { dominant: null, counts, filled, contrasted: false };
  const max = Math.max(...TEXTURE_ORDER.map((r) => counts[r]));
  const top = TEXTURE_ORDER.filter((r) => counts[r] === max);
  return { dominant: top[0], counts, filled, contrasted: top.length > 1 };
};
