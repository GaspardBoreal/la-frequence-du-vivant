import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, CheckCircle2, Clock, QrCode, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface MarcheEvent {
  id: string;
  title: string;
  description: string | null;
  date_marche: string;
  lieu: string | null;
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
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';
  if (diffDays < 7) return `Dans ${diffDays} jours`;
  if (diffDays < 30) return `Dans ${Math.ceil(diffDays / 7)} sem.`;
  return `Dans ${Math.ceil(diffDays / 30)} mois`;
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

  return (
    <div className="space-y-6">
      {/* QR CTA */}
      <Link to="/marches-du-vivant/explorer">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 flex items-center gap-4 hover:bg-white/15 transition-colors">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <QrCode className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Valider une participation</p>
            <p className="text-emerald-200/50 text-xs">Scannez le QR code sur le lieu de la marche</p>
          </div>
        </div>
      </Link>

      {/* Upcoming */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          Prochaines marches
        </h2>
        {upcomingEvents.length === 0 ? (
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
            <p className="text-emerald-200/50 text-sm">Les prochaines marches se préparent…</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {[...upcomingEvents]
              .sort((a, b) => (registeredEventIds.has(a.id) ? 0 : 1) - (registeredEventIds.has(b.id) ? 0 : 1))
              .map((event, i) => {
                const isRegistered = registeredEventIds.has(event.id);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`rounded-xl p-3.5 space-y-2.5 transition-all ${
                      isRegistered
                        ? 'bg-emerald-500/15 border border-emerald-400/40 shadow-[0_0_12px_-4px_rgba(52,211,153,0.15)]'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium leading-snug">{event.title}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                          <span className="text-emerald-300/70 text-xs">
                            {format(new Date(event.date_marche), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          {event.lieu && (
                            <span className="text-emerald-200/40 text-xs flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />{event.lieu}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 flex-shrink-0">
                        {getCountdown(event.date_marche)}
                      </span>
                    </div>
                    {isRegistered ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs bg-emerald-500/15 rounded-full px-2.5 py-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-medium">Inscrit</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleRegister(event.id)}
                        disabled={registeringId === event.id}
                        className="w-full bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs rounded-lg h-8"
                      >
                        {registeringId === event.id ? 'Inscription...' : "S'inscrire"}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-300" />
          Historique
        </h2>
        {participations.length === 0 ? (
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
            <p className="text-emerald-200/50 text-sm">Aucune participation encore</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {participations.map((p) => (
              <div key={p.id} className="bg-white/5 rounded-lg border border-white/10 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {p.validated_at ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                    <div className="min-w-0">
                    <p className="text-white text-xs font-medium truncate">{p.marche_events?.title || 'Marche'}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-200/40">
                      {p.marche_events?.date_marche && (
                        <span>{format(new Date(p.marche_events.date_marche), 'dd MMM yy', { locale: fr })}</span>
                      )}
                      {p.marche_events?.lieu && (
                        <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{p.marche_events.lieu}</span>
                      )}
                      {p.marche_events?.explorations?.name && (
                        <span className="text-sky-300/60">• {p.marche_events.explorations.name}</span>
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
