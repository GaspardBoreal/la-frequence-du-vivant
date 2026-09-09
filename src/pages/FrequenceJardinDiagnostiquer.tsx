import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import { FjHead, FjBreadcrumb, FjSection, FjRelated } from '@/components/frequence-jardin/FjKit';
import { FJ_PAGES, FJ_PARCOURS } from '@/content/frequenceJardin/pilier';
import { PUBLIC_METHODS, SYNTHESE_AXES, LIFE_SIGNS_PUBLIC } from '@/content/etudeDeSolMethodes';

const PATH = '/frequence-jardin/diagnostiquer-son-jardin';
const SITE = 'https://la-frequence-du-vivant.com';

/** Guide public : diagnostiquer son jardin, étape par étape. */
const FrequenceJardinDiagnostiquer: React.FC = () => {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Diagnostiquer son jardin : le guide complet',
    description:
      'Du premier tour de jardin au diagnostic écrit : observer, lire le sol, interpréter la flore spontanée, synthétiser, choisir ses plantes.',
    inLanguage: 'fr-FR',
    mainEntityOfPage: `${SITE}${PATH}`,
    about: ['Diagnostic de jardin', 'Étude de sol', 'Flore bio-indicatrice', 'Agroécologie'],
    author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    publisher: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    isPartOf: { '@type': 'WebPage', name: 'Fréquence Jardin', url: `${SITE}/frequence-jardin` },
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))] font-sans">
      <FjHead
        title="Diagnostiquer son jardin : guide complet — Fréquence Jardin"
        description="Comment diagnostiquer un jardin sans laboratoire : tour d’observation, lecture du sol en douze méthodes de terrain, flore bio-indicatrice, synthèse et palette végétale."
        path={PATH}
        breadcrumb={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: 'Diagnostiquer son jardin', path: PATH },
        ]}
        jsonLd={articleLd}
      />
      <FjBreadcrumb
        items={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: 'Diagnostiquer son jardin' },
        ]}
      />

      <header className="mx-auto max-w-5xl px-5 pb-10 pt-8">
        <h1 className="font-serif text-[32px] leading-tight text-[hsl(var(--ds-forest-deep))] md:text-[46px]">
          Diagnostiquer son jardin
        </h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-[hsl(var(--ds-ink))] md:text-[18px]">
          Diagnostiquer un jardin, c’est répondre à trois questions dans l’ordre : de quoi cette terre
          est-elle faite, que raconte ce qui y pousse déjà, et que peut-on y planter sans forcer.
          Le protocole ci-dessous est celui de Fréquence Jardin. Il se pratique à la main, sur le
          terrain, sans laboratoire.
        </p>
      </header>

      <main>
        <FjSection
          eyebrow="Vue d’ensemble"
          title="Les cinq temps du diagnostic"
          lead="Chaque étape produit une matière que la suivante consomme. On ne saute pas d’étape : une palette végétale sans lecture de sol n’est qu’une liste de courses."
        >
          <ol className="space-y-4">
            {FJ_PARCOURS.map((s, i) => (
              <li
                key={s.name}
                className="flex gap-4 rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-5"
              >
                <span className="font-serif text-[26px] leading-none text-[hsl(var(--ds-gold))]">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-serif text-[18px] text-[hsl(var(--ds-forest-deep))]">{s.name}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </FjSection>

        <FjSection
          tone="forest"
          eyebrow="Étape 2"
          title={`Lire le sol : ${PUBLIC_METHODS.length} méthodes de terrain`}
          lead="Chaque méthode est un geste simple, un matériel courant, un repère chiffré et un livrable. On les répète sur plusieurs points du jardin — jusqu’à dix prélèvements géolocalisés et photographiés."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {PUBLIC_METHODS.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-[hsl(var(--ds-cream))]/15 bg-[hsl(var(--ds-cream))]/[0.06] p-4"
              >
                <h3 className="text-[15px] font-medium">{m.name}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[hsl(var(--ds-cream))]/75">
                  {m.summary}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[14px] text-[hsl(var(--ds-cream))]/75">
            Le détail complet de chaque geste, avec matériel, durée et livrable, est publié sur{' '}
            <Link to="/etude-de-sol" className="text-[hsl(var(--ds-gold))] underline underline-offset-4">
              la page consacrée à l’étude de sol vivante
            </Link>
            , téléchargeable en Markdown et en PDF.
          </p>
        </FjSection>

        <FjSection
          eyebrow="Étape 2 bis"
          title="Reconnaître un sol vivant"
          lead="La vie du sol se compte à la bêche : ce sont ces indices qu’on note à chaque prélèvement."
        >
          <ul className="flex flex-wrap gap-2">
            {LIFE_SIGNS_PUBLIC.map((s) => (
              <li
                key={s}
                className="rounded-full border border-[hsl(var(--ds-line))] bg-white/70 px-4 py-2 text-[14px] text-[hsl(var(--ds-ink))]"
              >
                {s}
              </li>
            ))}
          </ul>
        </FjSection>

        <FjSection
          eyebrow="Étape 3"
          title="Écouter la flore spontanée"
          lead="Les plantes qui poussent sans qu’on les invite renseignent sur l’humidité, la texture, la richesse et l’acidité du sol. Confrontée au sol mesuré, cette lecture donne l’Indice de Concordance Globale — l’accord, ou le désaccord, entre les deux voix."
        >
          <Link
            to="/frequence-jardin/plantes-bio-indicatrices"
            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-forest))] px-6 py-3 text-[15px] font-medium text-[hsl(var(--ds-cream))] transition hover:bg-[hsl(var(--ds-forest-deep))]"
          >
            Voir la table des plantes bio-indicatrices <ArrowRight className="h-4 w-4" />
          </Link>
        </FjSection>

        <FjSection
          eyebrow="Étape 4"
          title="Synthétiser : quatre curseurs avant tout détail"
          lead="Le diagnostic se lit d’abord en quatre gestes de curseur. Le détail espèce par espèce vient après, pour qui veut vérifier."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {SYNTHESE_AXES.map((a) => (
              <div key={a.label} className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-5">
                <h3 className="font-serif text-[18px] text-[hsl(var(--ds-forest-deep))]">{a.label}</h3>
                <p className="mt-1 text-[14px] italic text-[hsl(var(--ds-earth))]">{a.question}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">{a.steps}</p>
              </div>
            ))}
          </div>
        </FjSection>

        <FjSection
          eyebrow="Étape 5"
          title="Planter en connaissance de cause"
          lead="La palette végétale découle du sol lu, du climat de la commune et des projections climatiques. Elle n’est pas une liste d’envies : chaque espèce proposée est justifiable."
        >
          <div className="flex flex-wrap gap-3">
            <Link
              to="/frequence-jardin/palette-vegetale"
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-line))] px-6 py-3 text-[15px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest-soft))]"
            >
              Comment se construit une palette végétale
            </Link>
            <Link
              to="/jardin/demarrer"
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-forest))] px-6 py-3 text-[15px] font-medium text-[hsl(var(--ds-cream))]"
            >
              Diagnostiquer mon jardin <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FjSection>
      </main>

      <FjRelated items={FJ_PAGES} currentPath={PATH} />
      <Footer variant="marches" />
    </div>
  );
};

export default FrequenceJardinDiagnostiquer;
