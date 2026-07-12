import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, Sprout, Users, Headphones, Camera, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { CarteMdVEvent } from '@/hooks/useCarteMdV';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';

interface Props {
  event: CarteMdVEvent;
  compact?: boolean;
  rightBadge?: React.ReactNode;
}

const EventCard: React.FC<Props> = ({ event, compact = false, rightBadge }) => {
  const { user } = useAuth();
  const location = useLocation();
  const meta = getMarcheEventTypeMeta(event.event_type);
  const date = new Date(event.date_marche);
  const isUpcoming = date.getTime() > Date.now();
  const remaining = event.max_participants != null
    ? Math.max(0, event.max_participants - (event.participants_count ?? 0))
    : null;

  const isJardin = event.category === 'jardin';
  // Propager les filtres actifs de la carte vers la fiche Jardin (nav prev/next + retour).
  const carteQuery = isJardin && location.pathname.includes('carte-marches-du-vivant')
    ? location.search
    : '';
  const detailUrl = isJardin
    ? `/jardin/${event.public_slug ?? event.id}${carteQuery}`
    : event.is_public && event.public_slug
      ? `/m/${event.public_slug}`
      : `/admin/marche-events/${event.id}`;

  const inscriptionUrl = user
    ? detailUrl
    : `/marches-du-vivant/connexion?next=${encodeURIComponent(detailUrl)}`;

  return (
    <article className={`group relative overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg ${
      meta?.cardClassName ?? ''
    }`}>
      {event.cover_image_url && !compact && (
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          <img
            src={event.cover_image_url}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {meta && (
            <Badge className={`absolute left-2 top-2 ${meta.badgeClassName}`}>
              <meta.icon className="mr-1 h-3 w-3" />
              {meta.shortLabel}
            </Badge>
          )}
          {event.species_count > 0 && (
            <div className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold backdrop-blur">
              <Sprout className="mr-1 inline h-3 w-3 text-primary" />
              {event.species_count} espèces
            </div>
          )}
          {rightBadge && (
            <div className={`absolute right-2 ${event.species_count > 0 ? 'top-11' : 'top-2'}`}>
              {rightBadge}
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {!event.cover_image_url && (
          <div className="flex items-center justify-between gap-2 min-h-[22px]">
            {meta ? (
              <Badge className={meta.badgeClassName}>
                <meta.icon className="mr-1 h-3 w-3" />
                {meta.shortLabel}
              </Badge>
            ) : <span />}
            {rightBadge}
          </div>
        )}

        <div>
          <h3 className="font-semibold text-base leading-tight">{event.title}</h3>
          {event.exploration_name && (
            <p className="mt-0.5 text-xs text-muted-foreground">🧭 {event.exploration_name}</p>
          )}
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
          </div>
          {event.lieu && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.lieu}
            </div>
          )}
          {event.participants_count > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {event.participants_count} marcheur{event.participants_count > 1 ? 's' : ''} inscrit{event.participants_count > 1 ? 's' : ''}
              {remaining !== null && remaining > 0 && ` · ${remaining} place${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`}
              {remaining === 0 && <span className="text-destructive font-medium ml-1">· Complet</span>}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {event.has_audio && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Headphones className="h-2.5 w-2.5" /> Audio
            </Badge>
          )}
          {event.has_marcheur_photos && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Camera className="h-2.5 w-2.5" /> Photos
            </Badge>
          )}
          {event.species_count === 0 && (
            <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-500/40">
              <Sparkles className="h-2.5 w-2.5" /> Marche pionnière
            </Badge>
          )}
        </div>

        {isUpcoming && (
          <div className="flex gap-2 pt-1">
            {user ? (
              <Button asChild size="sm" className="flex-1">
                <Link to={inscriptionUrl}>S'inscrire à cette marche</Link>
              </Button>
            ) : (
              <div className="flex-1 space-y-1">
                <Button asChild size="sm" className="w-full">
                  <Link to={inscriptionUrl}>Créer mon compte pour rejoindre</Link>
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">
                  Déjà marcheur ?{' '}
                  <Link to={`/marches-du-vivant/connexion?next=${encodeURIComponent(detailUrl)}`}
                    className="text-primary hover:underline">Se connecter</Link>
                </p>
              </div>
            )}
          </div>
        )}
        {!isUpcoming && (
          <Button asChild size="sm" variant={isJardin ? 'default' : 'outline'} className="w-full">
            <Link to={detailUrl}>{isJardin ? '✦ Immersion Jardin' : 'Découvrir cette marche'}</Link>
          </Button>
        )}
      </div>
    </article>
  );
};

export default EventCard;
