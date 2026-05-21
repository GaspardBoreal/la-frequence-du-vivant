import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, Eye, Users, Share2, ArrowRight, Sparkles, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  usePublicEvent,
  usePublicEventCounters,
  useLogPublicEventView,
  buildPublicEventUrl,
} from '@/hooks/usePublicEvent';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import { cn } from '@/lib/utils';

const SITE = 'https://la-frequence-du-vivant.com';

const PublicEventPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  useLogPublicEventView(slug);

  const { data: event, isLoading, error } = usePublicEvent(slug);
  const { data: counters } = usePublicEventCounters(slug);

  const url = useMemo(() => (slug ? `${SITE}/m/${slug}` : ''), [slug]);
  const typeMeta = event ? getMarcheEventTypeMeta(event.event_type) : null;
  const dateLabel = event ? format(new Date(event.date_marche), 'PPP', { locale: fr }) : '';

  const share = async (channel: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'email' | 'copy') => {
    if (!slug) return;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="animate-pulse text-muted-foreground">Chargement…</div>
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
    organizer: { '@type': 'Organization', name: 'La Fréquence du Vivant', url: SITE },
    url,
    ...(event.cover_image_url ? { image: event.cover_image_url } : {}),
    description,
  };

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

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-amber-500/5"
          aria-hidden
        />
        {event.cover_image_url && (
          <img
            src={event.cover_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30 -z-10"
            aria-hidden
          />
        )}
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link to="/marches-du-vivant" className="hover:text-foreground">Les Marches du Vivant</Link>
            <span>·</span>
            <span>Page publique</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {typeMeta && (
              <Badge variant="outline" className={cn('gap-1 rounded-full', typeMeta.badgeClassName)}>
                <typeMeta.icon className="h-3 w-3" />
                {typeMeta.shortLabel}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 rounded-full bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              <Eye className="h-3 w-3" /> Lecture publique
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{dateLabel}</span>
            {event.lieu && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.lieu}</span>}
            {counters && counters.views_total > 0 && (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-foreground font-medium">{counters.unique_visitors.toLocaleString('fr-FR')}</span>
                &nbsp;personnes ont découvert cette marche
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-24 space-y-8">
        {/* Description */}
        {event.description && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">À propos de cette marche</h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground/90"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </Card>
        )}

        {/* Carte simple */}
        {event.latitude && event.longitude && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Point de rendez-vous
            </h2>
            <div className="aspect-[16/9] rounded-lg overflow-hidden border bg-muted">
              <iframe
                title="Carte"
                className="w-full h-full"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude - 0.02},${event.latitude - 0.015},${event.longitude + 0.02},${event.latitude + 0.015}&layer=mapnik&marker=${event.latitude},${event.longitude}`}
                loading="lazy"
              />
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=15/${event.latitude}/${event.longitude}`}
              target="_blank" rel="noreferrer"
              className="text-xs text-primary hover:underline mt-2 inline-block"
            >
              Voir en grand →
            </a>
          </Card>
        )}

        {/* Partager */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
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
            <Button size="sm" variant="outline" onClick={() => share('email')}>Email</Button>
            <Button size="sm" variant="outline" onClick={() => share('copy')}><Copy className="h-3.5 w-3.5 mr-1" />Copier le lien</Button>
          </div>
        </Card>

        {/* CTA conversion */}
        <Card className="p-8 text-center bg-gradient-to-br from-primary/10 via-background to-amber-500/10 border-primary/20">
          <Users className="h-8 w-8 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Inspiré·e par cette marche&nbsp;?
          </h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Rejoignez la prochaine marche du vivant près de chez vous, ou organisez la vôtre.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/marches-du-vivant/explorer">
              <Button>Trouver une marche <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
            <Link to="/marches-du-vivant">
              <Button variant="outline">Organiser ma marche</Button>
            </Link>
          </div>
        </Card>

        <div className="text-center text-xs text-muted-foreground pt-6 border-t">
          Données partagées avec l'accord des participants — Propulsé par{' '}
          <Link to="/" className="text-primary hover:underline">La Fréquence du Vivant</Link>
        </div>
      </main>
    </div>
  );
};

export default PublicEventPage;
