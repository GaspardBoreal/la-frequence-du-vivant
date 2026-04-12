import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, ExternalLink } from 'lucide-react';
import { type PhotoGpsResult, formatDistance, distanceEmoji } from '@/hooks/usePhotoGpsCheck';
import 'leaflet/dist/leaflet.css';

type MapStyle = 'geopoetic' | 'satellite' | 'terrain';

const TILE_CONFIGS: Record<MapStyle, { url: string; attribution: string; maxZoom?: number; className?: string }> = {
  geopoetic: {
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; OSM France',
    className: 'carte-tiles-dark',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    maxZoom: 18,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    maxZoom: 17,
  },
};

const STYLE_LABELS: Record<MapStyle, { icon: string; label: string }> = {
  geopoetic: { icon: '🎨', label: 'Géo' },
  satellite: { icon: '🛰', label: 'Sat' },
  terrain: { icon: '⛰', label: 'Relief' },
};

const PHOTO_BORDER_COLORS = [
  '#06b6d4', '#a855f7', '#f97316', '#ec4899',
  '#3b82f6', '#84cc16', '#f43f5e', '#14b8a6',
];

function distanceFillColor(meters: number | null): string {
  if (meters == null) return '#6b7280';
  if (meters < 200) return '#10b981';
  if (meters < 1000) return '#f59e0b';
  return '#ef4444';
}

/** Auto-fit map bounds to all markers */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [points, map]);
  return null;
}

/** Elegant zoom controls */
function ZoomControls() {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-left" style={{ pointerEvents: 'auto', zIndex: 1000 }}>
      <div style={{
        margin: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        {[{ label: '+', fn: () => map.zoomIn() }, { label: '−', fn: () => map.zoomOut() }].map(b => (
          <button
            key={b.label}
            onClick={b.fn}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(30,30,30,0.85)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              color: 'rgba(255,255,255,0.85)',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Dynamic tile layer without remounting the map */
function DynamicTileLayer({ style }: { style: MapStyle }) {
  const map = useMap();
  const [layer, setLayer] = useState<L.TileLayer | null>(null);

  useEffect(() => {
    if (layer) map.removeLayer(layer);
    const cfg = TILE_CONFIGS[style];
    const tl = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom || 19,
      className: cfg.className || '',
    });
    tl.addTo(map);
    setLayer(tl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, map]);

  return null;
}

interface GpsMapViewProps {
  results: PhotoGpsResult[];
  marcheCoords: { lat: number; lng: number } | null;
}

const GpsMapView: React.FC<GpsMapViewProps> = ({ results, marcheCoords }) => {
  const [mapStyle, setMapStyle] = useState<MapStyle>('geopoetic');

  const photosWithGps = useMemo(
    () => results.filter(r => r.hasGps && r.gpsPhoto),
    [results]
  );

  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (marcheCoords) pts.push([marcheCoords.lat, marcheCoords.lng]);
    photosWithGps.forEach(r => pts.push([r.gpsPhoto!.lat, r.gpsPhoto!.lng]));
    return pts;
  }, [marcheCoords, photosWithGps]);

  const defaultCenter: [number, number] = marcheCoords
    ? [marcheCoords.lat, marcheCoords.lng]
    : allPoints.length > 0
      ? allPoints[0]
      : [46.6, 2.5];

  if (allPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-white/30 text-xs">
        Aucun point GPS disponible pour la carte
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '350px', width: '100%', borderRadius: '8px' }}
        zoomControl={false}
      >
        <DynamicTileLayer style={mapStyle} />
        <ZoomControls />
        <FitBounds points={allPoints} />

        {/* Walk reference marker */}
        {marcheCoords && (
          <CircleMarker
            center={[marcheCoords.lat, marcheCoords.lng]}
            radius={12}
            pathOptions={{
              fillColor: '#ffffff',
              fillOpacity: 0.95,
              color: '#065f46',
              weight: 4,
            }}
          >
            <Popup>
              <div style={{ minWidth: '140px', fontFamily: 'system-ui', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⭐ Point de la marche
                </div>
                <div style={{ color: '#6b7280', fontSize: '10px', marginBottom: '6px' }}>
                  {marcheCoords.lat.toFixed(5)}, {marcheCoords.lng.toFixed(5)}
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
                  <a href={`https://maps.google.com/?q=${marcheCoords.lat},${marcheCoords.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    📍 Google Maps
                  </a>
                  <a href={`https://www.openstreetmap.org/?mlat=${marcheCoords.lat}&mlon=${marcheCoords.lng}&zoom=16`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#10b981', textDecoration: 'none' }}>
                    🗺 OSM
                  </a>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Dotted lines from each photo to walk point */}
        {marcheCoords && photosWithGps.map((r, i) => (
          <Polyline
            key={`line-${r.photoId}`}
            positions={[
              [r.gpsPhoto!.lat, r.gpsPhoto!.lng],
              [marcheCoords.lat, marcheCoords.lng],
            ]}
            pathOptions={{
              color: distanceFillColor(r.distanceM),
              weight: 1.5,
              opacity: 0.5,
              dashArray: '6 4',
            }}
          />
        ))}

        {/* Photo markers */}
        {photosWithGps.map((r, i) => {
          const borderColor = PHOTO_BORDER_COLORS[i % PHOTO_BORDER_COLORS.length];
          const fillColor = distanceFillColor(r.distanceM);
          return (
            <CircleMarker
              key={r.photoId}
              center={[r.gpsPhoto!.lat, r.gpsPhoto!.lng]}
              radius={7}
              pathOptions={{
                fillColor,
                fillOpacity: 0.9,
                color: borderColor,
                weight: 2.5,
              }}
            >
              <Popup>
                <div style={{ minWidth: '160px', fontFamily: 'system-ui', fontSize: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <img
                      src={r.url}
                      alt={r.nom}
                      style={{
                        width: '60px', height: '60px',
                        objectFit: 'cover', borderRadius: '6px',
                        border: `2px solid ${borderColor}`,
                      }}
                      loading="lazy"
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '11px', marginBottom: '2px', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.nom}
                      </div>
                      {r.distanceM != null && (
                        <div style={{ fontSize: '12px', fontWeight: 700, color: fillColor }}>
                          {distanceEmoji(r.distanceM)} {formatDistance(r.distanceM)}
                        </div>
                      )}
                      <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>
                        {r.gpsPhoto!.lat.toFixed(5)}, {r.gpsPhoto!.lng.toFixed(5)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '4px' }}>
                    <a href={`https://maps.google.com/?q=${r.gpsPhoto!.lat},${r.gpsPhoto!.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      📍 Google Maps
                    </a>
                    <a href={`https://www.openstreetmap.org/?mlat=${r.gpsPhoto!.lat}&mlon=${r.gpsPhoto!.lng}&zoom=16`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: '#10b981', textDecoration: 'none' }}>
                      🗺 OSM
                    </a>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Style toggle */}
      <div className="flex justify-center gap-1">
        {(Object.keys(TILE_CONFIGS) as MapStyle[]).map(key => (
          <button
            key={key}
            onClick={() => setMapStyle(key)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
              mapStyle === key
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
            }`}
          >
            {STYLE_LABELS[key].icon} {STYLE_LABELS[key].label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-white/60 bg-white/5 backdrop-blur-sm rounded-lg py-1.5 px-3">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-800 bg-white" />
          Point marche
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
          &lt;200m
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
          200m-1km
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
          &gt;1km
        </span>
      </div>
    </div>
  );
};

export default GpsMapView;
