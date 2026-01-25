import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Pause, Play, Sparkles, Bird, Feather, Volume2, Leaf, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRandomExplorationData, RandomBird, RandomSpecies, RandomText, RandomAudio } from '@/hooks/useRandomExplorationData';
import { BirdApparition, FragmentApparition, VoiceApparition, SpeciesApparition, MoralApparition } from './choir';
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
}

// Configuration des timers par type d'apparition
const APPARITION_CONFIG: Record<ApparitionType, { interval: [number, number]; ttl: [number, number] }> = {
  bird: { interval: [8000, 15000], ttl: [20000, 40000] },
  fragment: { interval: [20000, 30000], ttl: [30000, 60000] },
  voice: { interval: [45000, 60000], ttl: [20000, 30000] },
  species: { interval: [12000, 18000], ttl: [25000, 35000] },
  moral: { interval: [30000, 40000], ttl: [40000, 50000] },
};

// Générer une valeur aléatoire dans une plage
const randomInRange = (range: [number, number]) => 
  Math.floor(Math.random() * (range[1] - range[0]) + range[0]);

// Générer une position aléatoire évitant les chevauchements
const generatePosition = (existingApparitions: Apparition[]): { x: number; y: number } => {
  const maxAttempts = 10;
  
  for (let i = 0; i < maxAttempts; i++) {
    const x = 5 + Math.random() * 65; // 5% à 70% pour éviter les bords
    const y = 10 + Math.random() * 55; // 10% à 65%
    
    // Vérifier qu'on n'est pas trop proche d'une apparition existante
    const tooClose = existingApparitions.some(a => 
      Math.abs(a.position.x - x) < 15 && Math.abs(a.position.y - y) < 15
    );
    
    if (!tooClose) return { x, y };
  }
  
  // Fallback si on ne trouve pas de position idéale
  return { x: 5 + Math.random() * 70, y: 10 + Math.random() * 60 };
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
  
  const { fetchRandomBird, fetchRandomSpecies, fetchRandomText, fetchRandomAudio } = useRandomExplorationData();

  // Supprimer une apparition
  const removeApparition = useCallback((id: string) => {
    setApparitions(prev => prev.filter(a => a.id !== id));
  }, []);

  // Ajouter une apparition
  const addApparition = useCallback((type: ApparitionType, content: any) => {
    if (!content) return;
    
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ttl = randomInRange(APPARITION_CONFIG[type].ttl);
    
    setApparitions(prev => {
      const position = generatePosition(prev);
      return [...prev, { id, type, position, createdAt: new Date(), ttl, content }];
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
      key: apparition.id,
      position: apparition.position,
      ttl: apparition.ttl,
      onExpire: () => removeApparition(apparition.id),
    };

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
        <AnimatePresence>
          {apparitions.map(renderApparition)}
        </AnimatePresence>

        {/* Message de bienvenue si aucune apparition */}
        {apparitions.length === 0 && !isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-rose-500/10 mb-6"
            />
            <p className="text-muted-foreground text-sm font-crimson italic">
              Les seuils s'ouvrent... les apparitions arrivent.
            </p>
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
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground mr-2">Invoquer :</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => invokeApparition('bird')}
            className="text-cyan-400 hover:bg-cyan-500/10 h-8 px-2"
          >
            <Bird className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => invokeApparition('species')}
            className="text-emerald-400 hover:bg-emerald-500/10 h-8 px-2"
          >
            <Leaf className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => invokeApparition('fragment')}
            className="text-rose-400 hover:bg-rose-500/10 h-8 px-2"
          >
            <Feather className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => invokeApparition('voice')}
            className="text-amber-400 hover:bg-amber-500/10 h-8 px-2"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => invokeApparition('moral')}
            className="text-violet-400 hover:bg-violet-500/10 h-8 px-2"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Statistiques */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>{apparitions.length} visible(s)</span>
          <span className="opacity-50">•</span>
          <span>{stats.total} surgies</span>
          <span className="opacity-50">•</span>
          <span className="text-cyan-400/70">{stats.birds} 🐦</span>
          <span className="text-emerald-400/70">{stats.species} 🌿</span>
          <span className="text-rose-400/70">{stats.fragments} ✨</span>
          <span className="text-amber-400/70">{stats.voices} 🔊</span>
        </div>
      </div>
    </div>
  );
};

export default DordoniaChoirView;
