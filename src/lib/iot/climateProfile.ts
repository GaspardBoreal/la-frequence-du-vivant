import { buildSiteProfile, type SiteProfile } from '@/lib/paletteEngine';
import type { SoilLite } from '@/lib/plantIndicatorKb';
import type { ClimateSummary, SensorAnalysis } from './analyses';

/**
 * Profil de site déduit d'une station météo.
 *
 * Une station ne voit pas le sol : on ne peut donc pas prononcer de verdict de
 * plantation. Mais l'air mesuré dit beaucoup du milieu — humidité relative,
 * amplitude jour-nuit, gel et jours de canicule. On en tire une ambiance
 * hydrique et une exposition plausibles, complétées par le registre de sol de
 * la propriété, et l'on annonce toujours cette base.
 */
export function buildClimateProfile(
  climate: ClimateSummary | null,
  soil: SoilLite | null | undefined,
  analysis?: SensorAnalysis | null,
): { profile: SiteProfile; basis: string[]; missing: string[] } {
  const basis: string[] = [];
  const missing: string[] = [];

  let humidity: 'humide' | 'moyen' | 'sec' | null = null;
  const rh = climate?.humidity?.mean ?? null;
  const rain = analysis?.water?.rain7d ?? null;
  if (rh != null && Number.isFinite(rh)) {
    humidity = rh >= 78 ? 'humide' : rh <= 58 ? 'sec' : 'moyen';
    basis.push(`humidité de l’air mesurée (${Math.round(rh)} %)`);
  } else {
    missing.push('humidité de l’air non transmise');
  }
  if (rain != null) basis.push(`pluie cumulée ${rain} mm sur 7 jours`);
  else missing.push('pluviométrie non transmise par cette station');

  // Amplitude jour-nuit : forte = site ouvert et ensoleillé, faible = ambiance tamponnée.
  let exposure: 'soleil' | 'mi_ombre' | 'ombre' | null = null;
  if (climate?.amplitude != null) {
    exposure = climate.amplitude >= 12 ? 'soleil' : climate.amplitude >= 6 ? 'mi_ombre' : 'ombre';
    basis.push(`amplitude jour-nuit ${climate.amplitude.toFixed(1)} °C`);
  } else {
    missing.push('amplitude thermique indisponible : exposition inconnue');
  }

  if (soil?.texture) basis.push('texture du registre de sol');
  else missing.push('texture du sol non renseignée dans le registre');
  if (soil?.ph != null) basis.push(`pH ${Number(soil.ph).toFixed(1)} du registre de sol`);
  else missing.push('pH non renseigné dans le registre');

  const profile = buildSiteProfile({ soil, exposure, humidity });
  // Une station reste une lecture indirecte du milieu : on l'assume.
  return { profile: { ...profile, confidence: profile.confidence * 0.7 }, basis, missing };
}

/** Température de référence pour la fenêtre potagère : sol si mesuré, air sinon. */
export function referenceTemperature(analysis: SensorAnalysis | null): number | null {
  if (!analysis) return null;
  const soilT = analysis.series.find((s) => s.grandeur === 'soil_temperature');
  if (soilT && Number.isFinite(soilT.mean)) return soilT.mean;
  const air = analysis.climate?.air ?? analysis.series.find((s) => s.grandeur === 'air_temperature');
  return air && Number.isFinite(air.mean) ? air.mean : null;
}
