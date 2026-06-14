import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Search, Calendar, MapPin, Sparkles, ArrowUpAZ, ArrowDownAZ, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  cover_url?: string | null;
}

export const PratiquesRemarquablesTab: React.FC = () => {
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState<Sort>('recent');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['crm-pratiques-remarquables'],
    queryFn: async (): Promise<PratiqueRow[]> => {
      // 1. récupère curations "main"
      const { data: curations, error } = await supabase
        .from('exploration_curations')
        .select('id, title, description, media_ids, created_at, exploration_id')
        .eq('sense', 'main')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      if (!curations?.length) return [];

      // 2. récupère marches liées
      const explorationIds = Array.from(new Set(curations.map((c) => c.exploration_id).filter(Boolean)));
      const { data: marches } = await supabase
        .from('marche_events')
        .select('id, title, date_marche, lieu, exploration_id')
        .in('exploration_id', explorationIds);
      const marcheByExp = new Map<string, any>();
      (marches || []).forEach((m) => marcheByExp.set(m.exploration_id, m));

      // 3. récupère premier media par curation
      const allMediaIds = Array.from(
        new Set(curations.flatMap((c) => (c.media_ids || []).slice(0, 1)).filter(Boolean))
      );
      let mediaByKey = new Map<string, string>();
      if (allMediaIds.length) {
        const { data: medias } = await supabase
          .from('marcheur_medias')
          .select('id, url_fichier, external_url')
          .in('id', allMediaIds as string[]);
        (medias || []).forEach((m: any) => {
          const url = m.external_url || m.url_fichier || null;
          if (url) mediaByKey.set(m.id, url);
        });
      }

      return curations.map((c) => ({
        ...c,
        marche: marcheByExp.get(c.exploration_id) || null,
        cover_url: (c.media_ids || []).map((id: string) => mediaByKey.get(id)).find(Boolean) || null,
      }));
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
          x.description?.toLowerCase().includes(s) ||
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
          {filtered.map((p) => (
            <article
              key={p.id}
              className="group rounded-xl crm-surface overflow-hidden border border-[hsl(var(--crm-border))] hover:border-[hsl(var(--crm-accent))]/50 transition-all hover:shadow-lg"
            >
              <div className="aspect-[4/3] bg-[hsl(var(--crm-surface-2))] overflow-hidden relative">
                {p.cover_url ? (
                  <img
                    src={p.cover_url}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="h-10 w-10 crm-muted opacity-40" />
                  </div>
                )}
                {p.media_ids && p.media_ids.length > 1 && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] bg-black/60 text-white">
                    +{p.media_ids.length - 1}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm text-[hsl(var(--crm-text))] line-clamp-2">{p.title || 'Sans titre'}</h3>
                {p.description && (
                  <p className="text-xs crm-muted line-clamp-2">{p.description}</p>
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default PratiquesRemarquablesTab;
