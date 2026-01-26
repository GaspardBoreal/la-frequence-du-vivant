import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Pause, Play, Sparkles, Bird, Feather, Volume2, Leaf, BookOpen } from 'lucide-react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { useRandomExplorationData, RandomBird, RandomSpecies, RandomText, RandomAudio } from '@/hooks/useRandomExplorationData';
import { BirdApparition, FragmentApparition, VoiceApparition, SpeciesApparition, MoralApparition } from './choir';
import DraggableApparition from './choir/DraggableApparition';
import { getApparitionTypeFromTextType } from '@/utils/fableMoralExtractor';

interface DordoniaChoirViewProps {
  sessionKey: string;
  onExit: () => void;
}

type ApparitionType = 'bird' | 'fragment' | 'voice' | 'species' | 'moral';

interface Apparition {
  id: string;
  type: ApparitionType;
  position: { x: number; y: number };
  createdAt: Date;
  ttl: number;
  content: RandomBird | RandomSpecies | RandomText | RandomAudio;
  zIndex: number;
}

// Configuration des timers par type d'apparition
const APPARITION_CONFIG: Record<ApparitionType, { interval: [number, number]; ttl: [number, number] }> = {
  bird: { interval: [25000, 45000], ttl: [30000, 50000] },      // 25-45 sec
  fragment: { interval: [40000, 70000], ttl: [40000, 80000] },  // 40-70 sec
  voice: { interval: [90000, 150000], ttl: [25000, 40000] },    // 90-150 sec
  species: { interval: [35000, 55000], ttl: [35000, 50000] },   // 35-55 sec
  moral: { interval: [60000, 100000], ttl: [50000, 70000] },    // 60-100 sec
};

// Générer une valeur aléatoire dans une plage
const randomInRange = (range: [number, number]) => 
  Math.floor(Math.random() * (range[1] - range[0]) + range[0]);

// Limite maximum d'apparitions visibles
const MAX_VISIBLE_APPARITIONS = 5;

// Zones de positionnement pour répartir les widgets
const POSITION_ZONES = [
  { x: [5, 25], y: [8, 28] },    // Haut gauche
  { x: [30, 50], y: [8, 28] },   // Haut centre
  { x: [5, 25], y: [35, 55] },   // Milieu gauche
  { x: [30, 50], y: [35, 55] },  // Milieu centre
  { x: [15, 40], y: [20, 42] },  // Zone centrale
];

// Générer une position dans la zone la moins occupée
const generatePosition = (existingApparitions: Apparition[]): { x: number; y: number } => {
  // Compter les apparitions par zone
  const zoneCounts = POSITION_ZONES.map((zone, index) => ({
    index,
    count: existingApparitions.filter(a => 
      a.position.x >= zone.x[0] && a.position.x <= zone.x[1] &&
      a.position.y >= zone.y[0] && a.position.y <= zone.y[1]
    ).length
  }));
  
  // Trier par densité et ajouter un peu d'aléatoire
  zoneCounts.sort((a, b) => a.count - b.count);
  
  // Prendre une des deux zones les moins peuplées aléatoirement
  const selectedZoneIndex = zoneCounts[Math.random() < 0.7 ? 0 : Math.min(1, zoneCounts.length - 1)].index;
  const selectedZone = POSITION_ZONES[selectedZoneIndex];
  
  // Position aléatoire dans la zone choisie
  return {
    x: selectedZone.x[0] + Math.random() * (selectedZone.x[1] - selectedZone.x[0]),
    y: selectedZone.y[0] + Math.random() * (selectedZone.y[1] - selectedZone.y[0]),
  };
};

const DordoniaChoirView: React.FC<DordoniaChoirViewProps> = ({ sessionKey, onExit }) => {
  const [apparitions, setApparitions] = useState<Apparition[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({ total: 0, birds: 0, fragments: 0, voices: 0, species: 0, morals: 0 });
  
  const timersRef = useRef<Record<ApparitionType, NodeJS.Timeout | null>>({
    bird: null,
    fragment: null,
    voice: null,
    species: null,
    moral: null,
  });
  
  // Compteur z-index global - base haute et incrément de 10 pour hiérarchie claire
  const zIndexCounter = useRef(1000);
  
  const { fetchRandomBird, fetchRandomSpecies, fetchRandomText, fetchRandomAudio } = useRandomExplorationData();

  // Configurer les capteurs pour souris et tactile
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Handler de fin de drag
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    if (!delta) return;
    
    // Convertir le delta pixels en pourcentage du viewport
    const deltaXPercent = (delta.x / window.innerWidth) * 100;
    const deltaYPercent = (delta.y / window.innerHeight) * 100;
    
    setApparitions(prev => prev.map(a => {
      if (a.id === active.id) {
        // Calculer nouvelle position avec contraintes
        const newX = Math.max(2, Math.min(60, a.position.x + deltaXPercent));
        const newY = Math.max(5, Math.min(70, a.position.y + deltaYPercent));
        return { ...a, position: { x: newX, y: newY } };
      }
      return a;
    }));
    
    // Remonter au premier plan après déplacement
    bringToFront(active.id as string);
  }, []);

  // Supprimer une apparition
  const removeApparition = useCallback((id: string) => {
    setApparitions(prev => prev.filter(a => a.id !== id));
  }, []);

  // Remonter un widget au premier plan
  const bringToFront = useCallback((id: string) => {
    zIndexCounter.current += 10;
    setApparitions(prev => 
      prev.map(a => a.id === id ? { ...a, zIndex: zIndexCounter.current } : a)
    );
  }, []);

  // Ajouter une apparition
  const addApparition = useCallback((type: ApparitionType, content: any) => {
    if (!content) return;
    
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ttl = randomInRange(APPARITION_CONFIG[type].ttl);
    
    // Incrémenter le z-index par 10 pour hiérarchie claire
    zIndexCounter.current += 10;
    const zIndex = zIndexCounter.current;
    
    setApparitions(prev => {
      // Si trop d'apparitions, supprimer la plus ancienne non-pinnée
      let updatedList = [...prev];
      if (updatedList.length >= MAX_VISIBLE_APPARITIONS) {
        // Trouver et supprimer l'apparition la plus ancienne avec le z-index le plus bas
        const sortedByZ = [...updatedList].sort((a, b) => a.zIndex - b.zIndex);
        const toRemove = sortedByZ[0];
        if (toRemove) {
          updatedList = updatedList.filter(a => a.id !== toRemove.id);
        }
      }
      
      const position = generatePosition(updatedList);
      return [...updatedList, { id, type, position, createdAt: new Date(), ttl, content, zIndex }];
    });
    
    setStats(prev => ({ 
      ...prev, 
      total: prev.total + 1,
      [type === 'fragment' || type === 'moral' ? type + 's' : type + 's']: (prev as any)[type + 's'] + 1 
    }));
  }, []);

  // Fetchers par type
  const fetchAndAddBird = useCallback(async () => {
    const bird = await fetchRandomBird();
    if (bird) addApparition('bird', bird);
  }, [fetchRandomBird, addApparition]);

  const fetchAndAddSpecies = useCallback(async () => {
    const species = await fetchRandomSpecies();
    if (species) addApparition('species', species);
  }, [fetchRandomSpecies, addApparition]);

  const fetchAndAddText = useCallback(async () => {
    const text = await fetchRandomText();
    if (text) {
      const textType = getApparitionTypeFromTextType(text.typeTexte);
      addApparition(textType === 'haiku' ? 'fragment' : textType, text);
    }
  }, [fetchRandomText, addApparition]);

  const fetchAndAddAudio = useCallback(async () => {
    const audio = await fetchRandomAudio();
    if (audio) addApparition('voice', audio);
  }, [fetchRandomAudio, addApparition]);

  // Démarrer les timers
  const startTimers = useCallback(() => {
    // Bird timer
    const scheduleBird = () => {
      const delay = randomInRange(APPARITION_CONFIG.bird.interval);
      timersRef.current.bird = setTimeout(() => {
        fetchAndAddBird();
        scheduleBird();
      }, delay);
    };
    
    // Species timer
    const scheduleSpecies = () => {
      const delay = randomInRange(APPARITION_CONFIG.species.interval);
      timersRef.current.species = setTimeout(() => {
        fetchAndAddSpecies();
        scheduleSpecies();
      }, delay);
    };
    
    // Text timer (fragment ou moral)
    const scheduleText = () => {
      const delay = randomInRange(APPARITION_CONFIG.fragment.interval);
      timersRef.current.fragment = setTimeout(() => {
        fetchAndAddText();
        scheduleText();
      }, delay);
    };
    
    // Audio timer
    const scheduleAudio = () => {
      const delay = randomInRange(APPARITION_CONFIG.voice.interval);
      timersRef.current.voice = setTimeout(() => {
        fetchAndAddAudio();
        scheduleAudio();
      }, delay);
    };
    
    // Démarrer avec des délais initiaux variés
    setTimeout(scheduleBird, 2000);
    setTimeout(scheduleSpecies, 5000);
    setTimeout(scheduleText, 8000);
    setTimeout(scheduleAudio, 15000);
  }, [fetchAndAddBird, fetchAndAddSpecies, fetchAndAddText, fetchAndAddAudio]);

  // Arrêter les timers
  const stopTimers = useCallback(() => {
    Object.values(timersRef.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    timersRef.current = { bird: null, fragment: null, voice: null, species: null, moral: null };
  }, []);

  // Gestion pause/play
  useEffect(() => {
    if (isPaused) {
      stopTimers();
    } else {
      startTimers();
    }
    
    return () => stopTimers();
  }, [isPaused, startTimers, stopTimers]);

  // Invoquer manuellement une apparition
  const invokeApparition = useCallback(async (type: ApparitionType) => {
    switch (type) {
      case 'bird':
        await fetchAndAddBird();
        break;
      case 'species':
        await fetchAndAddSpecies();
        break;
      case 'fragment':
      case 'moral':
        await fetchAndAddText();
        break;
      case 'voice':
        await fetchAndAddAudio();
        break;
    }
  }, [fetchAndAddBird, fetchAndAddSpecies, fetchAndAddText, fetchAndAddAudio]);

  // Rendu des apparitions selon leur type
  const renderApparition = (apparition: Apparition) => {
    const commonProps = {
      ttl: apparition.ttl,
      onExpire: () => removeApparition(apparition.id),
      onFocus: () => bringToFront(apparition.id),
    };

    const content = (() => {
      switch (apparition.type) {
        case 'bird':
          return <BirdApparition {...commonProps} bird={apparition.content as RandomBird} />;
        case 'fragment':
          return <FragmentApparition {...commonProps} text={apparition.content as RandomText} />;
        case 'voice':
          return <VoiceApparition {...commonProps} audioData={apparition.content as RandomAudio} />;
        case 'species':
          return <SpeciesApparition {...commonProps} species={apparition.content as RandomSpecies} />;
        case 'moral':
          return <MoralApparition {...commonProps} text={apparition.content as RandomText} />;
        default:
          return null;
      }
    })();

    return (
      <DraggableApparition
        key={apparition.id}
        id={apparition.id}
        position={apparition.position}
        zIndex={apparition.zIndex}
      >
        {content}
      </DraggableApparition>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 text-rose-400">
          <Ghost className="h-5 w-5" />
          <span className="text-sm font-medium">Chœur d'apparitions</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-muted-foreground hover:text-foreground"
          >
            Quitter
          </Button>
        </div>
      </div>

      {/* Zone des apparitions */}
      <div className="flex-1 relative">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <AnimatePresence>
            {apparitions.map(renderApparition)}
          </AnimatePresence>
        </DndContext>

        {/* Message de bienvenue si aucune apparition */}
        {apparitions.length === 0 && !isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-rose-500/10 mb-4 sm:mb-6"
            />
            <div className="text-center space-y-4 sm:space-y-5">
              <p className="text-muted-foreground text-base sm:text-lg md:text-xl font-crimson italic">
                Qui souhaitez-vous invoquer ?
              </p>
              <div className="text-sm sm:text-base text-muted-foreground/70 font-crimson space-y-2 sm:space-y-2.5">
                <p><span className="text-cyan-400">Un oiseau</span> croisé sur la rivière</p>
                <p><span className="text-emerald-400">Une espèce</span> murmurant son nom latin</p>
                <p><span className="text-rose-400">Un fragment</span> de poésie surgissant</p>
                <p><span className="text-amber-400">Une voix</span> chantant depuis les rives</p>
                <p><span className="text-violet-400">Une morale</span> s'échappant d'une fable</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pause overlay */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
          >
            <div className="text-center">
              <p className="text-lg text-foreground/60 mb-4">Contemplation en cours</p>
              <Button
                variant="outline"
                onClick={() => setIsPaused(false)}
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              >
                <Play className="h-4 w-4 mr-2" />
                Reprendre le flux
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer avec stats et boutons d'invocation */}
      <div className="p-4 border-t border-border/30 bg-background/80 backdrop-blur-sm z-10">
        {/* Boutons d'invocation */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3">
          <span className="text-sm sm:text-xs text-muted-foreground mr-2 sm:mr-2">Invoquer :</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => invokeApparition('bird')}
            className="text-cyan-400 hover:bg-cyan-500/10 h-10 w-10 sm:h-8 sm:w-auto sm:px-3 p-0 sm:p-2"
          >
            <Bird className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => invokeApparition('species')}
            className="text-emerald-400 hover:bg-emerald-500/10 h-10 w-10 sm:h-8 sm:w-auto sm:px-3 p-0 sm:p-2"
          >
            <Leaf className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => invokeApparition('fragment')}
            className="text-rose-400 hover:bg-rose-500/10 h-10 w-10 sm:h-8 sm:w-auto sm:px-3 p-0 sm:p-2"
          >
            <Feather className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => invokeApparition('voice')}
            className="text-amber-400 hover:bg-amber-500/10 h-10 w-10 sm:h-8 sm:w-auto sm:px-3 p-0 sm:p-2"
          >
            <Volume2 className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => invokeApparition('moral')}
            className="text-violet-400 hover:bg-violet-500/10 h-10 w-10 sm:h-8 sm:w-auto sm:px-3 p-0 sm:p-2"
          >
            <BookOpen className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Statistiques */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2 sm:gap-4">
            <span>{apparitions.length} visible(s)</span>
            <span className="hidden sm:inline opacity-50">•</span>
            <span>{stats.total} surgies</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-0">
            <span className="text-cyan-400/70">{stats.birds} 🐦</span>
            <span className="text-emerald-400/70">{stats.species} 🌿</span>
            <span className="text-rose-400/70">{stats.fragments} ✨</span>
            <span className="text-amber-400/70">{stats.voices} 🔊</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DordoniaChoirView;
