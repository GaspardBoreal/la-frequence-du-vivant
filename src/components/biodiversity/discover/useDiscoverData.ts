import { useMemo } from 'react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { useSpeciesThumbs } from '@/hooks/useSpeciesThumb';

/**
 * Adapter qui résout en batch les vignettes (cache species_thumb_cache) pour
 * la liste d'espèces fournie au mode Découverte. Retourne aussi une map
 * scientificName (lower) → url, pratique pour les jeux et le screensaver.
 */
export function useDiscoverData(species: BiodiversitySpecies[]) {
  const names = useMemo(
    () => Array.from(new Set(species.map((s) => s.scientificName).filter(Boolean))),
    [species],
  );
  const thumbs = useSpeciesThumbs(names);

  const photoBy = useMemo(() => {
    const m = new Map<string, string>();
    const data = thumbs.data as Map<string, { photo_url: string | null; scientific_name: string }> | undefined;
    if (data) {
      data.forEach((row, key) => {
        if (row?.photo_url) m.set(key.toLowerCase(), row.photo_url);
      });
    }
    // Fallback : photos déjà attachées à species (marcheur)
    for (const s of species) {
      const k = s.scientificName?.toLowerCase();
      if (k && !m.has(k) && s.photos?.[0]) m.set(k, s.photos[0]);
    }
    return m;
  }, [thumbs.data, species]);

  const withPhoto = useMemo(
    () => species.filter((s) => photoBy.has(s.scientificName?.toLowerCase() ?? '')),
    [species, photoBy],
  );

  return { photoBy, withPhoto, isLoading: thumbs.isLoading };
}

export function getSpeciesPhoto(
  photoBy: Map<string, string>,
  s: BiodiversitySpecies,
): string | undefined {
  return photoBy.get(s.scientificName?.toLowerCase() ?? '') ?? s.photos?.[0];
}
