import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Récupère un résumé météo (30 derniers jours) au centroïde d'une parcelle. */
export function useParcelWeather(lat: number | null, lng: number | null, enabled = true) {
  return useQuery({
    queryKey: ['parcel-weather', lat, lng],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('open-meteo-data', {
        body: { latitude: lat, longitude: lng, days: 30 },
      });
      if (error) throw error;
      return data;
    },
    enabled: enabled && lat != null && lng != null,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function summarizeWeather(weather: any): {
  tempMean?: number;
  tempMax?: number;
  tempMin?: number;
  precipSum?: number;
  humidityMean?: number;
} {
  const daily = weather?.data?.daily;
  if (!daily) return {};
  const avg = (arr?: number[]) =>
    arr && arr.length ? arr.filter(v => v != null).reduce((s, v) => s + v, 0) / arr.filter(v => v != null).length : undefined;
  const sum = (arr?: number[]) =>
    arr && arr.length ? arr.filter(v => v != null).reduce((s, v) => s + v, 0) : undefined;
  return {
    tempMean: avg(daily.temperature_2m_mean),
    tempMax: avg(daily.temperature_2m_max),
    tempMin: avg(daily.temperature_2m_min),
    precipSum: sum(daily.precipitation_sum),
    humidityMean: avg(daily.relative_humidity_2m_mean),
  };
}
