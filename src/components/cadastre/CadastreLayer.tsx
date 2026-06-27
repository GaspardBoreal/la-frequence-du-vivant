import React from 'react';
import { GeoJSON, Pane } from 'react-leaflet';
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
  /** Mode "Ajouter un point" : on intercepte les clics sur parcelle pour les forwarder à la map. */
  tapMode?: boolean;
  onTapLatLng?: (lat: number, lng: number) => void;
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

const CadastreLayer: React.FC<CadastreLayerProps> = ({
  points,
  enabled = true,
  previewGeometry,
  previewData,
  tapMode = false,
  onTapLatLng,
}) => {
  const items = useLexiconParcelsWithGeometry(points, enabled);

  if (!enabled) return null;

  const tapHandlers = tapMode && onTapLatLng
    ? {
        click: (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onTapLatLng(e.latlng.lat, e.latlng.lng);
        },
      }
    : undefined;

  const tapStyle: L.PathOptions | undefined = tapMode
    ? { ...STYLE, fillOpacity: 0.15, className: 'cadastre-tap-cursor' }
    : undefined;

  return (
    <>
    {/* Pane dédié au popup cadastre — toujours au-dessus des marqueurs d'étapes */}
    <Pane name="cadastre-popup" style={{ zIndex: 1100 }} />
    <Pane name="cadastre-parcels" style={{ zIndex: 450 }}>
      {items.map(({ point, lexicon, geometry: realGeom }) => {
        // Priorité: géométrie cadastre-proxy (vraie parcelle) > shape LEXICON (geolocation/cadastre) > geometry brute
        const geometry =
          realGeom ||
          lexicon?._raw?.geolocation?.shape ||
          lexicon?._raw?.cadastre?.shape ||
          lexicon?.geometry ||
          lexicon?._raw?.geometry;
        if (!geometry?.coordinates) return null;
        const info = extractParcelInfo(lexicon);
        const centroid = geometryCentroid(geometry) || { lat: point.lat, lng: point.lng };
        return (
          <GeoJSON
            key={`${point.id}-${info.parcelId || 'p'}-${tapMode ? 'tap' : 'view'}`}
            data={geometry as any}
            style={tapStyle || STYLE}
            pane="cadastre-parcels"
            eventHandlers={tapHandlers}
          >
            {!tapMode && <ParcelPopup info={info} centroid={centroid} />}
          </GeoJSON>
        );
      })}

      {previewGeometry?.coordinates && (
        <GeoJSON
          key={`preview-${JSON.stringify(previewGeometry.coordinates).slice(0, 50)}-${tapMode ? 'tap' : 'view'}`}
          data={previewGeometry as any}
          style={tapMode ? { ...PREVIEW_STYLE, fillOpacity: 0.12, className: 'cadastre-tap-cursor' } : PREVIEW_STYLE}
          pane="cadastre-parcels"
          eventHandlers={tapHandlers}
        >
          {!tapMode && (
            <ParcelPopup
              info={extractParcelInfo(previewData)}
              centroid={geometryCentroid(previewGeometry)}
            />
          )}
        </GeoJSON>
      )}
    </Pane>
    </>
  );
};


export default CadastreLayer;
