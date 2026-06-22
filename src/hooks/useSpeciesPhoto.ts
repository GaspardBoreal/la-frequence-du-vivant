import { useSpeciesThumb } from './useSpeciesThumb';

interface SpeciesPhotoData {
  photos: string[];
  kingdom: string;
  commonName?: string;
  family?: string;
}

/**
 * @deprecated Préférez `useSpeciesThumb` / `useSpeciesThumbs` qui lisent
 * directement `species_thumb_cache` (cache serveur fiabilisée).
 *
 * Ce hook est conservé en thin-wrapper pour la rétro-compatibilité des
 * composants existants qui attendent la forme `{ photos, kingdom, commonName }`.
 */
export const useSpeciesPhoto = (scientificName: string | undefined) => {
  const { data, isLoading, isFetching } = useSpeciesThumb(scientificName);

  const photos = data?.photo_url ? [data.photo_url] : [];
  const result: SpeciesPhotoData | null = data
    ? {
        photos,
        kingdom: data.kingdom || 'Unknown',
        commonName: data.common_name_fr || data.common_name_en || undefined,
      }
    : null;

  return {
    data: result,
    isLoading,
    isFetching,
  };
};
