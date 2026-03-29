import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Book, MapPin, Camera, Music, PenLine, Leaf, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMarcheCollectedData, MarcheCollectedSummary } from '@/hooks/useMarcheCollectedData';

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

const CountBadge: React.FC<{ icon: typeof Camera; count: number; label: string; color: string; lightColor: string }> = ({ icon: Icon, count, label, color, lightColor }) => (
  <div className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 ${count === 0 ? 'opacity-30' : ''}`}>
    <Icon className={`w-3.5 h-3.5 ${lightColor} dark:${color}`} />
    <span className="text-foreground text-xs font-semibold">{count}</span>
    <span className="text-muted-foreground text-[9px]">{label}</span>
  </div>
);

const MarcheCard: React.FC<{
  participation: Participation;
  summary: MarcheCollectedSummary | undefined;
  index: number;
  onOpen: () => void;
}> = ({ participation, summary, index, onOpen }) => {
  const event = participation.marche_events;
  if (!event) return null;

  const date = new Date(event.date_marche);
  const hasData = summary && (summary.kigo_count > 0 || summary.photos_count > 0 || summary.audio_count > 0 || summary.species_count > 0);

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onOpen}
      className="w-full text-left relative"
    >
      {/* Timeline connector dot */}
      <div className="absolute -left-[21px] top-3 w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-500/60 border-2 border-white dark:border-emerald-900 z-10" />

      <div className={`rounded-xl border transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-emerald-500/5 ${
        participation.validated_at 
          ? 'bg-emerald-50 border-emerald-200 dark:bg-gradient-to-br dark:from-emerald-500/10 dark:to-amber-500/5 dark:border-emerald-500/20' 
          : 'bg-card border-border dark:bg-white/5 dark:border-white/10'
      }`}>
        <div className="p-3 space-y-2">
          {/* Header: lieu + date */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-foreground text-sm font-medium truncate">
                {event.lieu || event.title}
              </span>
            </div>
            <span className="text-emerald-700 dark:text-emerald-300/60 text-[11px] flex-shrink-0">
              {format(date, 'dd MMM', { locale: fr })}
            </span>
          </div>

          {event.lieu && event.lieu !== event.title && (
            <p className="text-muted-foreground text-[11px] truncate pl-5">{event.title}</p>
          )}

          {/* Data badges */}
          {summary && (
            <div className="flex gap-1.5">
              <CountBadge icon={Camera} count={summary.photos_count} label="Photos" color="text-sky-400" lightColor="text-sky-600" />
              <CountBadge icon={Music} count={summary.audio_count} label="Sons" color="text-violet-400" lightColor="text-violet-600" />
              <CountBadge icon={PenLine} count={summary.textes_count} label="Textes" color="text-amber-400" lightColor="text-amber-600" />
            </div>
          )}

          {/* Biodiversity + Kigo line */}
          {(summary?.species_count || summary?.kigo_text) && (
            <div className="flex items-center gap-2 text-[11px]">
              {summary.species_count > 0 && (
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300/70">
                  <Leaf className="w-3 h-3" />
                  {summary.species_count} espèces
                </span>
              )}
              {summary.kigo_text && (
                <span className="text-amber-600 dark:text-amber-300/60 italic">
                  « {summary.kigo_text} »
                </span>
              )}
            </div>
          )}

          {!hasData && (
            <p className="text-muted-foreground/60 text-[10px] italic pl-5">
              Données en attente de collecte
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
};

const CarnetVivant: React.FC<CarnetVivantProps> = ({ userId, participations }) => {
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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
      // Initialize: if nothing was explicitly toggled, add all except current
      if (prev.size === 0) {
        if (key === seasonKeys[0]) return next; // already open, close it
        next.add(key);
        return next;
      }
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedParticipation = participations.find(p => p.marche_event_id === selectedEventId);

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
                    {items.map((p, i) => (
                      <MarcheCard
                        key={p.id}
                        participation={p}
                        summary={collectedData?.[p.marche_event_id]}
                        index={i}
                        onOpen={() => setSelectedEventId(p.marche_event_id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedEventId && selectedParticipation && (
        <MarcheDetailModal
          open={!!selectedEventId}
          onClose={() => setSelectedEventId(null)}
          userId={userId}
          marcheEventId={selectedEventId}
          eventTitle={selectedParticipation.marche_events?.title || 'Marche'}
          eventDate={selectedParticipation.marche_events?.date_marche || ''}
          eventLieu={selectedParticipation.marche_events?.lieu || null}
        />
      )}
    </div>
  );
};

export default CarnetVivant;
