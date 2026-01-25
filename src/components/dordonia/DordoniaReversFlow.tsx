import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Heart, Lock, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DordoniaReversFlowProps {
  sessionKey: string;
  onExit: () => void;
}

interface ReversForm {
  decision: string;
  pertesHumainImmédiat: string;
  pertesHumainDiffere: string;
  pertesRiviere: string;
  pertesMachine: string;
  detteReparation: string;
}

type FlowStep = 'intro' | 'decision' | 'pertes' | 'dette' | 'confirm' | 'sealed';

const DordoniaReversFlow: React.FC<DordoniaReversFlowProps> = ({ sessionKey, onExit }) => {
  const [step, setStep] = useState<FlowStep>('intro');
  const [form, setForm] = useState<ReversForm>({
    decision: '',
    pertesHumainImmédiat: '',
    pertesHumainDiffere: '',
    pertesRiviere: '',
    pertesMachine: '',
    detteReparation: '',
  });
  const [isSealing, setIsSealing] = useState(false);

  const handleSeal = async () => {
    if (!form.decision.trim() || !form.detteReparation.trim()) {
      toast.error('La décision et la dette sont obligatoires');
      return;
    }

    setIsSealing(true);
    try {
      // Create the Revers
      const { data: revers, error: reversError } = await supabase
        .from('dordonia_revers')
        .insert({
          session_id: sessionKey,
          decision: form.decision,
          pertes_humain_immediat: form.pertesHumainImmédiat ? [form.pertesHumainImmédiat] : [],
          pertes_humain_differe: form.pertesHumainDiffere ? [form.pertesHumainDiffere] : [],
          pertes_riviere: form.pertesRiviere ? [form.pertesRiviere] : [],
          pertes_machine: form.pertesMachine ? [form.pertesMachine] : [],
          dette_reparation: form.detteReparation,
          is_sealed: true,
          sealed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (reversError) throw reversError;

      // Create the Care Registry entry
      const { error: careError } = await supabase
        .from('dordonia_care_registry')
        .insert({
          revers_id: revers.id,
          acte_soin: form.detteReparation,
          statut: 'engage',
        });

      if (careError) throw careError;

      setStep('sealed');
      toast.success('Revers scellé. La dette est engagée.');
    } catch (error) {
      console.error('Error sealing revers:', error);
      toast.error('Erreur lors du scellement');
    } finally {
      setIsSealing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 max-w-lg mx-auto"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
              <Scale className="h-8 w-8 text-amber-400" />
            </div>
            <h2 className="font-crimson text-2xl text-foreground">
              Créer un Revers
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Un Revers est une décision irréversible. En la scellant, tu reconnais les pertes
              qu'elle engendre et tu t'engages à une dette de réparation.
            </p>
            <p className="text-sm text-amber-400/70 italic">
              ⚠️ Un Revers scellé ne peut plus être modifié.
            </p>
            <Button
              onClick={() => setStep('decision')}
              className="bg-amber-600 hover:bg-amber-500"
            >
              Commencer
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'decision':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 max-w-lg mx-auto"
          >
            <h3 className="font-crimson text-xl text-foreground">
              Quelle décision prends-tu ?
            </h3>
            <Textarea
              value={form.decision}
              onChange={(e) => setForm(prev => ({ ...prev, decision: e.target.value }))}
              placeholder="Décris ta décision..."
              className="min-h-[120px] bg-slate-800/50 border-slate-700/50"
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep('intro')}
                className="text-slate-500"
              >
                Retour
              </Button>
              <Button
                onClick={() => setStep('pertes')}
                disabled={!form.decision.trim()}
                className="flex-1 bg-amber-600 hover:bg-amber-500"
              >
                Continuer
              </Button>
            </div>
          </motion.div>
        );

      case 'pertes':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 max-w-lg mx-auto"
          >
            <h3 className="font-crimson text-xl text-foreground">
              Quelles pertes reconnais-tu ?
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Pertes humaines immédiates
                </label>
                <Textarea
                  value={form.pertesHumainImmédiat}
                  onChange={(e) => setForm(prev => ({ ...prev, pertesHumainImmédiat: e.target.value }))}
                  placeholder="Ce qui est perdu maintenant pour les humains..."
                  className="bg-slate-800/50 border-slate-700/50"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Pertes humaines différées
                </label>
                <Textarea
                  value={form.pertesHumainDiffere}
                  onChange={(e) => setForm(prev => ({ ...prev, pertesHumainDiffere: e.target.value }))}
                  placeholder="Ce qui sera perdu plus tard..."
                  className="bg-slate-800/50 border-slate-700/50"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Pertes pour la rivière
                </label>
                <Textarea
                  value={form.pertesRiviere}
                  onChange={(e) => setForm(prev => ({ ...prev, pertesRiviere: e.target.value }))}
                  placeholder="Ce que la rivière perd..."
                  className="bg-slate-800/50 border-slate-700/50"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Pertes machines / techniques
                </label>
                <Textarea
                  value={form.pertesMachine}
                  onChange={(e) => setForm(prev => ({ ...prev, pertesMachine: e.target.value }))}
                  placeholder="Ce que les machines ou la technique perdent..."
                  className="bg-slate-800/50 border-slate-700/50"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep('decision')}
                className="text-slate-500"
              >
                Retour
              </Button>
              <Button
                onClick={() => setStep('dette')}
                className="flex-1 bg-amber-600 hover:bg-amber-500"
              >
                Continuer
              </Button>
            </div>
          </motion.div>
        );

      case 'dette':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 max-w-lg mx-auto"
          >
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-rose-400" />
              <h3 className="font-crimson text-xl text-foreground">
                Dette de réparation
              </h3>
            </div>
            <p className="text-muted-foreground text-sm">
              À quel acte concret de soin t'engages-tu pour réparer cette perte ?
            </p>
            <Textarea
              value={form.detteReparation}
              onChange={(e) => setForm(prev => ({ ...prev, detteReparation: e.target.value }))}
              placeholder="Décris ton engagement de réparation..."
              className="min-h-[120px] bg-slate-800/50 border-slate-700/50"
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep('pertes')}
                className="text-slate-500"
              >
                Retour
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!form.detteReparation.trim()}
                className="flex-1 bg-amber-600 hover:bg-amber-500"
              >
                Préparer le scellement
              </Button>
            </div>
          </motion.div>
        );

      case 'confirm':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 max-w-lg mx-auto"
          >
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-crimson text-xl">Confirmation du scellement</h3>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-800/50 border border-amber-500/30 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Décision</p>
                <p className="text-foreground">{form.decision}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Dette engagée</p>
                <p className="text-rose-300">{form.detteReparation}</p>
              </div>
            </div>

            <p className="text-sm text-amber-400/70 text-center italic">
              Ce Revers sera scellé de façon irréversible.
            </p>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep('dette')}
                className="text-slate-500"
              >
                Modifier
              </Button>
              <Button
                onClick={handleSeal}
                disabled={isSealing}
                className="flex-1 bg-amber-600 hover:bg-amber-500"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isSealing ? 'Scellement...' : 'Sceller le Revers'}
              </Button>
            </div>
          </motion.div>
        );

      case 'sealed':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-lg mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center"
            >
              <Check className="h-10 w-10 text-emerald-400" />
            </motion.div>
            <h2 className="font-crimson text-2xl text-foreground">
              Revers scellé
            </h2>
            <p className="text-muted-foreground">
              Ta décision est gravée. Ta dette de soin est engagée.
            </p>
            <p className="text-sm text-rose-300 italic">
              « {form.detteReparation} »
            </p>
            <Button
              onClick={onExit}
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              Revenir aux scénarios
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-amber-950/10 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-2 text-amber-400">
          <Scale className="h-5 w-5" />
          <span className="text-sm font-medium">Revers + Dette</span>
        </div>
        {step !== 'sealed' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-slate-500"
          >
            Quitter
          </Button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DordoniaReversFlow;
