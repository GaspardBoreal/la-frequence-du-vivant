import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  getTileNativeState,
  subscribeTileNative,
  type TileNativeState,
} from '../tileNativeZoomStore';

interface Props {
  /** Ignoré : le palier natif réel est désormais mesuré à l'usage. */
  nativeMaxZoom?: number;
}

/**
 * Repère d'échelle discret : niveau de zoom courant + barre métrique Leaflet.
 * Utile pour dimensionner un massif au mètre près pendant le tracé.
 */
export const ZoomScaleBadge: React.FC<Props> = () => {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(map.getZoom());
  const [tiles, setTiles] = useState<TileNativeState>(getTileNativeState);

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoom zoomend', onZoom);
    const scale = L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 120 });
    scale.addTo(map);
    const off = subscribeTileNative(setTiles);
    return () => {
      map.off('zoom zoomend', onZoom);
      scale.remove();
      off();
    };
  }, [map]);

  const upscaled = zoom > tiles.nativeMaxZoom;
  const factor = Math.round(2 ** (zoom - tiles.nativeMaxZoom));

  return (
    <div className="leaflet-bottom leaflet-left pointer-events-none">
      <div className="leaflet-control m-2 rounded-xl border border-[hsl(var(--ds-gold))]/60 bg-[hsl(var(--ds-forest-deep))]/90 px-2 py-1 text-[11px] font-semibold tabular-nums text-[hsl(var(--ds-cream))] shadow-lg backdrop-blur">
        zoom {zoom.toFixed(2).replace(/\.00$/, '')}
        {upscaled ? (
          <span className="ml-1.5 font-normal opacity-65">
            · natif z{tiles.nativeMaxZoom} · image agrandie ×{factor}
            {tiles.relayed && ' · relais Esri'}
          </span>
        ) : (
          tiles.source && <span className="ml-1.5 font-normal opacity-55">· {tiles.source}</span>
        )}
      </div>
    </div>
  );
};


export default ZoomScaleBadge;
