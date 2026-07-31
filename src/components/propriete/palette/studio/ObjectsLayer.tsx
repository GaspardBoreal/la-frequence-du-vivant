import React from 'react';
import { Marker, Polygon, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import { hexOf, isChromaticTool, teintesOf } from '@/lib/nuancierKb';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import type { ProprieteCalque } from '@/hooks/propriete/usePropertyCalques';
import { fmtMeasure, measureFor } from './geoMetrics';
import { photoPastilleIcon } from './photos/PhotoPastille';

/**
 * Applique un vrai dégradé SVG des teintes du nuancier au remplissage du
 * polygone Leaflet : un massif bicolore se lit comme bicolore sur le plan.
 */
const useGradientFill = (teintes: string[], id: string) => {
  const ref = React.useRef<any>(null);
  React.useEffect(() => {
    const layer = ref.current;
    const path: SVGPathElement | undefined = layer?._path;
    if (!path) return;
    const svg = path.ownerSVGElement;
    if (!svg) return;
    if (teintes.length < 2) {
      path.removeAttribute('fill');
      path.style.fill = '';
      return;
    }
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }
    const gid = `ds-nuancier-${id}`;
    defs.querySelector(`#${gid}`)?.remove();
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', gid);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '35%');
    teintes.forEach((t, i) => {
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', `${(i / (teintes.length - 1)) * 100}%`);
      stop.setAttribute('stop-color', hexOf(t));
      grad.appendChild(stop);
    });
    defs.appendChild(grad);
    path.style.fill = `url(#${gid})`;
    return () => {
      defs?.querySelector(`#${gid}`)?.remove();
    };
  }, [teintes.join(','), id]);
  return ref;
};

const MassifPolygon: React.FC<{
  id: string;
  teintes: string[];
  positions: any;
  pathOptions: any;
  handlers: any;
  children?: React.ReactNode;
}> = ({ id, teintes, positions, pathOptions, handlers, children }) => {
  const ref = useGradientFill(teintes, id);
  return (
    <Polygon
      ref={ref as any}
      positions={positions}
      pathOptions={pathOptions}
      eventHandlers={handlers}
    >
      {children}
    </Polygon>
  );
};

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

/**
 * Point d'accroche de l'étiquette photo : jamais le centre de l'ouvrage,
 * mais son bord (sommet nord-ouest pour un polygone, extrémité pour une
 * ligne). Le décalage visuel est ensuite fait en pixels via `iconAnchor`,
 * pour rester stable à tous les zooms.
 */
const photoAnchor = (geometry: any): [number, number] | null => {
  if (!geometry) return null;
  if (geometry.type === 'Point') {
    const c = geometry.coordinates;
    return [c[1], c[0]];
  }
  if (geometry.type === 'LineString') {
    const cs = geometry.coordinates || [];
    if (!cs.length) return null;
    // Extrémité la plus au nord : l'étiquette pend en marge du tracé.
    const m = cs.reduce((a: number[], b: number[]) => (b[1] > a[1] ? b : a), cs[0]);
    return [m[1], m[0]];
  }
  if (geometry.type === 'Polygon') {
    const ring: number[][] = geometry.coordinates?.[0] || [];
    if (!ring.length) return null;
    const lats = ring.map((c) => c[1]);
    const lngs = ring.map((c) => c[0]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const dLat = maxLat - minLat || 1;
    const dLng = maxLng - minLng || 1;
    // Sommet réel le plus proche du coin nord-ouest de l'enveloppe.
    let best = ring[0];
    let bestScore = -Infinity;
    for (const c of ring) {
      const score = (c[1] - minLat) / dLat + (maxLng - c[0]) / dLng;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return [best[1], best[0]];
  }
  return null;
};

/** Zoom courant de la carte, pour la variante compacte de la pastille. */
const useMapZoom = () => {
  const map = useMap();
  const [zoom, setZoom] = React.useState<number>(() => map.getZoom());
  React.useEffect(() => {
    const on = () => setZoom(map.getZoom());
    map.on('zoomend', on);
    return () => {
      map.off('zoomend', on);
    };
  }, [map]);
  return zoom;
};


interface Props {
  objets: ProprieteObjet[];
  calques: ProprieteCalque[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Objet rendu par la couche d'édition : masqué ici pour éviter le doublon. */
  hiddenId?: string | null;
  /** Double-clic : entrée directe en mode Transformer. */
  onActivate?: (id: string) => void;
  /** 0 = An 0, 1 = An 3, 2 = An 10 — fait grandir les plantations */
  timeIndex?: number;
  /** Nombre de photos par objet — pastille photo sur la carte. */
  photoCounts?: Record<string, number>;
  /** Vignette (1re photo) par objet, affichée dans la pastille. */
  photoThumbs?: Record<string, string | undefined>;
  /** Clic sur la pastille photo → ouvre la galerie de l'ouvrage. */
  onOpenPhotos?: (objetId: string) => void;
}

export const ObjectsLayer: React.FC<Props> = ({
  objets,
  calques,
  selectedId,
  onSelect,
  hiddenId = null,
  onActivate,
  timeIndex = 0,
  photoCounts,
  photoThumbs,
  onOpenPhotos,
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

  const zoom = useMapZoom();
  const map = useMap();
  const compact = zoom < 18;

  /**
   * Anti-collision légère : deux étiquettes trop proches (< 26 px) se
   * répartissent de part et d'autre du sommet.
   */
  const sideById = React.useMemo(() => {
    const out: Record<string, 'left' | 'right'> = {};
    const placed: { x: number; y: number }[] = [];
    for (const o of ordered) {
      if (!(photoCounts?.[o.id] ?? 0)) continue;
      const a = photoAnchor(o.geometry);
      if (!a) continue;
      let pt: { x: number; y: number };
      try {
        pt = map.latLngToLayerPoint(L.latLng(a[0], a[1])) as any;
      } catch {
        out[o.id] = 'left';
        continue;
      }
      const clash = placed.some((p) => Math.abs(p.x - pt.x) < 26 && Math.abs(p.y - pt.y) < 26);
      out[o.id] = clash ? 'right' : 'left';
      placed.push(pt);
    }
    return out;
  }, [ordered, photoCounts, map, zoom]);


  return (
    <>
      {ordered.map((o) => {
        const tool = TOOL_BY_KEY[o.outil_key];
        if (!tool) return null;
        if (o.id === hiddenId) return null;
        const cal = o.calque_id ? calqueById[o.calque_id] : null;
        if (cal && !cal.visible) return null;
        const layerOpacity = cal ? cal.opacite : 1;
        const color = (o.style?.color as string) || tool.color;
        const selected = o.id === selectedId;
        const label = o.nom || tool.label;
        const growth = tool.growth?.[Math.min(timeIndex, 2)] ?? null;
        const scale = growth ? 0.85 + (growth / (tool.growth?.[2] || 1)) * 0.5 : 1;
        const weightBoost = growth ? 1 + timeIndex * 0.9 : 1;
        const handlers = {
          click: (e: any) => {
            e.originalEvent?.stopPropagation?.();
            onSelect(o.id);
          },
          dblclick: (e: any) => {
            e.originalEvent?.preventDefault?.();
            e.originalEvent?.stopPropagation?.();
            onSelect(o.id);
            onActivate?.(o.id);
          },
        };
        const measure = fmtMeasure(tool.unit, measureFor(tool.unit, o.geometry));

        const tip = (
          <Tooltip sticky>
            <span style={{ fontSize: 11 }}>
              {tool.glyph} {label}
              {tool.unit !== 'u' ? ` · ${measure}` : ''}
              {photoCounts?.[o.id] ? ` · 📸 ${photoCounts[o.id]}` : ''}
            </span>
          </Tooltip>
        );

        // Pastille « carnet photo » — points, lignes et polygones
        const photoCount = photoCounts?.[o.id] ?? 0;
        const anchor = photoCount > 0 ? photoAnchor(o.geometry) : null;
        const isPoint = o.geometry?.type === 'Point';
        const pastille =
          anchor && photoCount > 0 ? (
            <Marker
              key={`${o.id}-photos-${compact ? 'dot' : sideById[o.id] ?? 'left'}${selected ? '-on' : ''}`}
              position={anchor as any}
              icon={photoPastilleIcon(photoCount, label, photoThumbs?.[o.id], {
                side: sideById[o.id] ?? 'left',
                compact,
                active: selected,
              })}

              zIndexOffset={800}
              interactive
              keyboard={false}
              eventHandlers={{
                click: (e: any) => {
                  e.originalEvent?.stopPropagation?.();
                  L.DomEvent.stop(e);
                  onOpenPhotos?.(o.id);
                },
                dblclick: (e: any) => {
                  e.originalEvent?.stopPropagation?.();
                  L.DomEvent.stop(e);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -12] as any}>
                <span style={{ fontSize: 11 }}>
                  📷 Carnet photo · {photoCount} photo{photoCount > 1 ? 's' : ''}
                </span>
              </Tooltip>
            </Marker>
          ) : null;

        const withPastille = (node: React.ReactNode) =>
          pastille ? (
            <React.Fragment key={o.id}>
              {node}
              {pastille}
            </React.Fragment>
          ) : (
            node
          );

        if (isPoint) {
          const c = o.geometry.coordinates;
          return withPastille(
            <Marker
              key={o.id}
              position={[c[1], c[0]] as any}
              icon={glyphIcon(tool.glyph, color, selected, scale)}
              opacity={layerOpacity}
              eventHandlers={handlers}
            >
              {tip}
            </Marker>,
          );
        }


        if (o.geometry?.type === 'LineString') {
          const pos = (o.geometry.coordinates || []).map((c: number[]) => [c[1], c[0]]);
          if (pos.length < 2) return null;
          return withPastille(
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
              eventHandlers={handlers}
            >
              {tip}
            </Polyline>,
          );
        }

        if (o.geometry?.type === 'Polygon') {
          const ring = (o.geometry.coordinates?.[0] || []).map((c: number[]) => [c[1], c[0]]);
          if (ring.length < 3) return null;
          const teintes = isChromaticTool(o.outil_key) ? teintesOf(o.meta) : [];
          const pathOptions = {
            color: teintes.length ? hexOf(teintes[0]) : color,
            weight: selected ? 3.5 : 2,
            fillColor: teintes.length ? hexOf(teintes[0]) : color,
            fillOpacity: layerOpacity * (selected ? 0.45 : 0.28 + timeIndex * 0.06),
            opacity: layerOpacity,
          };
          if (teintes.length >= 2) {
            return withPastille(
              <MassifPolygon
                key={o.id}
                id={o.id}
                teintes={teintes}
                positions={ring as any}
                pathOptions={pathOptions}
                handlers={handlers}
              >
                {tip}
              </MassifPolygon>,
            );
          }
          return withPastille(
            <Polygon
              key={o.id}
              positions={ring as any}
              pathOptions={pathOptions}
              eventHandlers={handlers}
            >
              {tip}
            </Polygon>,
          );
        }


        return null;
      })}
    </>
  );
};

export default ObjectsLayer;
