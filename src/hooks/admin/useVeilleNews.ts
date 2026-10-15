import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  external_link: string | null;
  published: boolean;
  created_at: string;
  metadata: {
    source?: string;
    origine?: string;
    score?: number;
    collecte_le?: string;
    tagsThemes?: string[];
    tagsMilieux?: string[];
    tagsTerritoires?: string[];
    tagsEspeces?: string[];
  } | null;
}

export interface NewsLink {
  id: string;
  news_id: string;
  target_type: 'exploration' | 'propriete';
  target_id: string;
  score: number;
  raisons: string[];
  statut: 'valide' | 'ecarte';
}

export const norm = (s?: string | null) =>
  (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const slug = (s?: string | null) => norm(s).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
export const tagLabel = (t: string) => t.replace(/_/g, ' ');
export const articleDate = (a: NewsArticle) => a.metadata?.collecte_le || a.created_at.slice(0, 10);

export function useVeilleNews() {
  return useQuery({
    queryKey: ['veille-news'],
    queryFn: async (): Promise<NewsArticle[]> => {
      const all: NewsArticle[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await db.from('news')
          .select('id,title,description,external_link,published,created_at,metadata')
          .order('created_at', { ascending: false }).range(from, from + 999);
        if (error) throw error;
        all.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      return all;
    },
  });
}

export function useTogglePublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, published }: { ids: string[]; published: boolean }) => {
      const { error } = await db.from('news').update({ published }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['veille-news'] });
      toast.success(v.published ? 'Publié' : 'Dépublié');
    },
    onError: () => toast.error("Modification impossible (accès réservé aux administrateurs)."),
  });
}

export interface VeilleTarget {
  type: 'exploration' | 'propriete';
  id: string;
  nom: string;
  sousTitre: string;
  regions: string[]; // slugs
  departements: string[];
  villes: string[];
  kind?: string | null; // exploration_type
}

export function useVeilleTargets() {
  return useQuery({
    queryKey: ['veille-targets'],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<VeilleTarget[]> => {
      const [p, e, em] = await Promise.all([
        db.from('proprietes').select('id,nom,ville,departement,region,is_active'),
        db.from('explorations').select('id,name,exploration_type'),
        db.from('exploration_marches').select('exploration_id, marches(ville,region,departement)'),
      ]);
      const out: VeilleTarget[] = [];
      (p.data ?? []).filter((r: any) => r.is_active !== false).forEach((r: any) =>
        out.push({
          type: 'propriete', id: r.id, nom: r.nom, sousTitre: [r.ville, r.region].filter(Boolean).join(' · '),
          regions: r.region ? [slug(r.region)] : [], departements: r.departement ? [slug(r.departement)] : [],
          villes: r.ville ? [slug(r.ville)] : [],
        }));
      const geo = new Map<string, any[]>();
      (em.data ?? []).forEach((r: any) => {
        if (!r.marches) return;
        geo.set(r.exploration_id, [...(geo.get(r.exploration_id) ?? []), r.marches]);
      });
      (e.data ?? []).forEach((r: any) => {
        const ms = geo.get(r.id) ?? [];
        const uniq = (k: string) => [...new Set(ms.map((m) => slug(m[k])).filter(Boolean))];
        out.push({
          type: 'exploration', id: r.id, nom: r.name, kind: r.exploration_type,
          sousTitre: `${ms.length} marche${ms.length > 1 ? 's' : ''}${uniq('region')[0] ? ' · ' + tagLabel(uniq('region')[0]) : ''}`,
          regions: uniq('region'), departements: uniq('departement'), villes: uniq('ville'),
        });
      });
      return out;
    },
  });
}

/** Rapprochement explicable article ↔ destination. */
export function matchArticle(a: NewsArticle, t: VeilleTarget): { score: number; raisons: string[] } {
  const m = a.metadata ?? {};
  const raisons: string[] = [];
  let score = 0;
  const terr = (m.tagsTerritoires ?? []).map(slug);
  const txt = norm(`${a.title} ${a.description ?? ''}`);
  if (terr.some((x) => t.regions.includes(x))) { score += 40; raisons.push('Même région'); }
  if (terr.some((x) => t.departements.includes(x))) { score += 30; raisons.push('Même département'); }
  const ville = t.villes.find((v) => v.length > 3 && txt.includes(v.replace(/_/g, ' ')));
  if (ville) { score += 40; raisons.push(`Cite ${tagLabel(ville)}`); }
  if (!score && terr.includes('national')) { score += 8; raisons.push('Portée nationale'); }
  const themes = (m.tagsThemes ?? []).map(slug);
  if (t.type === 'propriete') {
    if (themes.includes('sol_et_jardin')) { score += 25; raisons.push('Sol et jardin'); }
    if ((m.tagsMilieux ?? []).map(slug).some((x) => ['jardin', 'urbain', 'agricole'].includes(x))) { score += 10; raisons.push('Milieu proche'); }
  } else {
    if (themes.includes('sciences_participatives')) { score += 20; raisons.push('Sciences participatives'); }
    if (t.kind === 'agroecologique' && themes.includes('agroecologie')) { score += 20; raisons.push('Agroécologie'); }
    if (themes.includes('biodiversite')) { score += 8; raisons.push('Biodiversité'); }
  }
  score += Math.max(0, (m.score ?? 0) - 5) * 3;
  return { score: Math.min(100, score), raisons };
}

export function useNewsLinks() {
  return useQuery({
    queryKey: ['veille-links'],
    queryFn: async (): Promise<NewsLink[]> => {
      const { data, error } = await db.from('news_links').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDecideLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (l: Omit<NewsLink, 'id'>) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await db.from('news_links').upsert(
        { ...l, decided_by: auth.user?.id ?? null }, { onConflict: 'news_id,target_type,target_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['veille-links'] }),
    onError: () => toast.error('Enregistrement impossible.'),
  });
}
