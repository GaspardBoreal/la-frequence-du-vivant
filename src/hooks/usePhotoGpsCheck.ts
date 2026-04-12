import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import exifr from 'exifr';

export interface PhotoGpsResult {
  photoId: string;
  nom: string;
  url: string;
  gpsPhoto: { lat: number; lng: number } | null;
  gpsMarche: { lat: number; lng: number } | null;
  distanceM: number | null;
  hasGps: boolean;
}

/** Haversine distance in meters */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function distanceColor(meters: number): string {
  if (meters < 200) return 'text-emerald-400';
  if (meters < 1000) return 'text-amber-400';
  return 'text-red-400';
}

export function distanceEmoji(meters: number): string {
  if (meters < 200) return '✅';
  if (meters < 1000) return '⚠️';
  return '🔴';
}

interface PhotoInput {
  id: string;
  nom: string;
  url: string;
  /** Pre-stored GPS from metadata column (if available) */
  storedGps?: { latitude: number; longitude: number } | null;
}

export function usePhotoGpsCheck(marcheId: string) {
  const [results, setResults] = useState<PhotoGpsResult[] | null>(null);
  const [marcheCoords, setMarcheCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkPhotos = useCallback(async (photos: PhotoInput[]) => {
    if (!marcheId || photos.length === 0) return;
    setIsChecking(true);
    setResults(null);

    try {
      // Get marche coordinates
      const { data: marche } = await supabase
        .from('marches')
        .select('latitude, longitude')
        .eq('id', marcheId)
        .single();

      const gpsMarche = marche?.latitude && marche?.longitude
        ? { lat: marche.latitude, lng: marche.longitude }
        : null;

      setMarcheCoords(gpsMarche);

      // Extract GPS from each photo in parallel
      const photoResults = await Promise.all(
        photos.map(async (photo): Promise<PhotoGpsResult> => {
          try {
            // Priority 1: use stored GPS metadata from DB
            let lat: number | null = null;
            let lng: number | null = null;

            if (photo.storedGps?.latitude != null && photo.storedGps?.longitude != null) {
              lat = photo.storedGps.latitude;
              lng = photo.storedGps.longitude;
            } else {
              // Priority 2: fallback to runtime EXIF extraction
              const gps = await exifr.gps(photo.url);
              if (gps?.latitude != null && gps?.longitude != null) {
                lat = gps.latitude;
                lng = gps.longitude;
              }
            }

            if (lat != null && lng != null) {
              const gpsPhoto = { lat, lng };
              const distanceM = gpsMarche
                ? haversineDistance(gpsPhoto.lat, gpsPhoto.lng, gpsMarche.lat, gpsMarche.lng)
                : null;
              return {
                photoId: photo.id,
                nom: photo.nom,
                url: photo.url,
                gpsPhoto,
                gpsMarche,
                distanceM,
                hasGps: true,
              };
            }
          } catch {
            // EXIF extraction failed (CORS, no EXIF, etc.)
          }
          return {
            photoId: photo.id,
            nom: photo.nom,
            url: photo.url,
            gpsPhoto: null,
            gpsMarche,
            distanceM: null,
            hasGps: false,
          };
        })
      );

      setResults(photoResults);
    } catch (err) {
      console.warn('GPS check error:', err);
      setResults([]);
    } finally {
      setIsChecking(false);
    }
  }, [marcheId]);

  return { results, marcheCoords, isChecking, checkPhotos, reset: () => setResults(null) };
}
