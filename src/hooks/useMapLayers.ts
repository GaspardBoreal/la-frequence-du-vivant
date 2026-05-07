import { useCallback, useEffect, useState } from 'react';

export interface MapLayersState {
  weatherStations: boolean;
  cadastreDetail: boolean;
  recentSpecies: boolean;
}

const DEFAULTS: MapLayersState = {
  weatherStations: false,
  cadastreDetail: false,
  recentSpecies: false,
};

const storageKey = (explorationId: string) => `mapLayers:${explorationId}`;

export const useMapLayers = (explorationId: string | null | undefined) => {
  const [layers, setLayers] = useState<MapLayersState>(DEFAULTS);

  useEffect(() => {
    if (!explorationId) return;
    try {
      const raw = localStorage.getItem(storageKey(explorationId));
      if (raw) setLayers({ ...DEFAULTS, ...JSON.parse(raw) });
      else setLayers(DEFAULTS);
    } catch {
      setLayers(DEFAULTS);
    }
  }, [explorationId]);

  const toggleLayer = useCallback(
    (key: keyof MapLayersState) => {
      setLayers((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        if (explorationId) {
          try {
            localStorage.setItem(storageKey(explorationId), JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }
        return next;
      });
    },
    [explorationId]
  );

  const activeCount = Object.values(layers).filter(Boolean).length;

  return { layers, toggleLayer, activeCount };
};
