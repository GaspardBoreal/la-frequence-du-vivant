import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Activity,
  Eye,
  EyeOff,
  CalendarDays,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import EntryEditor from '@/components/roadmap/admin/EntryEditor';
import SocialStudio from '@/components/roadmap/admin/SocialStudio';
import { useRoadmapAdmin, useRoadmapEntries, useRoadmapWeeks } from '@/hooks/roadmap/useRoadmap';
import { isoWeekInfo, weekRangeLabel, type RoadmapWeek } from '@/lib/roadmap/types';

/** Atelier hebdomadaire : composer l'édition, l'illustrer, la publier, la diffuser. */
const AdminRoadmap: React.FC = () => {
  const { data: weeks = [] } = useRoadmapWeeks(true);
  const { upsertWeek, deleteWeek, saveEntry } = useRoadmapAdmin();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [raw, setRaw] = React.useState('');
  const [busy, setBusy] = React.useState<'digest' | 'compose' | null>(null);
  const [digest, setDigest] = React.useState<Record<string, number> | null>(null);

  React.useEffect(() => {
    if (!selectedId && weeks.length > 0) setSelectedId(weeks[0].id);
  }, [weeks, selectedId]);

  const week = weeks.find((w) => w.id === selectedId) ?? null;
  const { data: entries = [] } = useRoadmapEntries(week ? [week.id] : []);
  const [draft, setDraft] = React.useState<Partial<RoadmapWeek>>({});

  React.useEffect(() => setDraft(week ?? {}), [week]);

  const createCurrentWeek = async () => {
    const info = isoWeekInfo(new Date());
    if (weeks.some((w) => w.iso_year === info.isoYear && w.iso_week === info.isoWeek)) {
      toast.info('La semaine en cours existe déjà.');
      return;
    }
    const created = await upsertWeek.mutateAsync({
      iso_year: info.isoYear,
      iso_week: info.isoWeek,
      starts_on: info.startsOn,
      ends_on: info.endsOn,
      title: `Semaine ${info.isoWeek}`,
      status: 'draft',
    });
    setSelectedId(created.id);
    toast.success('Édition créée en brouillon');
  };

  const loadDigest = async () => {
    if (!week) return;
    setBusy('digest');
    try {
      const { data, error } = await supabase.functions.invoke('roadmap-activity-digest', {
        body: { from: week.starts_on, to: week.ends_on },
      });
      if (error) throw error;
      const { periode, ...counts } = (data ?? {}) as any;
      setDigest(counts);
    } catch (e: any) {
      toast.error(e?.message ?? 'Relevé indisponible');
    } finally {
      setBusy(null);
    }
  };

  const compose = async () => {
    if (!week) return;
    setBusy('compose');
    try {
      const { data, error } = await supabase.functions.invoke('roadmap-compose', {
        body: { week, rawNotes: raw, activity: digest ?? {} },
      });
      if (error) throw error;
      const payload = data as any;
      if (payload?.narrative || payload?.title) {
        await upsertWeek.mutateAsync({
          ...week,
          title: payload.title || week.title,
          narrative: payload.narrative ?? week.narrative,
        });
      }
      const proposals = payload?.entries ?? [];
      for (let i = 0; i < proposals.length; i += 1) {
        const p = proposals[i];
        await saveEntry.mutateAsync({
          week_id: week.id,
          title: p.title,
          promise: p.promise ?? null,
          body: p.body ?? null,
          domain: p.domain ?? null,
          audiences: p.audiences ?? [],
          pitch_marcheur: p.pitch_marcheur ?? null,
          pitch_proprietaire: p.pitch_proprietaire ?? null,
          pitch_partenaire: p.pitch_partenaire ?? null,
          position: entries.length + i,
        } as any);
      }
      toast.success(`${proposals.length} nouveautés proposées`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Composition impossible');
    } finally {
      setBusy(null);
    }
  };

  const addEmptyEntry = async () => {
    if (!week) return;
    await saveEntry.mutateAsync({
      week_id: week.id,
      title: 'Nouvelle entrée',
      audiences: [],
      position: entries.length,
    } as any);
  };

  const togglePublish = async () => {
    if (!week) return;
    const next = week.status === 'published' ? 'draft' : 'published';
    await upsertWeek.mutateAsync({
      ...week,
      status: next,
      published_at: next === 'published' ? new Date().toISOString() : null,
    });
    toast.success(next === 'published' ? 'Édition publiée' : 'Édition repassée en brouillon');
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Atelier Roadmap vivante — Administration</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="border-b border-border/60 bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4">
          <Link
            to="/access-admin-gb2025"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Administration
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Atelier — Roadmap vivante</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/roadmap" target="_blank" rel="noreferrer">
                Voir la page publique
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              <CalendarDays className="mr-2 h-4 w-4" /> Autre semaine…
            </Button>
            <Button size="sm" onClick={createCurrentWeek}>
              <Plus className="mr-2 h-4 w-4" /> Semaine en cours
            </Button>

          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          {weeks.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                w.id === selectedId
                  ? 'border-primary bg-primary/10'
                  : 'border-border/60 bg-card/50 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> S{w.iso_week} · {w.iso_year}
                <Badge
                  variant={w.status === 'published' ? 'default' : 'secondary'}
                  className="ml-auto text-[10px]"
                >
                  {w.status === 'published' ? 'Publiée' : 'Brouillon'}
                </Badge>
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{w.title}</div>
              <div className="text-[11px] text-muted-foreground">{weekRangeLabel(w)}</div>
            </button>
          ))}
          {weeks.length === 0 && (
            <p className="rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
              Aucune édition. Créez la semaine en cours.
            </p>
          )}
        </aside>

        <main>
          {!week && (
            <p className="py-20 text-center text-sm text-muted-foreground">
              Sélectionnez une semaine.
            </p>
          )}

          {week && (
            <Tabs defaultValue="composer">
              <TabsList>
                <TabsTrigger value="composer">1. Composer</TabsTrigger>
                <TabsTrigger value="entrees">2. Nouveautés ({entries.length})</TabsTrigger>
                <TabsTrigger value="social">3. Diffuser</TabsTrigger>
              </TabsList>

              <TabsContent value="composer" className="space-y-5 pt-5">
                <div className="grid gap-3">
                  <Input
                    value={draft.title ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Titre de l’édition"
                  />
                  <Textarea
                    value={draft.narrative ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, narrative: e.target.value }))}
                    placeholder="Le récit de la semaine"
                    rows={4}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => upsertWeek.mutate({ ...week, ...draft })}>
                      Enregistrer l’édition
                    </Button>
                    <Button variant="outline" onClick={togglePublish}>
                      {week.status === 'published' ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" /> Dépublier
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" /> Publier la semaine
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        deleteWeek.mutate(week.id);
                        setSelectedId(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                    </Button>
                  </div>
                </div>

                <section className="space-y-3 rounded-xl border border-border/60 bg-card/50 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm" onClick={loadDigest} disabled={busy === 'digest'}>
                      <Activity className="mr-2 h-4 w-4" />
                      {busy === 'digest' ? 'Relevé…' : 'Relever l’activité réelle'}
                    </Button>
                    {digest && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(digest)
                          .filter(([, v]) => typeof v === 'number' && v > 0)
                          .map(([k, v]) => (
                            <Badge key={k} variant="secondary" className="text-[11px]">
                              {k.replace(/_/g, ' ')} · {v}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>
                  <Textarea
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    placeholder="Collez ici les notes brutes de la semaine (prompts, changements, livraisons)…"
                    rows={8}
                  />
                  <Button onClick={compose} disabled={busy === 'compose'}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {busy === 'compose' ? 'Rédaction…' : 'Composer les nouveautés'}
                  </Button>
                </section>
              </TabsContent>

              <TabsContent value="entrees" className="space-y-4 pt-5">
                <Button variant="outline" size="sm" onClick={addEmptyEntry}>
                  <Plus className="mr-2 h-4 w-4" /> Ajouter une nouveauté
                </Button>
                {entries.map((e) => (
                  <EntryEditor key={e.id} entry={e} />
                ))}
                {entries.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                    Aucune nouveauté pour l’instant.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="social" className="pt-5">
                <SocialStudio week={week} entries={entries} />
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminRoadmap;
