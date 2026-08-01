/**
 * Projection perspective « à hauteur d'homme » d'un scénario.
 *
 * On se tient au centre de l'ouvrage, à 1,60 m du sol, et on regarde dans une
 * direction. Chaque plante posée devient une silhouette à sa vraie distance et
 * à sa vraie hauteur : c'est ce qui rend la projection honnête plutôt que
 * décorative.
 */
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';
import { sizeAt, toLocal, type PlantSize } from './growthModel';

export const EYE_HEIGHT_M = 1.6;

export interface ProjectedPlant {
  planting: Planting;
  size: PlantSize;
  /** Distance à l'œil, en mètres. */
  distance: number;
  /** Écart angulaire au regard, en radians (négatif = à gauche). */
  offsetRad: number;
  /** Position horizontale à l'écran, en px. */
  x: number;
  /** Ordonnée du collet (sol) à l'écran, en px. */
  groundY: number;
  widthPx: number;
  heightPx: number;
}

const normAngle = (a: number) => {
  let v = a;
  while (v > Math.PI) v -= Math.PI * 2;
  while (v < -Math.PI) v += Math.PI * 2;
  return v;
};

export function projectPlants(opts: {
  plantings: Planting[];
  center: { lat: number; lng: number };
  /** Cap du regard, en radians (0 = nord, sens horaire). */
  yaw: number;
  year: number;
  width: number;
  height: number;
  /** Champ de vision horizontal, en radians. */
  fov?: number;
  horizonRatio?: number;
  eyeHeight?: number;
}): { plants: ProjectedPlant[]; horizonY: number; focal: number } {
  const { plantings, center, yaw, year, width, height } = opts;
  const fov = opts.fov ?? (72 * Math.PI) / 180;
  const horizonY = height * (opts.horizonRatio ?? 0.52);
  const eye = opts.eyeHeight ?? EYE_HEIGHT_M;
  const focal = width / 2 / Math.tan(fov / 2);

  const plants: ProjectedPlant[] = [];
  plantings.forEach((p) => {
    const l = toLocal(p, center);
    const distance = Math.max(0.8, Math.hypot(l.x, l.y));
    const bearing = Math.atan2(l.x, l.y);
    const offsetRad = normAngle(bearing - yaw);
    if (Math.abs(offsetRad) > fov * 0.75) return;
    const size = sizeAt(p, year);
    const x = width / 2 + Math.tan(offsetRad) * focal;
    const groundY = horizonY + (focal * eye) / distance;
    const heightPx = (focal * size.heightM) / distance;
    const widthPx = (focal * size.spreadM) / distance;
    plants.push({ planting: p, size, distance, offsetRad, x, groundY, widthPx, heightPx });
  });

  plants.sort((a, b) => b.distance - a.distance);
  return { plants, horizonY, focal };
}
