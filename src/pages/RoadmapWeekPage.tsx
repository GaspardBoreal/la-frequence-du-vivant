import React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CalendarDays, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import RoadmapNav from '@/components/roadmap/RoadmapNav';
import EntryCard from '@/components/roadmap/EntryCard';
import FriseVivante from '@/components/roadmap/viz/FriseVivante';
import PlancheDePreuves from '@/components/roadmap/viz/PlancheDePreuves';
import MediaLightbox from '@/components/roadmap/MediaLightbox';

import { useRoadmapEntries, useRoadmapWeeks } from '@/hooks/roadmap/useRoadmap';
import {
  AUDIENCES,
  weekRangeLabel,
  type RoadmapAudience,
  type RoadmapMedia,
} from '@/lib/roadmap/types';

/** Édition d'une semaine : le récit puis les nouveautés, filtrables par public. */
const RoadmapWeekPage: React.FC = () => {
  const { year, week: weekNo } = useParams();
  const [params, setParams] = useSearchParams();
  const audience = (params.get('public') as RoadmapAudience | null) ?? null;
  const [zoom, setZoom] = React.useState<RoadmapMedia | null>(null);
  const [copied, setCopied] = React.useState(false);

  const { data: weeks = [], isLoading } = useRoadmapWeeks(false);
  const week = weeks.find(
    (w) => String(w.iso_year) === String(year) && String(w.iso_week) === String(weekNo),
  );
  const weekIds = React.useMemo(() => weeks.map((w) => w.id), [weeks]);
  const { data: allEntries = [] } = useRoadmapEntries(weekIds);
  const entries = React.useMemo(
    () => (week ? allEntries.filter((e) => e.week_id === week.id) : []),
    [allEntries, week],
  );

  const shown = audience ? entries.filter((e) => e.audiences.includes(audience)) : entries;


  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>
          {(week?.title ? `${week.title} — Roadmap vivante` : 'Édition de la semaine — Roadmap').slice(0, 60)}
        </title>
        <meta
          name="description"
          content={(week?.narrative ?? 'Le journal hebdomadaire des Marches du Vivant.').slice(0, 158)}
        />
        {week && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: week.title || `Semaine ${week.iso_week}`,
              datePublished: week.published_at ?? week.ends_on,
              description: week.narrative ?? '',
              author: { '@type': 'Organization', name: 'Les Marches du Vivant' },
            })}
          </script>
        )}
      </Helmet>

      <RoadmapNav />

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-10">
        <Link
          to="/roadmap"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Toutes les semaines
        </Link>

        {isLoading && <p className="py-16 text-center text-sm text-muted-foreground">Chargement…</p>}

        {!isLoading && !week && (
          <div className="rounded-2xl border border-dashed border-border/70 p-12 text-center">
            <p className="text-sm text-muted-foreground">Cette édition n’est pas encore publiée.</p>
          </div>
        )}

        {week && (
          <>
            <header className="mb-8 space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Semaine {week.iso_week} · {week.iso_year} — {weekRangeLabel(week)}
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-foreground">
                {week.title || `Semaine ${week.iso_week}`}
              </h1>
              {week.narrative && (
                <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                  {week.narrative}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button
                  variant={audience ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => {
                    params.delete('public');
                    setParams(params);
                  }}
                >
                  Tous les publics
                </Button>
                {AUDIENCES.map((a) => (
                  <Button
                    key={a.key}
                    variant={audience === a.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      params.set('public', a.key);
                      setParams(params);
                    }}
                  >
                    {a.label}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={share} className="ml-auto">
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                  {copied ? 'Lien copié' : 'Partager'}
                </Button>
              </div>
            </header>

            {shown.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                Aucune nouveauté pour ce public cette semaine.
              </p>
            ) : (
              <div className="grid gap-4">
                {shown.map((e) => (
                  <EntryCard key={e.id} entry={e} audience={audience} onOpenMedia={setZoom} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <MediaLightbox media={zoom} onClose={() => setZoom(null)} />
      <Footer variant="marches" />
    </div>
  );
};

export default RoadmapWeekPage;
