import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar, MapPin, Eye, Users, Share2, ArrowRight, Sparkles, Copy,
  Leaf, Bird, Trees, Globe2, Heart, ChevronRight, Camera, Quote, Mail,
  Waves, ChevronDown,
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

const PublicEventPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  useLogPublicEventView(slug);

  const { data: event, isLoading, error } = usePublicEvent(slug);
  const { data: counters } = usePublicEventCounters(slug);
  const { data: biodiversity } = usePublicEventBiodiversity(slug);
  const { data: marcheurs } = usePublicEventMarcheurs(slug);
  const { data: testimonies } = usePublicEventTestimonies(slug);
  const { data: medias } = usePublicEventMedias(slug);

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
    ...(counters?.marcheurs_count ? { attendeeCount: counters.marcheurs_count } : {}),
  };

  const hasGeo = event.latitude != null && event.longitude != null;
  const geoObs = biodiversity?.observations_geo ?? [];

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

      {/* ───────── HERO ───────── */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-amber-500/5"
          aria-hidden
        />
        {event.cover_image_url && (
          <>
            <img
              src={event.cover_image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30 -z-10"
              aria-hidden
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-background/20" aria-hidden />
          </>
        )}
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link to="/marches-du-vivant" className="hover:text-foreground">Les Marches du Vivant</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Page publique</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {typeMeta && (
              <Badge variant="outline" className={cn('gap-1 rounded-full', typeMeta.badgeClassName)}>
                <typeMeta.icon className="h-3 w-3" />
                {typeMeta.shortLabel}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <Eye className="h-3 w-3" /> Lecture publique
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{dateLabel}</span>
            {event.lieu && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.lieu}</span>}
            {event.organisateur && (
              <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />Organisé par {event.organisateur.nom}</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-24 space-y-10">
        {/* ───────── SOCIAL PROOF ───────── */}
        {counters && (
          <Card className="p-5 -mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 backdrop-blur bg-card/80 border-primary/10 shadow-sm">
            <Stat label="Marcheurs" value={counters.marcheurs_count} icon={Users} tone="text-primary" />
            <Stat label="Espèces observées" value={counters.species_count} icon={Leaf} tone="text-emerald-600 dark:text-emerald-400" />
            <Stat label="Observations" value={counters.observations_count} icon={Camera} tone="text-amber-600 dark:text-amber-400" />
            <Stat label="Découvreurs" value={counters.unique_visitors} icon={Eye} tone="text-muted-foreground" />
          </Card>
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
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; icon: React.ElementType; tone: string }> = ({
  label, value, icon: Icon, tone,
}) => (
  <div className="flex items-center gap-3">
    <Icon className={cn('h-5 w-5', tone)} />
    <div className="min-w-0">
      <p className="text-xl font-bold text-foreground leading-none">{value.toLocaleString('fr-FR')}</p>
      <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
    </div>
  </div>
);

export default PublicEventPage;
