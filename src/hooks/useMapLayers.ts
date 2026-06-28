import { useCallback, useEffect, useState } from 'react';

export type WeatherStationsMode = 'off' | 'on_with_marches' | 'on_only';

export interface MapLayersState {
  weatherStations: WeatherStationsMode;
  weatherStationsRadius: number; // km, 40-100
  showWaypoints: boolean;
  showObservationRadii: boolean;
}

const DEFAULTS: MapLayersState = {
  weatherStations: 'off',
  weatherStationsRadius: 60,
  showWaypoints: false,
  showObservationRadii: true,
};

const storageKey = (explorationId: string) => `mapLayers:${explorationId}`;

const migrate = (raw: any): MapLayersState => {
  const merged = { ...DEFAULTS, ...(raw || {}) };
  if (typeof merged.weatherStations === 'boolean') {
    merged.weatherStations = merged.weatherStations ? 'on_with_marches' : 'off';
  }
  if (!['off', 'on_with_marches', 'on_only'].includes(merged.weatherStations)) {
    merged.weatherStations = 'off';
  }
  const r = Number(merged.weatherStationsRadius);
  merged.weatherStationsRadius = Number.isFinite(r) && r >= 20 && r <= 200 ? r : 60;
  merged.showWaypoints = Boolean(merged.showWaypoints);
  merged.showObservationRadii = merged.showObservationRadii === undefined ? true : Boolean(merged.showObservationRadii);
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
          const cycle: WeatherStationsMode[] = ['off', 'on_with_marches', 'on_only'];
          const idx = cycle.indexOf(prev.weatherStations);
          next = { ...prev, weatherStations: cycle[(idx + 1) % cycle.length] };
        } else if (key === 'weatherStationsRadius') {
          next = prev; // not toggleable
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

  const setWeatherStationsRadius = useCallback(
    (radiusKm: number) => {
      setLayers((prev) => {
        const clamped = Math.max(40, Math.min(100, Math.round(radiusKm)));
        const next = { ...prev, weatherStationsRadius: clamped };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const activeCount =
    (layers.weatherStations !== 'off' ? 1 : 0) +
    (layers.showWaypoints ? 1 : 0);

  return {
    layers,
    toggleLayer,
    setWeatherStationsMode,
    setWeatherStationsRadius,
    activeCount,
  };
};
