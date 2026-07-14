import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveBrandKit } from '@/lib/brandKits/registry';
import type { BrandKit, BrandKitOverrides } from '@/lib/brandKits/types';

/**
 * Lit les colonnes brand_kit_* de marche_events (accessibles anon via la policy
 * "Anyone can read marche events") et résout le preset.
 */
export function useEventBrandKit(slug: string | undefined) {
  return useQuery<BrandKit | null>({
    queryKey: ['brand-kit', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_events')
        .select('brand_kit_slug, brand_kit_overrides, brand_kit_enabled')
        .eq('public_slug', slug!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as {
        brand_kit_slug: string | null;
        brand_kit_overrides: BrandKitOverrides | null;
        brand_kit_enabled: boolean | null;
      };
      if (!row.brand_kit_enabled || !row.brand_kit_slug) return null;
      return resolveBrandKit(row.brand_kit_slug, row.brand_kit_overrides);
    },
    staleTime: 5 * 60_000,
  });
}
