import React, { useMemo, useState } from 'react';
import { CloudSun, Copy, Check, ExternalLink, Navigation, Mountain, Route } from 'lucide-react';
import { toast } from 'sonner';
import { useNearestStations } from '@/hooks/useNearestStations';
import { getStationByCode } from '@/utils/weatherStationDatabase';
import type { StationCoordSource } from '@/utils/weatherStationResolver';

interface Props {
  center?: [number, number] | null;
  radiusKm?: number;
}

const formatCoord = (v: number, dir: 'lat' | 'lng') => {
  const abs = Math.abs(v);
  const hemi = dir === 'lat' ? (v >= 0 ? 'N' : 'S') : v >= 0 ? 'E' : 'O';
  return `${abs.toFixed(4)}°${hemi}`;
};

const formatDistance = (km: number) =>
  km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/([\s\-'])/)
    .map((w) => (w.length > 1 ? w[0].toUpperCase() + w.slice(1) : w))
    .join('');

const sourceBadge = (source: StationCoordSource) => {
  switch (source) {
    case 'local':
    case 'cached':
      return { label: 'Précis', cls: 'bg-emerald-500/15 border-emerald-400/25 text-emerald-100' };
    case 'geocoded':
      return { label: 'Géocodé', cls: 'bg-sky-500/15 border-sky-400/25 text-sky-100' };
    case 'commune':
      return { label: 'Commune', cls: 'bg-amber-500/15 border-amber-400/25 text-amber-100' };
    default:
      return { label: '—', cls: 'bg-white/5 border-white/10 text-white/60' };
  }
};

/**
 * Pavé "Station météo la plus proche" — utilise la même source que la carte
 * (`useNearestStations`), qui fusionne la DB locale et les stations LEXICON
 * géocodées, garantissant la cohérence avec le popup carte.
 */
export const NearestWeatherStationCard: React.FC<Props> = ({ center, radiusKm = 60 }) => {
  const [copied, setCopied] = useState<'addr' | 'gps' | null>(null);

  const points = useMemo(() => {
    if (!center) return [];
    return [{ id: 'property-center', latitude: center[0], longitude: center[1] }];
  }, [center]);

  const { stations, pointLinks, isLoading } = useNearestStations(points, radiusKm);

  const nearest = useMemo(() => {
    const link = pointLinks[0];
    if (!link) return null;
    const station = stations.find((s) => s.code === link.stationCode);
    if (!station) return null;
    const local = getStationByCode(station.code);
    return {
      code: station.code,
      name: station.name,
      lat: station.lat,
      lng: station.lng,
      source: station.source,
      distance: link.distance,
      department: local?.department,
      region: local?.region,
      elevation: local?.elevation,
    };
  }, [pointLinks, stations]);

  if (!center) return null;

  if (isLoading && !nearest) {
    return (
      <div className="rounded-2xl border border-emerald-800/40 bg-slate-900/60 backdrop-blur-xl p-4 animate-pulse">
        <div className="h-4 w-56 bg-white/10 rounded mb-2" />
        <div className="h-3 w-40 bg-white/5 rounded" />
      </div>
    );
  }

  if (!nearest) return null;

  const displayName = titleCase(nearest.name);
  const locality = [nearest.department, nearest.region].filter(Boolean).join(' · ');
  const addressText = [displayName, nearest.department, nearest.region].filter(Boolean).join(' — ');
  const badge = sourceBadge(nearest.source);

  const copy = async (text: string, key: 'addr' | 'gps') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
      toast.success('Copié');
    } catch {
      toast.error('Copie impossible');
    }
  };

  const { lat, lng } = nearest;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`;
  const approx = nearest.source === 'geocoded' || nearest.source === 'commune';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-slate-900/90 via-emerald-950/60 to-slate-950/90 backdrop-blur-xl shadow-lg">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400/80 via-emerald-500/60 to-emerald-800/40" />

      <div className="grid md:grid-cols-2 gap-4 p-4 md:p-5 pl-5 md:pl-6">
        {/* Colonne 1 : station */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 flex items-center justify-center shrink-0">
              <CloudSun className="w-4 h-4" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/70 font-semibold">
                Station météo la plus proche
              </div>
              <div className="text-base md:text-lg font-serif italic text-white leading-tight mt-0.5">
                {displayName}
              </div>
              {locality && <div className="text-sm text-white/85 mt-1">{locality}</div>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/25 text-sky-100 font-medium flex items-center gap-1">
                  <Route className="w-3 h-3" /> {approx ? '~' : ''}{formatDistance(nearest.distance)}
                </span>
                {nearest.elevation != null && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-100 font-medium flex items-center gap-1">
                    <Mountain className="w-3 h-3" /> {nearest.elevation} m
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-mono">
                  #{nearest.code}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne 2 : GPS + actions */}
        <div className="space-y-2 md:border-l md:border-white/10 md:pl-5">
          <div className="flex items-start gap-2">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/70 font-semibold">
                Coordonnées GPS
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm text-white/90">
                  {formatCoord(lat, 'lat')} · {formatCoord(lng, 'lng')}
                </span>
                <button
                  onClick={() => copy(`${lat}, ${lng}`, 'gps')}
                  className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition"
                  aria-label="Copier les coordonnées"
                  title="Copier"
                >
                  {copied === 'gps' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                <button
                  onClick={() => copy(addressText, 'addr')}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 flex items-center gap-1.5 transition"
                >
                  {copied === 'addr' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  Copier l'adresse
                </button>
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3 h-3" /> Google Maps
                </a>
                <a
                  href={osmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3 h-3" /> OpenStreetMap
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearestWeatherStationCard;
