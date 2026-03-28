import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Headphones, BookOpen, Leaf, MapPin, Music, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarcheDetailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  marcheEventId: string;
  eventTitle: string;
  eventDate: string;
  eventLieu: string | null;
}

type TabKey = 'voir' | 'ecouter' | 'lire' | 'vivant';

const tabs: { key: TabKey; label: string; icon: typeof Eye }[] = [
  { key: 'voir', label: 'Voir', icon: Eye },
  { key: 'ecouter', label: 'Écouter', icon: Headphones },
  { key: 'lire', label: 'Lire', icon: BookOpen },
  { key: 'vivant', label: 'Vivant', icon: Leaf },
];

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <p className="text-emerald-200/40 text-xs">{message}</p>
    <p className="text-emerald-200/25 text-[10px] mt-1">Les données seront disponibles après la collecte</p>
  </div>
);

// ─── Voir ───
const VoirTab: React.FC<{ marcheId: string }> = ({ marcheId }) => {
  const { data: photos } = useQuery({
    queryKey: ['marche-detail-photos', marcheId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_photos')
        .select('id, url_supabase, titre, description')
        .eq('marche_id', marcheId)
        .order('ordre')
        .limit(20);
      return data || [];
    },
  });

  if (!photos?.length) return <EmptyState message="Aucune photo pour cette marche" />;

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {photos.map(photo => (
        <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-white/5">
          <img
            src={photo.url_supabase}
            alt={photo.titre || 'Photo de marche'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

// ─── Écouter ───
const EcouterTab: React.FC<{ marcheId: string }> = ({ marcheId }) => {
  const { data: audioFiles } = useQuery({
    queryKey: ['marche-detail-audio', marcheId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_audio')
        .select('id, url_supabase, titre, duree_secondes, type_audio')
        .eq('marche_id', marcheId)
        .order('ordre')
        .limit(20);
      return data || [];
    },
  });

  if (!audioFiles?.length) return <EmptyState message="Aucun enregistrement sonore" />;

  return (
    <div className="space-y-2">
      {audioFiles.map(audio => (
        <div key={audio.id} className="bg-white/5 rounded-lg border border-white/10 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{audio.titre || 'Enregistrement'}</p>
              {audio.duree_secondes && (
                <p className="text-emerald-200/40 text-[10px]">
                  {Math.floor(audio.duree_secondes / 60)}:{String(audio.duree_secondes % 60).padStart(2, '0')}
                </p>
              )}
            </div>
          </div>
          <audio controls className="w-full h-8" preload="none">
            <source src={audio.url_supabase} />
          </audio>
        </div>
      ))}
    </div>
  );
};

// ─── Lire ───
const LireTab: React.FC<{ userId: string; marcheEventId: string }> = ({ userId, marcheEventId }) => {
  const { data: kigos } = useQuery({
    queryKey: ['marche-detail-kigos', marcheEventId, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('kigo_entries')
        .select('id, kigo, haiku, saison, especes_associees')
        .eq('user_id', userId)
        .eq('marche_event_id', marcheEventId);
      return data || [];
    },
  });

  if (!kigos?.length) return <EmptyState message="Aucun kigo ni texte pour cette marche" />;

  return (
    <div className="space-y-3">
      {kigos.map(kigo => (
        <div key={kigo.id} className="bg-gradient-to-br from-amber-500/10 to-emerald-500/5 rounded-xl border border-amber-400/20 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-300 text-lg">🌿</span>
            <span className="text-white font-medium text-sm">{kigo.kigo}</span>
            <span className="text-emerald-300/40 text-[10px] ml-auto">{kigo.saison}</span>
          </div>
          {kigo.haiku && (
            <p className="text-emerald-100/70 text-xs italic whitespace-pre-line pl-4 border-l border-amber-400/20">
              {kigo.haiku}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Vivant ───
const VivantTab: React.FC<{ marcheEventId: string }> = ({ marcheEventId }) => {
  const { data: event } = useQuery({
    queryKey: ['marche-detail-event-biodiv', marcheEventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_events')
        .select('latitude, longitude')
        .eq('id', marcheEventId)
        .single();
      return data;
    },
  });

  const { data: snapshot } = useQuery({
    queryKey: ['marche-detail-biodiv', event?.latitude, event?.longitude],
    queryFn: async () => {
      if (!event?.latitude || !event?.longitude) return null;
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('total_species, birds_count, plants_count, fungi_count, biodiversity_index, species_data')
        .gte('latitude', Number(event.latitude) - 0.01)
        .lte('latitude', Number(event.latitude) + 0.01)
        .gte('longitude', Number(event.longitude) - 0.01)
        .lte('longitude', Number(event.longitude) + 0.01)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!(event?.latitude && event?.longitude),
  });

  if (!snapshot) return <EmptyState message="Aucune donnée de biodiversité" />;

  const stats = [
    { label: 'Espèces totales', value: snapshot.total_species, color: 'text-emerald-400' },
    { label: 'Oiseaux', value: snapshot.birds_count, color: 'text-sky-400' },
    { label: 'Plantes', value: snapshot.plants_count, color: 'text-green-400' },
    { label: 'Champignons', value: snapshot.fungi_count, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-3">
      {snapshot.biodiversity_index != null && (
        <div className="bg-gradient-to-r from-emerald-500/15 to-sky-500/10 rounded-xl border border-emerald-500/20 p-4 text-center">
          <p className="text-emerald-200/50 text-[10px] mb-1">Indice de biodiversité</p>
          <p className="text-emerald-300 text-2xl font-bold">{Number(snapshot.biodiversity_index).toFixed(1)}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(s => (
          <div key={s.label} className="bg-white/5 rounded-lg border border-white/10 p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-emerald-200/40 text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Step Selector ───
interface StepSelectorProps {
  marches: { id: string; nom_marche: string | null; ville: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

const StepSelector: React.FC<StepSelectorProps> = ({ marches, activeIndex, onSelect }) => {
  const current = marches[activeIndex];
  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-amber-500/5 rounded-xl border border-emerald-400/15 p-3 mx-1">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onSelect(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-20 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-300" />
        </button>

        <div className="text-center flex-1 min-w-0 px-2">
          <p className="text-emerald-300/60 text-[10px] font-medium">
            Étape {activeIndex + 1}/{marches.length}
          </p>
          <p className="text-white text-sm font-medium truncate">
            🌿 {current.nom_marche || current.ville}
          </p>
        </div>

        <button
          onClick={() => onSelect(activeIndex + 1)}
          disabled={activeIndex === marches.length - 1}
          className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-20 hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-emerald-300" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {marches.map((_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === activeIndex ? 'bg-emerald-400 scale-125' : 'bg-white/20 hover:bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Main Modal ───
const MarcheDetailModal: React.FC<MarcheDetailModalProps> = ({
  open, onClose, userId, marcheEventId, eventTitle, eventDate, eventLieu,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('voir');
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Load exploration marches linked to this event
  const { data: explorationMarches } = useQuery({
    queryKey: ['marche-detail-steps', marcheEventId],
    queryFn: async () => {
      // Get exploration_id from the event
      const { data: event } = await supabase
        .from('marche_events')
        .select('exploration_id')
        .eq('id', marcheEventId)
        .single();

      if (!event?.exploration_id) return [];

      // Get all marches linked to this exploration
      const { data: links } = await supabase
        .from('exploration_marches')
        .select('marche_id, ordre')
        .eq('exploration_id', event.exploration_id)
        .order('ordre');

      if (!links?.length) return [];

      // Get marche details
      const { data: marches } = await supabase
        .from('marches')
        .select('id, nom_marche, ville')
        .in('id', links.map(l => l.marche_id));

      if (!marches?.length) return [];

      // Sort by the exploration_marches ordre
      const ordreMap = new Map(links.map(l => [l.marche_id, l.ordre ?? 0]));
      return marches.sort((a, b) => (ordreMap.get(a.id) ?? 0) - (ordreMap.get(b.id) ?? 0));
    },
    enabled: open,
  });

  const hasMultipleSteps = (explorationMarches?.length ?? 0) > 1;
  const activeMarcheId = explorationMarches?.[activeStepIndex]?.id;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0a1a0f] border-emerald-500/20 max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="p-4 pb-2 space-y-1">
          <DialogHeader>
            <DialogTitle className="text-white text-base font-semibold">{eventTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-emerald-300/60 text-[11px]">
            {eventDate && <span>{format(new Date(eventDate), 'dd MMMM yyyy', { locale: fr })}</span>}
            {eventLieu && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />{eventLieu}
              </span>
            )}
          </div>
        </div>

        {/* Step Selector — only if multiple marches */}
        {hasMultipleSteps && explorationMarches && (
          <div className="px-3 pb-2">
            <StepSelector
              marches={explorationMarches}
              activeIndex={activeStepIndex}
              onSelect={(i) => setActiveStepIndex(i)}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors relative ${
                  isActive ? 'text-emerald-300' : 'text-emerald-200/40 hover:text-emerald-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${activeMarcheId || marcheEventId}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'voir' && <VoirTab marcheId={activeMarcheId || ''} />}
              {activeTab === 'ecouter' && <EcouterTab marcheId={activeMarcheId || ''} />}
              {activeTab === 'lire' && <LireTab userId={userId} marcheEventId={marcheEventId} />}
              {activeTab === 'vivant' && <VivantTab marcheEventId={marcheEventId} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarcheDetailModal;
