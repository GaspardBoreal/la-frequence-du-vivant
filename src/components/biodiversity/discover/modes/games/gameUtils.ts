// Helpers partagés mode Enfant : tirage, mélange, accès photo.
import type { BiodiversitySpecies } from '@/types/biodiversity';

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickWithPhotos(
  species: BiodiversitySpecies[],
  photoBy: Map<string, string>,
  n: number,
): BiodiversitySpecies[] {
  const eligible = species.filter((s) => {
    const k = s.scientificName?.toLowerCase();
    return k && (photoBy.has(k) || s.photos?.[0]);
  });
  return shuffle(eligible).slice(0, Math.min(n, eligible.length));
}

export function photoUrl(s: BiodiversitySpecies, photoBy: Map<string, string>) {
  const k = s.scientificName?.toLowerCase();
  return (k && photoBy.get(k)) || s.photos?.[0];
}

export function displayName(s: BiodiversitySpecies): string {
  return s.commonName?.trim() || s.scientificName;
}
