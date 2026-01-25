import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDordoniaSession, DordoniaScenario } from '@/hooks/useDordoniaSession';
import DordoniaWelcome from '@/components/dordonia/DordoniaWelcome';
import DordoniaThresholdQuestions from '@/components/dordonia/DordoniaThresholdQuestions';
import DordoniaScenarioCards from '@/components/dordonia/DordoniaScenarioCards';
import DordoniaSilenceButton from '@/components/dordonia/DordoniaSilenceButton';
import DordoniaSilenceMode from '@/components/dordonia/DordoniaSilenceMode';
import DordoniaWalkMode from '@/components/dordonia/DordoniaWalkMode';
import DordoniaReversFlow from '@/components/dordonia/DordoniaReversFlow';
import DordoniaAtlasView from '@/components/dordonia/DordoniaAtlasView';
import DordoniaParliament from '@/components/dordonia/DordoniaParliament';
import DordoniaChoirView from '@/components/dordonia/DordoniaChoirView';

type DordoniaPhase = 'welcome' | 'threshold' | 'scenarios' | 'active';

const Dordonia: React.FC = () => {
  const [phase, setPhase] = useState<DordoniaPhase>('welcome');
  const session = useDordoniaSession();

  const handleWelcomeComplete = () => setPhase('threshold');
  
  const handleThresholdComplete = () => {
    session.completeThreshold();
    setPhase('scenarios');
  };

  const handleSelectScenario = (scenario: DordoniaScenario) => {
    session.setScenario(scenario);
    setPhase('active');
  };

  const handleExitScenario = () => {
    session.setScenario('marche'); // Reset
    setPhase('scenarios');
  };

  // Silence mode overlay
  if (session.isInSilenceMode) {
    return <DordoniaSilenceMode onExit={session.exitSilenceMode} />;
  }

  // Active scenario views
  if (phase === 'active' && session.scenarioActif) {
    switch (session.scenarioActif) {
      case 'marche':
        return (
          <DordoniaWalkMode 
            onExit={handleExitScenario} 
            onEnterSilence={session.enterSilenceMode} 
          />
        );
      case 'revers':
        return (
          <DordoniaReversFlow 
            sessionKey={session.sessionKey} 
            onExit={handleExitScenario} 
          />
        );
      case 'atlas':
        return (
          <DordoniaAtlasView 
            sessionKey={session.sessionKey} 
            onExit={handleExitScenario} 
          />
        );
      case 'parlement':
        return (
          <DordoniaParliament 
            sessionKey={session.sessionKey} 
            onExit={handleExitScenario} 
          />
        );
      case 'choeur':
        return (
          <DordoniaChoirView 
            sessionKey={session.sessionKey} 
            onExit={handleExitScenario} 
          />
        );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-cyan-950/20">
      <AnimatePresence mode="wait">
        {phase === 'welcome' && (
          <DordoniaWelcome onContinue={handleWelcomeComplete} />
        )}

        {phase === 'threshold' && (
          <div className="min-h-screen flex items-center justify-center p-6">
            <DordoniaThresholdQuestions
              answers={session.thresholdAnswers}
              onAnswer={session.setThresholdAnswer}
              onComplete={handleThresholdComplete}
            />
          </div>
        )}

        {phase === 'scenarios' && (
          <div className="min-h-screen p-6 pt-12">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="font-crimson text-4xl text-foreground mb-2">DORDONIA</h1>
                <p className="text-muted-foreground">Choisissez votre chemin</p>
              </div>
              <DordoniaScenarioCards
                recommendedScenario={session.getRecommendedScenario()}
                onSelectScenario={handleSelectScenario}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating silence button */}
      {phase !== 'welcome' && (
        <DordoniaSilenceButton onClick={session.enterSilenceMode} />
      )}
    </div>
  );
};

export default Dordonia;
