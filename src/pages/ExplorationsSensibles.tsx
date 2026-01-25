import React from 'react';
import { motion } from 'framer-motion';
import { Waves, TreeDeciduous, Wheat, ExternalLink, MapPin, Compass, Check, Leaf, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import DecorativeElements from '@/components/DecorativeElements';

const DORDOGNE_URL = '/galerie-fleuve/exploration/remontee-dordogne-atlas-eaux-vivantes-2025-2045';
const DORDOGNE_BIODIVERSITE_URL = `${DORDOGNE_URL}/biodiversite`;
interface ThemeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive?: boolean;
  comingSoon?: boolean;
  delay?: number;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ 
  icon, 
  title, 
  description, 
  isActive = false, 
  comingSoon = false,
  delay = 0 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={`relative gaspard-card rounded-xl p-6 ${
      isActive 
        ? 'border-emerald-500/30 bg-emerald-950/20' 
        : 'border-border/20 opacity-70'
    }`}
  >
    {comingSoon && (
      <span className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
        à venir
      </span>
    )}
    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
      isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted/30 text-muted-foreground'
    }`}>
      {icon}
    </div>
    <h3 className="font-crimson text-xl text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </motion.div>
);

const ExplorationsSensibles: React.FC = () => {
  const navigate = useNavigate();

  const handleEnterExploration = () => {
    window.open(DORDOGNE_URL, '_blank', 'noopener,noreferrer');
  };

  const handleOpenBiodiversite = () => {
    window.open(DORDOGNE_BIODIVERSITE_URL, '_blank', 'noopener,noreferrer');
  };

  const handleOpenDordonia = () => {
    navigate('/dordonia');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <DecorativeElements />
      
      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/20 mb-6"
          >
            <Compass className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-300">Explorations Sensibles</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-crimson text-4xl md:text-5xl text-foreground mb-4"
          >
            Traversées poétiques des territoires en mutation
          </motion.h1>
        </div>
      </header>

      {/* Introduction poétique */}
      <section className="relative z-10 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 text-muted-foreground leading-relaxed"
          >
            <p className="text-lg">
              Une exploration sensible, c'est une invitation à marcher autrement.
              Ni randonnée touristique, ni étude académique : <em className="text-foreground">une immersion
              où le pas devient écoute, où le regard devient récit</em>.
            </p>
            <p>
              Chaque exploration rassemble plusieurs marches poétiques autour
              d'un fil conducteur — une rivière, une forêt, un terroir —
              pour tisser ensemble les voix du vivant, les mémoires du lieu
              et les imaginaires de demain.
            </p>
            <p className="text-sm italic border-l-2 border-emerald-500/30 pl-4">
              « Je veux du spectre vivant, pas seulement du spectrogramme. »
            </p>
          </motion.div>
        </div>
      </section>

      {/* Thématiques */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-crimson text-2xl text-foreground mb-8 text-center"
          >
            Trois territoires, trois écoutes
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <ThemeCard
              icon={<Waves className="h-6 w-6" />}
              title="La Rivière"
              description="Remonter le cours d'eau comme on remonte le temps. Écouter ce que l'eau raconte aux berges, ce que les oiseaux confient au mascaret."
              isActive
              delay={0.4}
            />
            <ThemeCard
              icon={<TreeDeciduous className="h-6 w-6" />}
              title="La Forêt"
              description="Pénétrer la lisière où la technodiversité rencontre le sauvage. Cartographier les silences, recueillir les murmures feuillus."
              comingSoon
              delay={0.5}
            />
            <ThemeCard
              icon={<Wheat className="h-6 w-6" />}
              title="L'Agroécologie"
              description="Arpenter les paysages de la transition. Entre vignes résilientes et prairies régénérées, documenter les gestes qui réparent."
              comingSoon
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Première exploration */}
      <section className="relative z-10 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-cyan-950/30 to-blue-950/40 border border-emerald-500/20"
          >
            {/* Effet de vagues subtil */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/20 to-transparent" />
            </div>
            
            <div className="relative p-8 md:p-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Waves className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-400/80 mb-1 block">
                    Première exploration disponible
                  </span>
                  <h3 className="font-crimson text-2xl md:text-3xl text-foreground">
                    Fréquences de la rivière Dordogne
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Atlas des Vivants — De l'estuaire aux sources
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                    <Check className="h-3.5 w-3.5" />
                    Disponible depuis janvier 2026
                  </span>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-8 max-w-2xl">
                Deux semaines pour remonter la rivière Dordogne, de Bec d'Ambès au Mont Dore.
                Deux semaines d'écoute poétique et bioacoustique pour imaginer nos futurs désirables.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span className="text-foreground font-medium">15 marches</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Compass className="h-4 w-4 text-cyan-400" />
                  <span className="text-foreground font-medium">3 régions traversées</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Waves className="h-4 w-4 text-blue-400" />
                  <span className="text-foreground font-medium">6 départements</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleEnterExploration}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  Entrer dans l'exploration
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={handleOpenBiodiversite}
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/50 px-6 py-3 rounded-lg font-medium transition-all"
                >
                  <Leaf className="mr-2 h-4 w-4" />
                  3 100+ espèces
                </Button>
                <Button
                  onClick={handleOpenDordonia}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Découvrez Dordonia
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Citation finale */}

      {/* Citation finale */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="font-crimson text-xl text-muted-foreground italic"
          >
            « Chaque marche est une strophe, chaque exploration un poème géographique. »
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-sm text-muted-foreground/60 mt-3"
          >
            — Gaspard Boréal, Poète des Mondes Hybrides
          </motion.p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ExplorationsSensibles;
