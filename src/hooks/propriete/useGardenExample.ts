import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fiche à jour d'un jardin-exemple choisi pendant le parcours d'accueil
 * (« Lequel vous ressemble le plus ? »). Les exemples publiés sont lisibles
 * publiquement : aucune RPC n'est nécessaire.
 */

export interface GardenExampleRow {
  id: string;
  stable_id: string | null;
  titre: string | null;
  sous_titre: string | null;
  description: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  image_alt: string | null;
  source_url: string | null;
  user_intent: string | null;
  keywords: string[];
  ai_profile: Record<string, unknown> | null;
}

export const useGardenExample = (id?: string | null) =>
  useQuery({
    queryKey: ['onboarding-garden-example', id],
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<GardenExampleRow | null> => {
      const { data, error } = await supabase
        .from('onboarding_garden_examples' as never)
        .select('id, stable_id, titre, sous_titre, description, image_url, thumbnail_url, image_alt, source_url, user_intent, keywords, ai_profile')
        .eq('id', id!)
        .maybeSingle();
      if (error) return null;
      if (!data) return null;
      const row = data as Record<string, unknown>;
      return {
        id: String(row.id),
        stable_id: (row.stable_id as string) ?? null,
        titre: (row.titre as string) ?? null,
        sous_titre: (row.sous_titre as string) ?? null,
        description: (row.description as string) ?? null,
        image_url: (row.image_url as string) ?? null,
        thumbnail_url: (row.thumbnail_url as string) ?? null,
        image_alt: (row.image_alt as string) ?? null,
        source_url: (row.source_url as string) ?? null,
        user_intent: (row.user_intent as string) ?? null,
        keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : [],
        ai_profile:
          row.ai_profile && typeof row.ai_profile === 'object'
            ? (row.ai_profile as Record<string, unknown>)
            : null,
      };
    },
  });
