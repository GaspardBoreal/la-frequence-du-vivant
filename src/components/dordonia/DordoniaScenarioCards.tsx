import React from 'react';
import { motion } from 'framer-motion';
import { 
  Waves, 
  Scale, 
  Map, 
  Users, 
  Ghost,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { DordoniaScenario } from '@/hooks/useDordoniaSession';

interface DordoniaScenarioCardsProps {
  recommendedScenario: DordoniaScenario | null;
  onSelectScenario: (scenario: DordoniaScenario) => void;
}

interface ScenarioCardData {
  id: DordoniaScenario;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  iconBg: string;
}

const SCENARIOS: ScenarioCardData[] = [
  {
    id: 'marche',
    title: 'Mode Marche',
    subtitle: 'Fréquence réduite',
    description: 'Marcher accompagné, sans être guidé : une expérience lente pour accorder le corps, l\'attention et la rivière.',
    icon: <Waves className="h-6 w-6" />,
    gradient: 'from-cyan-950/60 to-blue-950/40',
    borderColor: 'border-cyan-500/30 hover:border-cyan-500/50',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
  },
  {
    id: 'revers',
    title: 'Revers + Dette',
    subtitle: 'Décisions irréversibles',
    description: 'Donner une forme juste aux décisions : reconnaître les pertes et transformer chaque choix en acte de soin.',
    icon: <Scale className="h-6 w-6" />,
    gradient: 'from-amber-950/60 to-orange-950/40',
    borderColor: 'border-amber-500/30 hover:border-amber-500/50',
    iconBg: 'bg-amber-500/20 text-amber-400',
  },
  {
    id: 'atlas',
    title: 'ATLAS + ARCH',
    subtitle: 'Cartographie floue',
    description: 'Cartographier sans exposer : une carte floue et une archive sensible pour retenir sans posséder.',
    icon: <Map className="h-6 w-6" />,
    gradient: 'from-emerald-950/60 to-teal-950/40',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    id: 'parlement',
    title: 'Parlement 2050',
    subtitle: 'Gouvernance du vivant',
    description: 'Décider avec la rivière : une scène de gouvernance où le vivant peut opposer un veto.',
    icon: <Users className="h-6 w-6" />,
    gradient: 'from-purple-950/60 to-violet-950/40',
    borderColor: 'border-purple-500/30 hover:border-purple-500/50',
    iconBg: 'bg-purple-500/20 text-purple-400',
  },
  {
    id: 'choeur',
    title: 'Chœur d\'apparitions',
    subtitle: 'Poésie éphémère',
    description: 'Laisser parler les seuils : un poème collectif fait d\'apparitions rares, de silences et de traces.',
    icon: <Ghost className="h-6 w-6" />,
    gradient: 'from-rose-950/60 to-pink-950/40',
    borderColor: 'border-rose-500/30 hover:border-rose-500/50',
    iconBg: 'bg-rose-500/20 text-rose-400',
  },
];

const DordoniaScenarioCards: React.FC<DordoniaScenarioCardsProps> = ({
  recommendedScenario,
  onSelectScenario,
}) => {
  return (
    <div className="space-y-6">
      {/* Recommended scenario highlight */}
      {recommendedScenario && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Scénario recommandé : <strong>{SCENARIOS.find(s => s.id === recommendedScenario)?.title}</strong></span>
          </div>
        </motion.div>
      )}

      {/* Scenario cards grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCENARIOS.map((scenario, index) => {
          const isRecommended = scenario.id === recommendedScenario;
          
          return (
            <motion.button
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectScenario(scenario.id)}
              className={`relative text-left p-6 rounded-xl border bg-gradient-to-br transition-all duration-300 group ${scenario.gradient} ${scenario.borderColor} ${
                isRecommended ? 'ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-slate-950' : ''
              }`}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${scenario.iconBg}`}>
                {scenario.icon}
              </div>

              {/* Content */}
              <h3 className="font-crimson text-lg text-foreground mb-1">
                {scenario.title}
              </h3>
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wider mb-3">
                {scenario.subtitle}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {scenario.description}
              </p>

              {/* Hover arrow */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                <span>Entrer</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default DordoniaScenarioCards;
