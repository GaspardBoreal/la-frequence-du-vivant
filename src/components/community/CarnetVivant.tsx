import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, MapPin, Camera, Music, PenLine, Leaf, ChevronDown, ChevronUp, UserMinus } from 'lucide-react';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMarcheCollectedData, MarcheCollectedSummary } from '@/hooks/useMarcheCollectedData';
import { supabase } from '@/integrations/supabase/client';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
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
    exploration_id?: string | null;
    event_type?: string | null;
    explorations?: { name: string } | null;
  } | null;
}

interface CarnetVivantProps {
  userId: string;
  participations: Participation[];
}

type SeasonKey = string; // e.g. "Printemps 2026"

const getSeason = (date: Date): string => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Printemps';
  if (month >= 5 && month <= 7) return 'Été';
  if (month >= 8 && month <= 10) return 'Automne';
  return 'Hiver';
};

const getSeasonEmoji = (season: string): string => {
  if (season.startsWith('Printemps')) return '🌱';
  if (season.startsWith('Été')) return '☀️';
  if (season.startsWith('Automne')) return '🍂';
  return '❄️';
};

const getSeasonYear = (date: Date): string => {
  const season = getSeason(date);
  const year = date.getFullYear();
  if (season === 'Hiver' && date.getMonth() === 0) {
    return `Hiver ${year - 1}-${String(year).slice(2)}`;
  }
  if (season === 'Hiver') {
    return `Hiver ${year}-${String(year + 1).slice(2)}`;
  }
  return `${season} ${year}`;
};


const MarcheCard: React.FC<{
  participation: Participation;
  summary: MarcheCollectedSummary | undefined;
  index: number;
  onOpen: () => void;
  onUnregister?: (participationId: string) => void;
}> = ({ participation, summary, index, onOpen, onUnregister }) => {
  const event = participation.marche_events;
  if (!event) return null;

  const date = new Date(event.date_marche);
  const typeMeta = getMarcheEventTypeMeta(event.event_type);
  const hasData = summary && (summary.kigo_count > 0 || summary.photos_count > 0 || summary.audio_count > 0 || summary.species_count > 0);
  const isFuture = new Date(event.date_marche) > new Date();
  const canUnregister = !participation.validated_at && isFuture;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onOpen}
      className="w-full text-left relative"
    >
      {/* Timeline connector dot */}
      <div className="absolute -left-[21px] top-3 w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-500/60 border-2 border-white dark:border-emerald-900 z-10" />

      <div className={`rounded-xl overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-emerald-500/5 ${
        participation.validated_at 
          ? 'bg-emerald-50 border border-emerald-200 shadow-sm dark:bg-emerald-500/10 dark:border-amber-400/30 dark:shadow-[0_0_20px_-6px_rgba(251,191,36,0.12)]' 
          : 'bg-card border border-border dark:bg-white/5 dark:border-white/10'
      }`}>
        <div className="p-3.5 space-y-2">
          {/* Title */}
          <p className="text-foreground text-sm font-semibold leading-snug">{event.title}</p>

          {/* Exploration subtitle */}
          {event.explorations?.name && (
            <p className="text-sky-600 dark:text-sky-300/60 text-[10px]">• {event.explorations.name}</p>
          )}

          {/* Date + lieu */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-emerald-700 dark:text-emerald-300/70 text-[11px]">
              {format(date, 'dd MMM yyyy', { locale: fr })}
            </span>
            {event.lieu && (
              <span className="text-muted-foreground text-[11px] flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />{event.lieu}
              </span>
            )}
          </div>

          {/* Event type badge */}
          {typeMeta && (
            <div className="flex flex-wrap gap-1.5">
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${typeMeta.badgeClassName}`}>
                <typeMeta.icon className="w-3 h-3" />
                {typeMeta.label}
              </span>
            </div>
          )}

          {/* Collected data counters */}
          {summary && hasData && (
            <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
              {summary.photos_count > 0 && (
                <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                  <Camera className="w-3 h-3" />{summary.photos_count}
                </span>
              )}
              {summary.audio_count > 0 && (
                <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                  <Music className="w-3 h-3" />{summary.audio_count}
                </span>
              )}
              {summary.textes_count > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <PenLine className="w-3 h-3" />{summary.textes_count}
                </span>
              )}
              {summary.species_count > 0 && (
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300/70">
                  <Leaf className="w-3 h-3" />{summary.species_count} espèces
                </span>
              )}
            </div>
          )}

          {/* Kigo */}
          {summary?.kigo_text && (
            <p className="text-amber-600 dark:text-amber-300/60 text-[11px] italic">
              « {summary.kigo_text} »
            </p>
          )}

          {!hasData && !canUnregister && (
            <p className="text-muted-foreground/60 text-[10px] italic">
              Données en attente de collecte
            </p>
          )}

          {/* Unregister button */}
          {canUnregister && onUnregister && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnregister(participation.id);
              }}
              className="flex items-center gap-1 text-[10px] text-destructive/70 hover:text-destructive transition-colors mt-1"
            >
              <UserMinus className="w-3 h-3" />
              Se désinscrire
            </button>
          )}
        </div>
      </div>
    </motion.button>
  );
};

const CarnetVivant: React.FC<CarnetVivantProps> = ({ userId, participations }) => {
  const navigate = useNavigate();
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [unregisterTarget, setUnregisterTarget] = useState<string | null>(null);
  const [unregisterLoading, setUnregisterLoading] = useState(false);

  const eventIds = useMemo(
    () => participations.map(p => p.marche_event_id),
    [participations]
  );
  const { data: collectedData } = useMarcheCollectedData(userId, eventIds);

  // Sort by date desc and group by season
  const groupedBySeason = useMemo(() => {
    const sorted = [...participations]
      .filter(p => p.marche_events?.date_marche)
      .sort((a, b) => {
        const dateA = new Date(a.marche_events!.date_marche).getTime();
        const dateB = new Date(b.marche_events!.date_marche).getTime();
        return dateB - dateA;
      });

    const groups = new Map<SeasonKey, Participation[]>();
    for (const p of sorted) {
      const date = new Date(p.marche_events!.date_marche);
      const key = getSeasonYear(date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return groups;
  }, [participations]);

  // Auto-expand first season
  const seasonKeys = [...groupedBySeason.keys()];
  const isExpanded = (key: string) => {
    if (expandedSeasons.size === 0 && key === seasonKeys[0]) return true;
    return expandedSeasons.has(key);
  };

  const toggleSeason = (key: string) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (prev.size === 0) {
        if (key === seasonKeys[0]) return next;
        next.add(key);
        return next;
      }
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleOpenExploration = (participation: Participation) => {
    const explorationId = participation.marche_events?.exploration_id;
    if (explorationId) {
      navigate(`/marches-du-vivant/mon-espace/exploration/${explorationId}`);
    } else {
      navigate(`/marches-du-vivant/mon-espace/exploration/event-${participation.marche_event_id}`);
    }
  };

  const handleUnregister = async () => {
    if (!unregisterTarget) return;
    setUnregisterLoading(true);
    try {
      const { error } = await supabase
        .from('marche_participations')
        .delete()
        .eq('id', unregisterTarget);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['community-participations'] });
      toast.success('Désinscription confirmée. Vous pouvez vous réinscrire à tout moment.');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la désinscription');
    } finally {
      setUnregisterLoading(false);
      setUnregisterTarget(null);
    }
  };

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Book className="w-4 h-4 text-amber-600 dark:text-amber-300" />
        <h2 className="text-sm font-semibold text-foreground">
          Mon carnet vivant
        </h2>
        <span className="text-muted-foreground text-xs">({participations.length})</span>
      </div>

      {participations.length === 0 ? (
        <div className="bg-card border-border dark:bg-white/5 rounded-xl border dark:border-white/10 p-5 text-center">
          <p className="text-muted-foreground text-xs">Vos marches vécues apparaîtront ici</p>
          <p className="text-muted-foreground/60 text-[10px] mt-1">
            Chaque aventure laissera une trace dans votre carnet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {seasonKeys.map((seasonKey) => {
            const items = groupedBySeason.get(seasonKey)!;
            const open = isExpanded(seasonKey);
            const emoji = getSeasonEmoji(seasonKey);

            return (
              <div key={seasonKey}>
                {/* Season header */}
                <button
                  onClick={() => toggleSeason(seasonKey)}
                  className="w-full flex items-center gap-2 py-1.5 px-1 group"
                >
                   <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300 dark:via-emerald-500/20 to-transparent" />
                  <span className="text-emerald-700 dark:text-emerald-300/70 text-[11px] font-medium flex items-center gap-1.5 flex-shrink-0">
                    {emoji} {seasonKey}
                    <span className="text-emerald-500 dark:text-emerald-300/40">({items.length})</span>
                    {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300 dark:via-emerald-500/20 to-transparent" />
                </button>

                {/* Timeline */}
                {open && (
                  <div className="relative ml-4 pl-4 border-l border-emerald-300 dark:border-emerald-500/20 space-y-2 pb-2">
                  <AnimatePresence mode="popLayout">
                    {items.map((p, i) => (
                      <MarcheCard
                        key={p.id}
                        participation={p}
                        summary={collectedData?.[p.marche_event_id]}
                        index={i}
                        onOpen={() => handleOpenExploration(p)}
                        onUnregister={(id) => setUnregisterTarget(id)}
                      />
                    ))}
                  </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!unregisterTarget}
        onOpenChange={(open) => { if (!open) setUnregisterTarget(null); }}
        title="Quitter cette marche ?"
        description="Vous pourrez vous réinscrire plus tard depuis l'onglet Marches."
        onConfirm={handleUnregister}
        loading={unregisterLoading}
        confirmLabel="Se désinscrire"
        loadingLabel="Désinscription..."
      />
    </div>
  );
};

export default CarnetVivant;
