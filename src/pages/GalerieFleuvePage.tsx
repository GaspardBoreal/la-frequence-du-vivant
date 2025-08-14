import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wind, Clock, Grid3X3, Eye, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import GalerieFleuve from '../components/GalerieFleuve';
import { Link } from 'react-router-dom';
import { useSupabaseMarches } from '../hooks/useSupabaseMarches';
import { REGIONAL_THEMES } from '../utils/regionalThemes';

const GalerieFleuvePage: React.FC = () => {
  const { data: marches = [], isLoading } = useSupabaseMarches();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-green-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Initialisation de la Galerie-Fleuve...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec introduction poétique */}
      <motion.div
        className="relative bg-gradient-to-b from-primary/10 via-secondary/5 to-background p-6 border-b"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Navigation retour */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/explorations">
              <Button variant="ghost" className="gap-2 hover:bg-white/20">
                <ArrowLeft className="h-4 w-4" />
                Retour aux explorations
              </Button>
            </Link>
            
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Innovation Galerie
            </Badge>
          </div>

          {/* Titre principal */}
          <motion.div
            className="text-center mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                La Galerie-Fleuve
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Une expérience révolutionnaire pour explorer toutes les photos des explorations 
              bioacoustiques dans leur diversité territoriale et temporelle
            </p>
          </motion.div>

          {/* Description des modes de navigation */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[
              {
                icon: Wind,
                mode: 'Fleuve',
                description: 'Navigation fluide comme une remontée de rivière',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Clock,
                mode: 'Temporelle',
                description: 'Timeline interactive des moments capturés',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: Grid3X3,
                mode: 'Mosaïque',
                description: 'Grille adaptative révélant les territoires',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: Eye,
                mode: 'Immersion',
                description: 'Plongée contemplative dans chaque fragment',
                color: 'from-orange-500 to-red-500'
              }
            ].map(({ icon: Icon, mode, description, color }) => (
              <div
                key={mode}
                className="bg-card/50 backdrop-blur-sm border rounded-xl p-4 text-center hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-card-foreground mb-2">{mode}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </motion.div>

          {/* Statistiques et informations */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 text-center"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-card/30 rounded-lg px-4 py-2">
              <div className="text-2xl font-bold text-primary">{marches.length}</div>
              <div className="text-sm text-muted-foreground">Explorations</div>
            </div>
            <div className="bg-card/30 rounded-lg px-4 py-2">
              <div className="text-2xl font-bold text-secondary">4</div>
              <div className="text-sm text-muted-foreground">Modes de vue</div>
            </div>
            <div className="bg-card/30 rounded-lg px-4 py-2">
              <div className="text-2xl font-bold text-accent">∞</div>
              <div className="text-sm text-muted-foreground">Perspectives</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Instructions d'utilisation mobile-first */}
      <motion.div
        className="bg-muted/30 p-4 text-center border-b"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          <span className="font-medium">Mobile First :</span> Utilisez les contrôles en bas d'écran pour naviguer entre les modes. 
          Touchez les photos pour les explorer en détail.
        </p>
      </motion.div>

      {/* Galerie principale */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <GalerieFleuve 
          explorations={marches} 
          themes={Object.values(REGIONAL_THEMES)}
        />
      </motion.div>
    </div>
  );
};

export default GalerieFleuvePage;