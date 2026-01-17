import { useQuery } from '@tanstack/react-query';

interface SpeciesPhotoData {
  photos: string[];
  kingdom: string;
  commonName?: string;
  family?: string;
}

/**
 * Hook to fetch species photo and metadata from iNaturalist API
 * Uses the taxa API to find species by scientific name
 */
export const useSpeciesPhoto = (scientificName: string | undefined) => {
  return useQuery({
    queryKey: ['species-photo', scientificName],
    queryFn: async (): Promise<SpeciesPhotoData | null> => {
      if (!scientificName) return null;

      try {
        // Query iNaturalist Taxa API
        const response = await fetch(
          `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&per_page=5`
        );

        if (!response.ok) {
          console.warn('iNaturalist API error:', response.status);
          return null;
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
          return null;
        }

        // Find the best match - prefer exact scientific name match
        const exactMatch = data.results.find(
          (taxon: any) => taxon.name?.toLowerCase() === scientificName.toLowerCase()
        );
        const taxon = exactMatch || data.results[0];

        // Extract photos
        const photos: string[] = [];
        
        // Default photo
        if (taxon.default_photo?.medium_url) {
          photos.push(taxon.default_photo.medium_url);
        }
        
        // Try to get additional photos from taxon_photos
        if (taxon.taxon_photos && Array.isArray(taxon.taxon_photos)) {
          taxon.taxon_photos.slice(0, 4).forEach((tp: any) => {
            if (tp.photo?.medium_url && !photos.includes(tp.photo.medium_url)) {
              photos.push(tp.photo.medium_url);
            }
          });
        }

        // Determine kingdom from iconic_taxon_name or ancestor_ids
        let kingdom = 'Unknown';
        if (taxon.iconic_taxon_name) {
          const iconicName = taxon.iconic_taxon_name.toLowerCase();
          if (iconicName.includes('plant') || iconicName === 'plantae') {
            kingdom = 'Plantae';
          } else if (iconicName.includes('bird') || iconicName === 'aves') {
            kingdom = 'Animalia';
          } else if (iconicName.includes('mammal') || iconicName === 'mammalia') {
            kingdom = 'Animalia';
          } else if (iconicName.includes('insect') || iconicName === 'insecta') {
            kingdom = 'Animalia';
          } else if (iconicName.includes('fungi')) {
            kingdom = 'Fungi';
          } else if (['amphibia', 'reptilia', 'actinopterygii', 'mollusca', 'arachnida'].includes(iconicName)) {
            kingdom = 'Animalia';
          }
        }

        return {
          photos,
          kingdom,
          commonName: taxon.preferred_common_name || taxon.english_common_name,
          family: taxon.ancestor_ids ? String(taxon.ancestor_ids[taxon.ancestor_ids.length - 2]) : undefined,
        };
      } catch (error) {
        console.warn('Error fetching species photo:', error);
        return null;
      }
    },
    enabled: !!scientificName,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - species photos don't change often
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    retry: 1,
  });
};
