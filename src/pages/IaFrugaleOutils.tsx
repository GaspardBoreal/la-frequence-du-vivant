import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, Gauge, Leaf } from 'lucide-react';
import { OUTILS, CAS_LABEL } from '@/content/iaFrugale/casUsage';
import {
  CONSTANTES_CODECARBON,
  CONSTANTES_ECOLOGITS,
  CONSTANTES_GREEN_ALGORITHMS,
  CONSTANTES_COMPARIA,
  SOURCE_CI,
  type Constante,
} from '@/content/iaFrugale/outilsMesure';
import SimulateurCard from '@/components/ia-frugale/SimulateurCard';
import CodeCarbonSection from '@/components/ia-frugale/CodeCarbonSection';
import SourceNote from '@/components/ia-frugale/SourceNote';
import Footer from '@/components/Footer';
import IntensiteCarboneChart from '@/components/ia-frugale/IntensiteCarboneChart';

const CANONICAL = 'https://la-frequence-du-vivant.com/ia-frugale/outils-de-mesure';

const CONSTANTES: Record<string, Constante[]> = {
  codecarbon: CONSTANTES_CODECARBON,
  ecologits: CONSTANTES_ECOLOGITS,
  greenalgorithms: CONSTANTES_GREEN_ALGORITHMS,
  comparia: CONSTANTES_COMPARIA,
};

const IaFrugaleOutils: React.FC = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: "IA frugale : mesurer l'impact d'un calcul, outil par outil",
    description:
      "Huit exercices interactifs pour comprendre CodeCarbon, EcoLogits, Green Algorithms et compar:IA, appliqués aux Marches du Vivant et à Fréquence Jardin. Formules et constantes officielles, sources citées.",
    inLanguage: 'fr-FR',
    url: CANONICAL,
    learningResourceType: 'Simulateur interactif',
    educationalLevel: 'Enseignement supérieur, formation professionnelle',
    teaches: [
      'Mesure de la consommation énergétique du calcul',
      "Estimation de l'impact des modèles de langage",
      'Empreinte carbone des infrastructures numériques',
      'Sobriété numérique et IA frugale',
    ],
    isAccessibleForFree: true,
    author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    publisher: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>IA frugale : 8 simulateurs de mesure d'impact | Fréquence du Vivant</title>
        <meta
          name="description"
          content="CodeCarbon, EcoLogits, Green Algorithms, compar:IA : huit exercices interactifs pour mesurer l'impact d'un calcul, formules et constantes officielles à l'appui."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="IA frugale : 8 simulateurs de mesure d'impact" />
        <meta
          property="og:description"
          content="Faites varier les curseurs, lisez les formules officielles : quatre outils de mesure appliqués aux Marches du Vivant et à Fréquence Jardin."
        />
        <meta property="og:url" content={CANONICAL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" aria-hidden />
            Cours — IA frugale
          </p>
          <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Mesurer avant de croire
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Quatre outils publics savent chiffrer ce que coûte un calcul. Ils ne disent pas la même
            chose, ne s'utilisent pas au même moment, et n'ont pas la même définition de la
            rigueur. Voici huit exercices pour les manipuler : déplacez les curseurs, regardez les
            chiffres bouger, puis ouvrez la formule.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Chaque exercice est ancré dans un cas réel :{' '}
            <strong className="font-medium text-foreground">{CAS_LABEL.mdv}</strong> et{' '}
            <strong className="font-medium text-foreground">{CAS_LABEL.jardin}</strong>. Aucune
            constante n'est inventée : toutes viennent des sources officielles, datées et
            cliquables. Ce que vous réglez vous-même est signalé comme{' '}
            <em className="not-italic uppercase tracking-wider">hypothèse</em>.
          </p>

          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Aller à un outil">
            {OUTILS.map((o) => (
              <a
                key={o.cle}
                href={`#${o.cle}`}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-muted"
              >
                {o.nom}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Repère commun : l'intensité carbone */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Un repère commun aux quatre outils : d'où vient l'électricité
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Les quatre outils convertissent des kilowattheures en grammes de CO2 avec la même idée :
            un même calcul n'a pas le même poids selon le pays. Les valeurs ci-dessous sont celles
            embarquées dans CodeCarbon, reprises d'Our World in Data pour l'année 2023.
          </p>
          <IntensiteCarboneChart />

          <div className="mt-5">
            <SourceNote sources={[SOURCE_CI]} />
          </div>
        </div>
      </section>

      {/* Les quatre outils */}
      <main>
        {OUTILS.map((outil) =>
          outil.cle === 'codecarbon' ? (
            <CodeCarbonSection key={outil.cle} outil={outil} />
          ) : (
          <section
            key={outil.cle}
            id={outil.cle}
            className="scroll-mt-4 border-b border-border"
            style={{ ['--accent-outil' as string]: `var(--frugal-${outil.cle})` }}
          >
            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-[hsl(var(--accent-outil)/0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--accent-outil))]">
                  {outil.nature}
                </span>
                <a
                  href={outil.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
                >
                  Ouvrir l'outil officiel
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {outil.nom}
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Ce qu'il mesure
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/85">{outil.quoi}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Quand s'en servir
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/85">{outil.quand}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {outil.constantesTitre}
                </p>
                <ul className="mt-3 space-y-3">
                  {CONSTANTES[outil.cle].map((c) => (
                    <li key={c.label} className="text-sm leading-relaxed">
                      <span className="font-medium text-foreground">{c.label}</span>
                      <span className="text-muted-foreground"> — {c.valeur}</span>{' '}
                      <a
                        href={c.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whitespace-nowrap text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
                      >
                        source
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 space-y-8">
                {outil.simulateurs.map((sim) => (
                  <SimulateurCard key={sim.id} simulateur={sim} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>

      {/* Clôture */}
      <footer className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Leaf className="h-3.5 w-3.5" aria-hidden />
            Ce que ces huit exercices ont en commun
          </p>
          <p className="mt-4 text-sm leading-relaxed text-foreground/85">
            Aucun de ces outils ne donne « le » chiffre. Ils donnent un ordre de grandeur défendable,
            à condition de dire ce qu'on a supposé. C'est pourquoi chaque simulateur de cette page
            sépare deux choses : les constantes publiées, que personne ne discute, et les
            hypothèses de volume, qui vous appartiennent et qui changent tout.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Les trois leviers qui reviennent partout : la durée du calcul, la taille du modèle ou du
            matériel mobilisé, et le nombre de fois où l'on relance. Le pays où tourne la machine
            arrive ensuite — puissant, mais rarement décidé par celui qui écrit le code.
          </p>
        </div>
      </footer>

      {/* Pied de page commun */}
      <Footer variant="marches" />
    </div>
  );
};

export default IaFrugaleOutils;
