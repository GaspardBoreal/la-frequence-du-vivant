import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Leaf, Sparkles } from 'lucide-react';
import Footer from '@/components/Footer';
import RoadmapNav from '@/components/roadmap/RoadmapNav';
import WeekCard from '@/components/roadmap/WeekCard';
import EntryCard from '@/components/roadmap/EntryCard';
import LiveStats from '@/components/roadmap/LiveStats';
import FriseVivante from '@/components/roadmap/viz/FriseVivante';
import ConstellationDomaines from '@/components/roadmap/viz/ConstellationDomaines';
import Sismographe from '@/components/roadmap/viz/Sismographe';
import PlancheDePreuves from '@/components/roadmap/viz/PlancheDePreuves';
import MediaLightbox from '@/components/roadmap/MediaLightbox';
import { useRoadmapEntries, useRoadmapWeeks } from '@/hooks/roadmap/useRoadmap';
import { AUDIENCES, audienceBySlug, type RoadmapMedia } from '@/lib/roadmap/types';


/** Page publique de la Roadmap vivante : accueil et déclinaisons par public. */
const RoadmapPublic: React.FC = () => {
  const { audience: audienceSlug } = useParams();
  const audienceDef = audienceBySlug(audienceSlug);
  const audience = audienceDef?.key ?? null;

  const { data: weeks = [], isLoading } = useRoadmapWeeks(false);
  const weekIds = React.useMemo(() => weeks.map((w) => w.id), [weeks]);
  const { data: allEntries = [] } = useRoadmapEntries(weekIds);
  const [zoom, setZoom] = React.useState<RoadmapMedia | null>(null);

  const entries = React.useMemo(
    () => (audience ? allEntries.filter((e) => e.audiences.includes(audience)) : allEntries),
    [allEntries, audience],
  );

  const visibleWeeks = React.useMemo(
    () => (audience ? weeks.filter((w) => entries.some((e) => e.week_id === w.id)) : weeks),
    [weeks, entries, audience],
  );

  /** Séries chronologiques pour les micro-sparklines des cartouches. */
  const chrono = React.useMemo(
    () => [...visibleWeeks].sort((a, b) => a.iso_year - b.iso_year || a.iso_week - b.iso_week),
    [visibleWeeks],
  );
  const perWeek = React.useMemo(
    () => chrono.map((w) => entries.filter((e) => e.week_id === w.id)),
    [chrono, entries],
  );


  const lastWeek = visibleWeeks[0];
  const lastEntries = lastWeek ? entries.filter((e) => e.week_id === lastWeek.id) : [];

  const title = audienceDef
    ? `Roadmap vivante — ${audienceDef.label} | Les Marches du Vivant`
    : 'Roadmap vivante — le journal hebdomadaire | Les Marches du Vivant';
  const description = audienceDef
    ? audienceDef.baseline
    : "Semaine après semaine, ce que Les Marches du Vivant produisent et publient réellement : terrain, biodiversité, sols, capteurs et partage.";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title.slice(0, 60)}</title>
        <meta name="description" content={description.slice(0, 158)} />
        <link
          rel="canonical"
          href={`https://la-frequence-du-vivant.com/roadmap${audienceDef ? `/${audienceDef.slug}` : ''}`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <RoadmapNav />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10">
        <header className="mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Journal hebdomadaire
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {audienceDef ? (
              <>
                La dynamique du projet, vue par les {audienceDef.label.toLowerCase()}
              </>
            ) : (
              <>Ce que nous produisons, semaine après semaine</>
            )}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            {audienceDef ? audienceDef.baseline : description}
          </p>

          <LiveStats
            stats={[
              {
                label: 'Semaines publiées',
                value: visibleWeeks.length,
                series: perWeek.map((_, i) => i + 1),
              },
              {
                label: 'Nouveautés',
                value: entries.length,
                series: perWeek.map((es) => es.length),
              },
              {
                label: 'Illustrées',
                value: entries.filter((e) => (e.medias?.length ?? 0) > 0).length,
                series: perWeek.map((es) => es.filter((e) => (e.medias?.length ?? 0) > 0).length),
              },
              {
                label: 'Domaines couverts',
                value: new Set(entries.map((e) => e.domain).filter(Boolean)).size,
                series: perWeek.map((es) => new Set(es.map((e) => e.domain).filter(Boolean)).size),
              },
            ]}
          />

        </header>

        {!audienceDef && (
          <section className="mb-12 grid gap-3 sm:grid-cols-3">
            {AUDIENCES.map((a) => (
              <Link
                key={a.slug}
                to={`/roadmap/${a.slug}`}
                className="group rounded-2xl border border-border/60 bg-card/60 p-5 transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Leaf className="h-4 w-4 text-primary" /> {a.label}
                </div>
                <p className="text-sm text-muted-foreground">{a.short}</p>
                <p className="mt-3 text-xs text-primary opacity-0 transition group-hover:opacity-100">
                  Voir les nouveautés →
                </p>
              </Link>
            ))}
          </section>
        )}

        {visibleWeeks.length > 0 && (
          <section className="mb-12 space-y-8">
            <div>
              <h2 className="mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                La frise vivante
              </h2>
              <FriseVivante weeks={visibleWeeks} entries={entries} audience={audience} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-border/60 bg-card/50 p-5 backdrop-blur">
                <h2 className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                  Où le projet a poussé
                </h2>
                <ConstellationDomaines entries={entries} audience={audience} />
              </div>
              <div className="rounded-3xl border border-border/60 bg-card/50 p-5 backdrop-blur">
                <h2 className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                  Cadence de livraison
                </h2>
                <Sismographe weeks={visibleWeeks} entries={entries} />
              </div>
            </div>
          </section>
        )}


        {isLoading && (
          <p className="py-16 text-center text-sm text-muted-foreground">Chargement du journal…</p>
        )}

        {!isLoading && visibleWeeks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-12 text-center">
            <p className="text-sm text-muted-foreground">
              La première édition sera publiée très prochainement.
            </p>
          </div>
        )}

        {lastWeek && lastEntries.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              Dernière édition — semaine {lastWeek.iso_week}
            </h2>
            <div className="grid gap-4">
              {lastEntries.slice(0, 3).map((e) => (
                <EntryCard key={e.id} entry={e} audience={audience} onOpenMedia={setZoom} />
              ))}
            </div>
          </section>
        )}

        {entries.some((e) => (e.medias?.length ?? 0) > 0) && (
          <section className="mb-14">
            <h2 className="mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              La planche de preuves
            </h2>
            <PlancheDePreuves
              medias={entries.flatMap((e) => e.medias ?? [])}
              onOpen={setZoom}
            />
          </section>
        )}


        {visibleWeeks.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              La frise des semaines
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleWeeks.map((w, i) => (
                <WeekCard
                  key={w.id}
                  week={w}
                  entries={entries.filter((e) => e.week_id === w.id)}
                  audience={audience}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <MediaLightbox media={zoom} onClose={() => setZoom(null)} />
      <Footer variant="marches" />
    </div>
  );
};

export default RoadmapPublic;
