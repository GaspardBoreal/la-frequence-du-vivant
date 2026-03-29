import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, CheckCircle2, Clock, QrCode, Leaf, Music, PenLine, ChevronRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { stripHtml } from '@/utils/textUtils';

interface MarcheEvent {
  id: string;
  title: string;
  description: string | null;
  date_marche: string;
  lieu: string | null;
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
}

const getCountdown = (dateStr: string) => {
  const days = differenceInCalendarDays(new Date(dateStr), new Date());
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days < 7) return `${days} j`;
  if (days < 30) return `${Math.ceil(days / 7)} sem.`;
  return `${Math.ceil(days / 30)} mois`;
};

const detectPillars = (title: string, desc: string | null) => {
  const text = `${title} ${desc || ''}`.toLowerCase();
  const pillars: { icon: typeof Leaf; label: string; color: string }[] = [];

  if (/biodiversit|espèce|faune|flore|vivant|arbre|sol|terre|transhumance|berger|mouton|oiseaux|insecte/.test(text))
    pillars.push({ icon: Leaf, label: 'Biodiversité', color: 'text-emerald-600 dark:text-emerald-400' });
  if (/bioacoustique|son|écoute|acoustique|chant|audio|sonore|fréquence|silence/.test(text))
    pillars.push({ icon: Music, label: 'Bioacoustique', color: 'text-sky-600 dark:text-sky-400' });
  if (/géopoétique|poé|récit|narrat|territoire|paysage|marche|sentier|chemin|gardien/.test(text))
    pillars.push({ icon: PenLine, label: 'Géopoétique', color: 'text-amber-600 dark:text-amber-400' });

  if (pillars.length === 0) pillars.push({ icon: Leaf, label: 'Biodiversité', color: 'text-emerald-600 dark:text-emerald-400' });
  return pillars;
};

const EventCard: React.FC<{
  event: MarcheEvent;
  isRegistered: boolean;
  index: number;
  registeringId: string | null;
  onRegister: (id: string) => void;
}> = ({ event, isRegistered, index, registeringId, onRegister }) => {
  const pillars = detectPillars(event.title, event.description);
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

        <div className="flex flex-wrap gap-1.5">
          {pillars.map((p, j) => (
            <span key={j} className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-white/5 ${p.color}`}>
              <p.icon className="w-3 h-3" />
              {p.label}
            </span>
          ))}
        </div>

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

const MarchesTab: React.FC<MarchesTabProps> = ({ userId, upcomingEvents, participations, registeredEventIds }) => {
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
