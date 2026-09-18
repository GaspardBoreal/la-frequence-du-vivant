import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { buildSeedArticles, type KbAudience } from '@/lib/knowledge/seed';

const db = supabase as any;

export type KbStatus = 'brouillon' | 'relecture' | 'publiee';

export interface KbSource {
  id: string;
  article_id: string;
  name: string;
  url: string | null;
  consulted_at: string;
  note: string | null;
}

export interface KbArticle {
  id: string;
  stable_id: string | null;
  title: string;
  question_principale: string | null;
  short_answer: string;
  body_md: string;
  audiences: KbAudience[];
  univers: string;
  topic: string | null;
  status: KbStatus;
  is_public: boolean;
  origin: string;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  kb_article_sources?: KbSource[];
}

export interface KbQuestion {
  id: string;
  label: string;
  audience: KbAudience;
  univers: string;
  origin: 'fournie' | 'assistant' | 'support';
  occurrences: number;
  status: 'ouverte' | 'couverte' | 'ignoree';
  created_at: string;
  kb_question_articles?: Array<{ article_id: string }>;
}

export interface KbCoverage {
  sources: Array<{ cle: string; libelle: string; famille: string; volume: number }>;
  fiches: {
    total: number;
    publiees: number;
    relecture: number;
    brouillons: number;
    sans_source: number;
    a_relire: number;
  };
  questions: {
    total: number;
    couvertes: number;
    ouvertes: number;
    par_public: Record<string, number>;
  };
}

function humanError(e: unknown): string {
  const msg = (e as Error)?.message ?? '';
  if (/aucune source citée/i.test(msg)) return "Cette fiche ne peut pas être publiée : ajoutez au moins une source.";
  if (/réponse courte est vide/i.test(msg)) return 'Cette fiche ne peut pas être publiée : la réponse courte est vide.';
  if (/JWT|session|auth/i.test(msg)) return 'Votre session a expiré, reconnectez-vous.';
  if (/permission|row-level|administrateur/i.test(msg)) return 'Accès réservé aux administrateurs.';
  if (/Failed to fetch|network/i.test(msg)) return 'Connexion interrompue, réessayez.';
  return msg || 'Une erreur est survenue.';
}

/* ── Cartographie ──────────────────────────────────────────────── */
export function useKbCoverage() {
  return useQuery({
    queryKey: ['kb-coverage'],
    queryFn: async (): Promise<KbCoverage> => {
      const { data, error } = await db.rpc('get_kb_coverage');
      if (error) throw error;
      return data as KbCoverage;
    },
  });
}

/* ── Fiches ────────────────────────────────────────────────────── */
export function useKbArticles() {
  return useQuery({
    queryKey: ['kb-articles'],
    queryFn: async (): Promise<KbArticle[]> => {
      const { data, error } = await db
        .from('kb_articles')
        .select('*, kb_article_sources(*)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as KbArticle[];
    },
  });
}

export function useSaveKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<KbArticle> & { id?: string }) => {
      const { kb_article_sources, ...row } = payload as any;
      if (row.id) {
        const { error } = await db.from('kb_articles').update(row).eq('id', row.id);
        if (error) throw error;
        return row.id as string;
      }
      const { data, error } = await db.from('kb_articles').insert(row).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kb-articles'] });
      qc.invalidateQueries({ queryKey: ['kb-coverage'] });
      toast.success('Fiche enregistrée.');
    },
    onError: (e) => toast.error(humanError(e)),
  });
}

export function useDeleteKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('kb_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kb-articles'] });
      qc.invalidateQueries({ queryKey: ['kb-coverage'] });
      toast.success('Fiche supprimée.');
    },
    onError: (e) => toast.error(humanError(e)),
  });
}

/* ── Sources ───────────────────────────────────────────────────── */
export function useAddKbSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { article_id: string; name: string; url?: string; consulted_at?: string }) => {
      const { error } = await db.from('kb_article_sources').insert(s);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kb-articles'] });
      qc.invalidateQueries({ queryKey: ['kb-coverage'] });
    },
    onError: (e) => toast.error(humanError(e)),
  });
}

export function useDeleteKbSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('kb_article_sources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kb-articles'] }),
    onError: (e) => toast.error(humanError(e)),
  });
}

/* ── Questions ─────────────────────────────────────────────────── */
export function useKbQuestions() {
  return useQuery({
    queryKey: ['kb-questions'],
    queryFn: async (): Promise<KbQuestion[]> => {
      const { data, error } = await db
        .from('kb_questions')
        .select('*, kb_question_articles(article_id)')
        .order('occurrences', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as KbQuestion[];
    },
  });
}

export function useSaveKbQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: Partial<KbQuestion> & { id?: string }) => {
      const { kb_question_articles, ...row } = q as any;
      if (row.id) {
        const { error } = await db.from('kb_questions').update(row).eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('kb_questions').insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kb-questions'] });
      qc.invalidateQueries({ queryKey: ['kb-coverage'] });
    },
    onError: (e) => toast.error(humanError(e)),
  });
}

export function useDeleteKbQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('kb_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kb-questions'] });
      qc.invalidateQueries({ queryKey: ['kb-coverage'] });
    },
    onError: (e) => toast.error(humanError(e)),
  });
}

export function useLinkQuestionArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ question_id, article_id, link }: { question_id: string; article_id: string; link: boolean }) => {
      if (link) {
        const { error } = await db.from('kb_question_articles').insert({ question_id, article_id });
        if (error) throw error;
        await db.from('kb_questions').update({ status: 'couverte' }).eq('id', question_id);
      } else {
        const { error } = await db
          .from('kb_question_articles')
          .delete()
          .eq('question_id', question_id)
          .eq('article_id', article_id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kb-questions'] });
      qc.invalidateQueries({ queryKey: ['kb-coverage'] });
    },
    onError: (e) => toast.error(humanError(e)),
  });
}

/** Questions réellement posées à l'Assistant, proposées à la validation. */
export function useAssistantQuestionSuggestions() {
  return useQuery({
    queryKey: ['kb-question-suggestions'],
    queryFn: async (): Promise<Array<{ label: string; occurrences: number; derniere: string }>> => {
      const { data, error } = await db.rpc('suggest_kb_questions_from_assistant', { _limit: 50 });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });
}

/* ── Import des savoirs déjà écrits dans le site ───────────────── */
export function useImportKbSeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const seeds = buildSeedArticles();
      const { data: existing, error: exErr } = await db.from('kb_articles').select('id, stable_id');
      if (exErr) throw exErr;
      const known = new Map<string, string>((existing ?? []).filter((r: any) => r.stable_id).map((r: any) => [r.stable_id, r.id]));

      let created = 0;
      for (const s of seeds) {
        if (known.has(s.stable_id)) continue;
        const { data, error } = await db
          .from('kb_articles')
          .insert({
            stable_id: s.stable_id,
            title: s.title,
            question_principale: s.question_principale,
            short_answer: s.short_answer,
            body_md: s.body_md,
            audiences: s.audiences,
            univers: 'jardin',
            topic: s.topic,
            status: 'relecture',
            is_public: s.is_public,
            origin: 'code',
          })
          .select('id')
          .single();
        if (error) throw error;
        created += 1;
        if (s.sources.length) {
          const { error: sErr } = await db
            .from('kb_article_sources')
            .insert(s.sources.map((src) => ({ article_id: data.id, name: src.name, url: src.url ?? null })));
          if (sErr) throw sErr;
        }
      }
      return { created, total: seeds.length };
    },
    onSuccess: ({ created, total }) => {
      qc.invalidateQueries({ queryKey: ['kb-articles'] });
      qc.invalidateQueries({ queryKey: ['kb-coverage'] });
      toast.success(
        created === 0
          ? `Rien à importer : les ${total} fiches du site sont déjà présentes.`
          : `${created} fiche(s) importée(s) sur ${total}, en attente de relecture.`
      );
    },
    onError: (e) => toast.error(humanError(e)),
  });
}

export function useKbSeedCount() {
  return buildSeedArticles().length;
}
