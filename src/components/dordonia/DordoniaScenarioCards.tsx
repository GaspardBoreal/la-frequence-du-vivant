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
  // Séparer le scénario recommandé des autres
  const recommended = SCENARIOS.find(s => s.id === recommendedScenario);
  const otherScenarios = SCENARIOS.filter(s => s.id !== recommendedScenario);

  // Si pas de recommandation, afficher tous les scénarios normalement
  if (!recommended) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCENARIOS.map((scenario, index) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onSelect={onSelectScenario}
            delay={index * 0.1}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* === SECTION 1: Scénario Recommandé === */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col items-center"
      >
        {/* Label "Recommandé pour vous" */}
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-4 w-4 text-cyan-400/80" />
          <span className="text-sm uppercase tracking-[0.2em] text-cyan-400/70 font-light">
            Recommandé pour vous
          </span>
          <Sparkles className="h-4 w-4 text-cyan-400/80" />
        </div>
        
        {/* Carte héros du scénario recommandé */}
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => onSelectScenario(recommended.id)}
          className={`w-full max-w-xl p-8 rounded-2xl border-2 bg-gradient-to-br transition-all duration-500 group text-left ${recommended.gradient} ${recommended.borderColor} ring-1 ring-cyan-500/10`}
        >
          {/* Icône centrée */}
          <div className="flex justify-center mb-6">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${recommended.iconBg}`}>
              {React.cloneElement(recommended.icon as React.ReactElement, { className: 'h-8 w-8' })}
            </div>
          </div>

          {/* Contenu centré */}
          <div className="text-center">
            <h3 className="font-crimson text-2xl text-foreground mb-2">
              {recommended.title}
            </h3>
            <p className="text-xs text-muted-foreground/70 uppercase tracking-wider mb-4">
              {recommended.subtitle}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto">
              {recommended.description}
            </p>

            {/* Bouton "Entrer" */}
            <div className="flex items-center justify-center gap-2 text-foreground group-hover:text-cyan-400 transition-colors">
              <span className="font-medium">Entrer dans ce scénario</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.button>
      </motion.section>

      {/* === SECTION 2: Séparateur Poétique === */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="flex items-center gap-6 py-4"
      >
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
        <p className="font-crimson text-base italic text-muted-foreground/50 whitespace-nowrap">
          Autres voies de dialogue avec Dordonia
        </p>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
      </motion.div>

      {/* === SECTION 3: Grille des Alternatives === */}
      <div className="grid md:grid-cols-2 gap-4">
        {otherScenarios.map((scenario, index) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onSelect={onSelectScenario}
            delay={0.6 + index * 0.1}
            isAlternative
          />
        ))}
      </div>
    </div>
  );
};

// Composant carte réutilisable
interface ScenarioCardProps {
  scenario: ScenarioCardData;
  onSelect: (id: DordoniaScenario) => void;
  delay: number;
  isAlternative?: boolean;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onSelect,
  delay,
  isAlternative = false,
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      onClick={() => onSelect(scenario.id)}
      className={`relative text-left rounded-xl border bg-gradient-to-br transition-all duration-300 group ${scenario.gradient} ${scenario.borderColor} ${
        isAlternative ? 'p-5 opacity-90 hover:opacity-100' : 'p-6'
      }`}
    >
      {/* Icon */}
      <div className={`rounded-lg flex items-center justify-center mb-4 ${scenario.iconBg} ${
        isAlternative ? 'w-10 h-10' : 'w-12 h-12'
      }`}>
        {isAlternative 
          ? React.cloneElement(scenario.icon as React.ReactElement, { className: 'h-5 w-5' })
          : scenario.icon
        }
      </div>

      {/* Content */}
      <h3 className={`font-crimson text-foreground mb-1 ${isAlternative ? 'text-base' : 'text-lg'}`}>
        {scenario.title}
      </h3>
      <p className="text-xs text-muted-foreground/70 uppercase tracking-wider mb-3">
        {scenario.subtitle}
      </p>
      <p className={`text-muted-foreground leading-relaxed mb-4 ${isAlternative ? 'text-xs' : 'text-sm'}`}>
        {scenario.description}
      </p>

      {/* Hover arrow */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        <span>Entrer</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.button>
  );
};

export default DordoniaScenarioCards;
