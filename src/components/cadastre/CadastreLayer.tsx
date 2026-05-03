import React, { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { CadastrePoint, useLexiconParcelsWithGeometry } from './useLexiconParcels';
import { extractParcelInfo, geometryCentroid } from './cadastreUtils';
import ParcelPopup from './ParcelPopup';

interface CadastreLayerProps {
  points: CadastrePoint[];
  enabled?: boolean;
  /** Géométrie supplémentaire (preview après repositionnement). */
  previewGeometry?: any;
  previewData?: any;
}

const STYLE: L.PathOptions = {
  color: '#ef4444',
  weight: 2.5,
  opacity: 0.85,
  fillColor: '#fbbf24',
  fillOpacity: 0.28,
};

const PREVIEW_STYLE: L.PathOptions = {
  color: '#3b82f6',
  weight: 3,
  opacity: 0.95,
  fillColor: '#60a5fa',
  fillOpacity: 0.25,
  dashArray: '6 6',
};

const CadastreLayer: React.FC<CadastreLayerProps> = ({ points, enabled = true, previewGeometry, previewData }) => {
  const items = useLexiconParcelsWithGeometry(points, enabled);

  if (!enabled) return null;

  return (
    <>
      {items.map(({ point, lexicon, geometry: realGeom }) => {
        // Priorité: géométrie cadastre-proxy (vraie parcelle) > shape LEXICON > geometry brute
        const geometry =
          realGeom ||
          lexicon?._raw?.cadastre?.shape ||
          lexicon?.geometry ||
          lexicon?._raw?.geometry;
        if (!geometry?.coordinates) return null;
        const info = extractParcelInfo(lexicon);
        const centroid = geometryCentroid(geometry) || { lat: point.lat, lng: point.lng };
        return (
          <GeoJSON key={`${point.id}-${info.parcelId || 'p'}`} data={geometry as any} style={STYLE}>
            <ParcelPopup info={info} centroid={centroid} />
          </GeoJSON>
        );
      })}

      {previewGeometry?.coordinates && (
        <GeoJSON
          key={`preview-${JSON.stringify(previewGeometry.coordinates).slice(0, 50)}`}
          data={previewGeometry as any}
          style={PREVIEW_STYLE}
        >
          <ParcelPopup
            info={extractParcelInfo(previewData)}
            centroid={geometryCentroid(previewGeometry)}
          />
        </GeoJSON>
      )}
    </>
  );
};

export default CadastreLayer;
