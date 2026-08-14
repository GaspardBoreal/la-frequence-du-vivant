import React from 'react';
import { Helmet } from 'react-helmet-async';
import { StickyAnchorNav, type AnchorItem } from '@/components/etude-sol/StickyAnchorNav';
import { HeroEtudeSol } from '@/components/etude-sol/HeroEtudeSol';
import { EnjeuxSection } from '@/components/etude-sol/EnjeuxSection';
import { MethodesSection } from '@/components/etude-sol/MethodesSection';
import { CasDeviatSection } from '@/components/etude-sol/CasDeviatSection';
import { ContactCTA } from '@/components/etude-sol/ContactCTA';
import { PUBLIC_METHODS } from '@/content/etudeDeSolMethodes';

const CANONICAL = 'https://la-frequence-du-vivant.com/etude-de-sol';
const CONTACT_HREF =
  'mailto:contact@la-frequence-du-vivant.com?subject=Demande%20de%20diagnostic%20de%20sol';

const ANCHORS: AnchorItem[] = [
  { id: 'enjeux', label: 'Les enjeux', short: 'Enjeux' },
  { id: 'methodes', label: 'Synthèse des méthodes', short: 'Méthodes' },
  { id: 'cas-deviat', label: 'Cas concret : Jardin Monde DEVIAT', short: 'Cas concret' },
  { id: 'contact', label: 'Nous contacter', short: 'Contact' },
];

const EtudeDeSolPublique: React.FC = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'L’étude de sol vivante : enjeux, méthodes de terrain et cas concret',
    description:
      'Douze méthodes de diagnostic de sol sans laboratoire (bêche, boudin, sédimentation, pH, bêche vivante) et un cas concret documenté au Jardin Monde DEVIAT.',
    inLanguage: 'fr-FR',
    mainEntityOfPage: CANONICAL,
    author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    publisher: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    about: ['Étude de sol', 'Diagnostic de sol', 'Agroécologie', 'Jardin vivant'],
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))] font-sans">
      <Helmet>
        <title>Étude de sol vivante : méthodes de terrain et cas concret</title>
        <meta
          name="description"
          content="Diagnostic de sol sans laboratoire : 12 méthodes de terrain (bêche, boudin, pH, bêche vivante), leurs livrables, et un cas concret documenté au Jardin Monde DEVIAT."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="L’étude de sol vivante — La Fréquence du Vivant" />
        <meta
          property="og:description"
          content="12 méthodes de terrain pour lire un sol, leurs livrables, et un cas concret en Dordogne."
        />
        <meta property="og:url" content={CANONICAL} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <HeroEtudeSol
        contactHref={CONTACT_HREF}
        onDiscover={() =>
          document.getElementById('enjeux')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        stats={[
          { value: PUBLIC_METHODS.length, label: 'Méthodes de terrain' },
          { value: 10, label: 'Prélèvements par site' },
          { value: 4, label: 'Curseurs de lecture' },
        ]}
      />

      <StickyAnchorNav items={ANCHORS} contactHref={CONTACT_HREF} />

      <main>
        <EnjeuxSection />
        <MethodesSection />
        <CasDeviatSection />
        <ContactCTA contactHref={CONTACT_HREF} />
      </main>
    </div>
  );
};

export default EtudeDeSolPublique;
