import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, ArrowRight, Waves, Leaf, Mic2, Sparkles } from 'lucide-react';
import Footer from '@/components/Footer';
import TrustBar from '@/components/marches-vivant/TrustBar';
import ScienceCounters from '@/components/marches-vivant/ScienceCounters';

const MarchesDuVivant = () => {
  return (
    <>
      <Helmet>
        <title>Les Marches du Vivant - Team Building Scientifique & Bioacoustique Dordogne</title>
        <meta 
          name="description" 
          content="Formations Qualiopi et team building bioacoustique en Nouvelle-Aquitaine. Science participative, biodiversité et leadership. Reconnectez vos équipes au vivant." 
        />
        <meta 
          name="keywords" 
          content="team building scientifique, bioacoustique entreprise, formation Qualiopi RSE, séminaire biodiversité, Dordogne, science participative" 
        />
        <link rel="canonical" href="https://la-frequence-du-vivant.com/marches-du-vivant" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          {/* Background avec gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/30 to-secondary/20" />
          
          {/* Éléments décoratifs animés */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl"
            />
            <motion.div
              animate={{ 
                y: [0, 20, 0],
                opacity: [0.1, 0.15, 0.1]
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl"
            />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-full mb-8"
            >
              <Waves className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs uppercase tracking-wide text-emerald-300">
                Team Building & Formations
              </span>
            </motion.div>

            {/* Titre */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-crimson text-5xl md:text-7xl lg:text-8xl text-foreground mb-6"
            >
              Les Marches<br />
              <span className="text-emerald-400">du Vivant</span>
            </motion.h1>

            {/* Sous-titre */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12"
            >
              Team Building Scientifique & Bioacoustique
            </motion.p>

            {/* Proposition de valeur */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base text-muted-foreground/80 max-w-xl mx-auto mb-12"
            >
              La preuve par l'expérience : ne pas "parler" de biodiversité, 
              mais la mesurer et l'écouter en temps réel.
            </motion.p>
          </div>
        </section>

        {/* Split Screen - Choix de parcours */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Entreprises */}
              <Link to="/marches-du-vivant/entreprises" onClick={() => window.scrollTo(0, 0)}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  className="group bg-card/40 backdrop-blur-sm border border-border/30 hover:border-emerald-500/50 rounded-2xl p-8 h-full transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center mb-6">
                    <Building2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  
                  <h2 className="font-crimson text-2xl text-foreground mb-3">
                    Pour les Entreprises et Collectivités
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 text-xs bg-emerald-950/30 border border-emerald-500/20 rounded-full text-emerald-300">
                      RSE
                    </span>
                    <span className="px-2 py-1 text-xs bg-orange-950/30 border border-orange-500/20 rounded-full text-orange-300">
                      Innovation
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-950/30 border border-blue-500/20 rounded-full text-blue-300">
                      Qualiopi
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-6">
                    Formations certifiées et team building pour reconnecter vos équipes au vivant. 
                    Produisez de la donnée RSE opposable (CSRD).
                  </p>
                  
                  <div className="flex items-center gap-2 text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    <span className="text-sm font-medium">Découvrir les formations</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>

              {/* Card Grand Public */}
              <Link to="/marches-du-vivant/association" onClick={() => window.scrollTo(0, 0)}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  className="group bg-card/40 backdrop-blur-sm border border-border/30 hover:border-amber-500/50 rounded-2xl p-8 h-full transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-center mb-6">
                    <Users className="w-7 h-7 text-amber-400" />
                  </div>
                  
                  <h2 className="font-crimson text-2xl text-foreground mb-3">
                    Grand Public et Association
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 text-xs bg-amber-950/30 border border-amber-500/20 rounded-full text-amber-300">
                      Science Participative
                    </span>
                    <span className="px-2 py-1 text-xs bg-purple-950/30 border border-purple-500/20 rounded-full text-purple-300">
                      Émerveillement
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-6">
                    Rejoignez la communauté des Marcheurs du Vivant. 
                    Devenez ambassadeur et transmettez l'art de l'écoute.
                  </p>
                  
                  <div className="flex items-center gap-2 text-amber-400 group-hover:text-amber-300 transition-colors">
                    <span className="text-sm font-medium">Rejoindre la communauté</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <TrustBar className="border-y border-border/20" />

        {/* Différenciateurs */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-crimson text-3xl text-foreground mb-4">
                Ce qui nous différencie
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Une approche unique mêlant sciences, arts narratifs et pratique de l'instant présent
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Sparkles className="w-6 h-6 text-blue-400" />,
                  title: 'Data RSE Opposable',
                  description: 'Protocoles connectés au GBIF pour produire des données CSRD certifiées.',
                  color: 'blue',
                },
                {
                  icon: <Mic2 className="w-6 h-6 text-emerald-400" />,
                  title: 'Bioacoustique Immersive',
                  description: 'Écoutez le vivant avec des outils de reconnaissance IA sobres et accessibles.',
                  color: 'emerald',
                },
                {
                  icon: <Leaf className="w-6 h-6 text-amber-400" />,
                  title: 'Science Participative',
                  description: 'Chaque marche contribue à la connaissance collective de la biodiversité.',
                  color: 'amber',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card/30 border border-border/30 rounded-xl p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-background/50 flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-crimson text-lg text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Compteurs Science Participative */}
        <ScienceCounters className="border-t border-border/20" />

        {/* CTA vers partenaires */}
        <section className="py-16 px-6 bg-card/20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-crimson text-3xl text-foreground mb-4">
                7 lieux partenaires le long de la Dordogne
              </h2>
              <p className="text-muted-foreground mb-8">
                Organisez votre séminaire ou team building dans des hébergements partenaires, 
                au cœur de territoires riches en biodiversité.
              </p>
              <Link 
                to="/marches-du-vivant/partenaires"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                Découvrir les lieux
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default MarchesDuVivant;
