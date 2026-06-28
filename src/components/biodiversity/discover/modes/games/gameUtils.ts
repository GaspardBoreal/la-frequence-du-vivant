// Helpers partagés mode Enfant : tirage, mélange, accès photo.
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { normalizeSpeciesKey } from '@/hooks/useExplorationFieldPhotos';

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function hasPhoto(s: BiodiversitySpecies, photoBy: Map<string, string>): boolean {
  const k = s.scientificName;
  if (!k) return !!s.photos?.[0];
  return photoBy.has(k.toLowerCase()) || photoBy.has(normalizeSpeciesKey(k)) || !!s.photos?.[0];
}

export function pickWithPhotos(
  species: BiodiversitySpecies[],
  photoBy: Map<string, string>,
  n: number,
): BiodiversitySpecies[] {
  const eligible = species.filter((s) => hasPhoto(s, photoBy));
  return shuffle(eligible).slice(0, Math.min(n, eligible.length));
}

export function photoUrl(s: BiodiversitySpecies, photoBy: Map<string, string>): string | undefined {
  const k = s.scientificName;
  if (!k) return s.photos?.[0];
  return (
    photoBy.get(k.toLowerCase())
    || photoBy.get(normalizeSpeciesKey(k))
    || s.photos?.[0]
  );
}

export function displayName(s: BiodiversitySpecies): string {
  return s.commonName?.trim() || s.scientificName;
}
