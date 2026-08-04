import React from 'react';
import {
  closeRing,
  geomCoords,
  openRing,
  smoothRing,
  withGeomCoords,
  type Ring,
} from '@/lib/geomTransform';
import {
  computeDimensions,
  measureFor,
  type ObjetDimensions,
} from '@/components/propriete/palette/studio/geoMetrics';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { TOOL_BY_KEY } from '@/lib/paysageTools';

export interface ObjetTransformApi {
  objet: ProprieteObjet | null;
  /** Sommets courants [lng, lat][] (1 point pour un objet ponctuel). */
  coords: Ring;
  kind: 'Point' | 'LineString' | 'Polygon' | null;
  unit: 'm2' | 'ml' | 'u';
  dirty: boolean;
  smoothCount: number;
  canUndo: boolean;
  canSmooth: boolean;
  /** Remplace la géométrie éditée (ex. point → emprise réelle polygonale). */
  morph: (geometry: any) => void;
  baseMeasure: number;
  measure: number;
  /** Cotation vivante (côtés, encombrement, périmètre) des sommets courants. */
  dimensions: ObjetDimensions;
  /** Affichage du calque de cotes (mémorisé). */
  showDims: boolean;
  toggleDims: () => void;
  /** Géométrie GeoJSON reconstruite à partir des sommets courants. */
  geometry: any;
  start: (objet: ProprieteObjet) => void;
  pushHistory: () => void;
  preview: (coords: Ring) => void;
  smooth: () => void;
  undo: () => void;
  cancel: () => void;
  save: () => void;
}

/**
 * État d'édition géométrique d'un ouvrage de l'Atelier (mare, potager,
 * pas japonais, massif…). Générique sur le type de géométrie, non destructif :
 * rien n'est écrit en base avant « Valider ».
 */
const DIMS_KEY = 'atelier.objet.showDims';

export function useObjetTransform(
  onSave?: (objet: ProprieteObjet, geometry: any) => void,
): ObjetTransformApi {
  const [objet, setObjet] = React.useState<ProprieteObjet | null>(null);
  const [showDims, setShowDims] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(DIMS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [coords, setCoords] = React.useState<Ring>([]);
  const [history, setHistory] = React.useState<Array<{ coords: Ring; geometry: any }>>([]);
  const [smoothCount, setSmoothCount] = React.useState(0);
  const baseRef = React.useRef<Ring>([]);
  const coordsRef = React.useRef<Ring>([]);
  coordsRef.current = coords;
  const geomRef = React.useRef<any>(null);
  geomRef.current = objet?.geometry ?? null;

  const kind = (objet?.geometry?.type ?? null) as ObjetTransformApi['kind'];
  const unit = (objet ? TOOL_BY_KEY[objet.outil_key]?.unit ?? 'u' : 'u') as 'm2' | 'ml' | 'u';

  const start = React.useCallback((o: ProprieteObjet) => {
    const c = geomCoords(o.geometry);
    baseRef.current = c;
    setObjet(o);
    setCoords(c);
    setHistory([]);
    setSmoothCount(0);
  }, []);

  const pushHistory = React.useCallback(() => {
    setHistory((h) => [...h.slice(-24), { coords: coordsRef.current, geometry: geomRef.current }]);
  }, []);

  /** Morphing de géométrie : le point devient une emprise réelle éditable. */
  const morph = React.useCallback((geometry: any) => {
    setHistory((h) => [...h.slice(-24), { coords: coordsRef.current, geometry: geomRef.current }]);
    setObjet((o) => (o ? { ...o, geometry } : o));
    setCoords(geomCoords(geometry));
  }, []);

  const preview = React.useCallback((next: Ring) => setCoords(next), []);

  const smooth = React.useCallback(() => {
    setHistory((h) => [...h.slice(-24), { coords: coordsRef.current, geometry: geomRef.current }]);
    setCoords((c) => {
      if (c.length < 3) return c;
      const smoothed = smoothRing(c, 1);
      return objet?.geometry?.type === 'Polygon' ? closeRing(smoothed) : smoothed;
    });
    setSmoothCount((n) => n + 1);
  }, [objet]);

  const undo = React.useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setCoords(prev.coords);
      setObjet((o) => (o && prev.geometry ? { ...o, geometry: prev.geometry } : o));
      setSmoothCount((n) => Math.max(0, n - 1));
      return h.slice(0, -1);
    });
  }, []);

  const cancel = React.useCallback(() => {
    setObjet(null);
    setCoords([]);
    setHistory([]);
    setSmoothCount(0);
  }, []);

  const geometry = React.useMemo(
    () => (objet ? withGeomCoords(objet.geometry, coords) : null),
    [objet, coords],
  );

  const baseMeasure = React.useMemo(
    () => (objet ? measureFor(unit, withGeomCoords(objet.geometry, baseRef.current)) : 0),
    [objet, unit],
  );
  const measure = React.useMemo(
    () => (geometry ? measureFor(unit, geometry) : 0),
    [geometry, unit],
  );

  const dimensions = React.useMemo(() => computeDimensions(coords, kind), [coords, kind]);

  const toggleDims = React.useCallback(() => {
    setShowDims((v) => {
      const next = !v;
      try {
        localStorage.setItem(DIMS_KEY, next ? '1' : '0');
      } catch {
        /* stockage indisponible */
      }
      return next;
    });
  }, []);

  const dirty = React.useMemo(() => {
    const a = baseRef.current;
    if (a.length !== coords.length) return true;
    return coords.some((p, i) => p[0] !== a[i][0] || p[1] !== a[i][1]);
  }, [coords]);

  const save = React.useCallback(() => {
    if (!objet) return;
    const min = objet.geometry?.type === 'Point' ? 1 : objet.geometry?.type === 'LineString' ? 2 : 3;
    if (openRing(coordsRef.current).length < min) {
      cancel();
      return;
    }
    onSave?.(objet, withGeomCoords(objet.geometry, coordsRef.current));
    cancel();
  }, [objet, onSave, cancel]);

  return {
    objet,
    coords,
    kind,
    unit,
    dirty,
    smoothCount,
    canUndo: history.length > 0,
    canSmooth: kind === 'Polygon' && coords.length >= 4,
    morph,
    baseMeasure,
    measure,
    dimensions,
    showDims,
    toggleDims,
    geometry,
    start,
    pushHistory,
    preview,
    smooth,
    undo,
    cancel,
    save,
  };
}

export default useObjetTransform;
