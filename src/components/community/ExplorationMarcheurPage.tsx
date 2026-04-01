import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, MapPin, Footprints, Users, Map, MessageCircle, ChevronLeft, ChevronRight, Eye, Headphones, BookOpen, Leaf, TreePine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createSlug } from '@/utils/slugGenerator';
import { useMarcheurStats } from '@/hooks/useMarcheurContributions';
import MediaSkeletonGrid from './contributions/MediaSkeletonGrid';
import MarcheursTab from './exploration/MarcheursTab';
import ExplorationCarteTab from './exploration/ExplorationCarteTab';

// Import tab components from MarcheDetailModal
import { VoirTab, EcouterTab, LireTab, VivantTab, StepSelector } from './MarcheDetailModal';

type GlobalTab = 'marches' | 'marcheurs' | 'carte' | 'messages';
type SensoryTab = 'voir' | 'ecouter' | 'lire' | 'vivant';

const globalTabs: { key: GlobalTab; label: string; icon: typeof Footprints }[] = [
  { key: 'carte', label: 'Carte', icon: Map },
  { key: 'marches', label: 'Marches', icon: Footprints },
  { key: 'marcheurs', label: 'Marcheurs', icon: Users },
  { key: 'messages', label: 'Messages', icon: MessageCircle },
];

const sensoryTabs: { key: SensoryTab; label: string; icon: typeof Eye }[] = [
  { key: 'voir', label: 'Voir', icon: Eye },
  { key: 'ecouter', label: 'Écouter', icon: Headphones },
  { key: 'lire', label: 'Lire', icon: BookOpen },
  { key: 'vivant', label: 'Vivant', icon: Leaf },
];

const ComingSoonPlaceholder: React.FC<{ icon: typeof Users; title: string; description: string }> = ({ icon: Icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-emerald-500/15 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-emerald-400/60" />
    </div>
    <h3 className="text-foreground text-sm font-semibold mb-1">{title}</h3>
    <p className="text-muted-foreground text-xs max-w-xs">{description}</p>
    <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
      <span className="text-emerald-500 dark:text-emerald-400 text-[10px] font-medium">Bientôt disponible</span>
    </div>
  </motion.div>
);

const ExplorationMarcheurPage: React.FC = () => {
  const { explorationId: rawParam } = useParams<{ explorationId: string }>();
  const navigate = useNavigate();
  const [activeGlobalTab, setActiveGlobalTab] = useState<GlobalTab>('carte');
  const [activeSensoryTab, setActiveSensoryTab] = useState<SensoryTab>('voir');
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Detect if param is an event-based fallback (event-{uuid}) or a real exploration ID
  const isEventFallback = rawParam?.startsWith('event-');
  const directMarcheEventId = isEventFallback ? rawParam.replace('event-', '') : null;
  const explorationId = isEventFallback ? null : rawParam;

  // Get current user
  const { data: session } = useQuery({
    queryKey: ['session-exploration'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });
  const userId = session?.user?.id;

  // Resolve exploration_id from marche_event if needed
  const { data: resolvedExplorationId } = useQuery({
    queryKey: ['resolve-exploration', directMarcheEventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_events')
        .select('exploration_id')
        .eq('id', directMarcheEventId!)
        .single();
      return data?.exploration_id || null;
    },
    enabled: !!directMarcheEventId,
  });

  const effectiveExplorationId = explorationId || resolvedExplorationId;

  // Fetch exploration details
  const { data: exploration, isLoading: isLoadingExploration } = useQuery({
    queryKey: ['exploration-marcheur', effectiveExplorationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('explorations')
        .select('id, name, description, slug')
        .eq('id', effectiveExplorationId!)
        .single();
      return data;
    },
    enabled: !!effectiveExplorationId,
  });

  // Fetch marche_events for this exploration (or use direct event)
  const { data: marcheEvent } = useQuery({
    queryKey: ['exploration-marche-event', effectiveExplorationId, directMarcheEventId],
    queryFn: async () => {
      if (directMarcheEventId) {
        const { data } = await supabase
          .from('marche_events')
          .select('id, title, date_marche, lieu')
          .eq('id', directMarcheEventId)
          .single();
        return data;
      }
      const { data } = await supabase
        .from('marche_events')
        .select('id, title, date_marche, lieu')
        .eq('exploration_id', effectiveExplorationId!)
        .order('date_marche', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!effectiveExplorationId || !!directMarcheEventId,
  });

  // Fetch exploration marches (steps)
  const { data: explorationMarches } = useQuery({
    queryKey: ['exploration-marcheur-steps', effectiveExplorationId],
    queryFn: async () => {
      const { data: links } = await supabase
        .from('exploration_marches')
        .select('marche_id, ordre')
        .eq('exploration_id', effectiveExplorationId!)
        .order('ordre');
      if (!links?.length) return [];
      const { data: marches } = await supabase
        .from('marches')
        .select('id, nom_marche, ville, latitude, longitude')
        .in('id', links.map(l => l.marche_id))
        .returns<{ id: string; nom_marche: string | null; ville: string; latitude: number | null; longitude: number | null }[]>();
      if (!marches?.length) return [];
      const ordreMap: Record<string, number> = {};
      links.forEach(l => { ordreMap[l.marche_id] = l.ordre ?? 0; });
      return marches.sort((a, b) => (ordreMap[a.id] ?? 0) - (ordreMap[b.id] ?? 0));
    },
    enabled: !!effectiveExplorationId,
  });

  const hasMultipleSteps = (explorationMarches?.length ?? 0) > 1;
  const activeMarcheId = explorationMarches?.[activeStepIndex]?.id;
  const activeMarche = explorationMarches?.[activeStepIndex];
  const activeMarcheSlug = activeMarche ? createSlug(activeMarche.nom_marche || activeMarche.ville, activeMarche.ville) : undefined;
  const marcheEventId = marcheEvent?.id || '';

  // Stats for badge indicators
  const { data: stats } = useMarcheurStats(marcheEventId, userId || '', activeMarcheId);

  const tabCounts: Record<SensoryTab, number> = {
    voir: stats?.totalMedias || 0,
    ecouter: stats?.totalAudio || 0,
    lire: stats?.totalTextes || 0,
    vivant: 0,
  };

  if (!rawParam) {
    navigate('/marches-du-vivant/mon-espace');
    return null;
  }

  // Loading state
  if (isLoadingExploration) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-32" />
            <MediaSkeletonGrid count={6} mode="immersion" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/marches-du-vivant/mon-espace')}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-foreground text-sm font-semibold truncate">
                {exploration?.name || marcheEvent?.title || 'Exploration'}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                {marcheEvent?.date_marche && (
                  <span>{format(new Date(marcheEvent.date_marche), 'dd MMMM yyyy', { locale: fr })}</span>
                )}
                {marcheEvent?.lieu && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {marcheEvent.lieu}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Tabs */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex border-b border-border -mb-px">
            {globalTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeGlobalTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveGlobalTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors relative ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="global-tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {activeGlobalTab === 'marches' && (
            <motion.div
              key="marches"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Step Selector */}
              {hasMultipleSteps && explorationMarches && (
                <div className="mb-4">
                  <StepSelector
                    marches={explorationMarches}
                    activeIndex={activeStepIndex}
                    onSelect={setActiveStepIndex}
                  />
                </div>
              )}

              {/* Sensory Tabs */}
              <div className="flex border-b border-border dark:border-white/10 mb-4">
                {sensoryTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeSensoryTab === tab.key;
                  const count = tabCounts[tab.key];
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveSensoryTab(tab.key)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors relative ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-300'
                          : 'text-muted-foreground dark:text-emerald-200/40 hover:text-foreground dark:hover:text-emerald-200/60'
                      }`}
                    >
                      <div className="relative">
                        <Icon className="w-4 h-4" />
                        {count > 0 && (
                          <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                            {count}
                          </span>
                        )}
                      </div>
                      {tab.label}
                      {isActive && (
                        <motion.div
                          layoutId="sensory-tab-indicator"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeSensoryTab}-${activeMarcheId || marcheEventId}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {!userId ? (
                    <div className="text-center py-8 text-white/40 text-sm">
                      Connectez-vous pour voir et gérer vos contributions.
                    </div>
                  ) : (
                    <>
                      {activeSensoryTab === 'voir' && (
                        <VoirTab marcheId={activeMarcheId || ''} userId={userId} marcheEventId={marcheEventId} activeMarcheId={activeMarcheId} />
                      )}
                      {activeSensoryTab === 'ecouter' && (
                        <EcouterTab marcheId={activeMarcheId || ''} userId={userId} marcheEventId={marcheEventId} activeMarcheId={activeMarcheId} />
                      )}
                      {activeSensoryTab === 'lire' && (
                        <LireTab userId={userId} marcheEventId={marcheEventId} activeMarcheId={activeMarcheId} />
                      )}
                      {activeSensoryTab === 'vivant' && (
                        <VivantTab marcheId={activeMarcheId || ''} userId={userId} marcheSlug={activeMarcheSlug} />
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {activeGlobalTab === 'marcheurs' && (
            <motion.div key="marcheurs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MarcheursTab
                explorationId={effectiveExplorationId || undefined}
                marcheEventId={marcheEventId || undefined}
                explorationName={exploration?.name}
              />
            </motion.div>
          )}

          {activeGlobalTab === 'carte' && (
            <motion.div key="carte" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ExplorationCarteTab
                explorationId={effectiveExplorationId || undefined}
                marches={(explorationMarches || []).map((m, i) => ({
                  id: m.id,
                  nom_marche: m.nom_marche,
                  ville: m.ville,
                  latitude: m.latitude,
                  longitude: m.longitude,
                  ordre: i,
                }))}
                onSelectStep={(index) => {
                  setActiveStepIndex(index);
                  setActiveGlobalTab('marches');
                }}
              />
            </motion.div>
          )}

          {activeGlobalTab === 'messages' && (
            <ComingSoonPlaceholder
              key="messages"
              icon={MessageCircle}
              title="Messages partagés"
              description="Échangez notes, commentaires et impressions avec les autres marcheurs de cette exploration."
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExplorationMarcheurPage;
