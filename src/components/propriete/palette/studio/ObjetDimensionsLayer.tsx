import React from 'react';
import L from 'leaflet';
import { Marker, Polyline } from 'react-leaflet';
import { computeDimensions, fmtShort } from './geoMetrics';
import type { Ring } from '@/lib/geomTransform';

interface Props {
  coords: Ring;
  kind: 'Point' | 'LineString' | 'Polygon' | null;
  color: string;
  /** Segment survolé sur la carte : sa cote passe au premier plan. */
  hoveredIndex?: number | null;
}

const label = (
  text: string,
  angleDeg: number,
  color: string,
  strong: boolean,
  dim: boolean,
) =>
  L.divIcon({
    className: 'objet-dim-label',
    html: `<span style="
      display:inline-block;
      transform:translate(-50%,-50%) rotate(${angleDeg}deg);
      white-space:nowrap;
      padding:1px 6px;
      border-radius:999px;
      border:1px solid ${color}55;
      background:rgba(250,248,243,${strong ? 0.98 : 0.88});
      color:#1d2a22;
      font-size:${strong ? 11.5 : 10.5}px;
      font-weight:${strong ? 700 : 500};
      font-variant-numeric:tabular-nums;
      letter-spacing:.01em;
      box-shadow:0 1px 4px rgba(0,0,0,.14);
      opacity:${dim ? 0.42 : 1};
    ">${text}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

/**
 * « Le mètre du jardinier » : cotes de chaque côté + cotes d'encombrement
 * (largeur E-O sous la forme, profondeur N-S à sa gauche), en lecture seule.
 */
export const ObjetDimensionsLayer: React.FC<Props> = ({
  coords,
  kind,
  color,
  hoveredIndex = null,
}) => {
  const dims = React.useMemo(() => computeDimensions(coords, kind), [coords, kind]);
  if (!kind || kind === 'Point' || !dims.bbox || coords.length < 2) return null;

  const { minLat, maxLat, minLng, maxLng } = dims.bbox;
  const latPad = Math.max((maxLat - minLat) * 0.14, 1e-6);
  const lngPad = Math.max((maxLng - minLng) * 0.14, 1e-6);
  const tickLat = latPad * 0.28;
  const tickLng = lngPad * 0.28;

  const yBase = minLat - latPad; // cote de largeur (sous la forme)
  const xBase = minLng - lngPad; // cote de profondeur (à gauche)

  const dimLine = { color, weight: 1, opacity: 0.6, dashArray: '3 4' } as const;

  return (
    <>
      {/* Cotes de chaque côté */}
      {dims.segments.map((s) => {
        const strong = hoveredIndex === s.index;
        return (
          <Marker
            key={`seg-${s.index}`}
            position={s.mid as any}
            interactive={false}
            icon={label(fmtShort(s.lengthM), s.angleDeg, color, strong, hoveredIndex != null && !strong)}
          />
        );
      })}

      {/* Cote d'encombrement — largeur */}
      <Polyline positions={[[yBase, minLng], [yBase, maxLng]] as any} pathOptions={dimLine} interactive={false} />
      <Polyline positions={[[yBase - tickLat, minLng], [minLat, minLng]] as any} pathOptions={dimLine} interactive={false} />
      <Polyline positions={[[yBase - tickLat, maxLng], [minLat, maxLng]] as any} pathOptions={dimLine} interactive={false} />
      <Marker
        position={[yBase, (minLng + maxLng) / 2] as any}
        interactive={false}
        icon={label(`↔ ${fmtShort(dims.bbox.widthM)}`, 0, color, false, false)}
      />

      {/* Cote d'encombrement — profondeur */}
      <Polyline positions={[[minLat, xBase], [maxLat, xBase]] as any} pathOptions={dimLine} interactive={false} />
      <Polyline positions={[[minLat, xBase - tickLng], [minLat, minLng]] as any} pathOptions={dimLine} interactive={false} />
      <Polyline positions={[[maxLat, xBase - tickLng], [maxLat, minLng]] as any} pathOptions={dimLine} interactive={false} />
      <Marker
        position={[(minLat + maxLat) / 2, xBase] as any}
        interactive={false}
        icon={label(`↕ ${fmtShort(dims.bbox.depthM)}`, -90, color, false, false)}
      />
    </>
  );
};

export default ObjetDimensionsLayer;
