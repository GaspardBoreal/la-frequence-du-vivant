import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Pause, Play, Feather, Moon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDordoniaChat } from '@/hooks/useDordoniaChat';

interface DordoniaWalkModeProps {
  onExit: () => void;
  onEnterSilence: () => void;
}

const RITUAL_PHASES = [
  { text: "Ferme les yeux un instant.", duration: 4000 },
  { text: "Respire avec la rivière.", duration: 5000 },
  { text: "Écoute ce qui t'entoure.", duration: 4000 },
  { text: "Tu peux marcher maintenant.", duration: 3000 },
];

const WALK_CONSIGNES = [
  "Laisse tes pas trouver leur rythme.",
  "Que vois-tu que tu n'avais jamais remarqué ?",
  "La rivière coule quelque part près de toi.",
  "Un oiseau chante. L'entends-tu ?",
  "Tes pieds connaissent le chemin.",
  "Le silence aussi est une fréquence.",
  "Qu'est-ce qui bouge autour de toi ?",
  "Respire. Tu es ici.",
];

type WalkPhase = 'ritual' | 'walking' | 'paused';

const DordoniaWalkMode: React.FC<DordoniaWalkModeProps> = ({ onExit, onEnterSilence }) => {
  const [phase, setPhase] = useState<WalkPhase>('ritual');
  const [ritualStep, setRitualStep] = useState(0);
  const [currentConsigne, setCurrentConsigne] = useState(0);
  const [showConsigne, setShowConsigne] = useState(false);
  const [fragmentText, setFragmentText] = useState('');
  const [fragments, setFragments] = useState<string[]>([]);
  const [showFragmentInput, setShowFragmentInput] = useState(false);

  const { sendMessage, isLoading } = useDordoniaChat();

  // Ritual phase progression
  useEffect(() => {
    if (phase !== 'ritual') return;
    
    if (ritualStep < RITUAL_PHASES.length) {
      const timer = setTimeout(() => {
        setRitualStep(prev => prev + 1);
      }, RITUAL_PHASES[ritualStep].duration);
      return () => clearTimeout(timer);
    } else {
      setPhase('walking');
    }
  }, [phase, ritualStep]);

  // Consigne cycling during walk
  useEffect(() => {
    if (phase !== 'walking') return;
    
    // Show consigne after random delay (3-5 minutes in production, 15-30s for demo)
    const showDelay = 15000 + Math.random() * 15000; // 15-30 seconds
    const hideDelay = 8000;

    const showTimer = setTimeout(() => {
      setShowConsigne(true);
      setTimeout(() => {
        setShowConsigne(false);
        setCurrentConsigne(prev => (prev + 1) % WALK_CONSIGNES.length);
      }, hideDelay);
    }, showDelay);

    return () => clearTimeout(showTimer);
  }, [phase, currentConsigne]);

  const handleCaptureFragment = useCallback(() => {
    if (fragmentText.trim()) {
      setFragments(prev => [...prev, fragmentText.trim()]);
      setFragmentText('');
      setShowFragmentInput(false);
    }
  }, [fragmentText]);

  const handleCaptureSilence = useCallback(() => {
    setFragments(prev => [...prev, '[FF-0 Silence]']);
  }, []);

  const handleTogglePause = () => {
    setPhase(prev => prev === 'paused' ? 'walking' : 'paused');
  };

  const handleFinish = async () => {
    // Generate frugal summary via Dordonia agent
    if (fragments.length > 0) {
      const summary = `Résumé frugal de la marche: ${fragments.length} fragment(s) capturé(s).`;
      await sendMessage(`[MODE MARCHE TERMINÉ] Fragments: ${fragments.join(' | ')}`);
    }
    onExit();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-cyan-950/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-2 text-cyan-400">
          <Wind className="h-5 w-5" />
          <span className="text-sm font-medium">Mode Marche</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEnterSilence}
            className="text-slate-500 hover:text-slate-300"
          >
            <Moon className="h-4 w-4" />
          </Button>
          {phase === 'walking' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTogglePause}
              className="text-slate-400"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Ritual phase */}
          {phase === 'ritual' && ritualStep < RITUAL_PHASES.length && (
            <motion.div
              key={`ritual-${ritualStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1 }}
              className="text-center"
            >
              <p className="font-crimson text-2xl md:text-3xl text-slate-300 italic">
                {RITUAL_PHASES[ritualStep].text}
              </p>
            </motion.div>
          )}

          {/* Walking phase */}
          {phase === 'walking' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-8 w-full max-w-md"
            >
              {/* Breathing animation */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20"
              />

              {/* Consigne */}
              <AnimatePresence>
                {showConsigne && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 0.8, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 1 }}
                    className="font-crimson text-xl text-slate-400 italic"
                  >
                    {WALK_CONSIGNES[currentConsigne]}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Fragment capture buttons */}
              <div className="flex flex-col gap-3 pt-8">
                {showFragmentInput ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <textarea
                      value={fragmentText}
                      onChange={(e) => setFragmentText(e.target.value)}
                      placeholder="Capture cet instant..."
                      className="w-full p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:border-cyan-500/50"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCaptureFragment}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500"
                      >
                        Capturer
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowFragmentInput(false)}
                        className="text-slate-500"
                      >
                        Annuler
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => setShowFragmentInput(true)}
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Feather className="h-4 w-4 mr-2" />
                      Fragment de Fréquence
                    </Button>
                    <Button
                      onClick={handleCaptureSilence}
                      variant="ghost"
                      className="text-slate-500 hover:text-slate-300"
                    >
                      FF-0 Silence
                    </Button>
                  </div>
                )}
              </div>

              {/* Fragments count */}
              {fragments.length > 0 && (
                <p className="text-sm text-slate-500">
                  {fragments.length} fragment(s) capturé(s)
                </p>
              )}
            </motion.div>
          )}

          {/* Paused phase */}
          {phase === 'paused' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6"
            >
              <p className="font-crimson text-xl text-slate-400">
                Pause. Prends ton temps.
              </p>
              <Button
                onClick={handleTogglePause}
                className="bg-cyan-600 hover:bg-cyan-500"
              >
                <Play className="h-4 w-4 mr-2" />
                Reprendre
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {phase === 'walking' && (
        <div className="p-4 border-t border-slate-800/50">
          <Button
            onClick={handleFinish}
            variant="ghost"
            className="w-full text-slate-500 hover:text-slate-300"
          >
            Terminer la marche
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DordoniaWalkMode;
