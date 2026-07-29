import React from 'react';
import { Marker, Polygon, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import type { ProprieteCalque } from '@/hooks/propriete/usePropertyCalques';
import { fmtMeasure, measureFor } from './geoMetrics';

const glyphIcon = (glyph: string, color: string, selected: boolean, scale = 1) =>
  L.divIcon({
    className: 'studio-objet-marker',
    html: `<div style="
      width:${28 * scale}px;height:${28 * scale}px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${14 * scale}px;background:#fffdf7;
      border:${selected ? 3 : 2}px solid ${color};
      box-shadow:0 2px 6px rgba(0,0,0,.25);">${glyph}</div>`,
    iconSize: [28 * scale, 28 * scale],
    iconAnchor: [14 * scale, 14 * scale],
  });

interface Props {
  objets: ProprieteObjet[];
  calques: ProprieteCalque[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** 0 = An 0, 1 = An 3, 2 = An 10 — fait grandir les plantations */
  timeIndex?: number;
}

export const ObjectsLayer: React.FC<Props> = ({
  objets,
  calques,
  selectedId,
  onSelect,
  timeIndex = 0,
}) => {
  const calqueById = React.useMemo(
    () => Object.fromEntries(calques.map((c) => [c.id, c])),
    [calques],
  );

  const ordered = React.useMemo(
    () =>
      [...objets].sort((a, b) => {
        const oa = a.calque_id ? calqueById[a.calque_id]?.ordre ?? 0 : 0;
        const ob = b.calque_id ? calqueById[b.calque_id]?.ordre ?? 0 : 0;
        return oa - ob || a.ordre - b.ordre;
      }),
    [objets, calqueById],
  );

  return (
    <>
      {ordered.map((o) => {
        const tool = TOOL_BY_KEY[o.outil_key];
        if (!tool) return null;
        const cal = o.calque_id ? calqueById[o.calque_id] : null;
        if (cal && !cal.visible) return null;
        const layerOpacity = cal ? cal.opacite : 1;
        const color = (o.style?.color as string) || tool.color;
        const selected = o.id === selectedId;
        const label = o.nom || tool.label;
        const growth = tool.growth?.[Math.min(timeIndex, 2)] ?? null;
        const scale = growth ? 0.85 + (growth / (tool.growth?.[2] || 1)) * 0.5 : 1;
        const weightBoost = growth ? 1 + timeIndex * 0.9 : 1;
        const measure = fmtMeasure(tool.unit, measureFor(tool.unit, o.geometry));

        const tip = (
          <Tooltip sticky>
            <span style={{ fontSize: 11 }}>
              {tool.glyph} {label}
              {tool.unit !== 'u' ? ` · ${measure}` : ''}
            </span>
          </Tooltip>
        );

        if (o.geometry?.type === 'Point') {
          const c = o.geometry.coordinates;
          return (
            <Marker
              key={o.id}
              position={[c[1], c[0]] as any}
              icon={glyphIcon(tool.glyph, color, selected, scale)}
              opacity={layerOpacity}
              eventHandlers={{ click: () => onSelect(o.id) }}
            >
              {tip}
            </Marker>
          );
        }

        if (o.geometry?.type === 'LineString') {
          const pos = (o.geometry.coordinates || []).map((c: number[]) => [c[1], c[0]]);
          if (pos.length < 2) return null;
          return (
            <Polyline
              key={o.id}
              positions={pos as any}
              pathOptions={{
                color,
                weight: (selected ? 6 : 4) * weightBoost,
                opacity: layerOpacity * (selected ? 1 : 0.9),
                dashArray: tool.family === 'annotation' ? '8 6' : undefined,
                lineCap: 'round',
              }}
              eventHandlers={{ click: () => onSelect(o.id) }}
            >
              {tip}
            </Polyline>
          );
        }

        if (o.geometry?.type === 'Polygon') {
          const ring = (o.geometry.coordinates?.[0] || []).map((c: number[]) => [c[1], c[0]]);
          if (ring.length < 3) return null;
          return (
            <Polygon
              key={o.id}
              positions={ring as any}
              pathOptions={{
                color,
                weight: selected ? 3.5 : 2,
                fillColor: color,
                fillOpacity: layerOpacity * (selected ? 0.4 : 0.24 + timeIndex * 0.06),
                opacity: layerOpacity,
              }}
              eventHandlers={{ click: () => onSelect(o.id) }}
            >
              {tip}
            </Polygon>
          );
        }
        return null;
      })}
    </>
  );
};

export default ObjectsLayer;
