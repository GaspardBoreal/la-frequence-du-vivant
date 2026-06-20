import React from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STAGE_MARKER_COLOR, STAGE_LABELS, type CrmCompany, type CrmCompanyStage } from '@/types/crmCompany';

const FitBounds: React.FC<{ points: Array<{ lat: number; lng: number }>; skip: boolean; padding: [number, number] }> = ({ points, skip, padding }) => {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
  React.useEffect(() => {
    if (skip) return;
    if (points.length === 0) {
      map.setView([46.6, 2.5], 5);
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding, maxZoom: 14 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, skip, padding[0], padding[1]]);
  return null;
};

const FlyToSelected: React.FC<{ point: { lat: number; lng: number } | null; offsetX?: number }> = ({
  point,
  offsetX = 0,
}) => {
  const map = useMap();
  React.useEffect(() => {
    if (!point) return;
    const targetZoom = Math.max(map.getZoom(), 13);
    // Compose offset into destination so a single flyTo lands correctly,
    // even if the map container was just resized.
    const raf = requestAnimationFrame(() => {
      try {
        const cp = map.latLngToContainerPoint([point.lat, point.lng]).add([offsetX, 0] as any);
        const dest = map.containerPointToLatLng(cp);
        map.flyTo(dest, targetZoom, { duration: 0.7 });
      } catch {
        map.flyTo([point.lat, point.lng], targetZoom, { duration: 0.7 });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [point?.lat, point?.lng, offsetX, map]);
  return null;
};

function pinSvg(color: string, selected: boolean) {
  const halo = selected
    ? `<span class="crm-pin-halo" style="--c:${color}"></span>`
    : '';
  return `
    <div class="crm-pin-wrap">
      ${halo}
      <svg class="crm-pin-svg" width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g${color.replace('#', '')}" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stop-color="white" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z"
              fill="url(#g${color.replace('#', '')})"
              stroke="${color}" stroke-width="1.2"
              filter="drop-shadow(0 3px 6px rgba(0,0,0,.35))"/>
        <circle cx="15" cy="14" r="5" fill="white" opacity="0.95"/>
      </svg>
    </div>
  `;
}

function buildIcon(color: string, selected: boolean) {
  return L.divIcon({
    className: 'crm-marker',
    html: pinSvg(color, selected),
    iconSize: [30, 40],
    iconAnchor: [15, 38],
    tooltipAnchor: [0, -32],
  });
}

interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  stage?: CrmCompanyStage;
}

const DefaultMapTooltip: React.FC<{ point: MapPoint }> = ({ point }) => (
  <div className="text-xs">
    <p className="font-semibold leading-tight">{point.title}</p>
    {point.subtitle && <p className="mt-0.5 text-[11px] opacity-70">{point.subtitle}</p>}
    {point.stage && (
      <p className="mt-1 inline-flex items-center gap-1 text-[10px]">
        <span className="h-2 w-2 rounded-full" style={{ background: STAGE_MARKER_COLOR[point.stage] }} />
        {STAGE_LABELS[point.stage]}
      </p>
    )}
  </div>
);

const MarkerLayer: React.FC<{
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  colorBy?: (point: MapPoint) => string;
  onHoverPoint: (point: MapPoint, map: L.Map) => void;
  onLeavePoint: () => void;
}> = ({ points, selectedId, onSelect, colorBy, onHoverPoint, onLeavePoint }) => {
  const map = useMap();

  return (
    <>
      {points.map((p) => {
        const isSelected = p.id === selectedId;
        const color = colorBy ? colorBy(p) : p.stage ? STAGE_MARKER_COLOR[p.stage] : '#0ea5e9';
        return (
          <Marker
            key={p.id + (isSelected ? ':sel' : '')}
            position={[p.lat, p.lng]}
            icon={buildIcon(color, isSelected)}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{
              click: () => onSelect?.(p.id),
              mouseover: () => onHoverPoint(p, map),
              mouseout: onLeavePoint,
            }}
          />
        );
      })}
    </>
  );
};

export const CrmCompaniesMap: React.FC<{
  companies: Array<CrmCompany | MapPoint>;
  height?: number | string;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  flyOffsetX?: number;
  /** Override pin color per point (returns hex/css color). Falls back to stage color. */
  colorBy?: (point: MapPoint) => string;
  /** Override tooltip content per point. If omitted, the default tooltip is rendered. */
  renderTooltip?: (point: MapPoint) => React.ReactNode;
  /** Padding [y, x] in pixels reserved around points when fitting bounds. */
  fitPadding?: [number, number];
  /** Approx hover card size [w, h] used to clamp the card inside the map without moving it. */
  tooltipSize?: [number, number];
}> = ({ companies, height = 480, onSelect, selectedId, flyOffsetX = 0, colorBy, renderTooltip, fitPadding = [40, 40], tooltipSize = [220, 120] }) => {
  const [hoverCard, setHoverCard] = React.useState<{ point: MapPoint; left: number; top: number } | null>(null);
  const hideTimerRef = React.useRef<number | null>(null);

  const points: MapPoint[] = React.useMemo(() => {
    return companies
      .map((c: any) => {
        if (c.lat != null && c.lng != null) return c as MapPoint;
        if (c.latitude != null && c.longitude != null) {
          return {
            id: c.id,
            lat: c.latitude,
            lng: c.longitude,
            title: c.denomination ?? c.nom_complet ?? c.siren,
            subtitle: c.ville ?? undefined,
            stage: c.lifecycle_stage as CrmCompanyStage | undefined,
          };
        }
        return null;
      })
      .filter(Boolean) as MapPoint[];
  }, [companies]);

  const selectedPoint = React.useMemo(
    () => (selectedId ? points.find((p) => p.id === selectedId) ?? null : null),
    [selectedId, points]
  );

  const clearHideTimer = React.useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hideHoverCard = React.useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => setHoverCard(null), 180);
  }, [clearHideTimer]);

  React.useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const showHoverCard = React.useCallback((point: MapPoint, map: L.Map) => {
    clearHideTimer();
    const [cardWidth, cardHeight] = tooltipSize;
    const margin = 12;
    const markerGap = 46;
    const size = map.getSize();
    const cp = map.latLngToContainerPoint([point.lat, point.lng]);

    const maxLeft = Math.max(margin, size.x - cardWidth - margin);
    const left = Math.min(Math.max(cp.x - cardWidth / 2, margin), maxLeft);
    const preferredTop = cp.y - cardHeight - markerGap;
    const fallbackTop = cp.y + 12;
    const rawTop = preferredTop >= margin ? preferredTop : fallbackTop;
    const maxTop = Math.max(margin, size.y - cardHeight - margin);
    const top = Math.min(Math.max(rawTop, margin), maxTop);

    setHoverCard({ point, left, top });
  }, [clearHideTimer, tooltipSize]);

  return (
    <div className="relative rounded-2xl overflow-hidden border shadow-sm" style={{ height }}>
      <style>{`
        .crm-marker { background: transparent !important; border: 0 !important; }
        .crm-pin-wrap { position: relative; width: 30px; height: 40px; }
        .crm-pin-svg { display: block; }
        .crm-pin-halo {
          position: absolute; left: 50%; top: 10px;
          width: 30px; height: 30px; transform: translateX(-50%);
          border-radius: 9999px;
          background: var(--c);
          opacity: .35;
          animation: crm-ping 1.6s cubic-bezier(0,0,.2,1) infinite;
        }
        .crm-pin-wrap::after {
          content: ""; position: absolute; left: 50%; top: 10px;
          width: 14px; height: 14px; transform: translateX(-50%);
          border-radius: 9999px;
          box-shadow: 0 0 0 0 transparent;
        }
        @keyframes crm-ping {
          0% { transform: translateX(-50%) scale(0.7); opacity: .55; }
          80%, 100% { transform: translateX(-50%) scale(2.2); opacity: 0; }
        }
        .crm-map-hover-card {
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 10px;
          padding: 8px 10px;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,.4);
          font-family: inherit;
        }
      `}</style>
      <MapContainer
        center={[46.6, 2.5]}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} skip={!!selectedPoint} padding={fitPadding} />
        <FlyToSelected point={selectedPoint} offsetX={flyOffsetX} />

        <MarkerLayer
          points={points}
          selectedId={selectedId}
          onSelect={onSelect}
          colorBy={colorBy}
          onHoverPoint={showHoverCard}
          onLeavePoint={hideHoverCard}
        />
      </MapContainer>
      {hoverCard && (
        <button
          type="button"
          className="crm-map-hover-card absolute z-[1000] block cursor-pointer text-left"
          style={{ left: hoverCard.left, top: hoverCard.top, width: tooltipSize[0] }}
          onMouseEnter={clearHideTimer}
          onMouseLeave={hideHoverCard}
          onClick={() => onSelect?.(hoverCard.point.id)}
        >
          {renderTooltip ? renderTooltip(hoverCard.point) : <DefaultMapTooltip point={hoverCard.point} />}
        </button>
      )}
    </div>
  );
};
