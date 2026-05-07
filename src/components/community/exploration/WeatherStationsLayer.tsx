import React, { useMemo, useState } from 'react';
import { Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNearestLexiconStations } from '@/hooks/useNearestLexiconStations';
import type { ResolvedStationCoords } from '@/utils/weatherStationResolver';
import { calculateDistance, formatDistance, getDataQuality } from '@/utils/weatherStationGeolocation';

interface MarchePoint {
  id: string;
  latitude: number;
  longitude: number;
  nom_marche?: string | null;
  ville?: string | null;
}

interface WeatherStationsLayerProps {
  marches: MarchePoint[];
  maxDistanceKm?: number;
  showLinks?: boolean;
}

// Custom SVG icon — sky-blue cloud + thermometer
const stationIcon = L.divIcon({
  className: 'weather-station-marker',
  html: `
    <div style="
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #38bdf8, #0284c7);
      border: 2px solid #ffffff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.45);
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.8A7 7 0 1 0 4 15.5"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const sourceLabel = (source: ResolvedStationCoords['source']) => {
  switch (source) {
    case 'local': return 'Précis';
    case 'cached': return 'Précis';
    case 'geocoded': return 'Géocodé';
    case 'commune': return 'Commune';
    default: return '—';
  }
};

const WeatherStationsLayer: React.FC<WeatherStationsLayerProps> = ({
  marches,
  maxDistanceKm = 100,
  showLinks = true,
}) => {
  const points = useMemo(
    () =>
      marches
        .filter((m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude))
        .map((m) => ({ id: m.id, latitude: m.latitude, longitude: m.longitude })),
    [marches]
  );

  const { pointStations, resolved } = useNearestLexiconStations(points);

  // Group by station code → list of marches
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        code: string;
        name: string;
        coords: ResolvedStationCoords;
        points: { marche: MarchePoint; distance: number }[];
      }
    >();
    for (const ps of pointStations) {
      if (!ps.station) continue;
      const coords = resolved[ps.station.code];
      if (!coords) continue;
      const marche = marches.find((m) => m.id === ps.pointId);
      if (!marche) continue;
      const distance = calculateDistance(
        { lat: marche.latitude, lng: marche.longitude },
        { lat: coords.lat, lng: coords.lng }
      );
      if (distance > maxDistanceKm) continue;
      const entry =
        map.get(ps.station.code) ?? {
          code: ps.station.code,
          name: ps.station.name,
          coords,
          points: [],
        };
      entry.points.push({ marche, distance });
      map.set(ps.station.code, entry);
    }
    return Array.from(map.values());
  }, [pointStations, resolved, marches, maxDistanceKm]);

  return (
    <>
      {showLinks &&
        grouped.flatMap(({ code, coords, points }) =>
          points.map(({ marche }) => (
            <Polyline
              key={`link-${code}-${marche.id}`}
              positions={[
                [marche.latitude, marche.longitude],
                [coords.lat, coords.lng],
              ]}
              pathOptions={{
                color: '#0ea5e9',
                weight: 1.5,
                opacity: 0.45,
                dashArray: '3, 6',
              }}
            />
          ))
        )}

      {grouped.map(({ code, name, coords, points }) => {
        const minDist = Math.min(...points.map((p) => p.distance));
        const quality = getDataQuality(minDist);
        const approx = coords.source === 'geocoded' || coords.source === 'commune';
        return (
          <Marker
            key={code}
            position={[coords.lat, coords.lng]}
            icon={stationIcon}
          >
            <Popup className="exploration-carte-popup" maxWidth={280} minWidth={220}>
              <div className="bg-black/85 backdrop-blur-xl rounded-xl p-3 -m-3 text-white">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/25 border border-sky-400/40 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.8A7 7 0 1 0 4 15.5" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-sky-300/80 font-semibold">
                      Station météo
                    </div>
                    <div className="text-sm font-semibold leading-tight truncate">{name}</div>
                    <div className="text-[11px] text-white/50 font-mono">{code}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] mb-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${quality.color}25`, color: quality.color }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: quality.color }}
                    />
                    {approx ? '~' : ''}{formatDistance(minDist)} · {quality.level}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-white/40">
                    {sourceLabel(coords.source)}
                  </span>
                </div>

                <div className="text-[11px] text-white/65 leading-snug mb-2">
                  Rattachée à {points.length} point{points.length > 1 ? 's' : ''} de marche
                </div>

                <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {points
                    .sort((a, b) => a.distance - b.distance)
                    .map(({ marche, distance }) => (
                      <li
                        key={marche.id}
                        className="flex items-center justify-between gap-2 text-[11px] bg-white/5 rounded-md px-2 py-1"
                      >
                        <span className="truncate text-white/85">
                          {marche.nom_marche || marche.ville || 'Point'}
                        </span>
                        <span className="text-sky-300/90 font-mono shrink-0">
                          {approx ? '~' : ''}{formatDistance(distance)}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default WeatherStationsLayer;
