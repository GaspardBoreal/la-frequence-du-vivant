import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, BookOpen, Quote, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import FormationSection from '@/components/FormationSection';
import OutilsSection from '@/components/OutilsSection';
import ConstellationSection from '@/components/ConstellationSection';
import Footer from '@/components/Footer';

const MaterielPedagogique: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Matériel Pédagogique | Les Marches du Vivant</title>
        <meta 
          name="description" 
          content="Ressources pédagogiques pour les formations Les Marches du Vivant. Parcours Marcheur, Ambassadeur et Animateur pour explorer et documenter les territoires en transition." 
        />
        <meta 
          name="keywords" 
          content="formation, pédagogie, marches du vivant, biodiversité, territoire, transition écologique, marcheur, ambassadeur, animateur" 
        />
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col">
        {/* Éléments décoratifs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-10 pt-8 pb-8">
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
              <Badge variant="outline" className="mb-6 border-purple-500/30 text-purple-400">
                <GraduationCap className="w-4 h-4 mr-2" />
                Ressources Académiques
              </Badge>
              
              <h1 className="font-crimson text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
                Matériel pédagogique
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-crimson italic">
                Les Marches du Vivant — Former, transmettre, incarner
              </p>
            </motion.div>

            {/* Citation d'intention */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 max-w-2xl mx-auto"
            >
              <div className="relative bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-8">
                <Quote className="absolute -top-3 -left-3 w-8 h-8 text-purple-400/40" />
                <p className="font-crimson text-xl md:text-2xl text-center text-foreground/90 italic leading-relaxed">
                  Marcher pour écouter.<br />
                  Écouter pour habiter.<br />
                  Habiter sans posséder.
                </p>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Section Parcours de Formation */}
        <section className="relative z-10">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center pt-12 pb-4"
            >
              <h2 className="font-crimson text-2xl md:text-3xl text-foreground mb-3">
                Parcours de formation
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Un programme expérientiel pour devenir marcheur, ambassadeur 
                ou animateur des territoires en transition.
              </p>
            </motion.div>
          </div>
          <FormationSection />
        </section>

        {/* Section Outils du Marcheur */}
        <OutilsSection />

        {/* Section Constellation des Voix Territoriales */}
        <ConstellationSection />

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
                <span className="text-purple-300">c'est éveiller une capacité d'attention au vivant</span><br />
                <span className="text-cyan-300">et faire naître le désir de raconter ce qui a été vécu.</span>
              </p>
              
              <p className="mt-6 text-muted-foreground font-libre">— Philosophie des Marches du Vivant</p>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default MaterielPedagogique;
