/**
 * Source unique de vérité pour le « rôle » des prélèvements de sol :
 * capacité, alphabet des repères, génération d'identifiants sans collision
 * et positions par défaut lisibles jusqu'à 10 points.
 */
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

export const MIN_SAMPLES = 3;
export const MAX_SAMPLES = 10;

/** A → J : un repère par prélèvement. */
export const SAMPLE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

/** Lettres encore disponibles (hors celle du prélèvement courant). */
export function freeLetters(samples: SoilSample[], exceptId?: string): string[] {
  const taken = new Set(
    samples.filter((s) => s.id !== exceptId).map((s) => (s.label || '').toUpperCase()),
  );
  return SAMPLE_LETTERS.filter((l) => !taken.has(l));
}

/** Première lettre libre, sinon suffixe numéroté (jamais de collision). */
export function nextLabel(samples: SoilSample[]): string {
  const free = freeLetters(samples);
  if (free.length) return free[0];
  return `S${samples.length + 1}`;
}

/** Identifiant stable et unique, indépendant de la lettre affichée. */
export function nextSampleId(samples: SoilSample[]): string {
  const taken = new Set(samples.map((s) => s.id));
  const base = nextLabel(samples);
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

/**
 * Double couronne autour du centre : 5 points à ~30 m puis 5 à ~55 m,
 * décalés d'un demi-pas angulaire pour rester lisibles à 10 pastilles.
 */
export function defaultPositions(center: [number, number]): Array<[number, number]> {
  const latDeg = 0.00027; // ~30 m
  const lngScale = 1 / Math.max(0.2, Math.cos((center[0] * Math.PI) / 180));
  const out: Array<[number, number]> = [];
  for (let ring = 0; ring < 2; ring += 1) {
    const r = latDeg * (ring === 0 ? 1 : 1.85);
    const offset = ring === 0 ? 0 : Math.PI / 5;
    for (let i = 0; i < 5; i += 1) {
      const a = offset + (i * 2 * Math.PI) / 5 - Math.PI / 2;
      out.push([center[0] + r * Math.sin(a), center[1] + r * lngScale * Math.cos(a)]);
    }
  }
  return out;
}
