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
export const useFeaturedMarches = (limit: number = 5, includeAll: boolean = false, specificIds?: string[]) => {
  return useQuery({
    queryKey: ['featured-marches', limit, includeAll, specificIds],
    queryFn: async (): Promise<FeaturedMarche[]> => {
      let allowedIds: string[];

      if (specificIds && specificIds.length > 0) {
        // Use the specific IDs directly, no visibility check needed
        allowedIds = specificIds;
      } else {
        // Fetch only marches visible to readers (linked to an exploration with proper status)
        const { data: visibleLinks } = await supabase
          .from('exploration_marches')
          .select('marche_id')
          .in('publication_status', ['published_public', 'published_readers']);

        allowedIds = [...new Set((visibleLinks || []).map(l => l.marche_id))];
        if (allowedIds.length === 0) return [];
      }

      // Fetch marches with basic info (only allowed ones)
      const { data: marchesData, error: marchesError } = await supabase
        .from('marches')
        .select('id, nom_marche, ville, region, departement, date, descriptif_court, latitude, longitude')
        .in('id', allowedIds);

      if (marchesError) throw marchesError;
      if (!marchesData || marchesData.length === 0) return [];

      const marcheIds = marchesData.map(m => m.id);

      // Fetch related data in parallel (snapshots kept only for birds/plants breakdown)
      const [photosResult, audioResult, biodiversityResult, canonicalCountsResult] = await Promise.all([
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
          .select('marche_id, birds_count, plants_count, snapshot_date')
          .in('marche_id', marcheIds)
          .order('snapshot_date', { ascending: false }),
        // ✅ Canonical per-marche species counts (respects each marche's radius_m)
        supabase.rpc('get_marches_species_counts', { p_marche_ids: marcheIds }),
      ]);

      // Count photos per marche and get cover photo
      const photosCountByMarche: Record<string, number> = {};
      const coverPhotoByMarche: Record<string, string | null> = {};
      
      (photosResult.data || []).forEach(photo => {
        photosCountByMarche[photo.marche_id] = (photosCountByMarche[photo.marche_id] || 0) + 1;
        if (!coverPhotoByMarche[photo.marche_id] || (photo.ordre || 999) < 999) {
          coverPhotoByMarche[photo.marche_id] = photo.url_supabase;
        }
      });

      // Count audio per marche
      const audioCountByMarche: Record<string, number> = {};
      (audioResult.data || []).forEach(audio => {
        audioCountByMarche[audio.marche_id] = (audioCountByMarche[audio.marche_id] || 0) + 1;
      });

      // Canonical total_species per marche
      const canonicalByMarche: Record<string, number> = {};
      ((canonicalCountsResult.data as any[]) || []).forEach((row: any) => {
        canonicalByMarche[row.marche_id] = row.species_count || 0;
      });

      // Birds/plants breakdown — use latest snapshot per marche only (best-effort)
      const biodiversityByMarche: Record<string, { total_species: number; birds_count: number; plants_count: number }> = {};
      (biodiversityResult.data || []).forEach(snapshot => {
        if (!biodiversityByMarche[snapshot.marche_id]) {
          biodiversityByMarche[snapshot.marche_id] = {
            total_species: canonicalByMarche[snapshot.marche_id] ?? 0,
            birds_count: snapshot.birds_count || 0,
            plants_count: snapshot.plants_count || 0,
          };
        }
      });
      // Ensure every marche has an entry with canonical total
      marcheIds.forEach((id) => {
        if (!biodiversityByMarche[id]) {
          biodiversityByMarche[id] = {
            total_species: canonicalByMarche[id] ?? 0,
            birds_count: 0,
            plants_count: 0,
          };
        } else {
          biodiversityByMarche[id].total_species = canonicalByMarche[id] ?? biodiversityByMarche[id].total_species;
        }
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

      // If specific IDs were requested, preserve their order
      if (specificIds && specificIds.length > 0) {
        const byId = new Map(featuredMarches.map(m => [m.id, m]));
        return specificIds.map(id => byId.get(id)).filter(Boolean) as FeaturedMarche[];
      }

      // Sort by completeness and return top N (or all if includeAll)
      const filtered = featuredMarches
        .filter(m => includeAll || m.photos_count > 0 || m.total_species > 0)
        .sort((a, b) => b.completeness_score - a.completeness_score);
      return includeAll ? filtered : filtered.slice(0, limit);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 2
  });
};
