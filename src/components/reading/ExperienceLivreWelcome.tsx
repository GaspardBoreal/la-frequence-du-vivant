// Phase 3.1: Revolutionary Reading Experience - L'Invitation
// 3-level architecture entry point for immersive literary experience

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Map,
  Sparkles,
  Beaker,
  ArrowRight,
  Library,
  Users,
  Brain
} from 'lucide-react';
import type { Exploration, ExplorationMarcheComplete } from '@/hooks/useExplorations';
import type { WelcomeComposition } from '@/utils/welcomeComposer';

interface Props {
  exploration: Exploration;
  marches: ExplorationMarcheComplete[];
  composition: WelcomeComposition;
  onEnterMode: (mode: 'chemin-marches' | 'archipel-themes' | 'laboratoire-formes') => void;
}

interface EntryMode {
  id: 'chemin-marches' | 'archipel-themes' | 'laboratoire-formes';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  stats: string;
}

const ExperienceLivreWelcome: React.FC<Props> = ({ exploration, marches, composition, onEnterMode }) => {
  const entryModes: EntryMode[] = [
    {
      id: 'chemin-marches',
      title: 'Le Chemin des Marches',
      description: 'Lecture chronologique suivant le parcours géographique des explorations',
      icon: Map,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-blue-500/20',
      stats: `${composition.stats.marches} marches explorées`,
    },
    {
      id: 'archipel-themes',
      title: 'L\'Archipel des Thèmes',
      description: 'Navigation immersive par liens thématiques et sémantiques',
      icon: Sparkles,
      gradient: 'from-violet-500/20 via-purple-500/10 to-pink-500/20',
      stats: `${composition.stats.tags.length} thèmes interconnectés`,
    },
    {
      id: 'laboratoire-formes',
      title: 'Le Laboratoire des Formes',
      description: 'Découverte par types de textes et expérimentations littéraires',
      icon: Beaker,
      gradient: 'from-amber-500/20 via-orange-500/10 to-red-500/20',
      stats: 'Formes poétiques variées',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-12">
        
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-5xl font-bold mb-4">
              Entrer dans l'Univers Littéraire
            </h1>
            <h2 className="text-2xl text-muted-foreground mb-2">
              de Gaspard Boréal
            </h2>
            <div className="text-lg text-primary font-medium">
              « {composition.title} »
            </div>
          </div>

          {/* Stats Overview */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { icon: Library, label: 'Textes', value: composition.stats.photos + composition.stats.audio },
              { icon: Map, label: 'Marches', value: composition.stats.marches },
              { icon: Users, label: 'Régions', value: composition.stats.regions.length },
              { icon: Brain, label: 'Thèmes', value: composition.stats.tags.length },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <stat.icon className="h-4 w-4 mr-2" />
                  {stat.value} {stat.label}
                </Badge>
              </motion.div>
            ))}
          </div>

          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Choisissez votre porte d'entrée dans cette expérience littéraire révolutionnaire. 
            Chaque mode révèle une facette différente de l'écriture territorialisée 
            et de la poésie des mondes hybrides.
          </p>
        </motion.div>

        {/* Entry Modes */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {entryModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Card className={`h-full bg-gradient-to-br ${mode.gradient} border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer`}>
                <CardHeader className="text-center pb-4">
                  <div className="mb-4">
                    <div className="h-16 w-16 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <mode.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    {mode.title}
                  </CardTitle>
                  <Badge variant="outline" className="mx-auto mt-2">
                    {mode.stats}
                  </Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {mode.description}
                  </p>
                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                    variant="outline"
                    onClick={() => onEnterMode(mode.id)}
                  >
                    Explorer ce mode
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Manifesto */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-8">
              <blockquote className="text-lg italic text-muted-foreground leading-relaxed">
                "Cette application révolutionne l'expérience de lecture en créant un dialogue 
                permanent entre le territoire exploré, les données captées et l'écriture générée. 
                Elle inaugure un nouveau standard pour la littérature numérique du XXIe siècle."
              </blockquote>
              <div className="mt-4 text-sm text-primary font-medium">
                — La Comédie des Mondes Hybrides, 2025-2037
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ExperienceLivreWelcome;