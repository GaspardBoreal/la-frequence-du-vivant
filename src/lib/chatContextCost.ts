/**
 * Frugalité IA — mesure du poids d'un contexte envoyé au modèle.
 *
 * Principe : rien n'est envoyé tant que l'utilisateur n'a pas activé un
 * contexte. Chaque contexte affiche son coût AVANT activation, et la console
 * agrège le total en octets / tokens estimés / éco-score.
 */

/** Ratio empirique octets → tokens pour du JSON français compact. */
const BYTES_PER_TOKEN = 3.6;

export const payloadBytes = (value: unknown): number => {
  if (value === undefined || value === null) return 0;
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return 0;
  }
};

export const estimateTokens = (bytes: number): number => Math.round(bytes / BYTES_PER_TOKEN);

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

export const formatTokens = (tokens: number): string =>
  tokens >= 1000 ? `~${(tokens / 1000).toFixed(1)}k tokens` : `~${tokens} tokens`;

export type EcoScore = 'frugal' | 'mesure' | 'copieux';

export interface EcoVerdict {
  score: EcoScore;
  label: string;
  hint: string;
  /** Progression 0→1 vers le plafond « copieux ». */
  ratio: number;
}

/** Seuils (en octets) calés sur l'usage réel : une palette d'ouvrage ≈ 2 Ko. */
const SEUIL_MESURE = 6 * 1024;
const SEUIL_COPIEUX = 20 * 1024;

export const ecoVerdict = (bytes: number): EcoVerdict => {
  const ratio = Math.min(1, bytes / SEUIL_COPIEUX);
  if (bytes <= SEUIL_MESURE) {
    return {
      score: 'frugal',
      label: 'Frugal',
      hint: "Contexte léger : la réponse sera rapide et peu coûteuse.",
      ratio,
    };
  }
  if (bytes <= SEUIL_COPIEUX) {
    return {
      score: 'mesure',
      label: 'Mesuré',
      hint: "Contexte confortable. Restreignez le périmètre à un ouvrage si la réponse dérive.",
      ratio,
    };
  }
  return {
    score: 'copieux',
    label: 'Copieux',
    hint: "Beaucoup de données : ciblez un ouvrage et un rayon plutôt que la propriété entière.",
    ratio,
  };
};

export const ECO_COLORS: Record<EcoScore, { text: string; bg: string; ring: string; bar: string }> = {
  frugal: {
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    ring: 'border-emerald-400/30',
    bar: 'bg-emerald-400',
  },
  mesure: {
    text: 'text-amber-300',
    bg: 'bg-amber-500/10',
    ring: 'border-amber-400/30',
    bar: 'bg-amber-400',
  },
  copieux: {
    text: 'text-orange-300',
    bg: 'bg-orange-500/10',
    ring: 'border-orange-400/30',
    bar: 'bg-orange-400',
  },
};
