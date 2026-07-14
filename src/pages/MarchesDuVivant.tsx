import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, Heart, Trophy, ArrowRight, Waves, Leaf, Mic2, Sparkles, Trees, Sprout } from 'lucide-react';
import Footer from '@/components/Footer';
import PublicTopBar from '@/components/layout/PublicTopBar';
import { ArrowLeft } from 'lucide-react';
import TrustBar from '@/components/marches-vivant/TrustBar';
import ScienceCounters from '@/components/marches-vivant/ScienceCounters';

const MarchesDuVivant = () => {
  return (
    <>
      <Helmet>
        <title>Les Marches du Vivant — immersions territoriales | La Fréquence du Vivant</title>
        <meta name="description" content="Les Marches du Vivant : immersions territoriales mêlant marche sensible, bioacoustique, IA frugale et prose poétique en Charente, Nouvelle-Aquitaine, Occitanie, Pays de la Loire et Bretagne." />
        <meta name="keywords" content="marches du vivant, marche du vivant, les marches du vivant, bioacoustique, science participative, Charente, Nouvelle-Aquitaine, Occitanie, Pays de la Loire, Bretagne" />
        <link rel="canonical" href="https://la-frequence-du-vivant.com/marches-du-vivant" />
        <meta property="og:title" content="Les Marches du Vivant — immersions territoriales" />
        <meta property="og:description" content="Immersions territoriales mêlant marche sensible, bioacoustique, IA frugale et prose poétique. Charente, Nouvelle-Aquitaine, Occitanie, Pays de la Loire, Bretagne." />
        <meta property="og:url" content="https://la-frequence-du-vivant.com/marches-du-vivant" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Les Marches du Vivant — régions couvertes",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "item": { "@type": "Event", "name": "Marches du Vivant en Charente", "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode", "eventStatus": "https://schema.org/EventScheduled", "location": { "@type": "Place", "name": "Charente", "address": { "@type": "PostalAddress", "addressRegion": "Nouvelle-Aquitaine", "addressCountry": "FR" } }, "organizer": { "@type": "Organization", "name": "La Fréquence du Vivant", "url": "https://la-frequence-du-vivant.com/" } } },
            { "@type": "ListItem", "position": 2, "item": { "@type": "Event", "name": "Marches du Vivant en Nouvelle-Aquitaine", "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode", "eventStatus": "https://schema.org/EventScheduled", "location": { "@type": "Place", "name": "Nouvelle-Aquitaine", "address": { "@type": "PostalAddress", "addressRegion": "Nouvelle-Aquitaine", "addressCountry": "FR" } }, "organizer": { "@type": "Organization", "name": "La Fréquence du Vivant", "url": "https://la-frequence-du-vivant.com/" } } },
            { "@type": "ListItem", "position": 3, "item": { "@type": "Event", "name": "Marches du Vivant en Occitanie", "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode", "eventStatus": "https://schema.org/EventScheduled", "location": { "@type": "Place", "name": "Occitanie", "address": { "@type": "PostalAddress", "addressRegion": "Occitanie", "addressCountry": "FR" } }, "organizer": { "@type": "Organization", "name": "La Fréquence du Vivant", "url": "https://la-frequence-du-vivant.com/" } } },
            { "@type": "ListItem", "position": 4, "item": { "@type": "Event", "name": "Marches du Vivant en Pays de la Loire", "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode", "eventStatus": "https://schema.org/EventScheduled", "location": { "@type": "Place", "name": "Pays de la Loire", "address": { "@type": "PostalAddress", "addressRegion": "Pays de la Loire", "addressCountry": "FR" } }, "organizer": { "@type": "Organization", "name": "La Fréquence du Vivant", "url": "https://la-frequence-du-vivant.com/" } } },
            { "@type": "ListItem", "position": 5, "item": { "@type": "Event", "name": "Marches du Vivant en Bretagne", "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode", "eventStatus": "https://schema.org/EventScheduled", "location": { "@type": "Place", "name": "Bretagne", "address": { "@type": "PostalAddress", "addressRegion": "Bretagne", "addressCountry": "FR" } }, "organizer": { "@type": "Organization", "name": "La Fréquence du Vivant", "url": "https://la-frequence-du-vivant.com/" } } }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "La Fréquence du Vivant",
          "url": "https://la-frequence-du-vivant.com/",
          "logo": "https://la-frequence-du-vivant.com/favicon.png",
          "sameAs": ["https://www.gaspardboreal.com", "https://bziiit.com", "https://piloterra.fr"]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Qu'est-ce qu'une Marche du Vivant ?", "acceptedAnswer": { "@type": "Answer", "text": "Une Marche du Vivant est une immersion territoriale à pied qui combine marche sensible, bioacoustique, science participative et prose poétique. Chaque marche produit à la fois une donnée écologique et un récit." } },
            { "@type": "Question", "name": "Où se déroulent les Marches du Vivant ?", "acceptedAnswer": { "@type": "Answer", "text": "Les Marches du Vivant se déploient en Charente, en Nouvelle-Aquitaine, en Occitanie, en Pays de la Loire et en Bretagne, avec des points de départ ancrés dans les territoires ruraux et péri-urbains." } },
            { "@type": "Question", "name": "Qui organise les Marches du Vivant ?", "acceptedAnswer": { "@type": "Answer", "text": "Les Marches du Vivant sont portées par l'association La Fréquence du Vivant (loi 1901), présidée par Laurent Tripied et animées par Gaspard Boréal." } },
            { "@type": "Question", "name": "Comment participer à une marche du vivant ?", "acceptedAnswer": { "@type": "Answer", "text": "Vous pouvez explorer les marches à venir sur la page Explorer, contacter l'association pour un format entreprise, ou adhérer pour rejoindre la communauté des marcheurs." } },
            { "@type": "Question", "name": "Les Marches du Vivant sont-elles ouvertes aux entreprises ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, un format dédié team building biodiversité et séminaires dirigeants existe, avec des indicateurs RSE opposables et des restitutions cartographiées." } }
          ]
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <PublicTopBar
          tone="dark"
          leftSlot={
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span>Accueil</span>
            </Link>
          }
        />
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
                Entreprises · Grand Public · Association
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
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 text-center"
            >
              Biodiversité, Science Participative, Team Building & Exploration Gamifiée
            </motion.p>

            {/* Proposition de valeur */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base text-muted-foreground/80 max-w-xl mx-auto mb-12 text-center"
            >
              La preuve par l'expérience : ne pas "parler" de biodiversité, 
              mais l'observer, l'écouter, la mesurer en temps réel pour mieux la redévelopper
            </motion.p>
          </div>
        </section>

        {/* Split Screen - Choix de parcours */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

              {/* Card Agriculture & Coopératives */}
              <Link to="/marches-du-vivant/agriculture" onClick={() => window.scrollTo(0, 0)}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  className="group bg-card/40 backdrop-blur-sm border border-border/30 hover:border-lime-500/50 rounded-2xl p-8 h-full transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-lime-950/50 border border-lime-500/30 flex items-center justify-center mb-6">
                    <Sprout className="w-7 h-7 text-lime-400" />
                  </div>

                  <h2 className="font-crimson text-2xl text-foreground mb-3">
                    Pour les Acteurs Agricoles
                  </h2>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 text-xs bg-lime-950/30 border border-lime-500/20 rounded-full text-lime-300">
                      Coopératives & CUMA
                    </span>
                    <span className="px-2 py-1 text-xs bg-emerald-950/30 border border-emerald-500/20 rounded-full text-emerald-300">
                      Agroécologie
                    </span>
                    <span className="px-2 py-1 text-xs bg-amber-950/30 border border-amber-500/20 rounded-full text-amber-300">
                      Bio & Bocage
                    </span>
                  </div>

                  <p className="text-muted-foreground text-sm mb-6">
                    Organisez une marche sur vos parcelles pour révéler les services rendus par la biodiversité — pollinisateurs, auxiliaires, sols vivants, réseau bocager — et valoriser vos pratiques.
                  </p>

                  <div className="flex items-center gap-2 text-lime-400 group-hover:text-lime-300 transition-colors">
                    <span className="text-sm font-medium">Organiser une marche agricole</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>

              {/* Card Grand Public B2C */}
              <Link to="/marches-du-vivant/explorer" onClick={() => window.scrollTo(0, 0)}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  className="group bg-card/40 backdrop-blur-sm border border-border/30 hover:border-cyan-500/50 rounded-2xl p-8 h-full transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center mb-6">
                    <Trophy className="w-7 h-7 text-cyan-400" />
                  </div>
                  
                  <h2 className="font-crimson text-2xl text-foreground mb-3">
                    Devenez Marcheur du Vivant
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 text-xs bg-emerald-950/30 border border-emerald-500/20 rounded-full text-emerald-300">
                      Gratuit
                    </span>
                    <span className="px-2 py-1 text-xs bg-cyan-950/30 border border-cyan-500/20 rounded-full text-cyan-300">
                      Gamifié
                    </span>
                    <span className="px-2 py-1 text-xs bg-teal-950/30 border border-teal-500/20 rounded-full text-teal-300">
                      Zones Blanches
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-6">
                    Explorez les zones blanches, gagnez des points, montez dans le classement. 
                    Chaque kilomètre parcouru enrichit la connaissance du vivant.
                  </p>
                  
                  <div className="flex items-center gap-2 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    <span className="text-sm font-medium">Rejoindre l'aventure</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>

              {/* Card Association */}
              <Link to="/marches-du-vivant/association" onClick={() => window.scrollTo(0, 0)}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  className="group bg-card/40 backdrop-blur-sm border border-border/30 hover:border-amber-500/50 rounded-2xl p-8 h-full transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-center mb-6">
                    <Heart className="w-7 h-7 text-amber-400" />
                  </div>
                  
                  <h2 className="font-crimson text-2xl text-foreground mb-3">
                    L'Association
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 text-xs bg-amber-950/30 border border-amber-500/20 rounded-full text-amber-300">
                      Mission
                    </span>
                    <span className="px-2 py-1 text-xs bg-purple-950/30 border border-purple-500/20 rounded-full text-purple-300">
                      Équipe
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-6">
                    Découvrez l'équipe fondatrice, la vision et comment 
                    rejoindre l'aventure des Marches du Vivant.
                  </p>
                  
                  <div className="flex items-center gap-2 text-amber-400 group-hover:text-amber-300 transition-colors">
                    <span className="text-sm font-medium">Découvrir l'association</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <TrustBar showQualiopi={false} className="border-y border-border/20" />

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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
              {[
                {
                  icon: <Trees className="w-6 h-6 text-secondary-foreground" />,
                  title: '3 types de marches',
                  description: 'Éco poétique, éco tourisme et agroécologique : trois formats pour sensibiliser et impliquer tous les publics dans leur rapport au vivant.',
                  color: 'secondary',
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
                {
                  icon: <Trophy className="w-6 h-6 text-cyan-400" />,
                  title: 'Exploration Gamifiée',
                  description: 'Gagnez des points, explorez les zones blanches, montez dans le classement.',
                  color: 'cyan',
                },
                {
                  icon: <Sparkles className="w-6 h-6 text-blue-400" />,
                  title: 'Data RSE Opposable',
                  description: 'Protocoles connectés au GBIF pour produire des données CSRD certifiées.',
                  color: 'blue',
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

        {/* FAQ SEO — Marches du Vivant */}
        <section className="py-16 px-6 border-t border-border/20" aria-labelledby="faq-mdv">
          <div className="max-w-3xl mx-auto">
            <h2 id="faq-mdv" className="font-crimson text-3xl text-foreground mb-8 text-center">Questions fréquentes sur les Marches du Vivant</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-crimson text-xl text-foreground mb-2">Qu'est-ce qu'une marche du vivant ?</h3>
                <p className="text-muted-foreground">Une marche du vivant est une immersion territoriale à pied qui combine marche sensible, bioacoustique, science participative et prose poétique. Chaque marche du vivant produit à la fois une donnée écologique opposable et un récit géopoétique du territoire traversé.</p>
              </div>
              <div>
                <h3 className="font-crimson text-xl text-foreground mb-2">Où vivre les Marches du Vivant ?</h3>
                <p className="text-muted-foreground">Les Marches du Vivant se déploient en Charente, en Nouvelle-Aquitaine, en Occitanie, en Pays de la Loire et en Bretagne, avec des points de départ ancrés dans les territoires ruraux et péri-urbains.</p>
              </div>
              <div>
                <h3 className="font-crimson text-xl text-foreground mb-2">Qui porte les Marches du Vivant ?</h3>
                <p className="text-muted-foreground">Les Marches du Vivant sont portées par l'association <Link to="/marches-du-vivant/association" className="text-emerald-400 underline">La Fréquence du Vivant</Link> (loi 1901), présidée par Laurent Tripied et animées par Gaspard Boréal.</p>
              </div>
              <div>
                <h3 className="font-crimson text-xl text-foreground mb-2">Comment participer à une marche du vivant ?</h3>
                <p className="text-muted-foreground">Vous pouvez <Link to="/marches-du-vivant/explorer" className="text-emerald-400 underline">explorer les marches à venir</Link>, solliciter un format <Link to="/marches-du-vivant/entreprises" className="text-emerald-400 underline">entreprise</Link>, ou <Link to="/marches-du-vivant/association" className="text-emerald-400 underline">adhérer à l'association</Link>.</p>
              </div>
            </div>
          </div>
        </section>

        <Footer variant="marches" />
      </div>
    </>
  );
};

export default MarchesDuVivant;
