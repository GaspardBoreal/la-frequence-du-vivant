import type { PropertySoilState } from '@/hooks/propriete/usePropertySoil';
import { buildSoilReading } from '@/components/propriete/analyze/soilReading';
import type { SoilLite } from '@/lib/plantIndicatorKb';
import { normalizeStructure, normalizeTexture } from '@/lib/soilVocabulary';

export { normalizeStructure, normalizeTexture };

/**
 * Source de vérité unique du sol : les prélèvements priment (Étape 2),
 * les champs globaux hérités ne servent que de repli.
 */
export function soilLiteFromState(state?: PropertySoilState | null): SoilLite {
  if (!state) return {};
  const r = buildSoilReading(state);

  const lifeSigns =
    r.life.union && r.life.union.length > 0 ? r.life.union : (state.life_signs ?? []);

  return {
    structure: normalizeStructure(r.structure.dominant ?? state.structure),
    texture: normalizeTexture(r.texture.dominant ?? state.texture),
    boudin_shape: state.boudin_shape ?? null,
    ph: r.ph.average ?? state.ph ?? null,
    life_signs: lifeSigns,
  };
}

/** Le sol est-il suffisamment renseigné pour alimenter une concordance ? */
export function soilLiteAvailable(soil: SoilLite): boolean {
  return !!(
    soil.structure ||
    soil.texture ||
    soil.ph != null ||
    (soil.life_signs?.length ?? 0) > 0
  );
}

/**
 * Répartition des textures dominantes, prélèvement par prélèvement.
 * Sert la lecture « un mot + trois jauges » des quatre curseurs.
 */
export function textureCountsFromState(
  state?: PropertySoilState | null
): { argile: number; limon: number; sable: number } {
  if (!state) return { argile: 0, limon: 0, sable: 0 };
  const r = buildSoilReading(state);
  const c = r.texture?.counts ?? { sable: 0, limon: 0, argile: 0 };
  return { argile: c.argile ?? 0, limon: c.limon ?? 0, sable: c.sable ?? 0 };
}
