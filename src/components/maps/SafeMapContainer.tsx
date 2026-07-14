import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Map as LeafletMap,
  type FitBoundsOptions,
  type LatLngBoundsExpression,
  type LatLngExpression,
  type MapOptions,
} from 'leaflet';
import { CONTEXT_VERSION, LeafletProvider } from '@react-leaflet/core';

export interface SafeMapContainerProps extends MapOptions {
  center?: LatLngExpression;
  zoom?: number;
  bounds?: LatLngBoundsExpression;
  boundsOptions?: FitBoundsOptions;
  className?: string;
  id?: string;
  placeholder?: React.ReactNode;
  style?: React.CSSProperties;
  whenCreated?: (map: LeafletMap) => void;
  whenReady?: () => void;
  children?: React.ReactNode;
}

/**
 * Drop-in replacement for react-leaflet v3's MapContainer.
 *
 * The bundled MapContainer stores the created Leaflet instance only in React
 * state. If a parent re-renders during the same passive-effects flush, it can
 * try to construct a second Leaflet map on the same DOM node and Leaflet throws
 * “Map container is already initialized.” This component keeps the instance in
 * a ref synchronously before setting state, making initialization idempotent.
 */
const SafeMapContainer = forwardRef<LeafletMap | null, SafeMapContainerProps>((props, forwardedRef) => {
  const {
    children,
    className,
    id,
    placeholder,
    style,
    whenCreated,
    whenReady,
    center,
    zoom,
    bounds,
    boundsOptions,
    ...options
  } = props;

  const [map, setMap] = useState<LeafletMap | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initRef = useRef({ center, zoom, bounds, boundsOptions, options, whenCreated, whenReady });
  initRef.current = { center, zoom, bounds, boundsOptions, options, whenCreated, whenReady };

  const [containerProps] = useState({ className, id, style });

  useImperativeHandle(forwardedRef, () => mapInstanceRef.current, [map]);

  const attachContainer = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    containerRef.current = node;

    if (mapInstanceRef.current) return;

    // In case HMR or a previous failed mount left Leaflet's marker on the node.
    if ((node as HTMLDivElement & { _leaflet_id?: number })._leaflet_id) {
      delete (node as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
    }

    const init = initRef.current;
    const instance = new LeafletMap(node, init.options);
    mapInstanceRef.current = instance;

    if (init.center != null && init.zoom != null) {
      instance.setView(init.center, init.zoom);
    } else if (init.bounds != null) {
      instance.fitBounds(init.bounds, init.boundsOptions);
    }

    if (init.whenReady) {
      instance.whenReady(init.whenReady);
    }

    init.whenCreated?.(instance);
    setMap(instance);
  }, []);

  useEffect(() => {
    return () => {
      const instance = mapInstanceRef.current;
      const node = containerRef.current;

      if (instance) {
        instance.remove();
        mapInstanceRef.current = null;
      }

      if (node) {
        delete (node as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
      }
    };
  }, []);

  const context = useMemo(
    () => (map ? { __version: CONTEXT_VERSION, map } : null),
    [map],
  );

  return (
    <div {...containerProps} ref={attachContainer}>
      {context ? <LeafletProvider value={context}>{children}</LeafletProvider> : placeholder ?? null}
    </div>
  );
});

SafeMapContainer.displayName = 'SafeMapContainer';

export default SafeMapContainer;