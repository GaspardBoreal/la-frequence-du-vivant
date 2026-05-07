import { useEffect, useMemo, useState } from 'react';
import {
  useNearestLexiconStations,
  type MarchePointInput,
} from './useNearestLexiconStations';
import { getAllStations } from '@/utils/weatherStationDatabase';
import { calculateDistance } from '@/utils/weatherStationGeolocation';
import type { StationCoordSource } from '@/utils/weatherStationResolver';

export interface NearbyStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
  source: StationCoordSource;
  isLexicon: boolean;
}

export interface PointStationLink {
  pointId: string;
  stationCode: string;
  distance: number;
}

const SCAN_PREFIX = 'scan-';

const computeBarycenter = (points: MarchePointInput[]) => {
  if (!points.length) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.latitude, lng: acc.lng + p.longitude }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
};

/** 8 directions cardinales, distance en km depuis le centre */
const generateScanGrid = (
  center: { lat: number; lng: number },
  distanceKm: number
): MarchePointInput[] => {
  const R = 6371;
  const dirs = [0, 45, 90, 135, 180, 225, 270, 315];
  const ang = distanceKm / R;
  const lat1 = (center.lat * Math.PI) / 180;
  const lng1 = (center.lng * Math.PI) / 180;
  return dirs.map((bearingDeg) => {
    const brng = (bearingDeg * Math.PI) / 180;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(ang) +
        Math.cos(lat1) * Math.sin(ang) * Math.cos(brng)
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(ang) * Math.cos(lat1),
        Math.cos(ang) - Math.sin(lat1) * Math.sin(lat2)
      );
    return {
      id: `${SCAN_PREFIX}${bearingDeg}`,
      latitude: (lat2 * 180) / Math.PI,
      longitude: (lng2 * 180) / Math.PI,
    };
  });
};

export const useNearestStations = (
  points: MarchePointInput[],
  radiusKm: number = 60
) => {
  // Grille de scan : 8 points fictifs autour du barycentre, à radius/2,
  // pour découvrir des stations LEXICON non locales (est/sud).
  const scanGrid = useMemo(() => {
    const center = computeBarycenter(points);
    if (!center) return [];
    return generateScanGrid(center, Math.max(20, Math.round(radiusKm / 2)));
  }, [points, radiusKm]);

  const lexiconInput = useMemo(
    () => [...points, ...scanGrid],
    [points, scanGrid]
  );

  const { pointStations, resolved, isLoading } =
    useNearestLexiconStations(lexiconInput);

  const lexiconCodes = useMemo(
    () =>
      new Set(pointStations.filter((p) => p.station).map((p) => p.station!.code)),
    [pointStations]
  );

  // Fusion : DB locale + LEXICON résolues
  const allCandidates = useMemo<NearbyStation[]>(() => {
    const map = new Map<string, NearbyStation>();
    for (const s of getAllStations()) {
      map.set(s.code, {
        code: s.code,
        name: s.name,
        lat: s.coordinates.lat,
        lng: s.coordinates.lng,
        source: 'local',
        isLexicon: lexiconCodes.has(s.code),
      });
    }
    for (const ps of pointStations) {
      if (!ps.station) continue;
      if (map.has(ps.station.code)) {
        map.get(ps.station.code)!.isLexicon = true;
        continue;
      }
      const r = resolved[ps.station.code];
      if (!r) continue;
      map.set(ps.station.code, {
        code: ps.station.code,
        name: ps.station.name,
        lat: r.lat,
        lng: r.lng,
        source: r.source,
        isLexicon: true,
      });
    }
    return Array.from(map.values());
  }, [pointStations, resolved, lexiconCodes]);

  // Filtrage : station gardée si à ≤ radius d'AU MOINS UN point de marche réel
  const stations = useMemo<NearbyStation[]>(() => {
    if (!points.length) return [];
    return allCandidates.filter((s) =>
      points.some(
        (p) =>
          calculateDistance(
            { lat: p.latitude, lng: p.longitude },
            { lat: s.lat, lng: s.lng }
          ) <= radiusKm
      )
    );
  }, [allCandidates, points, radiusKm]);

  // Pour chaque point réel : station la plus proche
  const pointLinks = useMemo<PointStationLink[]>(() => {
    if (!stations.length) return [];
    return points
      .map((p) => {
        let best: NearbyStation | null = null;
        let bestD = Infinity;
        for (const s of stations) {
          const d = calculateDistance(
            { lat: p.latitude, lng: p.longitude },
            { lat: s.lat, lng: s.lng }
          );
          if (d < bestD) {
            bestD = d;
            best = s;
          }
        }
        return best
          ? { pointId: p.id, stationCode: best.code, distance: bestD }
          : { pointId: p.id, stationCode: '', distance: Infinity };
      })
      .filter((l) => l.stationCode);
  }, [points, stations]);

  return { stations, pointLinks, isLoading };
};
