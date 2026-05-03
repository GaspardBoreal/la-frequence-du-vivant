import L from 'leaflet';

export type ParcelGeometry = {
  type: string;
  coordinates: any;
};

export interface ParcelInfo {
  parcelId?: string | null;
  prefix?: string | null;
  section?: string | null;
  number?: string | null;
  surfaceM2?: number | null;
  surfaceHa?: number | null;
  commune?: string | null;
  postalCode?: string | null;
  communeCode?: string | null;
  country?: string | null;
}

export function extractParcelInfo(lexiconData: any): ParcelInfo {
  if (!lexiconData) return {};
  return {
    parcelId: lexiconData.parcel_id || lexiconData.identifiant_cadastral || lexiconData.id || null,
    prefix: lexiconData.prefix || lexiconData.prefixe || null,
    section: lexiconData.section || null,
    number: lexiconData.number || lexiconData.numero || null,
    surfaceM2: lexiconData.superficie_m2 ?? null,
    surfaceHa: lexiconData.surface_ha ?? null,
    commune: lexiconData.commune || lexiconData.ville || lexiconData.city || null,
    postalCode: lexiconData.postal_code || lexiconData.code_postal || null,
    communeCode: lexiconData.commune_code || lexiconData.code_commune || null,
    country: lexiconData.pays || lexiconData.country || null,
  };
}

/** Centroïde approximatif d'une géométrie GeoJSON (Polygon ou MultiPolygon). */
export function geometryCentroid(geometry: ParcelGeometry | null | undefined): { lat: number; lng: number } | null {
  if (!geometry?.coordinates) return null;
  try {
    const layer = L.geoJSON(geometry as any);
    const b = layer.getBounds();
    const c = b.getCenter();
    return { lat: c.lat, lng: c.lng };
  } catch {
    return null;
  }
}

export function formatLatLng(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
