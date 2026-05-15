import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MailOpen, MapPin, ChevronRight, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { stripHtml } from '@/utils/textUtils';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { InvitedEventRow } from '@/hooks/useCommunityInvitedEvents';

interface Props {
  userId: string;
  invitation: InvitedEventRow;
  index: number;
}

const countdown = (dateStr: string) => {
  const days = differenceInCalendarDays(new Date(dateStr), new Date());
  if (days < 0) return 'passée';
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'demain';
  if (days < 7) return `dans ${days} jours`;
  if (days < 30) return `dans ${Math.ceil(days / 7)} sem.`;
  return `dans ${Math.ceil(days / 30)} mois`;
};

const InvitedEventCard: React.FC<Props> = ({ userId, invitation, index }) => {
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState(false);
  const event = invitation.event;
  const typeMeta = getMarcheEventTypeMeta(event.event_type);
  const descText = event.description ? stripHtml(event.description) : null;
  const inviterPrenom = invitation.invited_by_prenom;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { error } = await supabase
        .from('marche_participations')
        .insert({ user_id: userId, marche_event_id: event.id });
      if (error && error.code !== '23505') throw error;
      toast.success('Invitation acceptée — à bientôt sur le sentier 🌿');
      queryClient.invalidateQueries({ queryKey: ['community-participations'] });
      queryClient.invalidateQueries({ queryKey: ['community-invited-events'] });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'acceptation");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.07 }}
      className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50/60 to-transparent shadow-[0_0_24px_-12px_hsl(45_90%_55%/0.4)] dark:border-amber-400/30 dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent dark:shadow-[0_0_28px_-10px_hsl(45_90%_55%/0.35)]"
    >
      {/* Shimmer band */}
      <motion.div
        initial={{ x: '-120%' }}
        animate={{ x: '160%' }}
        transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.4 + index * 0.07 }}
        className="pointer-events-none absolute inset-y-0 -inset-x-1/3 bg-gradient-to-r from-transparent via-amber-300/25 to-transparent dark:via-amber-300/20"
      />

      {/* Ribbon */}
      <div className="flex items-center gap-1.5 bg-amber-100/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
        <MailOpen className="h-3 w-3" />
        Invitation personnelle
      </div>

      <div className="space-y-2 p-3.5">
        <p className="text-sm font-semibold leading-snug text-foreground">{event.title}</p>

        {inviterPrenom && (
          <p className="flex items-center gap-1.5 text-[12px] italic text-amber-700 dark:text-amber-200/85">
            <Sparkles className="h-3 w-3" />
            {inviterPrenom} vous a invité·e à cheminer sur ce sentier
          </p>
        )}

        {descText && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{descText}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[11px] text-amber-700 dark:text-amber-200/80">
            {format(new Date(event.date_marche), 'dd MMM yyyy', { locale: fr })}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {countdown(event.date_marche)}
          </span>
          {event.lieu && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {event.lieu}
            </span>
          )}
        </div>

        {typeMeta && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${typeMeta.badgeClassName}`}>
            <typeMeta.icon className="h-3 w-3" />
            {typeMeta.label}
          </span>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={accepting}
            className="h-8 flex-1 gap-1 rounded-lg bg-amber-600 text-xs text-white hover:bg-amber-500 dark:bg-amber-500/90 dark:hover:bg-amber-400"
          >
            {accepting ? 'Acceptation…' : (
              <>Accepter et m'inscrire <ChevronRight className="h-3.5 w-3.5" /></>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default InvitedEventCard;
