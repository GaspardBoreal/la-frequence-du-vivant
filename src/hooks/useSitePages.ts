import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SitePage, SiteSearchRule } from '@/lib/search/siteSearch';

/**
 * Catalogue des pages publiques + règles de classement.
 * Chargé une seule fois puis filtré en mémoire : aucune requête réseau à chaque frappe.
 */
export function useSitePages(includeHidden = false) {
  return useQuery({
    queryKey: ['site-pages', includeHidden],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async (): Promise<{ pages: SitePage[]; rules: SiteSearchRule[] }> => {
      let pagesQuery = supabase
        .from('site_pages' as any)
        .select('id, path, title, subtitle, univers, keywords, priority, featured, is_active')
        .order('priority', { ascending: false });
      if (!includeHidden) pagesQuery = pagesQuery.eq('is_active', true);

      const [pagesRes, rulesRes] = await Promise.all([
        pagesQuery,
        supabase
          .from('site_search_rules' as any)
          .select('id, position, match_type, pattern, univers, is_active, note')
          .order('position', { ascending: true }),
      ]);

      if (pagesRes.error) throw pagesRes.error;
      if (rulesRes.error) throw rulesRes.error;

      return {
        pages: ((pagesRes.data ?? []) as any[]).map(p => ({
          ...p,
          keywords: Array.isArray(p.keywords) ? p.keywords : [],
        })) as SitePage[],
        rules: (rulesRes.data ?? []) as unknown as SiteSearchRule[],
      };
    },
  });
}
