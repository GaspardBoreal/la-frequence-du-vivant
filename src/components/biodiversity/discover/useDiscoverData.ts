import { useMemo } from 'react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { useSpeciesThumbs } from '@/hooks/useSpeciesThumb';
import { useExplorationFieldPhotos, normalizeSpeciesKey } from '@/hooks/useExplorationFieldPhotos';

/**
 * Adapter qui résout en batch les vignettes pour le mode Découverte.
 *
 * Cascade (par priorité) :
 *   1. Photos terrain marcheurs / citoyennes (instantanées, via exploration_id)
 *   2. photos déjà attachées à BiodiversitySpecies (snapshot)
 *   3. Cache species_thumb_cache (résolution iNat/GBIF)
 *
 * Retourne aussi une map normalisée scientificName → url, indexée à la fois
 * par lower-case et par clé sans diacritiques pour matcher les deux sources.
 */
export function useDiscoverData(
  species: BiodiversitySpecies[],
  explorationId?: string,
) {
  const names = useMemo(
    () => Array.from(new Set(species.map((s) => s.scientificName).filter(Boolean))),
    [species],
  );
  const thumbs = useSpeciesThumbs(names);
  const field = useExplorationFieldPhotos(explorationId);

  const photoBy = useMemo(() => {
    const m = new Map<string, string>();
    const set = (sci: string | null | undefined, url: string) => {
      if (!sci || !url) return;
      const lk = sci.toLowerCase();
      const nk = normalizeSpeciesKey(sci);
      if (!m.has(lk)) m.set(lk, url);
      if (!m.has(nk)) m.set(nk, url);
    };

    // 1. Field photos (priorité absolue : photos terrain marcheurs)
    const fieldMap = field.data?.byScientificName;
    if (fieldMap) {
      fieldMap.forEach((arr, key) => {
        const first = arr[0]?.url;
        if (first) {
          m.set(key, first);
          m.set(key.toLowerCase(), first);
        }
      });
    }

    // 2. Photos directement attachées à species (snapshot)
    for (const s of species) {
      if (s.photos?.[0]) set(s.scientificName, s.photos[0]);
    }

    // 3. Cache serveur (iNat / GBIF)
    const data = thumbs.data as Map<string, { photo_url: string | null }> | undefined;
    if (data) {
      data.forEach((row, key) => {
        if (row?.photo_url) set(key, row.photo_url);
      });
    }
    return m;
  }, [thumbs.data, field.data, species]);

  const withPhoto = useMemo(
    () => species.filter((s) => {
      const k = s.scientificName;
      if (!k) return false;
      return photoBy.has(k.toLowerCase()) || photoBy.has(normalizeSpeciesKey(k));
    }),
    [species, photoBy],
  );

  return {
    photoBy,
    withPhoto,
    isLoading: thumbs.isLoading || field.isLoading,
    eligibleCount: withPhoto.length,
    totalCount: species.length,
  };
}

export function getSpeciesPhoto(
  photoBy: Map<string, string>,
  s: BiodiversitySpecies,
): string | undefined {
  const k = s.scientificName;
  if (!k) return s.photos?.[0];
  return photoBy.get(k.toLowerCase())
    || photoBy.get(normalizeSpeciesKey(k))
    || s.photos?.[0];
}
