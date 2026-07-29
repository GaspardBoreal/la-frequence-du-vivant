import { useCallback, useState } from 'react';
import { useMapEvents } from 'react-leaflet';

export interface MapViewState {
  center: [number, number];
  zoom: number;
}

/**
 * Rapporte au parent le centre et le zoom réellement affichés.
 * Permet d'ouvrir une vue secondaire (console de curation) sans perdre
 * le cadrage travaillé par l'utilisateur.
 */
export const MapViewReporter: React.FC<{ onChange: (v: MapViewState) => void }> = ({ onChange }) => {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onChange({ center: [c.lat, c.lng], zoom: map.getZoom() });
    },
    zoomend: () => {
      const c = map.getCenter();
      onChange({ center: [c.lat, c.lng], zoom: map.getZoom() });
    },
  });
  return null;
};

/** État de vue mémorisé côté parent + reporter à insérer dans la carte. */
export function useMapViewState(initial?: MapViewState) {
  const [view, setView] = useState<MapViewState | null>(initial ?? null);
  const onChange = useCallback((v: MapViewState) => setView(v), []);
  return { view, onChange };
}

export default useMapViewState;
