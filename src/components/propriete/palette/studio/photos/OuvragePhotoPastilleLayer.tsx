/**
 * Couche « carnet photo » partagée — Atelier du jardin nourricier ET Scénographe.
 *
 * Une seule source de vérité pour l'étiquette photo posée sur les emprises :
 * ancrage au bord de l'ouvrage, anti-collision gauche/droite, variante
 * compacte aux petits zooms, ouverture de la galerie au clic.
 */
import React from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import { photoPastilleIcon } from './PhotoPastille';

/**
 * Point d'accroche de l'étiquette photo : jamais le centre de l'ouvrage,
 * mais son bord (sommet nord-ouest pour un polygone, extrémité pour une
 * ligne). Le décalage visuel est ensuite fait en pixels via `iconAnchor`,
 * pour rester stable à tous les zooms.
 */
export const photoAnchor = (geometry: any): [number, number] | null => {
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
export const useMapZoom = () => {
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
  /** Nombre de photos par objet. */
  photoCounts?: Record<string, number>;
  /** Vignette (1re photo) par objet. */
  photoThumbs?: Record<string, string | undefined>;
  /** Ouvrage sélectionné : sa pastille se relève. */
  selectedId?: string | null;
  /** Clic sur la pastille → ouvre la galerie de l'ouvrage. */
  onOpenPhotos?: (objetId: string) => void;
}

export const OuvragePhotoPastilleLayer: React.FC<Props> = ({
  objets,
  photoCounts,
  photoThumbs,
  selectedId = null,
  onOpenPhotos,
}) => {
  const map = useMap();
  const zoom = useMapZoom();
  const compact = zoom < 18;

  const withPhotos = React.useMemo(
    () => objets.filter((o) => o.geometry && (photoCounts?.[o.id] ?? 0) > 0),
    [objets, photoCounts],
  );

  /**
   * Anti-collision légère : deux étiquettes trop proches (< 26 px) se
   * répartissent de part et d'autre du sommet.
   */
  const sideById = React.useMemo(() => {
    const out: Record<string, 'left' | 'right'> = {};
    const placed: { x: number; y: number }[] = [];
    for (const o of withPhotos) {
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
  }, [withPhotos, map, zoom]);

  return (
    <>
      {withPhotos.map((o) => {
        const anchor = photoAnchor(o.geometry);
        if (!anchor) return null;
        const count = photoCounts?.[o.id] ?? 0;
        const label = o.nom || TOOL_BY_KEY[o.outil_key]?.label || 'Ouvrage';
        const selected = o.id === selectedId;
        return (
          <Marker
            key={`${o.id}-photos-${compact ? 'dot' : sideById[o.id] ?? 'left'}${selected ? '-on' : ''}`}
            position={anchor as any}
            icon={photoPastilleIcon(count, label, photoThumbs?.[o.id], {
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
                📷 Carnet photo · {count} photo{count > 1 ? 's' : ''}
              </span>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
};

export default OuvragePhotoPastilleLayer;
