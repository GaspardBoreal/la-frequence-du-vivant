import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Lightbulb, Compass, Users, ChevronDown, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import ContributeurCard, { ContributeurData } from '@/components/marches-vivant/ContributeurCard';
import ScienceCounters from '@/components/marches-vivant/ScienceCounters';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Équipe fondatrice
const contributeurs: ContributeurData[] = [
  {
    nom: 'Laurent Tripied',
    role: 'Président - CEO bziiit & Piloterra',
    bio: 'IA frugale & responsable | Agriculture + création | Dispositifs utiles, sobres, désirables | Ateliers, formations, conférences.',
    linkedin: 'https://www.linkedin.com/in/laurenttripied/',
    couleur: 'emerald',
  },
  {
    nom: 'Laurence Karki',
    role: 'Vice-Présidente - Consultante RH',
    bio: 'Consultante RH chez Lee Hecht Harrison-Altedia. Passionnée par l\'accompagnement des transitions professionnelles et territoriales.',
    linkedin: 'https://www.linkedin.com/in/laurence-karki-43153620/',
    couleur: 'blue',
  },
  {
    nom: 'Victor Boixeda',
    role: 'Responsable Relations Publiques',
    bio: 'Étudiant en 1ère année à l\'ISEG, curieux, motivé et passionné de sport et de sciences. En recherche d\'expériences professionnelles.',
    linkedin: 'https://www.linkedin.com/in/victor-boixeda-a70b8138b/',
    couleur: 'orange',
  },
  {
    nom: 'Gaspard Boréal',
    role: 'Auteur & Explorateur Sonore',
    bio: 'Ateliers d\'écoute du vivant | Soundwalks & récit de territoire | Outils numériques sobres | Résidences, conférences, collaborations.',
    linkedin: 'https://www.gaspardboreal.com/',
    couleur: 'purple',
  },
];

// Cercle d'Or
const cercleOr = {
  why: {
    title: 'POURQUOI',
    subtitle: 'Notre raison d\'être',
    points: [
      'Reconnecter positivement l\'ensemble des générations au vivant',
      'Proposer des alternatives au repliement sur soi',
      'Participer, donner envie d\'aller voir, rencontrer le vivant sous toutes ses formes',
      'Sensibiliser, former, démocratiser les nouvelles connaissances autour de la biodiversité et la bioacoustique',
      'Ne plus avoir peur de l\'évolution du vivant',
    ],
  },
  how: {
    title: 'COMMENT',
    subtitle: 'Notre approche unique',
    points: [
      'Mixer avec intelligence les sciences, les arts narratifs et la pratique de l\'instant présent',
      'Transmettre les nouvelles connaissances pour inventer des récits collectifs inspirants',
      'Animer les communautés pour développer la connaissance et la transmission',
      'Impliquer les membres vers la science participative et l\'art narratif participatif',
    ],
  },
  what: {
    title: 'QUOI',
    subtitle: 'Nos actions concrètes',
    points: [
      'Un catalogue de formations (biodiversité, bioacoustique, IA collaborative...)',
      'Des "Marches du Vivant" animées sur le terrain',
      'Des outils Open Source, Open Science et Creative Commons',
      'Une communauté de Marcheurs et d\'Ambassadeurs du Vivant',
    ],
  },
};

// Parcours Ambassadeur
const parcoursAmbassadeur = [
  {
    niveau: 'Marcheur',
    description: 'Participez à une première marche du vivant et découvrez l\'écoute active du territoire.',
    prerequis: 'Aucun',
  },
  {
    niveau: 'Ambassadeur',
    description: 'Formez-vous à l\'animation de petits groupes et aux outils de reconnaissance d\'espèces.',
    prerequis: '3 marches + formation 1 jour',
  },
  {
    niveau: 'Animateur',
    description: 'Animez des marches en autonomie et contribuez à former les futurs ambassadeurs.',
    prerequis: 'Certification + 5 animations supervisées',
  },
];

const MarchesDuVivantAssociation = () => {
  return (
    <>
      <Helmet>
        <title>Rejoindre Les Marches du Vivant - Devenir Ambassadeur</title>
        <meta 
          name="description" 
          content="Devenez ambassadeur des Marches du Vivant. Science participative, bioacoustique et nouveaux récits territoriaux. Rejoignez notre communauté." 
        />
        <meta 
          name="keywords" 
          content="association biodiversité, ambassadeur nature, science participative, communauté vivant, bénévolat écologie" 
        />
        <link rel="canonical" href="https://la-frequence-du-vivant.com/marches-du-vivant/association" />
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
        <section className="py-16 px-6 border-b border-border/20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-950/40 border border-purple-500/30 rounded-full">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="font-mono text-xs uppercase tracking-wide text-purple-300">
                  La Communauté
                </span>
              </div>

              <h1 className="font-crimson text-4xl md:text-5xl lg:text-6xl text-foreground">
                Rejoindre<br />
                <span className="text-purple-400">Les Marches du Vivant</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Une association pour reconnecter l'ensemble des générations au vivant, 
                née de La Comédie des Mondes Hybrides.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Le Cercle d'Or */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-crimson text-3xl text-foreground mb-4">
                Notre Cercle d'Or
              </h2>
              <p className="text-muted-foreground">
                Pourquoi, Comment et Quoi : notre vision pour reconnecter au vivant
              </p>
            </motion.div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="why" className="bg-card/40 border border-border/30 rounded-xl px-6">
                <AccordionTrigger className="py-6 hover:no-underline">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-mono text-xs text-emerald-400 uppercase tracking-wide">
                        {cercleOr.why.title}
                      </div>
                      <div className="font-crimson text-xl text-foreground">
                        {cercleOr.why.subtitle}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <ul className="space-y-2 pl-16">
                    {cercleOr.why.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-emerald-400 mt-1">→</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="how" className="bg-card/40 border border-border/30 rounded-xl px-6">
                <AccordionTrigger className="py-6 hover:no-underline">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-950/50 border border-orange-500/30 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-mono text-xs text-orange-400 uppercase tracking-wide">
                        {cercleOr.how.title}
                      </div>
                      <div className="font-crimson text-xl text-foreground">
                        {cercleOr.how.subtitle}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <ul className="space-y-2 pl-16">
                    {cercleOr.how.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-orange-400 mt-1">→</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="what" className="bg-card/40 border border-border/30 rounded-xl px-6">
                <AccordionTrigger className="py-6 hover:no-underline">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-950/50 border border-blue-500/30 flex items-center justify-center">
                      <Compass className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-mono text-xs text-blue-400 uppercase tracking-wide">
                        {cercleOr.what.title}
                      </div>
                      <div className="font-crimson text-xl text-foreground">
                        {cercleOr.what.subtitle}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <ul className="space-y-2 pl-16">
                    {cercleOr.what.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-blue-400 mt-1">→</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* L'Équipe Fondatrice */}
        <section className="py-16 px-6 bg-card/20 border-y border-border/20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-crimson text-3xl text-foreground mb-4">
                L'Équipe Fondatrice
              </h2>
              <p className="text-muted-foreground">
                Les premiers contributeurs actifs de La Comédie des Mondes Hybrides
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contributeurs.map((contributeur, index) => (
                <ContributeurCard
                  key={contributeur.nom}
                  contributeur={contributeur}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Parcours Ambassadeur */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-crimson text-3xl text-foreground mb-4">
                Devenir Ambassadeur
              </h2>
              <p className="text-muted-foreground">
                Un parcours progressif pour transmettre l'art de l'écoute du vivant
              </p>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-6 items-stretch">
              {parcoursAmbassadeur.map((etape, index) => (
                <motion.div
                  key={etape.niveau}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex-1 relative"
                >
                  <div className="bg-card/40 border border-border/30 rounded-xl p-6 h-full">
                    <div className="text-center mb-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 font-mono text-sm mb-2">
                        {index + 1}
                      </span>
                      <h3 className="font-crimson text-xl text-foreground">
                        {etape.niveau}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      {etape.description}
                    </p>
                    <div className="text-xs text-center text-muted-foreground/70">
                      <span className="font-medium">Prérequis :</span> {etape.prerequis}
                    </div>
                  </div>
                  
                  {/* Flèche entre les étapes */}
                  {index < parcoursAmbassadeur.length - 1 && (
                    <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Compteurs */}
        <ScienceCounters className="border-t border-border/20" />

        {/* CTA */}
        <section className="py-16 px-6 bg-emerald-950/20 border-t border-emerald-500/20">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="font-crimson text-3xl text-foreground">
                Prêt à rejoindre l'aventure ?
              </h2>
              <p className="text-muted-foreground">
                Contactez-nous pour participer à une première marche découverte 
                ou en savoir plus sur le parcours ambassadeur.
              </p>
              <a 
                href="https://www.gaspardboreal.com/contact" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                Nous contacter
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default MarchesDuVivantAssociation;
