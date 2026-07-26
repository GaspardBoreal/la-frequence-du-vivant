/**
 * Catalogue transverse des tests d'étude de sol.
 * Sert de référentiel unique aux médias de terrain (preuves photo / vidéo)
 * attachés à un couple prélèvement × test.
 */

export type SoilBlockId = 'structure' | 'texture' | 'ph' | 'life';

export type SoilTestId =
  | 'beche'
  | 'stabilite'
  | 'boudin'
  | 'sedimentation'
  | 'bandelette'
  | 'phmetre'
  | 'beche_vivante'
  | 'vinaigre'
  | 'sachet';

export interface SoilTestDef {
  id: SoilTestId;
  block: SoilBlockId;
  label: string;
  short: string;
}

export const SOIL_BLOCKS: Record<SoilBlockId, { label: string; accent: string }> = {
  // Teintes exprimées en HSL brut pour rester compatibles avec les tokens du design system.
  structure: { label: 'Structure du sol', accent: '24 52% 42%' },
  texture: { label: 'Texture du sol', accent: '38 68% 46%' },
  ph: { label: 'Acidité du sol', accent: '286 38% 48%' },
  life: { label: 'Vie du sol', accent: '142 46% 34%' },
};

export const SOIL_TESTS: SoilTestDef[] = [
  { id: 'beche', block: 'structure', label: 'Test de la bêche', short: 'Bêche' },
  { id: 'stabilite', block: 'structure', label: 'Test de stabilité', short: 'Stabilité' },
  { id: 'boudin', block: 'texture', label: 'Test du boudin', short: 'Boudin' },
  { id: 'sedimentation', block: 'texture', label: 'Test de sédimentation', short: 'Sédimentation' },
  { id: 'bandelette', block: 'ph', label: 'Bandelette / kit colorimétrique', short: 'Bandelette' },
  { id: 'phmetre', block: 'ph', label: 'pHmètre électronique', short: 'pHmètre' },
  { id: 'beche_vivante', block: 'life', label: 'Test de la bêche vivante', short: 'Bêche vivante' },
  { id: 'vinaigre', block: 'life', label: 'Test du vinaigre', short: 'Vinaigre' },
  { id: 'sachet', block: 'life', label: 'Test du sachet de thé', short: 'Sachet de thé' },
];

export const SOIL_TEST_MAP: Record<SoilTestId, SoilTestDef> = SOIL_TESTS.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<SoilTestId, SoilTestDef>
);

export const soilTestLabel = (id?: string | null): string =>
  (id && SOIL_TEST_MAP[id as SoilTestId]?.label) || 'Test non précisé';

export const soilTestAccent = (id?: string | null): string => {
  const t = id ? SOIL_TEST_MAP[id as SoilTestId] : undefined;
  return SOIL_BLOCKS[t?.block ?? 'structure'].accent;
};
