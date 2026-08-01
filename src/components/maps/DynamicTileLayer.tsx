import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { TILE_CONFIGS, CADASTRE_OVERLAY_URL, SATELLITE_RELAY, type MapStyle } from './mapStyles';
import { setTileNativeState } from './tileNativeZoomStore';
import { probeNativeZoom } from './tileCoverageProbe';

interface Props {
  mapStyle: MapStyle;
  /** Max zoom allowed on the map. Tiles beyond native are upscaled. */
  maxZoom?: number;
}

/**
 * Swap the basemap tiles without remounting the MapContainer.
 *
 * Trois garde-fous rendent le fond increvable en super zoom :
 *  1. une sonde de couverture (inventaire Esri + test de tuile IGN) qui mesure
 *     le vrai palier natif au point regardé, avant même d'afficher une tuile ;
 *  2. un relais mondial (Esri) posé sous l'ortho IGN ;
 *  3. une dégradation automatique sur `tileerror` ET sur tuile « pancarte »
 *     (image valide mais uniforme : « Map data not yet available »).
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
    const isSat = mapStyle === 'satellite';

    const relay = isSat
      ? L.tileLayer(SATELLITE_RELAY.url, {
          attribution: SATELLITE_RELAY.attribution,
          maxNativeZoom: SATELLITE_RELAY.maxNativeZoom,
          maxZoom: layerMax,
          zIndex: 1,
          crossOrigin: true,
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
      crossOrigin: true,
    });

    // ---- État de couverture ------------------------------------------------
    let ignNative = declaredNative;
    let esriNative = SATELLITE_RELAY.maxNativeZoom;
    let probed = false;
    let disposed = false;
    const failures = new Map<string, number>();

    const applyAndPublish = () => {
      layer.options.maxNativeZoom = ignNative;
      layer.options.maxZoom = relay ? Math.min(ignNative + 2, layerMax) : layerMax;
      if (relay) relay.options.maxNativeZoom = esriNative;

      const best = relay ? Math.max(ignNative, esriNative) : ignNative;
      const activeSource = !relay
        ? config.label || ''
        : ignNative >= esriNative
          ? 'IGN BD ORTHO'
          : 'Esri World Imagery';
      setTileNativeState({
        nativeMaxZoom: best,
        source: config.label || '',
        relayed: !!relay && esriNative > ignNative,
        activeSource,
        coverageProbed: probed,
      });
    };
    applyAndPublish();

    // ---- 1. Sonde de couverture au point regardé ---------------------------
    let probeToken = 0;
    const runProbe = async () => {
      if (!isSat) return;
      const token = ++probeToken;
      const c = map.getCenter();
      const target = Math.min(Math.ceil(map.getZoom()), 21);
      if (target < 15) return;
      const [ign, esri] = await Promise.all([
        probeNativeZoom('ign', c.lat, c.lng, Math.min(target, 21)),
        probeNativeZoom('esri', c.lat, c.lng, Math.min(target, 21)),
      ]);
      if (disposed || token !== probeToken) return;
      const changed = ign !== ignNative || esri !== esriNative;
      ignNative = ign;
      esriNative = esri;
      probed = true;
      applyAndPublish();
      if (changed) {
        layer.redraw();
        relay?.redraw();
      }
    };

    let probeTimer: number | undefined;
    const scheduleProbe = () => {
      window.clearTimeout(probeTimer);
      probeTimer = window.setTimeout(runProbe, 350);
    };
    if (isSat) {
      scheduleProbe();
      map.on('moveend zoomend', scheduleProbe);
    }

    // ---- 2. Dégradation sur erreur -----------------------------------------
    const degrade = (which: 'ign' | 'esri', z: number) => {
      if (which === 'ign' && z <= ignNative) {
        ignNative = Math.max(15, z - 1);
      } else if (which === 'esri' && z <= esriNative) {
        esriNative = Math.max(15, z - 1);
      } else return;
      applyAndPublish();
      layer.redraw();
      relay?.redraw();
    };

    const onError = (which: 'ign' | 'esri') => (e: any) => {
      const z: number = e?.coords?.z ?? map.getZoom();
      if (z <= 12) return;
      const key = `${which}:${z}`;
      const n = (failures.get(key) || 0) + 1;
      failures.set(key, n);
      if (n < 3) return;
      degrade(which, z);
    };
    const onIgnError = onError('ign');
    const onEsriError = onError('esri');
    layer.on('tileerror', onIgnError);
    relay?.on('tileerror', onEsriError);

    // ---- 3. Filet « pixel sniffing » : tuile 200 mais pancarte -------------
    let sniffCount = 0;
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const isPlaceholder = (img: HTMLImageElement) => {
      if (!ctx) return false;
      try {
        ctx.drawImage(img, 0, 0, 8, 8);
        const { data } = ctx.getImageData(0, 0, 8, 8);
        let satSum = 0;
        let min = 255;
        let max = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const mx = Math.max(r, g, b);
          const mn = Math.min(r, g, b);
          satSum += mx === 0 ? 0 : (mx - mn) / mx;
          const lum = (r + g + b) / 3;
          if (lum < min) min = lum;
          if (lum > max) max = lum;
        }
        const meanSat = satSum / (data.length / 4);
        // Pancarte Esri : gris quasi uniforme, aucune saturation.
        return meanSat < 0.04 && max - min < 26;
      } catch {
        return false;
      }
    };

    const onEsriLoad = (e: any) => {
      // Échantillonnage 1 tuile sur 4 : coût négligeable.
      if (++sniffCount % 4 !== 0) return;
      const z: number = e?.coords?.z ?? map.getZoom();
      if (z <= 12 || z > esriNative) return;
      const img: HTMLImageElement = e?.tile;
      if (!img?.complete) return;
      if (!isPlaceholder(img)) return;
      const key = `esri-blank:${z}`;
      const n = (failures.get(key) || 0) + 1;
      failures.set(key, n);
      if (n < 2) return;
      degrade('esri', z);
    };
    relay?.on('tileload', onEsriLoad);

    layer.addTo(map);

    return () => {
      disposed = true;
      window.clearTimeout(probeTimer);
      map.off('moveend zoomend', scheduleProbe);
      layer.off('tileerror', onIgnError);
      relay?.off('tileerror', onEsriError);
      relay?.off('tileload', onEsriLoad);
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
