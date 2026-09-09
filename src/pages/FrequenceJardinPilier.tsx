import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Sprout, Microscope, Flower2, NotebookPen, ExternalLink } from 'lucide-react';
import Footer from '@/components/Footer';
import { FjHead, FjBreadcrumb, FjSection } from '@/components/frequence-jardin/FjKit';
import {
  FJ_DEFINITION,
  FJ_TAGLINE,
  FJ_PAGES,
  FJ_PUBLICS,
  FJ_PARCOURS,
  FJ_MODULES,
  FJ_FAQ,
  FJ_REPERES, FJ_SIGNUP_URL } from '@/content/frequenceJardin/pilier';

const PATH = '/frequence-jardin';
const SITE = 'https://la-frequence-du-vivant.com';

const STEP_ICONS = [Leaf, Microscope, Sprout, NotebookPen, Flower2];

/** Page pilier publique de Fréquence Jardin. */
const FrequenceJardinPilier: React.FC = () => {
  const softwareLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Fréquence Jardin',
    alternateName: ['Frequence Jardin', 'Fréquence Jardin — La Fréquence du Vivant'],
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Diagnostic écologique et agroécologie',
    operatingSystem: 'Web',
    url: `${SITE}${PATH}`,
    inLanguage: 'fr-FR',
    description: FJ_DEFINITION,
    softwareHelp: `${SITE}/frequence-jardin/diagnostiquer-son-jardin`,
    audience: [
      { '@type': 'Audience', audienceType: 'Particuliers, jardiniers amateurs' },
      { '@type': 'Audience', audienceType: 'Collectivités, domaines et entreprises' },
      { '@type': 'Audience', audienceType: 'Paysagistes et professionnels du vivant' },
    ],
    featureList: FJ_MODULES.map((m) => m.name),
    publisher: {
      '@type': 'Organization',
      name: 'La Fréquence du Vivant',
      url: `${SITE}/`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '6 rue du Champ de Foire',
        postalCode: '16190',
        addressLocality: 'Deviat',
        addressCountry: 'FR',
      },
    },
    isPartOf: { '@type': 'WebSite', name: 'La Fréquence du Vivant', url: `${SITE}/` },
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))] font-sans">
      <FjHead
        title="Fréquence Jardin — diagnostiquer le vivant d’un lieu"
        description="Fréquence Jardin lit le sol d’un jardin, interprète la flore spontanée et propose une palette végétale adaptée. Application française éditée par La Fréquence du Vivant."
        path={PATH}
        breadcrumb={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: PATH },
        ]}
        jsonLd={softwareLd}
      />

      <FjBreadcrumb items={[{ name: 'Accueil', path: '/' }, { name: 'Fréquence Jardin' }]} />

      {/* Hero */}
      <header className="mx-auto max-w-5xl px-5 pb-12 pt-8 md:pt-12">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[hsl(var(--ds-earth))]">
          Application — La Fréquence du Vivant
        </p>
        <h1 className="mt-4 font-serif text-[34px] leading-[1.1] text-[hsl(var(--ds-forest-deep))] md:text-[54px]">
          Fréquence Jardin
        </h1>
        <p className="mt-3 font-serif text-[19px] italic text-[hsl(var(--ds-earth))] md:text-[23px]">
          {FJ_TAGLINE}
        </p>
        <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-[hsl(var(--ds-ink))] md:text-[18px]">
          {FJ_DEFINITION}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={FJ_SIGNUP_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-forest))] px-6 py-3 text-[15px] font-medium text-[hsl(var(--ds-cream))] transition hover:bg-[hsl(var(--ds-forest-deep))]"
          >
            Démarrer mon jardin <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#parcours"
            className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-line))] px-6 py-3 text-[15px] text-[hsl(var(--ds-forest-deep))] transition hover:border-[hsl(var(--ds-forest-soft))]"
          >
            Comment ça marche
          </a>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FJ_REPERES.map((r) => (
            <div
              key={r.label}
              className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-4"
            >
              <dt className="font-serif text-[30px] leading-none text-[hsl(var(--ds-forest))]">
                {r.value}
              </dt>
              <dd className="mt-2 text-[13px] font-medium text-[hsl(var(--ds-ink))]">{r.label}</dd>
              <dd className="mt-1 text-[12px] leading-snug text-[hsl(var(--ds-ink-soft))]">{r.hint}</dd>
            </div>
          ))}
        </dl>
      </header>

      <main>
        {/* Parcours */}
        <FjSection
          id="parcours"
          tone="forest"
          eyebrow="Le parcours"
          title="Cinq temps, du premier regard au geste de plantation"
          lead="Le cœur de l’application est une progression, pas un tableau de bord. Chaque étape produit une matière que la suivante consomme."
        >
          <ol className="grid gap-4 md:grid-cols-2">
            {FJ_PARCOURS.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? Leaf;
              return (
                <li
                  key={step.name}
                  className="rounded-2xl border border-[hsl(var(--ds-cream))]/15 bg-[hsl(var(--ds-cream))]/[0.06] p-5"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-[hsl(var(--ds-gold))]" aria-hidden />
                    <h3 className="font-serif text-[19px]">{step.name}</h3>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-[hsl(var(--ds-cream))]/80">
                    {step.desc}
                  </p>
                </li>
              );
            })}
          </ol>
          <p className="mt-8 text-[14px] text-[hsl(var(--ds-cream))]/75">
            Le détail pas à pas est décrit dans le{' '}
            <Link
              to="/frequence-jardin/diagnostiquer-son-jardin"
              className="text-[hsl(var(--ds-gold))] underline underline-offset-4"
            >
              guide pour diagnostiquer son jardin
            </Link>
            .
          </p>
        </FjSection>

        {/* Publics */}
        <FjSection
          id="publics"
          eyebrow="Pour qui"
          title="Trois façons d’entrer dans Fréquence Jardin"
        >
          <div className="grid gap-5 md:grid-cols-3">
            {FJ_PUBLICS.map((p) => (
              <article
                key={p.id}
                className="flex flex-col rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-6"
              >
                <h3 className="font-serif text-[20px] text-[hsl(var(--ds-forest-deep))]">{p.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">{p.lead}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-[14px] leading-snug text-[hsl(var(--ds-ink))]">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--ds-forest-soft))]" />
                      {b}
                    </li>
                  ))}
                </ul>
                {p.cta.to.startsWith('http') ? (
                  <a
                    href={p.cta.to}
                    target="_blank"
                    rel="noopener"
                    className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[hsl(var(--ds-forest))] underline-offset-4 hover:underline"
                  >
                    {p.cta.label} <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    to={p.cta.to}
                    className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[hsl(var(--ds-forest))] underline-offset-4 hover:underline"
                  >
                    {p.cta.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </article>
            ))}
          </div>
        </FjSection>

        {/* Modules */}
        <FjSection
          id="modules"
          eyebrow="Les modules"
          title="Ce qui prolonge le diagnostic"
          lead="Une fois le lieu lu, l’application accompagne le projet, les soins, la mesure et la décision."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {FJ_MODULES.map((m) => (
              <div
                key={m.name}
                className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/50 p-5"
              >
                <h3 className="font-serif text-[18px] text-[hsl(var(--ds-forest-deep))]">{m.name}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">{m.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[14px] text-[hsl(var(--ds-ink-soft))]">
            La description technique complète — architecture, données, interopérabilité — figure sur la{' '}
            <Link
              to="/roadmap/frequence-jardin"
              className="text-[hsl(var(--ds-forest))] underline underline-offset-4"
            >
              fiche application
            </Link>
            , disponible aussi en Markdown et en PDF.
          </p>
        </FjSection>

        {/* Pages satellites */}
        <FjSection id="ressources" eyebrow="Aller plus loin" title="Les ressources Fréquence Jardin">
          <div className="grid gap-4 sm:grid-cols-2">
            {FJ_PAGES.map((p) => (
              <Link
                key={p.path}
                to={p.path}
                className="group rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-5 transition hover:border-[hsl(var(--ds-forest-soft))] hover:shadow-sm"
              >
                <h3 className="font-serif text-[18px] text-[hsl(var(--ds-forest-deep))]">{p.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">{p.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-[hsl(var(--ds-forest))]">
                  Lire <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </FjSection>

        {/* Lien avec Les Marches du Vivant */}
        <FjSection
          id="marches"
          tone="forest"
          eyebrow="La filiation"
          title="Fréquence Jardin et Les Marches du Vivant"
          lead="Les Marches du Vivant sont des immersions collectives où l’on mesure la biodiversité d’un territoire. Fréquence Jardin en est le prolongement à l’échelle d’un lieu : les observations récoltées pendant une marche alimentent le diagnostic d’une propriété, et inversement."
        >
          <div className="flex flex-wrap gap-3">
            <Link
              to="/marches-du-vivant"
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-cream))] px-5 py-2.5 text-[14px] font-medium text-[hsl(var(--ds-forest-deep))]"
            >
              Découvrir Les Marches du Vivant <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/etude-de-sol"
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-cream))]/40 px-5 py-2.5 text-[14px]"
            >
              L’étude de sol vivante
            </Link>
            <Link
              to="/entretiens/laurent-tripied-marches-du-vivant-frequence-jardin"
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-cream))]/40 px-5 py-2.5 text-[14px]"
            >
              Entretien fondateur <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FjSection>

        {/* Questions fréquentes */}
        <FjSection
          id="questions"
          eyebrow="Questions fréquentes"
          title="Fréquence Jardin en questions"
          lead="Réponses courtes et factuelles, destinées autant aux lecteurs qu’aux moteurs de recherche et aux assistants conversationnels."
        >
          <div className="divide-y divide-[hsl(var(--ds-line))] rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60">
            {FJ_FAQ.map((qa) => (
              <div key={qa.q} className="p-5">
                <h3 className="font-serif text-[17px] text-[hsl(var(--ds-forest-deep))]">{qa.q}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--ds-ink))]">{qa.a}</p>
              </div>
            ))}
          </div>
        </FjSection>

        {/* Contact */}
        <section className="bg-[hsl(var(--ds-forest-deep))] py-16 text-[hsl(var(--ds-cream))]">
          <div className="mx-auto max-w-5xl px-5">
            <h2 className="font-serif text-[26px] md:text-[32px]">Commencer, ou nous parler d’un lieu</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[hsl(var(--ds-cream))]/80">
              Un jardin de ville, un parc d’entreprise, un domaine viticole, une parcelle communale :
              le diagnostic commence toujours par un tour de terrain.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={FJ_SIGNUP_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-gold))] px-6 py-3 text-[15px] font-medium text-[hsl(var(--ds-forest-deep))]"
              >
                Démarrer mon jardin <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="mailto:contact@la-frequence-du-vivant.com?subject=Fr%C3%A9quence%20Jardin"
                className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-cream))]/40 px-6 py-3 text-[15px]"
              >
                contact@la-frequence-du-vivant.com
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer variant="marches" />
    </div>
  );
};

export default FrequenceJardinPilier;
