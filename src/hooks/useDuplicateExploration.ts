import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/slugGenerator';

export interface DuplicateExplorationInput {
  sourceId: string;
  newName: string;
}

async function findUniqueSlug(base: string): Promise<string> {
  const safeBase = base || 'exploration';
  let candidate = safeBase;
  let i = 2;
  // Try up to 50 suffixes — enough in practice
  while (i < 50) {
    const { data, error } = await supabase
      .from('explorations')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    candidate = `${safeBase}-${i}`;
    i++;
  }
  // Last resort
  return `${safeBase}-${Date.now()}`;
}

export const useDuplicateExploration = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceId, newName }: DuplicateExplorationInput): Promise<string> => {
      // 1. Charger l'exploration source
      const { data: source, error: srcErr } = await supabase
        .from('explorations')
        .select('*')
        .eq('id', sourceId)
        .single();
      if (srcErr) throw srcErr;

      // 2. Calcul d'un slug unique depuis le nouveau nom
      const baseSlug = createSlug(newName, '');
      const slug = await findUniqueSlug(baseSlug);

      // 3. Insert nouvelle exploration (published forcé OFF)
      const payload = {
        name: newName.trim(),
        slug,
        description: source.description,
        exploration_type: source.exploration_type,
        cover_image_url: source.cover_image_url,
        is_loop: source.is_loop,
        language: source.language,
        meta_title: source.meta_title,
        meta_description: source.meta_description,
        meta_keywords: source.meta_keywords ?? [],
        published: false,
      };

      const { data: inserted, error: insErr } = await supabase
        .from('explorations')
        .insert(payload)
        .select('id')
        .single();
      if (insErr) throw insErr;
      const newId = inserted.id as string;

      try {
        // 4. Copie des exploration_pages
        const { data: pages, error: pagesErr } = await supabase
          .from('exploration_pages')
          .select('type, ordre, nom, description, config')
          .eq('exploration_id', sourceId);
        if (pagesErr) throw pagesErr;

        if (pages && pages.length > 0) {
          const pagesPayload = pages.map((p) => ({
            exploration_id: newId,
            type: p.type,
            ordre: p.ordre,
            nom: p.nom,
            description: p.description,
            config: p.config,
          }));
          const { error: insPagesErr } = await supabase
            .from('exploration_pages')
            .insert(pagesPayload);
          if (insPagesErr) throw insPagesErr;
        }

        // 5. Copie des liens marches (sans dupliquer les marches elles-mêmes)
        const { data: links, error: linksErr } = await supabase
          .from('exploration_marches')
          .select('marche_id, ordre')
          .eq('exploration_id', sourceId);
        if (linksErr) throw linksErr;

        if (links && links.length > 0) {
          const linksPayload = links.map((l) => ({
            exploration_id: newId,
            marche_id: l.marche_id,
            ordre: l.ordre,
            publication_status: 'draft',
            partie_id: null,
          }));
          const { error: insLinksErr } = await supabase
            .from('exploration_marches')
            .insert(linksPayload);
          if (insLinksErr) throw insLinksErr;
        }

        return newId;
      } catch (e) {
        // Rollback : supprimer l'exploration créée (CASCADE supprime pages + liens)
        await supabase.from('explorations').delete().eq('id', newId);
        throw e;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-explorations'] });
      qc.invalidateQueries({ queryKey: ['explorations'] });
      qc.invalidateQueries({ queryKey: ['exploration-pages'] });
      qc.invalidateQueries({ queryKey: ['exploration-marches'] });
    },
  });
};
