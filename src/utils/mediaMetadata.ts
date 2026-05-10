/**
 * Extraction unifiée des métadonnées EXIF pour les photos.
 * Schéma normalisé v1, jamais null — toujours un objet avec extraction_status.
 *
 * IMPORTANT : doit être appelé sur le File ORIGINAL (avant conversion HEIC),
 * sinon les données EXIF sont perdues.
 */
import exifr from 'exifr';

export const MEDIA_METADATA_SCHEMA_VERSION = 1;

export interface MediaGps {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  /** 'exif' (par défaut) ou 'manual' (drop GPS sur carte) */
  source?: 'exif' | 'manual';
}

export interface MediaMetadata {
  schema_version: number;
  gps: MediaGps | null;
  date_taken: string | null; // ISO 8601 UTC
  dimensions: { width: number; height: number } | null;
  orientation?: number | null;
  camera?: { make?: string; model?: string; lens?: string };
  exposure?: { iso?: number; aperture?: number; shutter?: string; focal_mm?: number };
  file: {
    original_name: string;
    size_bytes: number;
    mime: string;
    was_heic_converted: boolean;
  };
  extracted_at: string;
  extraction_status: 'ok' | 'partial' | 'failed';
  extraction_warnings?: string[];
}

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const isValidGps = (lat: unknown, lng: unknown): lat is number => {
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return false;
  if (lat === 0 && lng === 0) return false; // sentinelle bidon
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
};

const toIsoUtc = (d: unknown): string | null => {
  try {
    if (!d) return null;
    if (d instanceof Date) return Number.isNaN(d.getTime()) ? null : d.toISOString();
    if (typeof d === 'string') {
      const parsed = new Date(d);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    return null;
  } catch {
    return null;
  }
};

const isHeic = (file: File): boolean => {
  const t = (file.type || '').toLowerCase();
  if (t.includes('heic') || t.includes('heif')) return true;
  const n = file.name.toLowerCase();
  return n.endsWith('.heic') || n.endsWith('.heif');
};

/**
 * Extraction principale. Doit recevoir le File original (avant conversion).
 * `wasHeicConverted` est passé par l'appelant après conversion éventuelle.
 */
export async function extractMediaMetadata(
  file: File,
  opts?: { wasHeicConverted?: boolean }
): Promise<MediaMetadata> {
  const warnings: string[] = [];
  const base: MediaMetadata = {
    schema_version: MEDIA_METADATA_SCHEMA_VERSION,
    gps: null,
    date_taken: null,
    dimensions: null,
    file: {
      original_name: file.name,
      size_bytes: file.size,
      mime: file.type || 'application/octet-stream',
      was_heic_converted: !!opts?.wasHeicConverted || isHeic(file),
    },
    extracted_at: new Date().toISOString(),
    extraction_status: 'ok',
  };

  let parsed: any = null;
  try {
    parsed = await exifr.parse(file, {
      pick: [
        'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'latitude', 'longitude',
        'DateTimeOriginal', 'CreateDate', 'ModifyDate',
        'ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight',
        'Orientation', 'Make', 'Model', 'LensModel',
        'ISO', 'FNumber', 'ExposureTime', 'FocalLength',
      ],
    });
  } catch (err) {
    warnings.push('exif_parse_error');
    base.extraction_status = 'failed';
    base.extraction_warnings = warnings;
    return base;
  }

  if (!parsed) {
    warnings.push('no_exif');
    base.extraction_status = 'partial';
    base.extraction_warnings = warnings;
    return base;
  }

  // GPS
  const lat = parsed.latitude ?? parsed.GPSLatitude;
  const lng = parsed.longitude ?? parsed.GPSLongitude;
  if (isValidGps(lat, lng)) {
    base.gps = {
      latitude: lat as number,
      longitude: lng as number,
      ...(isFiniteNumber(parsed.GPSAltitude) ? { altitude: parsed.GPSAltitude } : {}),
      source: 'exif',
    };
  } else {
    warnings.push('no_gps');
  }

  // Date
  base.date_taken =
    toIsoUtc(parsed.DateTimeOriginal) ??
    toIsoUtc(parsed.CreateDate) ??
    toIsoUtc(parsed.ModifyDate);
  if (!base.date_taken) warnings.push('no_date');

  // Dimensions
  const w = parsed.ImageWidth ?? parsed.ExifImageWidth;
  const h = parsed.ImageHeight ?? parsed.ExifImageHeight;
  if (isFiniteNumber(w) && isFiniteNumber(h)) {
    base.dimensions = { width: w, height: h };
  } else {
    warnings.push('no_dimensions');
  }

  if (isFiniteNumber(parsed.Orientation)) base.orientation = parsed.Orientation;

  if (parsed.Make || parsed.Model || parsed.LensModel) {
    base.camera = {
      ...(parsed.Make ? { make: String(parsed.Make).trim() } : {}),
      ...(parsed.Model ? { model: String(parsed.Model).trim() } : {}),
      ...(parsed.LensModel ? { lens: String(parsed.LensModel).trim() } : {}),
    };
  }

  if (parsed.ISO || parsed.FNumber || parsed.ExposureTime || parsed.FocalLength) {
    base.exposure = {
      ...(isFiniteNumber(parsed.ISO) ? { iso: parsed.ISO } : {}),
      ...(isFiniteNumber(parsed.FNumber) ? { aperture: parsed.FNumber } : {}),
      ...(parsed.ExposureTime != null ? { shutter: String(parsed.ExposureTime) } : {}),
      ...(isFiniteNumber(parsed.FocalLength) ? { focal_mm: parsed.FocalLength } : {}),
    };
  }

  // Statut
  if (warnings.length === 0) {
    base.extraction_status = 'ok';
  } else if (base.gps || base.date_taken) {
    base.extraction_status = 'partial';
    base.extraction_warnings = warnings;
  } else {
    base.extraction_status = 'partial';
    base.extraction_warnings = warnings;
  }

  return base;
}

/** Construit un metadata "manuel" (ex : drop GPS sur carte, sans EXIF). */
export function buildManualMetadata(file: File, gps: MediaGps): MediaMetadata {
  return {
    schema_version: MEDIA_METADATA_SCHEMA_VERSION,
    gps: { ...gps, source: 'manual' },
    date_taken: null,
    dimensions: null,
    file: {
      original_name: file.name,
      size_bytes: file.size,
      mime: file.type || 'application/octet-stream',
      was_heic_converted: false,
    },
    extracted_at: new Date().toISOString(),
    extraction_status: 'partial',
    extraction_warnings: ['gps_manual_only'],
  };
}
