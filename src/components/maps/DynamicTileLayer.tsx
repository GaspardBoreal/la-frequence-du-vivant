import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { TILE_CONFIGS, CADASTRE_OVERLAY_URL, type MapStyle } from './mapStyles';

interface Props {
  mapStyle: MapStyle;
}

/**
 * Swap the basemap tiles without remounting the MapContainer.
 * Adds the Etalab cadastre overlay when mapStyle === 'cadastre'.
 */
const DynamicTileLayer: React.FC<Props> = ({ mapStyle }) => {
  const map = useMap();
  const [currentLayer, setCurrentLayer] = useState<L.TileLayer | null>(null);
  const cadastreOverlayRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (currentLayer) {
      map.removeLayer(currentLayer);
    }
    const config = TILE_CONFIGS[mapStyle];
    const layer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom || 19,
      className: config.className || '',
    });
    layer.addTo(map);
    setCurrentLayer(layer);

    if (cadastreOverlayRef.current) {
      map.removeLayer(cadastreOverlayRef.current);
      cadastreOverlayRef.current = null;
    }
    if (mapStyle === 'cadastre') {
      const overlay = L.tileLayer(CADASTRE_OVERLAY_URL, {
        attribution: '&copy; Etalab — Cadastre',
        opacity: 0.55,
        maxZoom: 20,
        pane: 'overlayPane',
      });
      overlay.addTo(map);
      cadastreOverlayRef.current = overlay;
    }

    return () => {
      map.removeLayer(layer);
      if (cadastreOverlayRef.current) {
        map.removeLayer(cadastreOverlayRef.current);
        cadastreOverlayRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle, map]);

  return null;
};

export default DynamicTileLayer;
