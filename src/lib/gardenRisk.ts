import type { PathogenKbEntry } from '@/hooks/propriete/useGardenClinique';

export interface WeatherSummaryLite {
  tempMean?: number;
  tempMax?: number;
  tempMin?: number;
  precipSum?: number;
  humidityMean?: number;
}

export interface RiskReading {
  /** 0 → 100 : pression exercée par le climat des 30 derniers jours. */
  score: number;
  level: 'calme' | 'vigilance' | 'tension' | 'alerte';
  label: string;
  /** Phrases courtes expliquant d'où vient la pression. */
  reasons: string[];
  /** Maladies dont la fenêtre de vigilance est ouverte ce mois-ci. */
  watchlist: PathogenKbEntry[];
}

const LEVELS: Array<{ max: number; level: RiskReading['level']; label: string }> = [
  { max: 24, level: 'calme', label: 'Le jardin respire' },
  { max: 49, level: 'vigilance', label: 'Vigilance douce' },
  { max: 74, level: 'tension', label: 'Tension sur le feuillage' },
  { max: 100, level: 'alerte', label: 'Fenêtre à risque ouverte' },
];

/**
 * Baromètre du jour : croise l'humidité, la pluie et la douceur des trente
 * derniers jours avec les fenêtres de vigilance de la base de connaissance.
 * Aucun chiffre inventé — seules les valeurs réellement relevées comptent.
 */
export function computeGardenRisk(
  weather: WeatherSummaryLite | null | undefined,
  kb: PathogenKbEntry[] | undefined,
  hosts: string[] = [],
  month = new Date().getMonth() + 1,
): RiskReading {
  const reasons: string[] = [];
  let score = 10;

  const hum = weather?.humidityMean;
  const rain = weather?.precipSum;
  const temp = weather?.tempMean;

  if (hum != null) {
    if (hum >= 85) { score += 30; reasons.push(`Humidité moyenne de ${hum.toFixed(0)} % : le feuillage sèche mal.`); }
    else if (hum >= 72) { score += 18; reasons.push(`Humidité moyenne de ${hum.toFixed(0)} % : rosées longues le matin.`); }
    else if (hum < 55) { score -= 5; reasons.push(`Air sec (${hum.toFixed(0)} %) : les champignons progressent peu.`); }
  }

  if (rain != null) {
    if (rain >= 90) { score += 25; reasons.push(`${rain.toFixed(0)} mm cumulés en trente jours : éclaboussures et lessivage.`); }
    else if (rain >= 45) { score += 12; reasons.push(`${rain.toFixed(0)} mm cumulés : sol régulièrement réhumecté.`); }
    else if (rain < 12) { score -= 5; reasons.push(`Seulement ${rain.toFixed(0)} mm en trente jours : stress hydrique plutôt que maladie.`); }
  }

  if (temp != null) {
    if (temp >= 15 && temp <= 24) { score += 15; reasons.push(`Douceur de ${temp.toFixed(1)} °C : la plage préférée des champignons.`); }
    else if (temp > 28) { score += 5; reasons.push(`Chaleur de ${temp.toFixed(1)} °C : surveiller plutôt les ravageurs et la soif.`); }
    else if (temp < 6) { score -= 8; reasons.push(`Froid de ${temp.toFixed(1)} °C : la végétation et les pathogènes ralentissent.`); }
  }

  if (!weather) reasons.push('Météo locale indisponible : le baromètre reste indicatif.');

  const normalizedHosts = hosts.map((h) => h.toLowerCase());
  const watchlist = (kb || []).filter((e) => {
    const inSeason = (e.risk_months || []).includes(month);
    if (!inSeason) return false;
    if (!normalizedHosts.length) return true;
    return (e.hosts || []).some((h) => normalizedHosts.some((n) => n.includes(h.toLowerCase()) || h.toLowerCase().includes(n)));
  });

  if (watchlist.length >= 4) score += 10;
  else if (watchlist.length >= 2) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const tier = LEVELS.find((l) => score <= l.max) ?? LEVELS[LEVELS.length - 1];

  return { score, level: tier.level, label: tier.label, reasons, watchlist };
}

export const RISK_TONE: Record<RiskReading['level'], string> = {
  calme: 'hsl(var(--ds-forest))',
  vigilance: 'hsl(var(--ds-gold))',
  tension: 'hsl(28 78% 48%)',
  alerte: 'hsl(4 68% 48%)',
};
