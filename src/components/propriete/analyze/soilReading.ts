import type { SoilSample, PropertySoilState } from '@/hooks/propriete/usePropertySoil';
import {
  dominantResult,
  RESULT_SHORT,
  READING,
  type StructureResultId,
  type StructureTestId,
} from './structureTests';
import {
  dominantTexture,
  TEXTURE_SHORT,
  TEXTURE_READING,
  type TextureResultId,
  type TextureTestId,
} from './textureTests';
import { aggregatePh, PH_CLASS_MAP, type PhAggregate, type PhTestId } from './phTests';
import { aggregateLife, LIFE_CLASS_MAP, type LifeAggregate, type LifeTestId } from './lifeTests';

export const TERRAIN_LABELS: Record<string, string> = {
  remanie: 'Terrain remanié',
  remblai: 'Remblai rapporté',
  decaissement: 'Terrain décaissé',
  naturel: 'Sol naturel en place',
  inconnu: 'Historique inconnu',
};

export const TERRAIN_READING: Record<string, string> = {
  remanie:
    'La terre a été déplacée : les horizons sont mélangés, la lecture du sol doit se faire prélèvement par prélèvement.',
  remblai:
    'Un apport extérieur recouvre le sol d’origine : vigilance sur la nature des matériaux et la continuité hydraulique.',
  decaissement:
    'De la terre a été retirée : on travaille probablement sur un horizon profond, pauvre en matière organique.',
  naturel:
    'Le sol semble en place : les horizons sont lisibles et le diagnostic peut s’appuyer sur leur succession.',
  inconnu:
    'L’historique du site reste à investiguer : croiser archives, photographies anciennes et observations de terrain.',
};

export interface SoilReading {
  terrainLabel: string | null;
  terrainReading: string | null;
  structure: ReturnType<typeof dominantResult>;
  texture: ReturnType<typeof dominantTexture>;
  ph: PhAggregate;
  life: LifeAggregate;
  structureTestCounts: Record<StructureTestId, number>;
  textureTestCounts: Record<TextureTestId, number>;
  phTestCounts: Record<PhTestId, number>;
  lifeTestCounts: Record<LifeTestId, number>;
  samples: SoilSample[];
  placedSamples: number;
  /** Phrase agronomique de synthèse. */
  sentence: string;
  /** Lectures détaillées par dimension renseignée. */
  readings: { key: string; title: string; text: string }[];
  /** Prélèvements incomplets (au moins une dimension manquante). */
  incomplete: string[];
}

const countBy = <T extends string>(values: (T | null | undefined)[], keys: T[]) =>
  keys.reduce((acc, k) => {
    acc[k] = values.filter((v) => v === k).length;
    return acc;
  }, {} as Record<T, number>);

export function buildSoilReading(state: PropertySoilState): SoilReading {
  const samples = state.samples ?? [];
  const structure = dominantResult(samples.map((s) => s.structure_result));
  const texture = dominantTexture(samples.map((s) => s.texture_result));
  const ph = aggregatePh(samples.map((s) => s.ph_value));
  const life = aggregateLife(
    samples.map((s) => ({ signs: s.life_signs, worms: s.worm_count ?? null }))
  );

  const terrainLabel = state.terrain_status ? TERRAIN_LABELS[state.terrain_status] ?? null : null;
  const terrainReading = state.terrain_status
    ? TERRAIN_READING[state.terrain_status] ?? null
    : null;

  const phClass = ph.dominant ? PH_CLASS_MAP[ph.dominant] : null;
  const lifeClass = life.dominant ? LIFE_CLASS_MAP[life.dominant] : null;

  const parts: string[] = [];
  if (texture.dominant) parts.push(`Sol ${TEXTURE_SHORT[texture.dominant as TextureResultId].toLowerCase()}`);
  if (structure.dominant)
    parts.push(
      `${texture.dominant ? 'à structure' : 'Structure'} ${RESULT_SHORT[
        structure.dominant as StructureResultId
      ].toLowerCase()}`
    );
  if (phClass) parts.push(phClass.short.toLowerCase());
  if (lifeClass) parts.push(lifeClass.label.toLowerCase());

  const sentence = parts.length
    ? `${parts.join(', ')}.`
    : 'Aucune dominante encore lisible : complétez les tests par prélèvement pour révéler la lecture du sol.';

  const readings: { key: string; title: string; text: string }[] = [];
  if (terrainReading) readings.push({ key: 'terrain', title: 'État du terrain', text: terrainReading });
  if (structure.dominant)
    readings.push({ key: 'structure', title: 'Structure', text: READING[structure.dominant] });
  if (texture.dominant)
    readings.push({ key: 'texture', title: 'Texture', text: TEXTURE_READING[texture.dominant] });
  if (phClass) readings.push({ key: 'ph', title: 'Acidité', text: phClass.advice });
  if (lifeClass) readings.push({ key: 'life', title: 'Vie du sol', text: lifeClass.reading });

  const incomplete = samples
    .filter(
      (s) =>
        !s.structure_result ||
        !s.texture_result ||
        typeof s.ph_value !== 'number' ||
        ((s.life_signs?.length ?? 0) === 0 && typeof s.worm_count !== 'number')
    )
    .map((s) => s.label);

  return {
    terrainLabel,
    terrainReading,
    structure,
    texture,
    ph,
    life,
    structureTestCounts: countBy(
      samples.map((s) => s.structure_test),
      ['beche', 'stabilite'] as StructureTestId[]
    ),
    textureTestCounts: countBy(
      samples.map((s) => s.texture_test),
      ['boudin', 'sedimentation'] as TextureTestId[]
    ),
    phTestCounts: countBy(
      samples.map((s) => s.ph_test),
      ['bandelette', 'phmetre'] as PhTestId[]
    ),
    lifeTestCounts: countBy(
      samples.map((s) => s.life_test),
      ['beche_vivante', 'vinaigre', 'sachet'] as LifeTestId[]
    ),
    samples,
    placedSamples: samples.filter((s) => s.lat != null && s.lng != null).length,
    sentence,
    readings,
    incomplete,
  };
}
