import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useDordoniaChat } from '@/hooks/useDordoniaChat';

interface DordoniaChoirViewProps {
  sessionKey: string;
  onExit: () => void;
}

interface Apparition {
  id: string;
  text: string;
  isEphemeral: boolean;
  createdAt: Date;
}

const CHOIR_PROMPTS = [
  "Que murmure l'eau sous les pierres ?",
  "Quel souvenir la berge garde-t-elle ?",
  "Qui chantait ici il y a cent ans ?",
  "Qu'est-ce que la brume cache ?",
  "Que dit l'oiseau à la rivière ?",
];

const DordoniaChoirView: React.FC<DordoniaChoirViewProps> = ({ sessionKey, onExit }) => {
  const [apparitions, setApparitions] = useState<Apparition[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  const { sendMessage, messages, isLoading } = useDordoniaChat();

  // Show prompt periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPrompt(true);
      setTimeout(() => setShowPrompt(false), 5000);
      setCurrentPrompt(prev => (prev + 1) % CHOIR_PROMPTS.length);
    }, 20000);

    // Show first prompt after 3 seconds
    const initialTimer = setTimeout(() => setShowPrompt(true), 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, []);

  // Handle ephemeral apparitions expiring
  useEffect(() => {
    const checkExpiry = setInterval(() => {
      const now = new Date();
      setApparitions(prev => 
        prev.filter(a => {
          if (!a.isEphemeral) return true;
          // Ephemeral apparitions last 2 minutes
          const age = now.getTime() - a.createdAt.getTime();
          return age < 120000;
        })
      );
    }, 10000);

    return () => clearInterval(checkExpiry);
  }, []);

  const generateApparition = useCallback(async () => {
    setIsGenerating(true);
    setShowPrompt(false);

    try {
      // Request apparition from Dordonia agent
      await sendMessage(`[CHŒUR] ${CHOIR_PROMPTS[currentPrompt]}`);
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the last assistant message
      const lastMessage = messages.filter(m => m.role === 'assistant').pop();
      
      if (lastMessage) {
        const newApparition: Apparition = {
          id: `app_${Date.now()}`,
          text: lastMessage.content.slice(0, 200), // Limit length
          isEphemeral: Math.random() > 0.7, // 30% chance ephemeral
          createdAt: new Date(),
        };

        setApparitions(prev => [...prev, newApparition]);

        // Optionally save to database
        if (!newApparition.isEphemeral) {
          await supabase.from('dordonia_choeur').insert({
            session_id: sessionKey,
            apparition: newApparition.text,
            is_ephemeral: false,
          });
        }
      }
    } catch (error) {
      console.error('Error generating apparition:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [currentPrompt, messages, sendMessage, sessionKey]);

  const handleDeleteApparition = (id: string) => {
    setApparitions(prev => prev.filter(a => a.id !== id));
  };

  const handleChooseNotToSave = async (id: string) => {
    const apparition = apparitions.find(a => a.id === id);
    if (apparition) {
      // Mark as deleted in DB if it was saved
      handleDeleteApparition(id);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/30">
        <div className="flex items-center gap-2 text-rose-400">
          <Ghost className="h-5 w-5" />
          <span className="text-sm font-medium">Chœur d'apparitions</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="text-slate-600 hover:text-slate-400"
        >
          Quitter
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Prompt */}
        <AnimatePresence>
          {showPrompt && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-8"
            >
              <p className="font-crimson text-lg text-slate-500 italic mb-4">
                {CHOIR_PROMPTS[currentPrompt]}
              </p>
              <Button
                onClick={generateApparition}
                variant="ghost"
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Invoquer une apparition
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 mb-4"
            />
            <p className="text-slate-600 text-sm">Les seuils s'ouvrent...</p>
          </motion.div>
        )}

        {/* Apparitions */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <AnimatePresence>
            {apparitions.map((apparition, index) => {
              // Random position for each apparition
              const x = 10 + (index * 20) % 60;
              const y = 15 + (index * 15) % 50;
              
              return (
                <motion.div
                  key={apparition.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: apparition.isEphemeral ? [0.3, 0.6, 0.3] : 0.7,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: apparition.isEphemeral ? 4 : 1, repeat: apparition.isEphemeral ? Infinity : 0 }}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className="absolute max-w-xs pointer-events-auto"
                >
                  <div className={`p-4 rounded-lg backdrop-blur-sm ${
                    apparition.isEphemeral 
                      ? 'bg-rose-950/10 border border-rose-500/10' 
                      : 'bg-slate-900/30 border border-slate-700/20'
                  }`}>
                    <p className="font-crimson text-sm text-slate-300 italic">
                      {apparition.text}
                    </p>
                    {apparition.isEphemeral && (
                      <p className="text-xs text-rose-400/50 mt-2">
                        ✧ Éphémère
                      </p>
                    )}
                    {!apparition.isEphemeral && (
                      <button
                        onClick={() => handleChooseNotToSave(apparition.id)}
                        className="mt-2 text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Ne pas sauvegarder
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {apparitions.length === 0 && !isGenerating && !showPrompt && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="text-slate-700 text-sm"
          >
            Le silence attend...
          </motion.p>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/30">
        <p className="text-xs text-slate-700 text-center">
          {apparitions.length} apparition(s) • {apparitions.filter(a => a.isEphemeral).length} éphémère(s)
        </p>
      </div>
    </div>
  );
};

export default DordoniaChoirView;
