import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import { FjHead, FjBreadcrumb, FjSection, FjRelated } from '@/components/frequence-jardin/FjKit';
import { FJ_PAGES } from '@/content/frequenceJardin/pilier';
import { CasDeviatSection } from '@/components/etude-sol/CasDeviatSection';

const PATH = '/frequence-jardin/cas-jardin-monde-deviat';
const SITE = 'https://la-frequence-du-vivant.com';

/** Cas concret public : le Jardin Monde de Deviat. */
const FrequenceJardinCasDeviat: React.FC = () => {
  const caseLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Cas concret : le Jardin Monde de Deviat (Charente)',
    description:
      "Un diagnostic Fréquence Jardin appliqué à un lieu réel : prélèvements géolocalisés, tests de terrain et lecture du sol, avec les chiffres tels qu'ils figurent dans le carnet.",
    inLanguage: 'fr-FR',
    mainEntityOfPage: `${SITE}${PATH}`,
    author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    publisher: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    contentLocation: {
      '@type': 'Place',
      name: 'Jardin Monde, Deviat',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Deviat',
        postalCode: '16190',
        addressRegion: 'Charente',
        addressCountry: 'FR',
      },
    },
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))] font-sans">
      <FjHead
        title="Cas concret : le Jardin Monde de Deviat — Fréquence Jardin"
        description="Un diagnostic Fréquence Jardin sur un lieu réel en Charente : prélèvements géolocalisés, tests de terrain, lecture du sol et suites données. Chiffres issus du carnet, sans reconstitution."
        path={PATH}
        breadcrumb={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: 'Cas concret : Jardin Monde de Deviat', path: PATH },
        ]}
        jsonLd={caseLd}
      />
      <FjBreadcrumb
        items={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: 'Jardin Monde de Deviat' },
        ]}
      />

      <header className="mx-auto max-w-5xl px-5 pb-10 pt-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[hsl(var(--ds-earth))]">
          Cas concret · Charente
        </p>
        <h1 className="mt-4 font-serif text-[32px] leading-tight text-[hsl(var(--ds-forest-deep))] md:text-[46px]">
          Le Jardin Monde de Deviat
        </h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-[hsl(var(--ds-ink))] md:text-[18px]">
          Une méthode ne vaut que confrontée à un terrain. Le Jardin Monde, à Deviat en Charente,
          est le lieu où le protocole Fréquence Jardin a été éprouvé : chaque prélèvement y est
          géolocalisé, photographié et daté. Les chiffres ci-dessous sont lus en direct dans le
          carnet du lieu — ils bougent quand le jardin bouge.
        </p>
      </header>

      <main>
        <CasDeviatSection />

        <FjSection
          eyebrow="Ce que le cas démontre"
          title="Un diagnostic tient dans une journée de terrain"
          lead="Pas de laboratoire, pas d’attente d’analyse : une bêche, un bocal, une bandelette, un téléphone. Le reste est de l’interprétation, et l’interprétation est écrite."
        >
          <ul className="space-y-3">
            {[
              'Chaque point de prélèvement porte sa position GPS, sa photo et sa date : le diagnostic est vérifiable et reproductible dans le temps.',
              'Les tests non réalisés restent visibles comme tels — un point incomplet n’est jamais présenté comme un point mesuré.',
              'La lecture du sol se confronte à la flore spontanée relevée sur place ; les écarts sont affichés, pas lissés.',
              'Le carnet se rejoue : un second passage, un an plus tard, se compare point par point au premier.',
            ].map((t) => (
              <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-[hsl(var(--ds-ink))]">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--ds-forest-soft))]" />
                {t}
              </li>
            ))}
          </ul>
        </FjSection>

        <FjSection
          tone="forest"
          eyebrow="Faire de même"
          title="Le même protocole, sur votre lieu"
          lead="Balcon, jardin de ville, parc d’entreprise, domaine agricole : le protocole ne change pas, seul le nombre de points varie."
        >
          <div className="flex flex-wrap gap-3">
            <Link
              to="/jardin/demarrer"
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-gold))] px-6 py-3 text-[15px] font-medium text-[hsl(var(--ds-forest-deep))]"
            >
              Démarrer mon jardin <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/etude-de-sol"
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-cream))]/40 px-6 py-3 text-[15px]"
            >
              Le protocole complet
            </Link>
          </div>
        </FjSection>
      </main>

      <FjRelated items={FJ_PAGES} currentPath={PATH} />
      <Footer variant="marches" />
    </div>
  );
};

export default FrequenceJardinCasDeviat;
