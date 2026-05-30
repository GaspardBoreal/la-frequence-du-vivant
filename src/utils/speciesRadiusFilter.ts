import { haversineM } from './geoDistance';

export interface MarcheGeoCtx {
  latitude: number | null;
  longitude: number | null;
  /** Rayon résolu en mètres (déjà COALESCE marche.radius_m → exploration.default_radius_m → 500). */
  radius_m: number;
  /** Rayon utilisé lors de la collecte du snapshot iNat (radius_meters), en mètres. */
  snapshot_radius_m?: number | null;
}

const num = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

/**
 * Une espèce d'un snapshot est considérée "dans le rayon" si :
 *  (a) au moins une attribution iNat a un GPS exact à ≤ ctx.radius_m du centre marche
 *  (b) ou son propre exactLat/Long est à ≤ ctx.radius_m
 *  (c) fallback (compat ancien) : aucune coord GPS sur l'espèce et le rayon
 *      demandé est >= au rayon de collecte du snapshot.
 */
export const isSpeciesWithinRadius = (sp: any, ctx: MarcheGeoCtx): boolean => {
  if (ctx.latitude == null || ctx.longitude == null) return true; // pas de centre → pas de filtre
  const attrs: any[] = Array.isArray(sp?.attributions) ? sp.attributions : [];
  let sawCoords = false;
  for (const a of attrs) {
    const la = num(a?.exactLatitude);
    const lo = num(a?.exactLongitude);
    if (la != null && lo != null) {
      sawCoords = true;
      if (haversineM(ctx.latitude, ctx.longitude, la, lo) <= ctx.radius_m) return true;
    }
  }
  const spLa = num(sp?.exactLatitude);
  const spLo = num(sp?.exactLongitude);
  if (spLa != null && spLo != null) {
    sawCoords = true;
    if (haversineM(ctx.latitude, ctx.longitude, spLa, spLo) <= ctx.radius_m) return true;
  }
  if (sawCoords) return false;
  const snapR = ctx.snapshot_radius_m ?? 500;
  return ctx.radius_m >= snapR;
};

/**
 * Une observation marcheur est dans le rayon si pas de GPS (legacy) OU si GPS ≤ radius.
 */
export const isObservationWithinRadius = (
  obs: { latitude?: number | null; longitude?: number | null },
  ctx: MarcheGeoCtx
): boolean => {
  if (ctx.latitude == null || ctx.longitude == null) return true;
  const la = num(obs?.latitude);
  const lo = num(obs?.longitude);
  if (la == null || lo == null) return true;
  return haversineM(ctx.latitude, ctx.longitude, la, lo) <= ctx.radius_m;
};
