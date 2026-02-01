import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import Footer from '@/components/Footer';
import TrustBar from '@/components/marches-vivant/TrustBar';
import FormationCard, { FormationData } from '@/components/marches-vivant/FormationCard';
import ContactFormB2B from '@/components/marches-vivant/ContactFormB2B';
import ProofBar from '@/components/marches-vivant/ProofBar';
import MarchesShowcase from '@/components/marches-vivant/MarchesShowcase';
import TerritorialCoverageMap from '@/components/marches-vivant/TerritorialCoverageMap';
import CSRDProofSection from '@/components/marches-vivant/CSRDProofSection';
import { Button } from '@/components/ui/button';
import { Database, Mic2, Sparkles, Leaf, Heart } from 'lucide-react';

// Données des formations
const formations: FormationData[] = [
  {
    id: 'data-biodiversite',
    titre: 'DATA & Biodiversité',
    sousTitre: 'Piloter la Transition',
    duree: '1 jour (7h)',
    objectif: 'Intégrer la biodiversité dans vos indicateurs RSE avec des protocoles de collecte connectés au GBIF. Produisez de la donnée opposable CSRD.',
    cible: 'DRH, Responsables RSE',
    icon: Database,
    couleur: 'blue',
    tags: ['CSRD', 'Indicateurs', 'Data'],
  },
  {
    id: 'bioacoustique-leadership',
    titre: 'Bioacoustique & Leadership',
    sousTitre: 'Cohésion & Écoute',
    duree: '1/2 journée (3h30)',
    objectif: 'Développez l\'écoute active de vos équipes à travers l\'expérience bioacoustique. Spectrogrammes, reconnaissance d\'espèces et silence actif.',
    cible: 'Équipes, Managers',
    icon: Mic2,
    couleur: 'emerald',
    tags: ['Team Building', 'Écoute', 'Cohésion'],
  },
  {
    id: 'ia-vivant',
    titre: 'Nouveaux Récits',
    sousTitre: 'L\'IA au Service du Vivant',
    duree: '2 jours (14h)',
    objectif: 'Découvrez les outils d\'IA frugale pour la reconnaissance d\'espèces et la création de récits territoriaux. De la donnée au récit engageant.',
    cible: 'Équipes Innovation',
    icon: Sparkles,
    couleur: 'purple',
    tags: ['IA Frugale', 'Créativité', 'Récits'],
  },
  {
    id: 'sentinelles-vivant',
    titre: 'Sentinelles du Vivant',
    sousTitre: 'Science Participative',
    duree: '1 jour (7h)',
    objectif: 'Apprenez à collecter et transmettre des observations naturalistes. Devenez contributeur actif de la connaissance biodiversité.',
    cible: 'Tout public entreprise',
    icon: Leaf,
    couleur: 'emerald',
    tags: ['GBIF', 'iNaturalist', 'Observation'],
  },
  {
    id: 'instant-present',
    titre: 'Design de l\'Instant Présent',
    sousTitre: 'QVT & Déconnexion',
    duree: '1/2 journée (3h30)',
    objectif: 'Une marche immersive pour développer l\'attention au présent. Silence, observation et reconnexion sensorielle pour le bien-être au travail.',
    cible: 'QVT, RH',
    icon: Heart,
    couleur: 'orange',
    tags: ['Bien-être', 'Déconnexion', 'Mindfulness'],
  },
];

const MarchesDuVivantEntreprises = () => {
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);

  const handleContactFormation = (formationId: string) => {
    setSelectedFormation(formationId);
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Formations Qualiopi RSE Biodiversité - Les Marches du Vivant</title>
        <meta 
          name="description" 
          content="5 formations certifiées Qualiopi pour entreprises. Data RSE opposable CSRD, bioacoustique, IA et vivant. Team building scientifique en Nouvelle-Aquitaine." 
        />
        <meta 
          name="keywords" 
          content="formation Qualiopi RSE, biodiversité entreprise, CSRD indicateurs, bioacoustique leadership, team building nature Dordogne" 
        />
        <link rel="canonical" href="https://la-frequence-du-vivant.com/marches-du-vivant/entreprises" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/20 bg-card/40 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link 
              to="/marches-du-vivant"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Retour aux Marches du Vivant</span>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Badge Qualiopi */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-full">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wide text-emerald-300">
                  Formations Qualiopi
                </span>
              </div>

              <h1 className="font-crimson text-4xl md:text-5xl lg:text-6xl text-foreground">
                Formations & Team Building<br />
                <span className="text-emerald-400">pour Entreprises</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des formations certifiées pour intégrer la biodiversité dans votre stratégie RSE 
                et reconnecter vos équipes au vivant.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ProofBar - Social Proof Scientifique */}
        <ProofBar className="border-y border-border/20 bg-card/20" />

        {/* MarchesShowcase - Galerie des Preuves */}
        <MarchesShowcase 
          className="bg-gradient-to-b from-background to-card/20" 
          onContactClick={scrollToContact}
        />

        {/* Carte Territoriale */}
        <TerritorialCoverageMap className="border-y border-border/20" />

        {/* Encart CSRD */}
        <CSRDProofSection 
          className="bg-gradient-to-b from-card/20 to-background"
          onLearnMore={scrollToContact}
        />

        {/* Argument Massue */}
        <section className="py-8 px-6 bg-emerald-950/20 border-y border-emerald-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg md:text-xl text-emerald-300 font-medium">
              "Vos équipes produisent de la donnée RSE opposable (CSRD) grâce à nos protocoles connectés."
            </p>
          </div>
        </section>

        {/* Catalogue des formations */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-crimson text-3xl text-foreground mb-4">
                5 Formations sur-mesure
              </h2>
              <p className="text-muted-foreground">
                Chaque formation est adaptable à vos objectifs et à votre contexte territorial
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formations.map((formation, index) => (
                <FormationCard
                  key={formation.id}
                  formation={formation}
                  index={index}
                  onContact={handleContactFormation}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <TrustBar className="border-y border-border/20" />

        {/* Formulaire de contact */}
        <section id="contact-form" className="py-16 px-6">
          <div className="max-w-xl mx-auto">
            <ContactFormB2B 
              formationId={selectedFormation || undefined}
              source="page-entreprises"
            />
          </div>
        </section>

        {/* CTAs secondaires */}
        <section className="py-16 px-6 bg-card/20 border-t border-border/20">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card/40 border border-border/30 rounded-xl p-6 text-center"
              >
                <Download className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-crimson text-xl text-foreground mb-2">
                  Programme Qualiopi
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Téléchargez le programme détaillé de nos formations pour votre dossier de financement.
                </p>
                <Button variant="outline" disabled>
                  Bientôt disponible
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-card/40 border border-border/30 rounded-xl p-6 text-center"
              >
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-crimson text-xl text-foreground mb-2">
                  Demander un Éductour
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Vivez une marche découverte gratuite pour évaluer notre approche avant de vous engager.
                </p>
                <Button 
                  variant="outline"
                  onClick={scrollToContact}
                >
                  Prendre contact
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default MarchesDuVivantEntreprises;
