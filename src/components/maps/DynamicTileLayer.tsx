import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { TILE_CONFIGS, CADASTRE_OVERLAY_URL, SATELLITE_RELAY, type MapStyle } from './mapStyles';
import { setTileNativeState } from './tileNativeZoomStore';

interface Props {
  mapStyle: MapStyle;
  /** Max zoom allowed on the map. Tiles beyond native are upscaled. */
  maxZoom?: number;
}

/**
 * Swap the basemap tiles without remounting the MapContainer.
 *
 * Deux garde-fous rendent le fond increvable en super zoom :
 *  1. un relais mondial (Esri) posé sous l'ortho IGN, qui couvre les niveaux
 *     que l'IGN ne sert pas sur la commune ;
 *  2. une dégradation automatique du `maxNativeZoom` dès que des tuiles
 *     reviennent en erreur — la couche cesse de demander du vide et agrandit
 *     la dernière tuile nette.
 */
const DynamicTileLayer: React.FC<Props> = ({ mapStyle, maxZoom = 19 }) => {
  const map = useMap();
  const cadastreOverlayRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    const config = TILE_CONFIGS[mapStyle];
    const declaredNative = config.maxZoom || 19;
    // Marge obligatoire : sans un maxZoom de COUCHE supérieur à celui de la
    // carte, Leaflet retire purement et simplement le fond en super zoom.
    const layerMax = Math.max(maxZoom + 2, declaredNative);

    const relay =
      mapStyle === 'satellite'
        ? L.tileLayer(SATELLITE_RELAY.url, {
            attribution: SATELLITE_RELAY.attribution,
            maxNativeZoom: SATELLITE_RELAY.maxNativeZoom,
            maxZoom: layerMax,
            zIndex: 1,
          })
        : null;
    relay?.addTo(map);

    const layer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxNativeZoom: declaredNative,
      // Au-delà d'un agrandissement ×4 de l'ortho IGN, on laisse le relais
      // mondial (plus net à ces niveaux) reprendre la main.
      maxZoom: relay ? declaredNative + 2 : layerMax,
      className: config.className || '',
      zIndex: 2,
    });


    // Auto-correction : si le fournisseur renvoie des 404 à un niveau donné,
    // on redescend son palier natif et on redemande les tuiles.
    let effectiveNative = declaredNative;
    const failures = new Map<number, number>();
    const publish = () =>
      setTileNativeState({
        nativeMaxZoom: effectiveNative,
        source: config.label || '',
        relayed: !!relay,
      });
    publish();

    const onTileError = (e: any) => {
      const z: number = e?.coords?.z ?? map.getZoom();
      if (z > effectiveNative) return;
      const n = (failures.get(z) || 0) + 1;
      failures.set(z, n);
      if (n < 3 || z <= 12) return;
      effectiveNative = z - 1;
      layer.options.maxNativeZoom = effectiveNative;
      if (relay) layer.options.maxZoom = effectiveNative + 2;
      publish();
      layer.redraw();
    };
    layer.on('tileerror', onTileError);
    layer.addTo(map);

    return () => {
      layer.off('tileerror', onTileError);
      map.removeLayer(layer);
      if (relay) map.removeLayer(relay);
      if (cadastreOverlayRef.current) {
        map.removeLayer(cadastreOverlayRef.current);
        cadastreOverlayRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle, map]);

  useEffect(() => {
    if (cadastreOverlayRef.current) {
      map.removeLayer(cadastreOverlayRef.current);
      cadastreOverlayRef.current = null;
    }
    if (mapStyle !== 'cadastre') return;
    const overlay = L.tileLayer(CADASTRE_OVERLAY_URL, {
      attribution: '&copy; Etalab — Cadastre',
      opacity: 0.55,
      maxNativeZoom: 20,
      maxZoom: Math.max(maxZoom + 2, 20),
      pane: 'overlayPane',
    });
    overlay.addTo(map);
    cadastreOverlayRef.current = overlay;
    return () => {
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
