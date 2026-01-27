import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Gavel, AlertTriangle, Check, X, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDordoniaChat } from '@/hooks/useDordoniaChat';

interface DordoniaParliamentProps {
  sessionKey: string;
  onExit: () => void;
}

type ParliamentPhase = 'select_case' | 'data' | 'deliberation' | 'decision' | 'result';

const CASES = [
  {
    id: 'barrage',
    title: 'Le barrage du Sablier',
    description: 'Faut-il démanteler le barrage hydroélectrique pour restaurer la migration des poissons ?',
  },
  {
    id: 'irrigation',
    title: 'Les droits d\'irrigation',
    description: 'Comment répartir l\'eau entre agriculteurs en période de sécheresse prolongée ?',
  },
  {
    id: 'urbanisation',
    title: 'L\'extension urbaine',
    description: 'Autoriser la construction sur les zones inondables pour loger les nouveaux habitants ?',
  },
];

const DordoniaParliament: React.FC<DordoniaParliamentProps> = ({ sessionKey, onExit }) => {
  const [phase, setPhase] = useState<ParliamentPhase>('select_case');
  const [selectedCase, setSelectedCase] = useState<typeof CASES[0] | null>(null);
  const [deliberation, setDeliberation] = useState('');
  const [decision, setDecision] = useState('');
  const [vetoActive, setVetoActive] = useState(false);
  const [pvGenerated, setPvGenerated] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { sendMessage, messages, isLoading: isChatLoading } = useDordoniaChat();

  // Simulate river veto with uncertainty
  useEffect(() => {
    if (phase === 'decision' && decision) {
      // 30% chance of river veto
      const vetoChance = Math.random();
      setVetoActive(vetoChance < 0.3);
    }
  }, [phase, decision]);

  const handleSelectCase = (caseItem: typeof CASES[0]) => {
    setSelectedCase(caseItem);
    setPhase('data');
  };

  const handleSubmitDeliberation = () => {
    if (deliberation.trim()) {
      setPhase('decision');
    }
  };

  const handleMakeDecision = async () => {
    if (!decision.trim() || !selectedCase) return;

    setIsLoading(true);
    try {
      // Generate PV
      const pvText = `
PROCÈS-VERBAL — Parlement 2050
Cas: ${selectedCase.title}
Date: ${new Date().toLocaleDateString('fr-FR')}

DÉLIBÉRATION:
${deliberation}

DÉCISION:
${decision}

${vetoActive ? '⚠️ VETO DE LA RIVIÈRE: La rivière s\'oppose à cette décision.' : 'La rivière accepte cette décision.'}

---
Session: ${sessionKey}
      `.trim();

      setPvGenerated(pvText);

      // Save to database
      const { error } = await supabase
        .from('dordonia_parlement')
        .insert({
          session_id: sessionKey,
          cas_deliberation: selectedCase.title,
          deliberation,
          decision,
          veto_riviere: vetoActive,
          pv_genere: pvText,
          donnees_sobres: { case_id: selectedCase.id },
          incertitude_affichee: 'Les données présentées comportent une marge d\'incertitude de 15-25%.',
        });

      if (error) throw error;

      setPhase('result');
    } catch (error) {
      console.error('Error saving parliament decision:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case 'select_case':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="font-crimson text-2xl text-foreground">
                Parlement 2050
              </h2>
              <p className="text-muted-foreground mt-2 text-center">
                Choisissez un cas de délibération
              </p>
            </div>

            <div className="space-y-3">
              {CASES.map((caseItem, index) => (
                <motion.button
                  key={caseItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSelectCase(caseItem)}
                  className="w-full text-left p-4 rounded-lg bg-slate-800/50 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                >
                  <h3 className="font-medium text-foreground mb-1">{caseItem.title}</h3>
                  <p className="text-sm text-muted-foreground">{caseItem.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 'data':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="font-crimson text-xl text-foreground">
              {selectedCase?.title}
            </h3>

            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-sm text-amber-400/80 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Données sobres — Incertitude affichée
              </p>
              <p className="text-muted-foreground text-sm">
                {selectedCase?.description}
              </p>
              <p className="text-xs text-slate-500 mt-3 italic">
                Les données présentées comportent une marge d'incertitude de 15-25%.
                Cette incertitude fait partie de la délibération.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-muted-foreground">
                Votre délibération
              </label>
              <Textarea
                value={deliberation}
                onChange={(e) => setDeliberation(e.target.value)}
                placeholder="Exposez votre réflexion sur ce cas..."
                className="min-h-[150px] bg-slate-800/50 border-slate-700/50"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setPhase('select_case')}
                className="text-slate-500"
              >
                Retour
              </Button>
              <Button
                onClick={handleSubmitDeliberation}
                disabled={!deliberation.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-500"
              >
                Passer à la décision
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'decision':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Gavel className="h-6 w-6 text-purple-400" />
              <h3 className="font-crimson text-xl text-foreground">
                Votre décision
              </h3>
            </div>

            <Textarea
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="Formulez votre décision..."
              className="min-h-[100px] bg-slate-800/50 border-slate-700/50"
            />

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setPhase('data')}
                className="text-slate-500"
              >
                Retour
              </Button>
              <Button
                onClick={handleMakeDecision}
                disabled={!decision.trim() || isLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-500"
              >
                {isLoading ? 'Délibération...' : 'Soumettre au Parlement'}
              </Button>
            </div>
          </motion.div>
        );

      case 'result':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Veto status */}
            <div className={`p-4 rounded-lg ${vetoActive ? 'bg-red-950/30 border-red-500/30' : 'bg-emerald-950/30 border-emerald-500/30'} border`}>
              <div className="flex items-center gap-3 mb-2">
                {vetoActive ? (
                  <X className="h-6 w-6 text-red-400" />
                ) : (
                  <Check className="h-6 w-6 text-emerald-400" />
                )}
                <h3 className="font-crimson text-lg text-foreground">
                  {vetoActive ? 'Veto de la rivière' : 'Décision acceptée'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {vetoActive
                  ? 'La rivière oppose son veto à cette décision. Un Revers doit être créé.'
                  : 'La rivière accepte cette décision. Le Parlement 2050 a statué.'
                }
              </p>
            </div>

            {/* PV Preview */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Procès-verbal généré</span>
              </div>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                {pvGenerated}
              </pre>
            </div>

            <Button
              onClick={onExit}
              variant="outline"
              className="w-full border-slate-700 text-slate-300"
            >
              Revenir aux scénarios
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-2 text-purple-400">
          <Users className="h-5 w-5" />
          <span className="text-sm font-medium">Parlement 2050</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="text-slate-500"
        >
          Quitter
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {renderPhase()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DordoniaParliament;
