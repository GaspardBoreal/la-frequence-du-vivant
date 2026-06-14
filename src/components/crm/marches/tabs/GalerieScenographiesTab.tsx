import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Search, Calendar, MapPin, ExternalLink, Copy, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SceneEvent {
  id: string;
  title: string;
  scenography_title: string | null;
  date_marche: string | null;
  lieu: string | null;
  event_type: string | null;
  cover_image_url: string | null;
  public_slug: string | null;
  scenography_updated_at: string | null;
}

export const GalerieScenographiesTab: React.FC = () => {
  const [q, setQ] = React.useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['crm-scenographies-gallery'],
    queryFn: async (): Promise<SceneEvent[]> => {
      const { data, error } = await supabase
        .from('marche_events')
        .select('id, title, scenography_title, date_marche, lieu, event_type, cover_image_url, public_slug, scenography_updated_at')
        .eq('scenography_enabled', true)
        .eq('is_public', true)
        .not('public_slug', 'is', null)
        .order('scenography_updated_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data || []) as SceneEvent[];
    },
  });

  const filtered = React.useMemo(() => {
    if (!q.trim()) return events;
    const s = q.toLowerCase();
    return events.filter(
      (e) =>
        e.title?.toLowerCase().includes(s) ||
        e.scenography_title?.toLowerCase().includes(s) ||
        e.lieu?.toLowerCase().includes(s)
    );
  }, [events, q]);

  const copyLink = (slug: string | null) => {
    if (!slug) return;
    const url = `${window.location.origin}/m/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Lien copié');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 crm-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une scénographie…"
            className="pl-9 bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))]"
          />
        </div>
        <span className="text-xs crm-muted ml-auto">{filtered.length} scénographie{filtered.length > 1 ? 's' : ''} publiée{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin crm-muted" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 crm-muted text-sm">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Aucune scénographie publique
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <article
              key={e.id}
              className="group rounded-xl crm-surface overflow-hidden border border-[hsl(var(--crm-border))] hover:border-[hsl(var(--crm-accent))]/50 transition-all hover:shadow-lg"
            >
              <a
                href={e.public_slug ? `/m/${e.public_slug}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-video bg-[hsl(var(--crm-surface-2))] overflow-hidden relative"
              >
                {e.cover_image_url ? (
                  <img
                    src={e.cover_image_url}
                    alt={e.scenography_title || e.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="h-12 w-12 crm-muted opacity-40" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="font-semibold text-white text-sm line-clamp-2">{e.scenography_title || e.title}</h3>
                </div>
              </a>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs crm-muted flex-wrap">
                  {e.date_marche && (
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(e.date_marche), 'd MMM yyyy', { locale: fr })}</span>
                  )}
                  {e.lieu && <span className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{e.lieu}</span>}
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1 h-7 text-xs">
                    <a href={`/m/${e.public_slug}`} target="_blank" rel="noopener noreferrer">
                      Ouvrir <ExternalLink className="h-3 w-3 ml-1.5" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => copyLink(e.public_slug)} title="Copier le lien">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalerieScenographiesTab;
