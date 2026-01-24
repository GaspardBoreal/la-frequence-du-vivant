
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Quote } from 'lucide-react';
import FormationSection from '@/components/FormationSection';
import Footer from '@/components/Footer';

const MaterielPedagogique: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex flex-col">
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Navigation retour */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link 
              to="/explorations-sensibles" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft size={18} />
              <span>Retour aux explorations</span>
            </Link>
          </motion.div>

          {/* Titre principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <BookOpen size={16} className="text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">Ressources Académiques</span>
            </div>
            
            <h1 className="font-crimson text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
              Matériel pédagogique
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Les Marches du Vivant — Former, transmettre, incarner une écoute du vivant
            </p>
          </motion.div>

        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 relative z-10">
        <FormationSection />
      </main>

      {/* Citation de clôture */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 py-16"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-sm border border-border/30 rounded-2xl p-10">
            <Quote className="absolute top-4 left-4 w-10 h-10 text-purple-400/30" />
            <Quote className="absolute bottom-4 right-4 w-10 h-10 text-cyan-400/30 rotate-180" />
            
            <p className="font-crimson text-2xl md:text-3xl text-foreground/90 italic leading-relaxed">
              Former des marcheurs,<br />
              ce n'est pas transmettre une méthode,<br />
              <span className="text-purple-300">c'est ouvrir une qualité d'écoute</span><br />
              <span className="text-cyan-300">et d'écriture poétique.</span>
            </p>
            
            <p className="mt-6 text-muted-foreground">— Gaspard Boréal</p>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MaterielPedagogique;
