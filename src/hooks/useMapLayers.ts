import { useCallback, useEffect, useState } from 'react';

export type WeatherStationsMode = 'off' | 'on_with_marches' | 'on_only';

export interface MapLayersState {
  weatherStations: WeatherStationsMode;
  cadastreDetail: boolean;
  recentSpecies: boolean;
}

const DEFAULTS: MapLayersState = {
  weatherStations: 'off',
  cadastreDetail: false,
  recentSpecies: false,
};

const storageKey = (explorationId: string) => `mapLayers:${explorationId}`;

const migrate = (raw: any): MapLayersState => {
  const merged = { ...DEFAULTS, ...(raw || {}) };
  // Backward compat: boolean → mode
  if (typeof merged.weatherStations === 'boolean') {
    merged.weatherStations = merged.weatherStations ? 'on_with_marches' : 'off';
  }
  if (!['off', 'on_with_marches', 'on_only'].includes(merged.weatherStations)) {
    merged.weatherStations = 'off';
  }
  return merged as MapLayersState;
};

export const useMapLayers = (explorationId: string | null | undefined) => {
  const [layers, setLayers] = useState<MapLayersState>(DEFAULTS);

  useEffect(() => {
    if (!explorationId) return;
    try {
      const raw = localStorage.getItem(storageKey(explorationId));
      setLayers(raw ? migrate(JSON.parse(raw)) : DEFAULTS);
    } catch {
      setLayers(DEFAULTS);
    }
  }, [explorationId]);

  const persist = useCallback(
    (next: MapLayersState) => {
      if (!explorationId) return;
      try {
        localStorage.setItem(storageKey(explorationId), JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [explorationId]
  );

  const toggleLayer = useCallback(
    (key: keyof MapLayersState) => {
      setLayers((prev) => {
        let next: MapLayersState;
        if (key === 'weatherStations') {
          // Cycle off → on_with_marches → on_only → off
          const cycle: WeatherStationsMode[] = ['off', 'on_with_marches', 'on_only'];
          const idx = cycle.indexOf(prev.weatherStations);
          next = { ...prev, weatherStations: cycle[(idx + 1) % cycle.length] };
        } else {
          next = { ...prev, [key]: !prev[key] } as MapLayersState;
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setWeatherStationsMode = useCallback(
    (mode: WeatherStationsMode) => {
      setLayers((prev) => {
        const next = { ...prev, weatherStations: mode };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const activeCount =
    (layers.weatherStations !== 'off' ? 1 : 0) +
    (layers.cadastreDetail ? 1 : 0) +
    (layers.recentSpecies ? 1 : 0);

  return { layers, toggleLayer, setWeatherStationsMode, activeCount };
};
