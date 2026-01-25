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

  const OptionButton: React.FC<{
    value: string;
    label: string;
    sublabel?: string;
    onClick: () => void;
    isSelected: boolean;
  }> = ({ value, label, sublabel, onClick, isSelected }) => (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: canInteract ? 1 : 0.4, x: 0 }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      disabled={!canInteract}
      className={`w-full text-left p-4 rounded-lg border transition-all duration-500 ${
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

  return (
    <div className="max-w-md mx-auto space-y-8">
      <AnimatePresence mode="wait">
        {currentStep === 'ouEsTu' && (
          <motion.div
            key="ouEsTu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 text-cyan-400 mb-6">
              <MapPin className="h-5 w-5" />
              <h3 className="font-crimson text-xl">Où es-tu ?</h3>
            </div>
            
            <div className="space-y-3">
              <OptionButton
                value="dehors"
                label="Je marche le long de la rivière Dordogne"
                onClick={() => handleAnswer('ouEsTu', 'dehors')}
                isSelected={answers.ouEsTu === 'dehors'}
              />
              <OptionButton
                value="ferme"
                label="Je suis chez moi ou dans un lieu fermé"
                onClick={() => handleAnswer('ouEsTu', 'ferme')}
                isSelected={answers.ouEsTu === 'ferme'}
              />
              <OptionButton
                value="immobile"
                label="Je suis immobile mais connecté au dehors"
                onClick={() => handleAnswer('ouEsTu', 'immobile')}
                isSelected={answers.ouEsTu === 'immobile'}
              />
            </div>
          </motion.div>
        )}

        {currentStep === 'queCherches' && (
          <motion.div
            key="queCherches"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 text-emerald-400 mb-6">
              <Search className="h-5 w-5" />
              <h3 className="font-crimson text-xl">Que cherches-tu ?</h3>
            </div>
            
            <div className="space-y-3">
              <OptionButton
                value="ecouter"
                label="Écouter"
                sublabel="Recevoir les voix de la rivière"
                onClick={() => handleAnswer('queCherches', 'ecouter')}
                isSelected={answers.queCherches === 'ecouter'}
              />
              <OptionButton
                value="marcher"
                label="Marcher"
                sublabel="Accorder le corps à l'attention"
                onClick={() => handleAnswer('queCherches', 'marcher')}
                isSelected={answers.queCherches === 'marcher'}
              />
              <OptionButton
                value="decider"
                label="Décider"
                sublabel="Trancher avec la rivière"
                onClick={() => handleAnswer('queCherches', 'decider')}
                isSelected={answers.queCherches === 'decider'}
              />
              <OptionButton
                value="cartographier"
                label="Cartographier"
                sublabel="Retenir sans posséder"
                onClick={() => handleAnswer('queCherches', 'cartographier')}
                isSelected={answers.queCherches === 'cartographier'}
              />
              <OptionButton
                value="imaginer2050"
                label="Imaginer 2050"
                sublabel="Gouverner avec le vivant"
                onClick={() => handleAnswer('queCherches', 'imaginer2050')}
                isSelected={answers.queCherches === 'imaginer2050'}
              />
            </div>
          </motion.div>
        )}

        {currentStep === 'quelRisque' && (
          <motion.div
            key="quelRisque"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 text-amber-400 mb-6">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-crimson text-xl">Quel risque acceptes-tu ?</h3>
            </div>
            
            <div className="space-y-3">
              <OptionButton
                value="renoncer"
                label="Renoncer"
                sublabel="Accepter de ne pas tout savoir"
                onClick={() => handleAnswer('quelRisque', 'renoncer')}
                isSelected={answers.quelRisque === 'renoncer'}
              />
              <OptionButton
                value="ressentir"
                label="Ressentir"
                sublabel="Laisser le corps décider"
                onClick={() => handleAnswer('quelRisque', 'ressentir')}
                isSelected={answers.quelRisque === 'ressentir'}
              />
              <OptionButton
                value="trancher"
                label="Trancher"
                sublabel="Assumer l'irréversible"
                onClick={() => handleAnswer('quelRisque', 'trancher')}
                isSelected={answers.quelRisque === 'trancher'}
              />
            </div>
          </motion.div>
        )}

        {currentStep === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "linear" }}
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
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === step
                  ? 'bg-cyan-400 w-6'
                  : index < ['ouEsTu', 'queCherches', 'quelRisque'].indexOf(currentStep)
                  ? 'bg-cyan-600'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DordoniaThresholdQuestions;
