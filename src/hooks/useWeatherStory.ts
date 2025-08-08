import { useMemo } from "react";

export type StoryEventType = "record" | "spike" | "humidExtreme";

export interface StoryEvent {
  id: string;
  type: StoryEventType;
  index: number; // index in the provided data array
  startIndex?: number; // optional range highlight
  endIndex?: number;
  metric: "temperature" | "humidity" | "both";
  title: string;
  summary: string;
  date: string; // human-readable date
}

export interface SimpleWeatherPoint {
  temperature: number;
  humidity: number;
  fullDateWithYear?: string; // x-axis key used by WeatherVisualization
  date?: string;
}

function formatDateLabel(p?: SimpleWeatherPoint) {
  return p?.fullDateWithYear || p?.date || "";
}

export function useWeatherStory(data: SimpleWeatherPoint[]) {
  const events: StoryEvent[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    const ev: StoryEvent[] = [];

    // Temperature max & min (records)
    let maxT = -Infinity, maxTi = -1;
    let minT = Infinity, minTi = -1;
    let maxH = -Infinity, maxHi = -1;
    let minH = Infinity, minHi = -1;

    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      if (typeof p.temperature === "number") {
        if (p.temperature > maxT) { maxT = p.temperature; maxTi = i; }
        if (p.temperature < minT) { minT = p.temperature; minTi = i; }
      }
      if (typeof p.humidity === "number") {
        if (p.humidity > maxH) { maxH = p.humidity; maxHi = i; }
        if (p.humidity < minH) { minH = p.humidity; minHi = i; }
      }
    }

    if (maxTi >= 0) {
      ev.push({
        id: `record-maxT-${maxTi}`,
        type: "record",
        index: maxTi,
        metric: "temperature",
        title: "Pic de chaleur",
        summary: `Température record de ${maxT.toFixed(1)}°C le ${formatDateLabel(data[maxTi])}.`,
        date: formatDateLabel(data[maxTi])
      });
    }

    if (minTi >= 0) {
      ev.push({
        id: `record-minT-${minTi}`,
        type: "record",
        index: minTi,
        metric: "temperature",
        title: "Frais remarquable",
        summary: `Température minimale de ${minT.toFixed(1)}°C le ${formatDateLabel(data[minTi])}.`,
        date: formatDateLabel(data[minTi])
      });
    }

    if (maxHi >= 0) {
      ev.push({
        id: `record-maxH-${maxHi}`,
        type: "humidExtreme",
        index: maxHi,
        metric: "humidity",
        title: "Humidité au plus haut",
        summary: `Humidité maximale de ${Math.round(maxH)}% le ${formatDateLabel(data[maxHi])}.`,
        date: formatDateLabel(data[maxHi])
      });
    }

    if (minHi >= 0) {
      ev.push({
        id: `record-minH-${minHi}`,
        type: "humidExtreme",
        index: minHi,
        metric: "humidity",
        title: "Air sec",
        summary: `Humidité minimale de ${Math.round(minH)}% le ${formatDateLabel(data[minHi])}.`,
        date: formatDateLabel(data[minHi])
      });
    }

    // Biggest temperature spike between consecutive points
    let spikeDelta = 0, spikeIndex = -1, spikeDir: "up" | "down" = "up";
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const cur = data[i];
      if (typeof prev.temperature === "number" && typeof cur.temperature === "number") {
        const d = cur.temperature - prev.temperature;
        if (Math.abs(d) > Math.abs(spikeDelta)) {
          spikeDelta = d; spikeIndex = i; spikeDir = d >= 0 ? "up" : "down";
        }
      }
    }
    if (spikeIndex >= 0) {
      const label = spikeDir === "up" ? "Hausse fulgurante" : "Chute brutale";
      ev.push({
        id: `spike-T-${spikeIndex}`,
        type: "spike",
        index: spikeIndex,
        metric: "temperature",
        title: label,
        summary: `${label} d'environ ${Math.abs(spikeDelta).toFixed(1)}°C autour du ${formatDateLabel(data[spikeIndex])}.`,
        date: formatDateLabel(data[spikeIndex])
      });
    }

    // Sort by chronological order for natural storytelling
    ev.sort((a, b) => {
      const ia = a.index, ib = b.index;
      return ia - ib;
    });

    return ev;
  }, [data]);

  return { events };
}
