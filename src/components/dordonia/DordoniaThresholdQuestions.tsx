import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, AlertTriangle, Check } from 'lucide-react';
import { DordoniaThresholdAnswers } from '@/hooks/useDordoniaSession';

interface DordoniaThresholdQuestionsProps {
  answers: DordoniaThresholdAnswers;
  onAnswer: (key: keyof DordoniaThresholdAnswers, value: any) => void;
  onComplete: () => void;
}

type QuestionStep = 'ouEsTu' | 'queCherches' | 'quelRisque' | 'complete';

const HESITATION_DELAY = 1500; // Contrainte constitutionnelle: hésitation obligatoire

// Extracted outside to prevent recreation on each render
interface OptionButtonProps {
  label: string;
  sublabel?: string;
  onClick: () => void;
  isSelected: boolean;
  canInteract: boolean;
  index: number;
}

const OptionButton: React.FC<OptionButtonProps> = ({ 
  label, sublabel, onClick, isSelected, canInteract, index 
}) => (
  <motion.button
    initial={{ opacity: 0 }}
    animate={{ opacity: canInteract ? 1 : 0.5 }}
    transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
    onClick={onClick}
    disabled={!canInteract}
    className={`w-full text-left p-4 rounded-lg border transition-colors duration-300 ${
      isSelected
        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
        : canInteract
        ? 'bg-slate-900/50 border-slate-700/30 text-slate-300 hover:bg-slate-800/50 hover:border-slate-600/50'
        : 'bg-slate-900/30 border-slate-800/20 text-slate-500 cursor-not-allowed'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{label}</p>
        {sublabel && <p className="text-sm text-slate-500 mt-1">{sublabel}</p>}
      </div>
      {isSelected && <Check className="h-5 w-5 text-cyan-400" />}
    </div>
  </motion.button>
);

const DordoniaThresholdQuestions: React.FC<DordoniaThresholdQuestionsProps> = ({
  answers,
  onAnswer,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<QuestionStep>('ouEsTu');
  const [isRevealing, setIsRevealing] = useState(true);
  const [canInteract, setCanInteract] = useState(false);

  // Hésitation obligatoire: délai avant interaction
  useEffect(() => {
    setCanInteract(false);
    const timer = setTimeout(() => setCanInteract(true), HESITATION_DELAY);
    return () => clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealing(false), 800);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleAnswer = (key: keyof DordoniaThresholdAnswers, value: any) => {
    if (!canInteract) return;
    
    onAnswer(key, value);
    setIsRevealing(true);
    
    // Progress to next step
    setTimeout(() => {
      if (key === 'ouEsTu') setCurrentStep('queCherches');
      else if (key === 'queCherches') setCurrentStep('quelRisque');
      else if (key === 'quelRisque') {
        setCurrentStep('complete');
        setTimeout(onComplete, 1000);
      }
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto space-y-8 min-h-[420px]">
      <AnimatePresence mode="wait">
        {currentStep === 'ouEsTu' && (
          <motion.div
            key="ouEsTu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 text-cyan-400 mb-6">
              <MapPin className="h-5 w-5" />
              <h3 className="font-crimson text-xl">Où es-tu ?</h3>
            </div>
            
            <div className="space-y-3">
              <OptionButton
                label="Je marche le long de la rivière Dordogne"
                onClick={() => handleAnswer('ouEsTu', 'dehors')}
                isSelected={answers.ouEsTu === 'dehors'}
                canInteract={canInteract}
                index={0}
              />
              <OptionButton
                label="Je suis chez moi ou dans un lieu fermé"
                onClick={() => handleAnswer('ouEsTu', 'ferme')}
                isSelected={answers.ouEsTu === 'ferme'}
                canInteract={canInteract}
                index={1}
              />
              <OptionButton
                label="Je suis immobile mais connecté au dehors"
                sublabel="Sur une terrasse, à une fenêtre, au bord de l'eau..."
                onClick={() => handleAnswer('ouEsTu', 'immobile')}
                isSelected={answers.ouEsTu === 'immobile'}
                canInteract={canInteract}
                index={2}
              />
            </div>
          </motion.div>
        )}

        {currentStep === 'queCherches' && (
          <motion.div
            key="queCherches"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 text-emerald-400 mb-6">
              <Search className="h-5 w-5" />
              <h3 className="font-crimson text-xl">Que cherches-tu ?</h3>
            </div>
            
            <div className="space-y-3">
              <OptionButton
                label="Écouter"
                sublabel="Recevoir les voix de la rivière"
                onClick={() => handleAnswer('queCherches', 'ecouter')}
                isSelected={answers.queCherches === 'ecouter'}
                canInteract={canInteract}
                index={0}
              />
              <OptionButton
                label="Marcher"
                sublabel="Accorder le corps à l'attention"
                onClick={() => handleAnswer('queCherches', 'marcher')}
                isSelected={answers.queCherches === 'marcher'}
                canInteract={canInteract}
                index={1}
              />
              <OptionButton
                label="Décider"
                sublabel="Trancher avec la rivière"
                onClick={() => handleAnswer('queCherches', 'decider')}
                isSelected={answers.queCherches === 'decider'}
                canInteract={canInteract}
                index={2}
              />
              <OptionButton
                label="Cartographier"
                sublabel="Retenir sans posséder"
                onClick={() => handleAnswer('queCherches', 'cartographier')}
                isSelected={answers.queCherches === 'cartographier'}
                canInteract={canInteract}
                index={3}
              />
              <OptionButton
                label="Imaginer 2050"
                sublabel="Gouverner avec le vivant"
                onClick={() => handleAnswer('queCherches', 'imaginer2050')}
                isSelected={answers.queCherches === 'imaginer2050'}
                canInteract={canInteract}
                index={4}
              />
            </div>
          </motion.div>
        )}

        {currentStep === 'quelRisque' && (
          <motion.div
            key="quelRisque"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 text-amber-400 mb-6">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-crimson text-xl">Quel risque acceptes-tu ?</h3>
            </div>
            
            <div className="space-y-3">
              <OptionButton
                label="Renoncer"
                sublabel="Accepter de ne pas tout savoir"
                onClick={() => handleAnswer('quelRisque', 'renoncer')}
                isSelected={answers.quelRisque === 'renoncer'}
                canInteract={canInteract}
                index={0}
              />
              <OptionButton
                label="Ressentir"
                sublabel="Laisser le corps décider"
                onClick={() => handleAnswer('quelRisque', 'ressentir')}
                isSelected={answers.quelRisque === 'ressentir'}
                canInteract={canInteract}
                index={1}
              />
              <OptionButton
                label="Trancher"
                sublabel="Assumer l'irréversible"
                onClick={() => handleAnswer('quelRisque', 'trancher')}
                isSelected={answers.quelRisque === 'trancher'}
                canInteract={canInteract}
                index={2}
              />
            </div>
          </motion.div>
        )}

        {currentStep === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "linear", repeat: Infinity }}
              className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-cyan-500/50 border-t-cyan-400"
            />
            <p className="text-slate-400 font-crimson text-lg italic">
              La rivière prépare ton chemin...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      {currentStep !== 'complete' && (
        <div className="flex justify-center gap-2 pt-4">
          {['ouEsTu', 'queCherches', 'quelRisque'].map((step, index) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep === step
                  ? 'bg-cyan-400 w-6'
                  : index < ['ouEsTu', 'queCherches', 'quelRisque'].indexOf(currentStep)
                  ? 'bg-cyan-600 w-2'
                  : 'bg-slate-700 w-2'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DordoniaThresholdQuestions;
