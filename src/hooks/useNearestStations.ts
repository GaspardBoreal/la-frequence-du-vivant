import { useEffect, useMemo, useState } from 'react';
import {
  useNearestLexiconStations,
  type MarchePointInput,
} from './useNearestLexiconStations';
import { getAllStations, type WeatherStation } from '@/utils/weatherStationDatabase';
import { calculateDistance } from '@/utils/weatherStationGeolocation';
import {
  resolveStationCoordinates,
  type ResolvedStationCoords,
  type StationCoordSource,
} from '@/utils/weatherStationResolver';

export interface NearbyStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
  source: StationCoordSource;
  isLexicon: boolean; // true if at least one point's LEXICON points here
}

export interface PointStationLink {
  pointId: string;
  stationCode: string;
  distance: number;
}

const computeBarycenter = (points: MarchePointInput[]) => {
  if (!points.length) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.latitude, lng: acc.lng + p.longitude }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
};

export const useNearestStations = (
  points: MarchePointInput[],
  radiusKm: number = 60
) => {
  const { pointStations, resolved, isLoading } =
    useNearestLexiconStations(points);

  // Stations LEXICON découvertes mais absentes du local — résolues via geocoding.
  // Déjà fait par le hook LEXICON; on reflète juste resolved[].
  const lexiconCodes = useMemo(
    () => new Set(pointStations.filter((p) => p.station).map((p) => p.station!.code)),
    [pointStations]
  );

  // Fusion : stations locales + stations LEXICON résolues
  const allCandidates = useMemo<NearbyStation[]>(() => {
    const map = new Map<string, NearbyStation>();
    // Locales
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
    // LEXICON résolues
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

  // Filtrage par rayon autour du barycentre
  const stations = useMemo<NearbyStation[]>(() => {
    const center = computeBarycenter(points);
    if (!center) return [];
    return allCandidates.filter(
      (s) =>
        calculateDistance(center, { lat: s.lat, lng: s.lng }) <= radiusKm
    );
  }, [allCandidates, points, radiusKm]);

  // Pour chaque point : station la plus proche parmi `stations`
  const pointLinks = useMemo<PointStationLink[]>(() => {
    if (!stations.length) return [];
    return points.map((p) => {
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
    }).filter((l) => l.stationCode);
  }, [points, stations]);

  return { stations, pointLinks, isLoading };
};
