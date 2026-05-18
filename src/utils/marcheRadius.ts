/**
 * Résolution du rayon d'observation pour une marche.
 *
 * Cascade : marche.radius_m → exploration.default_radius_m → 500 m.
 * Stockage : entiers en mètres dans la BDD ; conversion km/m centralisée ici.
 */

export const DEFAULT_RADIUS_M = 500;

export interface MarcheRadiusInput {
  radius_m?: number | null;
}

export interface ExplorationRadiusInput {
  default_radius_m?: number | null;
}

/** Rayon final à utiliser en mètres. */
export function resolveRadiusM(
  marche?: MarcheRadiusInput | null,
  exploration?: ExplorationRadiusInput | null,
): number {
  return (
    marche?.radius_m ??
    exploration?.default_radius_m ??
    DEFAULT_RADIUS_M
  );
}

/** Rayon final à utiliser en kilomètres (pour <RadiusSelector />). */
export function resolveRadiusKm(
  marche?: MarcheRadiusInput | null,
  exploration?: ExplorationRadiusInput | null,
): number {
  return resolveRadiusM(marche, exploration) / 1000;
}

export const kmToMeters = (km: number) => Math.round(km * 1000);
export const metersToKm = (m: number) => m / 1000;

export const RADIUS_BOUNDS_M = { min: 15, max: 50_000 } as const;

export function isRadiusOverride(
  marche?: MarcheRadiusInput | null,
): boolean {
  return marche?.radius_m != null;
}
