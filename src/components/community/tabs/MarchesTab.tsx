import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, CheckCircle2, QrCode, ChevronRight, Compass, Footprints, Users, Calendar, ChevronDown } from 'lucide-react';
import PastEventExpandedView from './PastEventExpandedView';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format, differenceInCalendarDays, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { stripHtml } from '@/utils/textUtils';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MarcheEvent {
  id: string;
  title: string;
  description?: string | null;
  date_marche: string;
  lieu: string | null;
  event_type?: string | null;
  exploration_id?: string | null;
  explorations?: { name: string } | null;
}

interface PastEvent {
  id: string;
  title: string;
  date_marche: string;
  lieu: string | null;
  event_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  exploration_id?: string | null;
  explorations?: { name: string } | null;
}

interface Participation {
  id: string;
  marche_event_id: string;
  validated_at: string | null;
  validation_method: string | null;
  created_at: string;
  marche_events: {
    title: string;
    date_marche: string;
    lieu: string | null;
    explorations?: { name: string } | null;
  } | null;
}

interface MarchesTabProps {
  userId: string;
  upcomingEvents: MarcheEvent[];
  participations: Participation[];
  registeredEventIds: Set<string>;
  pastEvents?: PastEvent[];
  pastParticipantCounts?: Record<string, number>;
}

const getCountdown = (dateStr: string) => {
  const days = differenceInCalendarDays(new Date(dateStr), new Date());
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days < 7) return `${days} j`;
  if (days < 30) return `${Math.ceil(days / 7)} sem.`;
  return `${Math.ceil(days / 30)} mois`;
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  agroecologique: '#10b981',
  eco_poetique: '#8b5cf6',
  eco_tourisme: '#f59e0b',
};

const EventCard: React.FC<{
  event: MarcheEvent;
  isRegistered: boolean;
  index: number;
  registeringId: string | null;
  onRegister: (id: string) => void;
}> = ({ event, isRegistered, index, registeringId, onRegister }) => {
  const typeMeta = getMarcheEventTypeMeta(event.event_type);
  const descText = event.description ? stripHtml(event.description) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-xl overflow-hidden transition-all ${
        isRegistered
          ? 'bg-emerald-50 border border-emerald-200 shadow-sm dark:bg-emerald-500/10 dark:border-amber-400/30 dark:shadow-[0_0_20px_-6px_rgba(251,191,36,0.12)]'
          : 'bg-card border border-border dark:bg-white/5 dark:border-white/10'
      }`}
    >
      <div className="p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-foreground text-sm font-semibold leading-snug flex-1">{event.title}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
            isRegistered
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
          }`}>
            {getCountdown(event.date_marche)}
          </span>
        </div>

        {descText && (
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{descText}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-emerald-700 dark:text-emerald-300/70 text-[11px]">
            {format(new Date(event.date_marche), 'dd MMM yyyy', { locale: fr })}
          </span>
          {event.lieu && (
            <span className="text-muted-foreground text-[11px] flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />{event.lieu}
            </span>
          )}
          {event.explorations?.name && (
            <span className="text-sky-600 dark:text-sky-300/60 text-[10px]">• {event.explorations.name}</span>
          )}
        </div>

        {typeMeta && (
          <div className="flex flex-wrap gap-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${typeMeta.badgeClassName}`}>
              <typeMeta.icon className="w-3 h-3" />
              {typeMeta.label}
            </span>
          </div>
        )}

        {isRegistered ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-100 dark:bg-emerald-500/10 rounded-full px-2.5 py-1 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-medium">Inscrit</span>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => onRegister(event.id)}
            disabled={registeringId === event.id}
            className="w-full bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs rounded-lg h-8 gap-1"
          >
            {registeringId === event.id ? 'Inscription...' : (
              <>S'inscrire à cette aventure <ChevronRight className="w-3.5 h-3.5" /></>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

const PastEventCard: React.FC<{ event: PastEvent; participantCount: number; index: number }> = ({ event, participantCount, index }) => {
  const [expanded, setExpanded] = useState(false);
  const typeMeta = getMarcheEventTypeMeta(event.event_type);
  const timeAgo = formatDistanceToNow(new Date(event.date_marche), { locale: fr, addSuffix: true });
  const hasExploration = !!event.exploration_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative rounded-lg overflow-hidden bg-stone-50 dark:bg-stone-800/20 border border-stone-200 dark:border-stone-600/30 p-3 space-y-1.5"
    >
      {typeMeta && (
        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${typeMeta.badgeClassName}`}>
          <typeMeta.icon className="w-3 h-3" />
          {typeMeta.label}
        </span>
      )}

      <p className="text-foreground text-xs font-semibold leading-snug line-clamp-2 pr-6">{event.title}</p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-stone-500 dark:text-stone-400 text-[11px]">
          {format(new Date(event.date_marche), 'dd MMM yyyy', { locale: fr })}
        </span>
        {event.lieu && (
          <span className="text-stone-400 dark:text-stone-500 text-[11px] flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />{event.lieu}
          </span>
        )}
      </div>

      {participantCount > 0 && (
        <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 text-[10px]">
          <Users className="w-3 h-3" />
          <span>{participantCount} marcheur{participantCount > 1 ? 's' : ''} {timeAgo}</span>
        </div>
      )}

      {hasExploration && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] font-medium transition-colors hover:opacity-80 pt-0.5"
          style={{ color: EVENT_TYPE_COLORS[event.event_type || ''] || '#78716c' }}
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Replier' : 'Voir le parcours'}
        </button>
      )}

      <AnimatePresence>
        {expanded && event.exploration_id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-2 border-t border-stone-200/60 dark:border-stone-600/20 mt-1">
              <PastEventExpandedView
                explorationId={event.exploration_id}
                eventType={event.event_type}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && <Footprints className="absolute bottom-2 right-2 w-5 h-5 text-stone-200 dark:text-stone-700/40" />}
    </motion.div>
  );
};

const PastEventsMap: React.FC<{ events: PastEvent[]; participantCounts: Record<string, number> }> = ({ events, participantCounts }) => {
  const geoEvents = useMemo(
    () => events.filter(e => e.latitude != null && e.longitude != null),
    [events]
  );

  if (geoEvents.length === 0) return null;

  const center: [number, number] = [
    geoEvents.reduce((s, e) => s + (e.latitude || 0), 0) / geoEvents.length,
    geoEvents.reduce((s, e) => s + (e.longitude || 0), 0) / geoEvents.length,
  ];

  return (
    <div className="rounded-lg overflow-hidden border border-stone-200 dark:border-stone-600/30 h-48 md:h-64">
      <MapContainer
        center={center}
        zoom={7}
        scrollWheelZoom={false}
        className="h-full w-full [&_.leaflet-tile-pane]:brightness-[0.85] [&_.leaflet-tile-pane]:contrast-[1.1] [&_.leaflet-tile-pane]:saturate-[0.3] past-events-map"
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />
        {geoEvents.map(event => {
          const color = EVENT_TYPE_COLORS[event.event_type || ''] || '#78716c';
          const typeMeta = getMarcheEventTypeMeta(event.event_type);
          const count = participantCounts[event.id] || 0;
          return (
            <CircleMarker
              key={event.id}
              center={[event.latitude!, event.longitude!]}
              radius={8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 2 }}
            >
              <Popup className="past-event-popup">
                <div
                  className="flex min-w-[200px] max-w-[260px] rounded-lg overflow-hidden"
                  style={{
                    background: 'linear-gradient(to bottom right, #fafaf9, #ffffff)',
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div className="p-3 space-y-2 w-full">
                    {typeMeta && (
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${typeMeta.badgeClassName}`}>
                        <typeMeta.icon className="w-3 h-3" />
                        {typeMeta.label}
                      </span>
                    )}
                    <p className="font-crimson text-sm font-bold text-stone-800 leading-snug">{event.title}</p>
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-xs text-stone-500">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {format(new Date(event.date_marche), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                      {event.lieu && (
                        <span className="flex items-center gap-1.5 text-xs text-stone-500">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {event.lieu}
                        </span>
                      )}
                    </div>
                    {count > 0 && (
                      <p className="flex items-center gap-1.5 text-[11px] text-stone-400 italic pt-0.5">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        {count} marcheur{count > 1 ? 's' : ''} {count > 1 ? 'ont exploré' : 'a exploré'} ce sentier
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <style>{`
        .past-events-map .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.15);
          border-radius: 0.5rem;
          padding: 0;
          border: none;
        }
        .past-events-map .leaflet-popup-content {
          margin: 0;
        }
        .past-events-map .leaflet-popup-tip {
          background: #fafaf9;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

const MarchesTab: React.FC<MarchesTabProps> = ({
  userId, upcomingEvents, participations, registeredEventIds,
  pastEvents = [], pastParticipantCounts = {},
}) => {
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleRegister = async (eventId: string) => {
    setRegisteringId(eventId);
    try {
      const { error } = await supabase
        .from('marche_participations')
        .insert({ user_id: userId, marche_event_id: eventId });
      if (error) {
        if (error.code === '23505') toast.info('Vous êtes déjà inscrit à cette marche 🌿');
        else throw error;
      } else {
        toast.success('Inscription confirmée ! 🌿 À bientôt sur les sentiers');
        queryClient.invalidateQueries({ queryKey: ['community-participations'] });
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'inscription");
    } finally {
      setRegisteringId(null);
    }
  };

  const myEvents = upcomingEvents
    .filter(e => registeredEventIds.has(e.id))
    .sort((a, b) => new Date(a.date_marche).getTime() - new Date(b.date_marche).getTime());

  const discoverEvents = upcomingEvents
    .filter(e => !registeredEventIds.has(e.id))
    .sort((a, b) => new Date(a.date_marche).getTime() - new Date(b.date_marche).getTime());

  return (
    <div className="space-y-6">
      {/* Section 1 — Mes aventures à venir */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground mb-0.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-300" />
            Mes aventures à venir
          </h2>
          <p className="text-muted-foreground text-[11px]">
            Les marches auxquelles vous êtes inscrit
          </p>
        </div>

        {myEvents.length === 0 ? (
          <div className="bg-card border border-border dark:bg-white/5 dark:border-white/10 rounded-xl p-5 text-center">
            <p className="text-muted-foreground text-xs">Aucune marche au programme</p>
            <p className="text-muted-foreground/70 text-[10px] mt-1">Explorez les sentiers ci-dessous ↓</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myEvents.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                isRegistered
                index={i}
                registeringId={registeringId}
                onRegister={handleRegister}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 2 — Sentiers à explorer */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground mb-0.5 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
            Sentiers à explorer
          </h2>
          <p className="text-muted-foreground text-[11px]">
            Découvrez les prochaines marches ouvertes
          </p>
        </div>

        {discoverEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 dark:bg-gradient-to-r dark:from-amber-500/15 dark:to-emerald-500/15 rounded-xl border border-amber-200 dark:border-amber-400/30 p-4 text-center"
          >
            <p className="text-foreground text-xs font-medium">✨ Vous êtes inscrit à toutes les marches — bravo !</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">De nouvelles aventures arrivent bientôt</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {discoverEvents.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                isRegistered={false}
                index={i}
                registeringId={registeringId}
                onRegister={handleRegister}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 3 — Empreintes passées */}
      {pastEvents.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-0.5 flex items-center gap-2">
              <Footprints className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              Empreintes passées
            </h2>
            <p className="text-muted-foreground text-[11px]">
              Les sentiers déjà parcourus par la communauté
            </p>
          </div>

          <PastEventsMap events={pastEvents} participantCounts={pastParticipantCounts} />

          {/* Légende de la carte */}
          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mt-1">
            {(['agroecologique', 'eco_poetique', 'eco_tourisme'] as const).map(type => {
              const meta = getMarcheEventTypeMeta(type);
              if (!meta) return null;
              return (
                <span key={type} className="inline-flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: EVENT_TYPE_COLORS[type] }}
                  />
                  {meta.shortLabel}
                </span>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pastEvents.map((event, i) => (
              <PastEventCard
                key={event.id}
                event={event}
                participantCount={pastParticipantCounts[event.id] || 0}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {/* QR compact */}
      <Link to="/marches-du-vivant/explorer">
        <div className="bg-card dark:bg-white/5 backdrop-blur-sm rounded-lg border border-border dark:border-white/10 px-3.5 py-2.5 flex items-center gap-3 hover:bg-accent/50 dark:hover:bg-white/10 transition-colors">
          <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-xs font-medium">Jour J ? Scanner le QR code</p>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-600/50 dark:text-emerald-300/50 flex-shrink-0" />
        </div>
      </Link>
    </div>
  );
};

export default MarchesTab;
