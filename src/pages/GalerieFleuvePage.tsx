import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Wind, Clock, Grid3X3, Eye, Sparkles, Camera, MapPin, Waves } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import GalerieFleuve from '../components/GalerieFleuve';
import { useSupabaseMarches } from '../hooks/useSupabaseMarches';
import { REGIONAL_THEMES } from '../utils/regionalThemes';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

const GalerieFleuvePage: React.FC = () => {
  const { data: marches = [], isLoading } = useSupabaseMarches();
  const [showWelcome, setShowWelcome] = useState(true);

  // Calculate statistics
  const totalPhotos = marches.reduce((sum, marche) => sum + (marche.photos?.length || 0), 0);
  const regions = [...new Set(marches.map(m => m.region).filter(Boolean))];
  
  // Animated counters
  const animatedMarches = useAnimatedCounter(marches.length, 1200, 500);
  const animatedPhotos = useAnimatedCounter(totalPhotos, 1500, 700);
  const animatedRegions = useAnimatedCounter(regions.length, 800, 900);

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

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Particles d'eau flottantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-200/30 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: window.innerHeight + 20,
                opacity: 0 
              }}
              animate={{ 
                y: -20, 
                opacity: [0, 0.6, 0],
                x: Math.random() * window.innerWidth 
              }}
              transition={{ 
                duration: 8 + Math.random() * 4, 
                repeat: Infinity, 
                delay: Math.random() * 5 
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-6 py-12 min-h-screen flex flex-col">
          {/* Badge de contexte */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
              <Waves className="h-4 w-4 mr-2" />
              Galerie Fleuve
            </Badge>
          </motion.div>

          {/* Titre principal du périple */}
          <motion.div
            className="text-center mb-12 max-w-4xl mx-auto"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-tight mb-6">
              <span className="text-slate-800 dark:text-slate-100">
                Fréquences de la rivière
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-800">
                Dordogne
              </span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-emerald-500 mx-auto mb-6 rounded-full" />
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-light leading-relaxed">
              Atlas des vivants — Remontée techno-sensible
            </p>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
              Un périple de <strong>480 kilomètres</strong> à travers <strong>6 départements</strong>, 
              cartographiant les fréquences du vivant entre Bergerac et les volcans d'Auvergne
            </p>
          </motion.div>

          {/* Statistiques du périple */}
          <motion.div
            className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-16"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {animatedMarches}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">marches</div>
            </div>
            <div className="text-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50">
              <div className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                {animatedPhotos}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">visuels</div>
            </div>
            <div className="text-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {animatedRegions}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">régions</div>
            </div>
          </motion.div>

          {/* Navigation des modes d'immersion */}
          <motion.div
            className="max-w-5xl mx-auto mb-16"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-2xl md:text-3xl font-serif text-center mb-8 text-slate-800 dark:text-slate-100">
              Modes d'immersion dans l'atlas vivant
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Sparkles,
                  mode: 'Galerie',
                  description: 'Navigation spatiale des souvenirs photographiques',
                  color: 'from-purple-500 to-pink-500'
                },
                {
                  icon: Wind,
                  mode: 'Fleuve temporel',
                  description: 'Chronologie fluide du périple au fil de l\'eau',
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  icon: Grid3X3,
                  mode: 'Mosaïque vivante',
                  description: 'Composition visuelle révélant les territoires',
                  color: 'from-green-500 to-emerald-500'
                },
                {
                  icon: Eye,
                  mode: 'Écoute attentive',
                  description: 'Plongée contemplative dans chaque fragment',
                  color: 'from-orange-500 to-red-500'
                }
              ].map(({ icon: Icon, mode, description, color }, index) => (
                <motion.div
                  key={mode}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2 text-lg">{mode}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bouton d'entrée */}
          <motion.div
            className="text-center mb-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <Button
              onClick={() => setShowWelcome(false)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Commencer l'exploration
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>

          {/* Signature de Gaspard Boréal */}
          <motion.div
            className="mt-auto text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            <div className="text-2xl font-libre text-slate-700 dark:text-slate-300 mb-1">
              Gaspard Boréal
            </div>
            <div className="text-sm font-mono text-slate-500 dark:text-slate-400 tracking-wide">
              Poète des Mondes Hybrides
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Galerie principale */}
        <GalerieFleuve 
          explorations={marches} 
          themes={Object.values(REGIONAL_THEMES)}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default GalerieFleuvePage;