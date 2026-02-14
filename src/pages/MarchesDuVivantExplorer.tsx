import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, MapPin, Flame, Construction } from 'lucide-react';
import Footer from '@/components/Footer';

const MarchesDuVivantExplorer = () => {
  return (
    <>
      <Helmet>
        <title>Explorez & Collectez - Les Marches du Vivant</title>
        <meta 
          name="description" 
          content="Marchez, explorez les zones blanches, gagnez des points. Chaque kilomètre compte pour la biodiversité. Rejoignez l'aventure gamifiée des Marches du Vivant." 
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center mx-auto mb-8">
              <Construction className="w-8 h-8 text-cyan-400" />
            </div>

            <h1 className="font-crimson text-4xl md:text-5xl text-foreground mb-4">
              Bientôt disponible
            </h1>

            <p className="text-muted-foreground text-lg mb-4">
              L'exploration gamifiée des Marches du Vivant arrive bientôt.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { icon: <Trophy className="w-4 h-4" />, label: 'Système de points' },
                { icon: <MapPin className="w-4 h-4" />, label: 'Zones blanches' },
                { icon: <Flame className="w-4 h-4" />, label: 'Séries & défis' },
              ].map(item => (
                <span key={item.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-950/30 border border-cyan-500/20 rounded-full text-cyan-300">
                  {item.icon}
                  {item.label}
                </span>
              ))}
            </div>

            <Link 
              to="/marches-du-vivant"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour aux Marches du Vivant</span>
            </Link>
          </motion.div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default MarchesDuVivantExplorer;
