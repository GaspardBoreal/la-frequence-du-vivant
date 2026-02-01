import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeaturedMarche {
  id: string;
  nom_marche: string | null;
  ville: string;
  region: string | null;
  departement: string | null;
  date: string | null;
  descriptif_court: string | null;
  latitude: number | null;
  longitude: number | null;
  // Media counts
  photos_count: number;
  audio_count: number;
  // Biodiversity stats
  total_species: number;
  birds_count: number;
  plants_count: number;
  // Featured photo
  cover_photo_url: string | null;
  // Completeness score for ranking
  completeness_score: number;
}

/**
 * Hook to fetch the most "complete" marches for the showcase
 * Completeness = photos + audio + biodiversity data
 */
export const useFeaturedMarches = (limit: number = 5) => {
  return useQuery({
    queryKey: ['featured-marches', limit],
    queryFn: async (): Promise<FeaturedMarche[]> => {
      // Fetch marches with basic info
      const { data: marchesData, error: marchesError } = await supabase
        .from('marches')
        .select('id, nom_marche, ville, region, departement, date, descriptif_court, latitude, longitude');

      if (marchesError) throw marchesError;
      if (!marchesData || marchesData.length === 0) return [];

      const marcheIds = marchesData.map(m => m.id);

      // Fetch related data in parallel
      const [photosResult, audioResult, biodiversityResult] = await Promise.all([
        supabase
          .from('marche_photos')
          .select('marche_id, url_supabase, ordre')
          .in('marche_id', marcheIds),
        supabase
          .from('marche_audio')
          .select('marche_id')
          .in('marche_id', marcheIds),
        supabase
          .from('biodiversity_snapshots')
          .select('marche_id, total_species, birds_count, plants_count')
          .in('marche_id', marcheIds)
      ]);

      // Count photos per marche and get cover photo
      const photosCountByMarche: Record<string, number> = {};
      const coverPhotoByMarche: Record<string, string | null> = {};
      
      (photosResult.data || []).forEach(photo => {
        photosCountByMarche[photo.marche_id] = (photosCountByMarche[photo.marche_id] || 0) + 1;
        // Keep the first photo (lowest ordre) as cover
        if (!coverPhotoByMarche[photo.marche_id] || (photo.ordre || 999) < 999) {
          coverPhotoByMarche[photo.marche_id] = photo.url_supabase;
        }
      });

      // Count audio per marche
      const audioCountByMarche: Record<string, number> = {};
      (audioResult.data || []).forEach(audio => {
        audioCountByMarche[audio.marche_id] = (audioCountByMarche[audio.marche_id] || 0) + 1;
      });

      // Aggregate biodiversity stats per marche
      const biodiversityByMarche: Record<string, { total_species: number; birds_count: number; plants_count: number }> = {};
      (biodiversityResult.data || []).forEach(snapshot => {
        if (!biodiversityByMarche[snapshot.marche_id]) {
          biodiversityByMarche[snapshot.marche_id] = { total_species: 0, birds_count: 0, plants_count: 0 };
        }
        biodiversityByMarche[snapshot.marche_id].total_species += snapshot.total_species || 0;
        biodiversityByMarche[snapshot.marche_id].birds_count += snapshot.birds_count || 0;
        biodiversityByMarche[snapshot.marche_id].plants_count += snapshot.plants_count || 0;
      });

      // Build featured marches with completeness score
      const featuredMarches: FeaturedMarche[] = marchesData.map(marche => {
        const photosCount = photosCountByMarche[marche.id] || 0;
        const audioCount = audioCountByMarche[marche.id] || 0;
        const biodiversity = biodiversityByMarche[marche.id] || { total_species: 0, birds_count: 0, plants_count: 0 };
        
        // Calculate completeness score (weighted)
        // Photos are most important for visual showcase
        const completenessScore = 
          (photosCount * 3) + 
          (audioCount * 2) + 
          (biodiversity.total_species > 0 ? 5 : 0) +
          (marche.nom_marche ? 2 : 0) +
          (marche.descriptif_court ? 1 : 0);

        return {
          id: marche.id,
          nom_marche: marche.nom_marche,
          ville: marche.ville,
          region: marche.region,
          departement: marche.departement,
          date: marche.date,
          descriptif_court: marche.descriptif_court,
          latitude: marche.latitude,
          longitude: marche.longitude,
          photos_count: photosCount,
          audio_count: audioCount,
          total_species: biodiversity.total_species,
          birds_count: biodiversity.birds_count,
          plants_count: biodiversity.plants_count,
          cover_photo_url: coverPhotoByMarche[marche.id] || null,
          completeness_score: completenessScore
        };
      });

      // Sort by completeness and return top N
      return featuredMarches
        .filter(m => m.photos_count > 0 || m.total_species > 0) // Only marches with some content
        .sort((a, b) => b.completeness_score - a.completeness_score)
        .slice(0, limit);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 2
  });
};
