import type { BrandKit, BrandKitOverrides } from './types';
import { chateauBoutinet } from './presets/chateauBoutinet';

/**
 * Registre des presets de marque disponibles.
 * Pour onboarder un nouveau partenaire : ajouter un fichier dans `presets/`
 * et l'enregistrer ici. Aucune migration nécessaire.
 */
export const BRAND_KIT_REGISTRY: Record<string, BrandKit> = {
  chateau_boutinet: chateauBoutinet,
};

export const listBrandKits = () =>
  Object.values(BRAND_KIT_REGISTRY).map((k) => ({ slug: k.slug, partner: k.partner }));

/** Deep-merge preset + overrides JSON (les overrides gagnent). */
export function resolveBrandKit(
  slug: string | null | undefined,
  overrides: BrandKitOverrides | null | undefined,
): BrandKit | null {
  if (!slug) return null;
  const preset = BRAND_KIT_REGISTRY[slug];
  if (!preset) {
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(`[BrandKit] Preset inconnu: ${slug}`);
    }
    return null;
  }
  if (!overrides || Object.keys(overrides).length === 0) return preset;

  return {
    ...preset,
    ...overrides,
    palette: { ...preset.palette, ...(overrides.palette ?? {}) },
    fonts: { ...preset.fonts, ...(overrides.fonts ?? {}) },
    meta: { ...preset.meta, ...(overrides.meta ?? {}) },
    badges: overrides.badges ?? preset.badges,
    socials: { ...preset.socials, ...(overrides.socials ?? {}) },
  } as BrandKit;
}
