import React from 'react';
import { Copy, Check, Sparkles, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useRoadmapAdmin, useRoadmapSocialPosts } from '@/hooks/roadmap/useRoadmap';
import {
  AUDIENCES,
  NETWORK_LABEL,
  type RoadmapEntry,
  type RoadmapNetwork,
  type RoadmapWeek,
} from '@/lib/roadmap/types';

interface Props {
  week: RoadmapWeek;
  entries: RoadmapEntry[];
}

const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });

/** Studio social : génération des 9 posts et calendrier de diffusion. */
const SocialStudio: React.FC<Props> = ({ week, entries }) => {
  const { data: posts = [] } = useRoadmapSocialPosts(week.id);
  const { saveSocialPosts } = useRoadmapAdmin();
  const [busy, setBusy] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  const generate = async () => {
    if (entries.length === 0) {
      toast.error('Ajoutez d’abord des nouveautés à la semaine.');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('roadmap-social', {
        body: {
          week,
          entries,
          publicUrl: `https://la-frequence-du-vivant.com/roadmap/semaine/${week.iso_year}/${week.iso_week}`,
        },
      });
      if (error) throw error;
      const generated = (data as any)?.posts ?? [];
      if (generated.length === 0) throw new Error('Aucun post généré');
      await saveSocialPosts.mutateAsync({ weekId: week.id, posts: generated });
      toast.success(`${generated.length} publications préparées`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Génération impossible');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const byDay = React.useMemo(() => {
    const map = new Map<string, typeof posts>();
    posts.forEach((p) => {
      const key = p.scheduled_for ?? 'non planifié';
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [posts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={busy}>
          <Sparkles className="mr-2 h-4 w-4" />
          {busy ? 'Rédaction en cours…' : 'Préparer les publications'}
        </Button>
        <span className="text-sm text-muted-foreground">
          3 publics × 3 réseaux, avec un calendrier de diffusion sur la semaine.
        </span>
      </div>

      {posts.length === 0 && (
        <p className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
          Aucune publication préparée pour cette semaine.
        </p>
      )}

      {byDay.map(([day, dayPosts]) => (
        <section key={day} className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {day === 'non planifié' ? 'Non planifié' : DAY_FMT.format(new Date(`${day}T12:00:00`))}
          </h4>
          <div className="grid gap-3 lg:grid-cols-2">
            {dayPosts.map((p) => {
              const text = drafts[p.id] ?? p.body;
              const full = `${text}\n\n${p.hashtags.map((h) => `#${h}`).join(' ')}`;
              return (
                <article key={p.id} className="rounded-xl border border-border/60 bg-card/70 p-4">
                  <header className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary">{NETWORK_LABEL[p.network as RoadmapNetwork] ?? p.network}</Badge>
                    <Badge variant="outline">
                      {AUDIENCES.find((a) => a.key === p.audience)?.label ?? p.audience}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => copy(p.id, full)}
                    >
                      {copiedId === p.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </header>
                  <Textarea
                    value={text}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    rows={8}
                    className="text-sm"
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.hashtags.map((h) => (
                      <span key={h} className="text-[11px] text-primary">#{h}</span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default SocialStudio;
