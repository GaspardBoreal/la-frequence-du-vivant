import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Search, Calendar, MapPin, Sparkles, ArrowUpAZ, ArrowDownAZ, Clock, Leaf } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PratiqueRemarquableDialog, { type PratiqueDetail } from '../PratiqueRemarquableDialog';

type Sort = 'recent' | 'name_asc' | 'name_desc';

interface PratiqueRow {
  id: string;
  title: string;
  description: string | null;
  media_ids: string[] | null;
  created_at: string;
  exploration_id: string;
  marche?: {
    id: string;
    title: string;
    date_marche: string | null;
    lieu: string | null;
  } | null;
  cover_urls: string[];
}

// "<p>foo</p>" → "foo"
const stripHtml = (html: string | null | undefined) => {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

// "conv:uuid" | "media:uuid" | "uuid" (legacy → conv)
const parseMediaKey = (raw: string): { source: 'conv' | 'media'; id: string } => {
  if (raw.startsWith('media:')) return { source: 'media', id: raw.slice(6) };
  if (raw.startsWith('conv:')) return { source: 'conv', id: raw.slice(5) };
  return { source: 'conv', id: raw };
};

export const PratiquesRemarquablesTab: React.FC = () => {
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState<Sort>('recent');
  const [selected, setSelected] = React.useState<PratiqueRow | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['crm-pratiques-remarquables'],
    queryFn: async (): Promise<PratiqueRow[]> => {
      const { data: curations, error } = await supabase
        .from('exploration_curations')
        .select('id, title, description, media_ids, created_at, exploration_id')
        .eq('sense', 'main')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      if (!curations?.length) return [];

      // Marches liées
      const explorationIds = Array.from(new Set(curations.map((c) => c.exploration_id).filter(Boolean)));
      const { data: marches } = await supabase
        .from('marche_events')
        .select('id, title, date_marche, lieu, exploration_id')
        .in('exploration_id', explorationIds);
      const marcheByExp = new Map<string, any>();
      (marches || []).forEach((m) => marcheByExp.set(m.exploration_id, m));

      // Résolution medias : conv: → exploration_convivialite_photos, media: → marcheur_medias
      const convIds = new Set<string>();
      const mediaIds = new Set<string>();
      for (const c of curations) {
        for (const raw of c.media_ids || []) {
          const { source, id } = parseMediaKey(raw);
          if (source === 'conv') convIds.add(id);
          else mediaIds.add(id);
        }
      }

      const urlMap = new Map<string, string>(); // key = "conv:id" or "media:id"
      await Promise.all([
        convIds.size
          ? supabase
              .from('exploration_convivialite_photos')
              .select('id, url')
              .in('id', Array.from(convIds))
              .then(({ data }) => {
                (data || []).forEach((p: any) => {
                  if (p.url) urlMap.set(`conv:${p.id}`, p.url);
                });
              })
          : Promise.resolve(),
        mediaIds.size
          ? supabase
              .from('marcheur_medias')
              .select('id, url_fichier, external_url')
              .in('id', Array.from(mediaIds))
              .then(({ data }) => {
                (data || []).forEach((m: any) => {
                  const u = m.external_url || m.url_fichier;
                  if (u) urlMap.set(`media:${m.id}`, u);
                });
              })
          : Promise.resolve(),
      ]);

      return curations.map((c) => {
        const cover_urls: string[] = [];
        for (const raw of c.media_ids || []) {
          const { source, id } = parseMediaKey(raw);
          const url = urlMap.get(`${source}:${id}`);
          if (url) cover_urls.push(url);
        }
        return {
          ...c,
          marche: marcheByExp.get(c.exploration_id) || null,
          cover_urls,
        };
      });
    },
    staleTime: 60_000,
  });

  const filtered = React.useMemo(() => {
    let r = rows;
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter(
        (x) =>
          x.title?.toLowerCase().includes(s) ||
          stripHtml(x.description).toLowerCase().includes(s) ||
          x.marche?.title?.toLowerCase().includes(s) ||
          x.marche?.lieu?.toLowerCase().includes(s)
      );
    }
    const sorted = [...r];
    if (sort === 'name_asc') sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else if (sort === 'name_desc') sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted;
  }, [rows, q, sort]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 crm-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une pratique, un lieu, une marche…"
            className="pl-9 bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))]"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="w-[200px] bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent"><span className="inline-flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Plus récentes</span></SelectItem>
            <SelectItem value="name_asc"><span className="inline-flex items-center gap-2"><ArrowUpAZ className="h-3.5 w-3.5" /> Nom A→Z</span></SelectItem>
            <SelectItem value="name_desc"><span className="inline-flex items-center gap-2"><ArrowDownAZ className="h-3.5 w-3.5" /> Nom Z→A</span></SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs crm-muted ml-auto">{filtered.length} pratique{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin crm-muted" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 crm-muted text-sm">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Aucune pratique remarquable trouvée
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const cover = p.cover_urls[0] || null;
            const preview = stripHtml(p.description);
            const total = p.media_ids?.length || 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className="group text-left rounded-xl crm-surface overflow-hidden border border-[hsl(var(--crm-border))] hover:border-[hsl(var(--crm-accent))]/60 hover:shadow-[0_8px_30px_-12px_hsl(var(--crm-accent)/0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--crm-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--crm-bg))]"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  {cover ? (
                    <img
                      src={cover}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500/25 via-amber-500/15 to-primary/25 grid place-items-center">
                      <Leaf className="h-10 w-10 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                  <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-white text-[10px]">
                    <Sparkles className="h-3 w-3 text-amber-300" /> Pratique
                  </div>
                  {total > 1 && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] bg-black/55 backdrop-blur-md text-white">
                      +{total - 1}
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-semibold text-sm text-[hsl(var(--crm-text))] line-clamp-2 group-hover:text-[hsl(var(--crm-accent))] transition-colors">
                    {p.title || 'Sans titre'}
                  </h3>
                  {preview && (
                    <p className="text-xs crm-muted line-clamp-2 leading-relaxed">{preview}</p>
                  )}
                  {p.marche && (
                    <div className="pt-2 border-t border-[hsl(var(--crm-border))] space-y-1">
                      <div className="text-xs text-[hsl(var(--crm-text))] font-medium line-clamp-1">{p.marche.title}</div>
                      <div className="flex items-center gap-2 text-[11px] crm-muted">
                        {p.marche.date_marche && (
                          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(p.marche.date_marche), 'd MMM yyyy', { locale: fr })}</span>
                        )}
                        {p.marche.lieu && (
                          <span className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{p.marche.lieu}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <PratiqueRemarquableDialog
        pratique={
          selected
            ? ({
                id: selected.id,
                title: selected.title,
                description: selected.description,
                cover_urls: selected.cover_urls,
                total_medias: selected.media_ids?.length || 0,
                marche: selected.marche,
              } as PratiqueDetail)
            : null
        }
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
};

export default PratiquesRemarquablesTab;
