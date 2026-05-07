import { geocodeAddress } from './geocoding';
import { getStationByCode } from './weatherStationDatabase';

export type StationCoordSource = 'local' | 'cached' | 'geocoded' | 'commune' | 'failed';

export interface ResolvedStationCoords {
  lat: number;
  lng: number;
  source: StationCoordSource;
}

interface ResolveInput {
  code: string;
  name: string;
  city?: string | null;
  postalCode?: string | null;
}

const memoryCache = new Map<string, ResolvedStationCoords>();
const inflight = new Map<string, Promise<ResolvedStationCoords | null>>();
const storageKey = (code: string) => `weatherStationCoords:${code}`;

const readCache = (code: string): ResolvedStationCoords | null => {
  if (memoryCache.has(code)) return memoryCache.get(code)!;
  try {
    const raw = localStorage.getItem(storageKey(code));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResolvedStationCoords;
    memoryCache.set(code, parsed);
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (code: string, value: ResolvedStationCoords) => {
  memoryCache.set(code, value);
  try {
    localStorage.setItem(storageKey(code), JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const resolveStationCoordinates = async (
  input: ResolveInput
): Promise<ResolvedStationCoords | null> => {
  const { code, name, city, postalCode } = input;
  if (!code) return null;

  // 1. Local database
  const local = getStationByCode(code);
  if (local) {
    const out: ResolvedStationCoords = { ...local.coordinates, source: 'local' };
    memoryCache.set(code, out);
    return out;
  }

  // 2. Cache
  const cached = readCache(code);
  if (cached) return cached;

  // 3. Inflight dedup
  if (inflight.has(code)) return inflight.get(code)!;

  const task = (async (): Promise<ResolvedStationCoords | null> => {
    // Try geocoding by station name (often a commune name)
    const queries: { q: string; source: StationCoordSource }[] = [];
    if (name) queries.push({ q: `${name}, France`, source: 'geocoded' });
    if (city && postalCode)
      queries.push({ q: `${city} ${postalCode}, France`, source: 'commune' });
    else if (city) queries.push({ q: `${city}, France`, source: 'commune' });

    for (const { q, source } of queries) {
      try {
        const r = await geocodeAddress(q);
        const [lat, lng] = r.coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const out: ResolvedStationCoords = { lat, lng, source };
          writeCache(code, out);
          return out;
        }
      } catch {
        // continue
      }
      // Polite to Nominatim
      await new Promise((res) => setTimeout(res, 250));
    }
    return null;
  })();

  inflight.set(code, task);
  try {
    return await task;
  } finally {
    inflight.delete(code);
  }
};
