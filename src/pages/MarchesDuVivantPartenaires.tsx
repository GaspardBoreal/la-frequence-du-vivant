import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin } from 'lucide-react';
import Footer from '@/components/Footer';
import HebergeurCard, { HebergeurData } from '@/components/marches-vivant/HebergeurCard';
import ContactFormB2B from '@/components/marches-vivant/ContactFormB2B';

// Données des hébergeurs partenaires
const hebergeurs: HebergeurData[] = [
  {
    id: 'le-chez-nous',
    nom: 'Le Chez Nous',
    adresse: '28 corniche de la Gironde',
    ville: 'Gauriac',
    departement: '33',
    url: 'https://www.booking.com/hotel/fr/le-chez-nous.fr.html',
    latitude: 45.0667,
    longitude: -0.6333,
    especesFrequentes: ['Loriot d\'Europe', 'Martin-pêcheur', 'Chouette hulotte'],
  },
  {
    id: 'closerie-fronsac',
    nom: 'La Closerie de Fronsac',
    adresse: '27 route de Gombaud',
    ville: 'Saint-Michel-de-Fronsac',
    departement: '33',
    url: 'https://www.lacloseriedefronsac.com/',
    latitude: 44.9167,
    longitude: -0.2833,
    especesFrequentes: ['Huppe fasciée', 'Pic vert', 'Fauvette à tête noire'],
  },
  {
    id: 'rebiere-or',
    nom: 'La Rebière d\'Or',
    adresse: '13 Rue De La Rocade',
    ville: 'Mouleydier',
    departement: '24',
    url: 'https://www.larebieredor.com/',
    latitude: 44.8500,
    longitude: 0.2000,
    especesFrequentes: ['Héron cendré', 'Rossignol philomèle', 'Coucou gris'],
  },
  {
    id: 'hotel-pont-grolejac',
    nom: 'Hôtel du Pont',
    adresse: '941 route de la Dordogne',
    ville: 'Groléjac',
    departement: '24',
    url: 'https://www.sarlathoteldupont.com/',
    latitude: 44.8167,
    longitude: 1.2833,
    especesFrequentes: ['Cincle plongeur', 'Bergeronnette des ruisseaux', 'Milan noir'],
  },
  {
    id: 'relais-castelnau',
    nom: 'Le Relais de Castelnau',
    adresse: 'Route de Padirac',
    ville: 'Loubressac',
    departement: '46',
    url: 'https://www.relaisdecastelnau.com/',
    latitude: 44.8667,
    longitude: 1.8000,
    especesFrequentes: ['Faucon crécerelle', 'Grand-duc d\'Europe', 'Circaète Jean-le-Blanc'],
  },
  {
    id: 'hostellerie-bruyere',
    nom: 'Hostellerie La Bruyère',
    adresse: 'La Bruyère',
    ville: 'Chalvignac',
    departement: '15',
    url: 'https://hostellerie-la-bruyere.fr/',
    latitude: 45.1833,
    longitude: 2.2833,
    especesFrequentes: ['Busard Saint-Martin', 'Pie-grièche écorcheur', 'Alouette lulu'],
  },
  {
    id: 'hebergement-artense',
    nom: 'Hébergement Artense',
    adresse: '19, Avenue de la Liberation',
    ville: 'Le Mont Dore',
    departement: '63',
    url: 'https://artense.eu/',
    latitude: 45.5833,
    longitude: 2.8167,
    especesFrequentes: ['Mésange noire', 'Venturon montagnard', 'Accenteur alpin'],
  },
];

const MarchesDuVivantPartenaires = () => {
  const [selectedHebergeur, setSelectedHebergeur] = React.useState<HebergeurData | null>(null);

  const handleSelectHebergeur = (hebergeur: HebergeurData) => {
    setSelectedHebergeur(hebergeur);
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Séminaires Nature Dordogne Gironde - Lieux Partenaires | Les Marches du Vivant</title>
        <meta 
          name="description" 
          content="7 hébergeurs partenaires le long de la Dordogne pour vos séminaires déconnexion et team building nature. De la Gironde au Cantal." 
        />
        <meta 
          name="keywords" 
          content="séminaire nature Dordogne, hébergement team building, Gironde, Lot, Cantal, déconnexion entreprise" 
        />
        <link rel="canonical" href="https://la-frequence-du-vivant.com/marches-du-vivant/partenaires" />
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-950/40 border border-amber-500/30 rounded-full">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs uppercase tracking-wide text-amber-300">
                  Le long de la Dordogne
                </span>
              </div>

              <h1 className="font-crimson text-4xl md:text-5xl lg:text-6xl text-foreground">
                Nos Lieux<br />
                <span className="text-amber-400">Partenaires</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                7 hébergeurs partenaires soigneusement sélectionnés, de la Gironde au Cantal, 
                au cœur de territoires riches en biodiversité.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Info parcours */}
        <section className="py-8 px-6 bg-card/20 border-b border-border/20">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-muted-foreground">
              Gaspard Boréal a parcouru chacun de ces sites d'hébergements et lieux de formation. 
              Ce sont des partenaires référencés du projet "Les Marches du Vivant".
            </p>
          </div>
        </section>

        {/* Grille des hébergeurs */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hebergeurs.map((hebergeur, index) => (
                <HebergeurCard
                  key={hebergeur.id}
                  hebergeur={hebergeur}
                  index={index}
                  onSelect={handleSelectHebergeur}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Formulaire de contact */}
        <section id="contact-form" className="py-16 px-6 bg-card/20 border-t border-border/20">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="font-crimson text-2xl text-foreground mb-2">
                {selectedHebergeur 
                  ? `Organiser une marche à ${selectedHebergeur.ville}`
                  : 'Organiser une marche'
                }
              </h2>
              <p className="text-sm text-muted-foreground">
                Nous vous aidons à organiser votre séminaire ou team building
              </p>
            </motion.div>

            <ContactFormB2B 
              formationId={selectedHebergeur?.id}
              source="page-partenaires"
            />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default MarchesDuVivantPartenaires;
