import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, CheckCircle2, Clock, QrCode, Calendar, Leaf, Music, PenLine, ChevronRight } from 'lucide-react';
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

/** Detect thematic pillars from title + description keywords */
const detectPillars = (title: string, desc: string | null) => {
  const text = `${title} ${desc || ''}`.toLowerCase();
  const pillars: { icon: typeof Leaf; label: string; color: string }[] = [];

  if (/biodiversit|espèce|faune|flore|vivant|arbre|sol|terre|transhumance|berger|mouton|oiseaux|insecte/.test(text))
    pillars.push({ icon: Leaf, label: 'Biodiversité', color: 'text-emerald-400' });
  if (/bioacoustique|son|écoute|acoustique|chant|audio|sonore|fréquence|silence/.test(text))
    pillars.push({ icon: Music, label: 'Bioacoustique', color: 'text-sky-400' });
  if (/géopoétique|poé|récit|narrat|territoire|paysage|marche|sentier|chemin|gardien/.test(text))
    pillars.push({ icon: PenLine, label: 'Géopoétique', color: 'text-amber-400' });

  // Always show at least biodiversity
  if (pillars.length === 0) pillars.push({ icon: Leaf, label: 'Biodiversité', color: 'text-emerald-400' });
  return pillars;
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

  // Sort: registered first, then by date
  const sortedEvents = [...upcomingEvents].sort((a, b) => {
    const aReg = registeredEventIds.has(a.id) ? 0 : 1;
    const bReg = registeredEventIds.has(b.id) ? 0 : 1;
    if (aReg !== bReg) return aReg - bReg;
    return new Date(a.date_marche).getTime() - new Date(b.date_marche).getTime();
  });

  const allRegistered = upcomingEvents.length > 0 && upcomingEvents.every(e => registeredEventIds.has(e.id));

  return (
    <div className="space-y-5">
      {/* Section titre */}
      <div>
        <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          Votre prochaine aventure
        </h2>
        <p className="text-emerald-200/50 text-[11px]">
          Chaque marche est une exploration unique du vivant
        </p>
      </div>

      {/* Message motivant si toutes inscrites */}
      {allRegistered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-500/15 to-emerald-500/15 rounded-xl border border-amber-400/30 p-3.5 text-center"
        >
          <p className="text-white/90 text-xs font-medium">✨ Vous êtes prêt pour l'aventure !</p>
          <p className="text-emerald-200/60 text-[10px] mt-0.5">Toutes les marches à venir sont dans votre carnet</p>
        </motion.div>
      )}

      {/* Event cards */}
      {upcomingEvents.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
          <p className="text-emerald-200/50 text-sm">Les prochaines marches se préparent…</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event, i) => {
            const isRegistered = registeredEventIds.has(event.id);
            const pillars = detectPillars(event.title, event.description);
            const descText = event.description ? stripHtml(event.description) : null;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`rounded-xl overflow-hidden transition-all ${
                  isRegistered
                    ? 'bg-emerald-500/10 border border-amber-400/30 shadow-[0_0_20px_-6px_rgba(251,191,36,0.12)]'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="p-3.5 space-y-2">
                  {/* Header: title + countdown */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white text-sm font-semibold leading-snug flex-1">{event.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                      isRegistered ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {getCountdown(event.date_marche)}
                    </span>
                  </div>

                  {/* Description teaser */}
                  {descText && (
                    <p className="text-emerald-100/60 text-xs leading-relaxed line-clamp-2">
                      {descText}
                    </p>
                  )}

                  {/* Date + lieu + exploration */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-emerald-300/70 text-[11px]">
                      {format(new Date(event.date_marche), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    {event.lieu && (
                      <span className="text-emerald-200/40 text-[11px] flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />{event.lieu}
                      </span>
                    )}
                    {event.explorations?.name && (
                      <span className="text-sky-300/60 text-[10px]">• {event.explorations.name}</span>
                    )}
                  </div>

                  {/* Pillar tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {pillars.map((p, j) => (
                      <span key={j} className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 ${p.color}`}>
                        <p.icon className="w-3 h-3" />
                        {p.label}
                      </span>
                    ))}
                  </div>

                  {/* CTA or status */}
                  {isRegistered ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs bg-emerald-500/10 rounded-full px-2.5 py-1 w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="font-medium">Inscrit</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleRegister(event.id)}
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
          })}
        </div>
      )}

      {/* QR compact - Jour J */}
      <Link to="/marches-du-vivant/explorer">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 px-3.5 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors">
          <QrCode className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-medium">Jour J ? Scanner le QR code</p>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-300/50 flex-shrink-0" />
        </div>
      </Link>

      {/* Historique */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-emerald-300/70" />
          Historique ({participations.length})
        </h2>
        {participations.length === 0 ? (
          <div className="bg-white/5 rounded-lg border border-white/10 p-4 text-center">
            <p className="text-emerald-200/50 text-xs">Aucune participation encore</p>
          </div>
        ) : (
          <div className="space-y-1">
            {participations.map((p) => (
              <div key={p.id} className="bg-white/5 rounded-lg border border-white/10 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {p.validated_at ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-[11px] font-medium truncate">{p.marche_events?.title || 'Marche'}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-200/40">
                      {p.marche_events?.date_marche && (
                        <span>{format(new Date(p.marche_events.date_marche), 'dd MMM yy', { locale: fr })}</span>
                      )}
                      {p.marche_events?.lieu && (
                        <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{p.marche_events.lieu}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  p.validated_at ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {p.validated_at ? 'Validée' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarchesTab;
