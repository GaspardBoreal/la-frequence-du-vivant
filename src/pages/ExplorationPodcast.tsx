import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Headphones, ListOrdered, Shuffle, Play, Pause, SkipBack, SkipForward, ArrowLeft } from 'lucide-react';
import { AudioProvider } from '@/contexts/AudioContext';
import { FloatingAudioPlayer } from '@/components/audio/FloatingAudioPlayer';
import { useAudioPlaylist, type PlayMode } from '@/hooks/useAudioPlaylist';

export default function ExplorationPodcast() {
  const { slug = '', sessionId = '' } = useParams<{ slug: string; sessionId: string }>();
  const { data: exploration } = useExploration(slug);
  const { data: marches = [] } = useExplorationMarches(exploration?.id || '');

  const tracks = useMemo(() => {
    const list: { id: string; url: string; title?: string; marche?: string }[] = [];
    marches.forEach((m) => {
      const marcheName = m.marche?.nom_marche || m.marche?.ville || 'Marche';
      (m.marche?.audio || []).forEach((a) => {
        if (a.url_supabase) {
          list.push({ id: a.id, url: a.url_supabase, title: a.titre || marcheName, marche: marcheName });
        }
      });
    });
    return list;
  }, [marches]);

  const [mode, setMode] = useState<PlayMode>('order');
  const playlist = useAudioPlaylist(tracks, mode);

  useEffect(() => {
    if (tracks.length) {
      // Try autoplay on arrival; browsers may block silently
      void playlist.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length]);

  if (!exploration) return null;

  const title = `Podcast — ${exploration.name}`.slice(0, 60);
  const canonical = `${window.location.origin}/explorations/${slug}/experience/${sessionId}/podcast`;

  return (
    <AudioProvider>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <SEOHead
          title={title}
          description={(exploration.meta_description || exploration.description || 'Écoutez le podcast de cette exploration').slice(0, 155)}
          canonicalUrl={canonical}
        />

        <header className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to={`/explorations/${slug}/experience/${sessionId}`} aria-label="Retour">
              <Button variant="outline" size="sm"><ArrowLeft /> Retour</Button>
            </Link>
            <div className="flex items-center gap-2">
              <Headphones className="opacity-80" />
              <h1 className="text-xl sm:text-2xl font-semibold">Podcast — {exploration.name}</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 pb-28">
          <Card className="border bg-background/70 backdrop-blur-xl shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl">Lecteur</CardTitle>
              <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as PlayMode)} className="">
                <ToggleGroupItem value="order" aria-label="Ordre des marches">
                  <ListOrdered className="mr-2" /> Remontée
                </ToggleGroupItem>
                <ToggleGroupItem value="shuffle" aria-label="Lecture aléatoire">
                  <Shuffle className="mr-2" /> Aléatoire
                </ToggleGroupItem>
              </ToggleGroup>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-foreground/70">En lecture</div>
                  <div className="text-base sm:text-lg font-medium">{playlist.currentTrack?.title || '—'}</div>
                  {playlist.currentTrack?.marche && (
                    <div className="text-sm text-foreground/60">{playlist.currentTrack.marche}</div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button size="lg" variant="outline" onClick={playlist.prev} aria-label="Piste précédente"><SkipBack /></Button>
                  <Button size="xl" variant="hero" onClick={playlist.toggle} aria-label={playlist.isPlaying ? 'Pause' : 'Lecture'}>
                    {playlist.isPlaying ? <Pause /> : <Play />}
                    {playlist.isPlaying ? 'Pause' : 'Lecture'}
                  </Button>
                  <Button size="lg" variant="outline" onClick={playlist.next} aria-label="Piste suivante"><SkipForward /></Button>
                </div>

                <div className="text-xs text-foreground/60">{playlist.currentIndex + 1} / {playlist.list.length}</div>
              </div>
            </CardContent>
          </Card>

          <section className="mt-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3">Liste des pistes</h2>
            <div className="divide-y divide-border rounded-md border">
              {playlist.list.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => playlist.playIndex(idx)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors ${idx === playlist.currentIndex ? 'bg-accent/50' : ''}`}
                  aria-label={`Lire ${t.title || 'piste'}`}
                >
                  <div>
                    <div className="text-sm font-medium">{t.title || 'Piste'}</div>
                    {t.marche && <div className="text-xs text-foreground/60">{t.marche}</div>}
                  </div>
                  <div className="text-xs text-foreground/60">{idx + 1}</div>
                </button>
              ))}
              {playlist.list.length === 0 && (
                <div className="px-4 py-8 text-center text-foreground/60">Aucun audio disponible pour cette exploration.</div>
              )}
            </div>
          </section>
        </main>

        <FloatingAudioPlayer />
      </div>
    </AudioProvider>
  );
}
