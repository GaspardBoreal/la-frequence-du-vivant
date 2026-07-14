import React, { useMemo, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar, MapPin, Eye, Users, Share2, ArrowRight, Sparkles, Copy,
  Leaf, Bird, Trees, Globe2, Heart, ChevronRight, Camera, Quote, Mail,
  Waves, ChevronDown, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CircleMarker, Popup } from 'react-leaflet';
import { RichMap } from '@/components/maps';
import { SpeciesName } from '@/components/species/SpeciesName';
import {
  usePublicEvent,
  usePublicEventStats,
  usePublicEventBiodiversity,
  usePublicEventMarcheurs,
  usePublicEventTestimonies,
  usePublicEventMedias,
  useLogPublicEventView,
  logPublicEventShare,
  logPublicEventCtaClick,
  buildPublicEventUrl,
} from '@/hooks/usePublicEvent';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import { cn } from '@/lib/utils';
import PratiquesEmblematiquesDialog from '@/components/public-event/PratiquesEmblematiquesDialog';
import PaysagesSonoresDialog from '@/components/public-event/PaysagesSonoresDialog';
import { useEventScenography, useEventScenographyData } from '@/hooks/useScenography';
import ScenographyRuntime from '@/components/scenography/ScenographyRuntime';
import VignobleImmersion from '@/components/vignoble/VignobleImmersion';
import { useEventBrandKit } from '@/hooks/useEventBrandKit';
import { BrandKitProvider } from '@/components/brand-kit/BrandKitProvider';
import { BrandSignatureBadge } from '@/components/brand-kit/BrandSignatureBadge';
import { BrandFooterSignature } from '@/components/brand-kit/BrandFooterSignature';
import { BrandDivider } from '@/components/brand-kit/BrandDivider';
import { BrandBadges } from '@/components/brand-kit/BrandBadges';

const SITE = 'https://la-frequence-du-vivant.com';

// Trophic colors aligned with biodiversity visualizations
const TROPHIC = {
  producteurs: { label: 'Producteurs', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', icon: Leaf },
  consommateurs: { label: 'Consommateurs', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', icon: Bird },
  decomposeurs: { label: 'Décomposeurs', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', icon: Trees },
  autres: { label: 'Autres', color: 'text-muted-foreground', bg: 'bg-muted', icon: Sparkles },
} as const;

const taxonColor = (taxon: string | null) => {
  if (!taxon) return '#94a3b8';
  if (['Plantae', 'Fungi'].includes(taxon)) return '#10b981';
  if (['Aves'].includes(taxon)) return '#f59e0b';
  if (['Mammalia', 'Reptilia', 'Amphibia'].includes(taxon)) return '#ef4444';
  if (['Insecta', 'Arachnida'].includes(taxon)) return '#8b5cf6';
  return '#6366f1';
};

const PublicEventPageInner: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  useLogPublicEventView(slug);

  // Scenography short-circuit
  const [scenoBypassed, setScenoBypassed] = useState(false);
  const { data: sceno } = useEventScenography(slug);
  const { data: scenoData } = useEventScenographyData(slug, !!sceno && !scenoBypassed);
  const { data: brandKitInner } = useEventBrandKit(slug);

  const { data: event, isLoading, error } = usePublicEvent(slug);
  const { data: stats } = usePublicEventStats(slug);
  const { data: biodiversity } = usePublicEventBiodiversity(slug);
  const { data: marcheurs } = usePublicEventMarcheurs(slug);
  const { data: testimonies } = usePublicEventTestimonies(slug);
  const { data: medias } = usePublicEventMedias(slug);

  const [pratiquesOpen, setPratiquesOpen] = useState(false);
  const [paysagesOpen, setPaysagesOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  const url = useMemo(() => (slug ? `${SITE}/m/${slug}` : ''), [slug]);
  const typeMeta = event ? getMarcheEventTypeMeta(event.event_type) : null;
  const dateLabel = event ? format(new Date(event.date_marche), 'PPP', { locale: fr }) : '';

  const share = async (channel: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'email' | 'copy') => {
    if (!slug) return;
    logPublicEventShare(slug, channel);
    const shareUrl = buildPublicEventUrl(slug, { utmSource: 'share', utmMedium: channel });
    const text = `${event?.title ?? 'Une marche du vivant'} — ${dateLabel}`;
    switch (channel) {
      case 'whatsapp': window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank'); break;
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'); break;
      case 'twitter':  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank'); break;
      case 'linkedin': window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank'); break;
      case 'email':    window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(shareUrl)}`; break;
      case 'copy':     await navigator.clipboard.writeText(shareUrl); toast.success('Lien copié'); break;
    }
  };

  const handleCta = (cta: string, href: string) => {
    if (slug) logPublicEventCtaClick(slug, cta);
    window.location.href = href + (href.includes('?') ? '&' : '?') + `utm_source=public_event&utm_campaign=${slug}`;
  };

  // === Scenography mode (early return) ===
  // Sous Brand Kit actif, on court-circuite la scéno custom : la fiche classique
  // se laisse repeindre par les tokens partenaire — visuel Boutinet immédiat.
  if (sceno && sceno.scenography_code && !scenoBypassed && !brandKitInner) {
    const title = sceno.scenography_title || sceno.title || 'Marche du vivant';
    const description = (sceno.description || '').replace(/<[^>]+>/g, ' ').slice(0, 160);
    const shareUrl = slug ? `${SITE}/m/${slug}` : SITE;
    return (
      <>
        <Helmet>
          <title>{title} — La Fréquence du Vivant</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={shareUrl} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={shareUrl} />
          {sceno.cover_image_url && <meta property="og:image" content={sceno.cover_image_url} />}
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        <ScenographyRuntime
          code={sceno.scenography_code}
          data={scenoData ?? {}}
          title={title}
          onExit={() => setScenoBypassed(true)}
          brand={brandKitInner ?? null}
        />
        {slug && (
          <Link
            to={`/apprendre/${slug}`}
            className="fixed top-4 right-4 z-50 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium backdrop-blur-xl bg-card/60 border border-primary/30 text-foreground shadow-lg hover:bg-card/80 transition"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Apprendre cette marche</span>
            <span className="sm:hidden">Apprendre</span>
          </Link>
        )}
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-72 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6 text-center">
        <div className="max-w-md space-y-3">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-semibold text-foreground">Page introuvable</h1>
          <p className="text-muted-foreground">
            Cette marche n'est pas (ou plus) publique. Découvrez les marches en cours et à venir.
          </p>
          <Link to="/marches-du-vivant">
            <Button>Découvrir Les Marches du Vivant</Button>
          </Link>
        </div>
      </div>
    );
  }

  const description = event.description
    ? event.description.replace(/<[^>]+>/g, ' ').slice(0, 160)
    : `Marche du vivant — ${dateLabel}${event.lieu ? ' à ' + event.lieu : ''}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.date_marche,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.lieu || 'Lieu à découvrir',
      ...(event.latitude && event.longitude
        ? { geo: { '@type': 'GeoCoordinates', latitude: event.latitude, longitude: event.longitude } }
        : {}),
    },
    organizer: event.organisateur
      ? { '@type': 'Organization', name: event.organisateur.nom, url: event.organisateur.site_web ?? SITE }
      : { '@type': 'Organization', name: 'La Fréquence du Vivant', url: SITE },
    url,
    ...(event.cover_image_url ? { image: event.cover_image_url } : {}),
    description,
    ...(stats?.marcheurs_count ? { attendeeCount: stats.marcheurs_count } : {}),
  };

  const hasGeo = event.latitude != null && event.longitude != null;
  const geoObs = biodiversity?.observations_geo ?? [];

  // ═══ IMMERSION VIGNOBLE — template dédié cat=vignoble ═══
  if (event.category === 'vignoble' && slug) {
    return (
      <>
        <Helmet>
          <title>{event.title} — Grand Cru du Vivant</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={url} />
          <meta property="og:title" content={event.title} />
          <meta property="og:description" content={description} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={url} />
          {event.cover_image_url && <meta property="og:image" content={event.cover_image_url} />}
          <meta name="twitter:card" content="summary_large_image" />
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Helmet>
        <VignobleImmersion
          event={event}
          stats={stats}
          biodiversity={biodiversity}
          slug={slug}
          onShare={() => share('copy')}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{event.title} — La Fréquence du Vivant</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        {event.cover_image_url && <meta property="og:image" content={event.cover_image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* ───────── HERO IMMERSIF ───────── */}
      <header ref={heroRef} className="relative overflow-hidden min-h-[92vh] sm:min-h-[80vh] flex flex-col">
        {event.cover_image_url ? (
          <>
            <motion.img
              src={event.cover_image_url}
              alt=""
              aria-hidden
              style={{ y: heroY, opacity: heroOpacity }}
              className="absolute inset-0 w-full h-[110%] object-cover -z-10"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/30 via-background/40 to-background" aria-hidden />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/60 to-transparent" aria-hidden />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-background to-amber-500/10" aria-hidden />
        )}

        {/* Top bar */}
        <div className="max-w-6xl w-full mx-auto px-4 pt-6 flex items-center justify-between gap-3">
          <Link
            to="/marches-du-vivant"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs backdrop-blur-xl bg-card/40 border border-primary/20 text-foreground/80 hover:text-foreground transition"
          >
            <ChevronRight className="h-3 w-3 rotate-180" />
            Les Marches du Vivant
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to={`/apprendre/${slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs backdrop-blur-xl bg-card/40 border border-primary/20 text-foreground/80 hover:text-foreground transition"
            >
              <BookOpen className="h-3 w-3" />
              Apprendre cette marche
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest backdrop-blur-xl bg-card/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <Eye className="h-3 w-3" /> Lecture publique
            </span>
          </div>
        </div>

        {/* Centerpiece */}
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 pb-12 flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-5"
          >
            {typeMeta && (
              <Badge variant="outline" className={cn('gap-1 rounded-full backdrop-blur-xl bg-card/50', typeMeta.badgeClassName)}>
                <typeMeta.icon className="h-3 w-3" />
                {typeMeta.shortLabel}
              </Badge>
            )}
            <h1
              className="font-display font-semibold text-foreground tracking-tight leading-[0.95] drop-shadow-sm"
              style={{ fontSize: 'clamp(2.25rem, 8vw, 5rem)' }}
            >
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:text-base text-foreground/80">
              <span className="flex items-center gap-1.5 uppercase tracking-widest text-xs">
                <Calendar className="h-4 w-4 text-primary" />{dateLabel}
              </span>
              {event.lieu && (
                <span className="flex items-center gap-1.5 uppercase tracking-widest text-xs">
                  <MapPin className="h-4 w-4 text-primary" />{event.lieu}
                </span>
              )}
              {event.organisateur && (
                <span className="flex items-center gap-1.5 text-xs italic">
                  <Heart className="h-3.5 w-3.5 text-amber-500" />avec {event.organisateur.nom}
                </span>
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-10 flex justify-center"
          >
            <ChevronDown className="h-6 w-6 text-foreground/40 animate-bounce" />
          </motion.div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-24 space-y-12">
        {/* ───────── PULSATIONS DU VIVANT ───────── */}
        {stats && (
          <section aria-label="Pulsations du vivant" className="-mt-10 sm:-mt-14 relative z-10">
            <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto snap-x snap-mandatory sm:overflow-visible pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              <StatCard icon={Users} tone="text-primary" label="Marcheurs" value={stats.marcheurs_count} />
              <StatCard icon={Leaf} tone="text-emerald-600 dark:text-emerald-400" label="Espèces" value={stats.species_count} />
              <StatCard icon={Camera} tone="text-amber-600 dark:text-amber-400" label="Observations" value={stats.observations_count} />
              <StatCard icon={Eye} tone="text-muted-foreground" label="Découvreurs" value={stats.unique_visitors} />
              <StatCard
                icon={Sparkles}
                tone="text-amber-500"
                label="Pratiques"
                value={stats.pratiques_count}
                onClick={stats.pratiques_count > 0 ? () => setPratiquesOpen(true) : undefined}
              />
              <StatCard
                icon={Waves}
                tone="text-emerald-500"
                label="Paysages sonores"
                value={stats.paysages_sonores_count}
                onClick={stats.paysages_sonores_count > 0 ? () => setPaysagesOpen(true) : undefined}
              />
            </div>
          </section>
        )}

        {/* ───────── DESCRIPTION ───────── */}
        {event.description && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">À propos de cette marche</h2>
            <Card className="p-6">
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground/90"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </Card>
          </section>
        )}

        {/* ───────── BIODIVERSITÉ ───────── */}
        {biodiversity && biodiversity.species_count > 0 && (
          <section>
            <div className="flex items-end justify-between mb-3 gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-emerald-500" />
                  Le vivant observé
                </h2>
                <p className="text-sm text-muted-foreground">
                  {biodiversity.species_count} espèce{biodiversity.species_count > 1 ? 's' : ''} identifiée{biodiversity.species_count > 1 ? 's' : ''} lors de cette marche
                </p>
              </div>
            </div>

            {/* Trophic summary */}
            {biodiversity.trophic_summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {(['producteurs', 'consommateurs', 'decomposeurs', 'autres'] as const).map((k) => {
                  const meta = TROPHIC[k];
                  const v = biodiversity.trophic_summary[k];
                  if (!v) return null;
                  const Icon = meta.icon;
                  return (
                    <div key={k} className={cn('rounded-lg p-3 border', meta.bg)}>
                      <Icon className={cn('h-4 w-4 mb-1', meta.color)} />
                      <p className={cn('text-xl font-bold', meta.color)}>{v}</p>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Map */}
            {hasGeo && (
              <Card className="overflow-hidden mb-4">
                <div className="h-[360px] relative">
                  <RichMap
                    center={[event.latitude!, event.longitude!]}
                    zoom={14}
                    height="100%"
                    controls={{ zoom: true, style: true, geolocate: false }}
                    scrollWheelZoom={false}
                  >
                    {geoObs.slice(0, 200).map((o, i) => (
                      <CircleMarker
                        key={i}
                        center={[o.latitude, o.longitude]}
                        radius={6}
                        pathOptions={{
                          color: taxonColor(
                            biodiversity.species.find((s) => s.scientific_name === o.scientific_name)?.iconic_taxon ?? null
                          ),
                          weight: 2,
                          fillOpacity: 0.6,
                        }}
                      >
                        <Popup>
                          <SpeciesName scientificName={o.scientific_name} size="sm" showScientific />
                        </Popup>
                      </CircleMarker>
                    ))}
                  </RichMap>
                </div>
                <div className="p-2 text-xs text-center text-muted-foreground border-t">
                  Coordonnées arrondies pour préserver la vie privée des observateurs · {geoObs.length} observation{geoObs.length > 1 ? 's' : ''} géolocalisée{geoObs.length > 1 ? 's' : ''}
                </div>
              </Card>
            )}

            {/* Species grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {biodiversity.species.slice(0, 24).map((sp) => (
                <Card key={sp.scientific_name} className="overflow-hidden group">
                  {sp.photo_url ? (
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={sp.photo_url}
                        alt={sp.scientific_name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-emerald-500/10 to-amber-500/10 grid place-items-center">
                      <Leaf className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <SpeciesName
                      scientificName={sp.scientific_name}
                      commonName={sp.common_name}
                      size="sm"
                      truncate
                      showScientific
                      scientificClassName="text-[10px]"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {sp.observations_count} obs.{sp.has_walker_observation ? ' · 🥾' : ''}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
            {biodiversity.species_count > 24 && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                + {biodiversity.species_count - 24} autres espèces observées
              </p>
            )}
          </section>
        )}

        {/* ───────── MARCHEURS ───────── */}
        {marcheurs && marcheurs.public_count > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-primary" />
              Les marcheurs
              <span className="text-sm font-normal text-muted-foreground">
                · {marcheurs.public_count} sur {marcheurs.total_count}
              </span>
            </h2>
            <Card className="p-4">
              <div className="flex flex-wrap gap-3">
                {marcheurs.public_marcheurs.map((m, i) => {
                  const node = (
                    <div className="flex flex-col items-center gap-1.5 w-20">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.display_name} />}
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {m.display_name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-center text-foreground leading-tight truncate w-full">
                        {m.display_name}
                      </span>
                    </div>
                  );
                  return m.slug ? (
                    <Link key={i} to={`/marcheurs/${m.slug}`} className="hover:opacity-80 transition-opacity">
                      {node}
                    </Link>
                  ) : (
                    <div key={i}>{node}</div>
                  );
                })}
              </div>
              {marcheurs.total_count > marcheurs.public_count && (
                <p className="text-xs text-muted-foreground italic mt-4 pt-3 border-t">
                  {marcheurs.total_count - marcheurs.public_count} autre{marcheurs.total_count - marcheurs.public_count > 1 ? 's' : ''} marcheur{marcheurs.total_count - marcheurs.public_count > 1 ? 's ont' : ' a'} participé sans souhaiter apparaître publiquement.
                </p>
              )}
            </Card>
          </section>
        )}

        {/* ───────── TÉMOIGNAGES ───────── */}
        {testimonies && testimonies.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
              <Quote className="h-5 w-5 text-amber-500" />
              Paroles de marcheurs
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {testimonies.map((t) => (
                <Card key={t.id} className="p-5">
                  <Quote className="h-5 w-5 text-amber-500/40 mb-2" />
                  <p className="text-foreground/90 italic mb-3 leading-relaxed">« {t.quote} »</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-7 w-7">
                      {t.avatar_url && <AvatarImage src={t.avatar_url} alt={t.author_name} />}
                      <AvatarFallback className="text-[10px] bg-muted">
                        {t.author_name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">— {t.author_name}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ───────── MÉDIAS ───────── */}
        {medias && medias.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
              <Camera className="h-5 w-5 text-primary" />
              Galerie de la marche
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {medias
                .filter((m) => m.type_media === 'photo' && (m.url_fichier || m.external_url))
                .slice(0, 24)
                .map((m) => (
                  <a
                    key={m.id}
                    href={m.url_fichier ?? m.external_url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-muted group relative"
                  >
                    <img
                      src={m.url_fichier ?? m.external_url ?? ''}
                      alt={m.titre ?? ''}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {m.author_name && (
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        📸 {m.author_name}
                      </div>
                    )}
                  </a>
                ))}
            </div>
          </section>
        )}

        {/* ───────── ORGANISATEUR ───────── */}
        {event.organisateur && (
          <section>
            <Card className="p-5 flex items-center gap-4">
              {event.organisateur.logo_url && (
                <img
                  src={event.organisateur.logo_url}
                  alt={event.organisateur.nom}
                  className="h-16 w-16 rounded-lg object-contain bg-muted p-1"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Organisé par</p>
                <p className="font-semibold text-foreground">{event.organisateur.nom}</p>
                {event.organisateur.ville && (
                  <p className="text-xs text-muted-foreground">{event.organisateur.ville}{event.organisateur.pays ? ` · ${event.organisateur.pays}` : ''}</p>
                )}
              </div>
              {event.organisateur.site_web && (
                <Button variant="outline" size="sm" asChild>
                  <a href={event.organisateur.site_web} target="_blank" rel="noreferrer">
                    Site web <ArrowRight className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
            </Card>
          </section>
        )}

        {/* ───────── PARTAGE ───────── */}
        <section>
          <Card className="p-6 bg-gradient-to-br from-amber-500/5 to-primary/5 border-amber-500/20">
            <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-amber-500" />
              Faire rayonner cette marche
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Plus elle est partagée, plus le vivant gagne en visibilité. Choisissez votre canal&nbsp;:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => share('whatsapp')}>WhatsApp</Button>
              <Button size="sm" variant="outline" onClick={() => share('facebook')}>Facebook</Button>
              <Button size="sm" variant="outline" onClick={() => share('twitter')}>X / Twitter</Button>
              <Button size="sm" variant="outline" onClick={() => share('linkedin')}>LinkedIn</Button>
              <Button size="sm" variant="outline" onClick={() => share('email')}>
                <Mail className="h-3.5 w-3.5 mr-1" />Email
              </Button>
              <Button size="sm" variant="outline" onClick={() => share('copy')}>
                <Copy className="h-3.5 w-3.5 mr-1" />Copier le lien
              </Button>
            </div>
          </Card>
        </section>

        {/* ───────── CTA ───────── */}
        <section>
          <Card className="p-8 text-center bg-gradient-to-br from-primary/10 via-background to-amber-500/10 border-primary/20">
            <Globe2 className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Inspiré·e par cette marche&nbsp;?
            </h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              Rejoignez la prochaine marche du vivant près de chez vous, ou organisez la vôtre.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={() => handleCta('find_walk', '/marches-du-vivant/explorer')}>
                Trouver une marche <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="outline" onClick={() => handleCta('organize_walk', '/marches-du-vivant')}>
                Organiser ma marche
              </Button>
            </div>
          </Card>
        </section>

        <div className="text-center text-xs text-muted-foreground pt-6 border-t">
          Données partagées avec l'accord des participants · GPS arrondis pour préserver la vie privée · Propulsé par{' '}
          <Link to="/" className="text-primary hover:underline">La Fréquence du Vivant</Link>
        </div>
      </main>

      {stats && (
        <>
          <PratiquesEmblematiquesDialog
            open={pratiquesOpen}
            onOpenChange={setPratiquesOpen}
            pratiques={stats.pratiques_sample ?? []}
            total={stats.pratiques_count}
          />
          <PaysagesSonoresDialog
            open={paysagesOpen}
            onOpenChange={setPaysagesOpen}
            paysages={stats.paysages_sample ?? []}
            total={stats.paysages_sonores_count}
          />
        </>
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, tone, onClick }) => {
  const inner = (
    <>
      <Icon className={cn('h-5 w-5 mb-2', tone)} />
      <p className="text-2xl sm:text-3xl font-display font-semibold text-foreground leading-none">
        {value.toLocaleString('fr-FR')}
      </p>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1.5">{label}</p>
      {onClick && (
        <span className="text-[10px] text-primary mt-1.5 inline-flex items-center gap-0.5">
          Explorer <ChevronRight className="h-2.5 w-2.5" />
        </span>
      )}
    </>
  );
  const baseClass = 'snap-center shrink-0 w-[44vw] max-w-[180px] sm:w-auto sm:max-w-none rounded-2xl backdrop-blur-xl bg-card/70 border border-primary/10 p-4 shadow-sm transition-all';
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(baseClass, 'hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 text-left cursor-pointer')}
      >
        {inner}
      </button>
    );
  }
  return <div className={baseClass}>{inner}</div>;
};

/**
 * Wrapper : applique le Brand Kit (habillage partenaire) autour de la page.
 * Sans kit actif → rendu identique. Avec kit → tokens CSS + fontes + signature.
 */
const PublicEventPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: brandKit } = useEventBrandKit(slug);
  return (
    <BrandKitProvider kit={brandKit ?? null}>
      {brandKit && <BrandSignatureBadge />}
      <PublicEventPageInner />
      {brandKit && <BrandFooterSignature />}
    </BrandKitProvider>
  );
};

// Re-exports pour usage ponctuel dans le corps de la page.
export { BrandDivider, BrandBadges };

export default PublicEventPage;
