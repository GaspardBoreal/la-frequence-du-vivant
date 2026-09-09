import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import Footer from '@/components/Footer';
import { FjHead, FjBreadcrumb, FjSection, FjRelated } from '@/components/frequence-jardin/FjKit';
import { FJ_PAGES } from '@/content/frequenceJardin/pilier';
import { PALETTE_SOURCES } from '@/lib/paletteSources';
import { SYNTHESE_AXES } from '@/content/etudeDeSolMethodes';

const PATH = '/frequence-jardin/palette-vegetale';
const SITE = 'https://la-frequence-du-vivant.com';

const ETAPES = [
  {
    title: '1. Le sol mesuré devient une position',
    desc: "Les prélèvements de terrain sont convertis en quatre valeurs de synthèse — eau, texture, nutrition, pH — sur une échelle à cinq crans. C'est la position écologique du lieu.",
  },
  {
    title: '2. La flore spontanée confirme ou contredit',
    desc: "Le cortège relevé sur place est lu par la méthode bio-indicatrice. Quand les deux voix s'accordent, la position est fiable ; quand elles divergent, l'écart est signalé plutôt que masqué.",
  },
  {
    title: '3. Les optima publiés font le tri',
    desc: "Chaque espèce candidate porte ses propres optima écologiques, issus de référentiels botaniques publiés. On ne retient que celles dont l'optimum recouvre la position du lieu.",
  },
  {
    title: '4. Le climat local et sa dérive tranchent',
    desc: "La commune, sa station météo de rattachement et les projections climatiques écartent les espèces qui tiendraient aujourd'hui mais pas dans trente ans.",
  },
  {
    title: '5. La planche se regarde avant de se lire',
    desc: "Vignettes photographiques sourcées, strates, fonctions écologiques et disponibilité en filière locale : la palette s'imprime pour être emportée en pépinière.",
  },
];

/** Page publique : comment se construit une palette végétale. */
const FrequenceJardinPalette: React.FC = () => {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Palette végétale : choisir des plantes adaptées au lieu',
    description:
      "Comment une recommandation d'espèces se construit à partir d'un sol mesuré, d'une flore lue, d'un climat local et de sources botaniques nommées.",
    inLanguage: 'fr-FR',
    mainEntityOfPage: `${SITE}${PATH}`,
    about: ['Palette végétale', 'Plantes adaptées au sol', 'Végétal local', 'Agroécologie'],
    author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    publisher: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    citation: PALETTE_SOURCES.map((s) => s.name),
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))] font-sans">
      <FjHead
        title="Palette végétale : choisir des plantes adaptées au sol — Fréquence Jardin"
        description="Comment Fréquence Jardin recommande des espèces : sol mesuré, flore bio-indicatrice, climat local et projections, sources botaniques nommées (CNPF, Baseflor, Tela Botanica, Végétal local)."
        path={PATH}
        breadcrumb={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: 'Palette végétale', path: PATH },
        ]}
        jsonLd={articleLd}
      />
      <FjBreadcrumb
        items={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: 'Palette végétale' },
        ]}
      />

      <header className="mx-auto max-w-5xl px-5 pb-10 pt-8">
        <h1 className="font-serif text-[32px] leading-tight text-[hsl(var(--ds-forest-deep))] md:text-[46px]">
          Choisir des plantes adaptées au lieu
        </h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-[hsl(var(--ds-ink))] md:text-[18px]">
          Une palette végétale n’est pas une liste d’envies : c’est la conséquence d’un sol lu.
          Dans Fréquence Jardin, chaque espèce proposée peut être justifiée par la position
          écologique du lieu, par un référentiel botanique nommé et par le climat de la commune.
        </p>
      </header>

      <main>
        <FjSection
          eyebrow="La position du lieu"
          title="Quatre valeurs suffisent à situer un jardin"
          lead="Avant toute recommandation, le lieu est réduit à quatre curseurs. C’est cette position que les optima des espèces doivent recouvrir."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {SYNTHESE_AXES.map((a) => (
              <div key={a.label} className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-5">
                <h3 className="font-serif text-[18px] text-[hsl(var(--ds-forest-deep))]">{a.label}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">{a.steps}</p>
              </div>
            ))}
          </div>
        </FjSection>

        <FjSection tone="forest" eyebrow="La méthode" title="De la carotte de sol à la planche à planter">
          <ol className="space-y-4">
            {ETAPES.map((e) => (
              <li
                key={e.title}
                className="rounded-2xl border border-[hsl(var(--ds-cream))]/15 bg-[hsl(var(--ds-cream))]/[0.06] p-5"
              >
                <h3 className="font-serif text-[18px]">{e.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--ds-cream))]/80">{e.desc}</p>
              </li>
            ))}
          </ol>
        </FjSection>

        <FjSection
          eyebrow="Transparence"
          title="Les sources des recommandations"
          lead="Chaque optimum écologique utilisé provient d’un référentiel public, nommé et consultable."
        >
          <ul className="divide-y divide-[hsl(var(--ds-line))] rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60">
            {PALETTE_SOURCES.map((s) => (
              <li key={s.id} className="p-5">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-[hsl(var(--ds-forest-deep))] underline-offset-4 hover:underline"
                >
                  {s.name} <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">{s.role}</p>
              </li>
            ))}
          </ul>
        </FjSection>

        <FjSection
          eyebrow="Ce que ce n’est pas"
          title="Les limites, dites clairement"
          lead="Une palette issue d’un diagnostic de terrain reste une aide à la décision, pas une garantie de reprise."
        >
          <ul className="space-y-3">
            {[
              "Les valeurs de sol sont des classes de terrain, pas des dosages de laboratoire.",
              "Le microclimat d'un jardin (mur, pente, vent, ombre portée) peut contredire la moyenne communale : il se constate sur place.",
              "La disponibilité réelle des plants dépend des pépinières et de la filière locale.",
              "Aucune recherche de polluants ni de métaux lourds n'est réalisée.",
            ].map((t) => (
              <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-[hsl(var(--ds-ink))]">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--ds-earth))]" />
                {t}
              </li>
            ))}
          </ul>
          <a
            href={FJ_SIGNUP_URL}
            target="_blank"
            rel="noopener"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-forest))] px-6 py-3 text-[15px] font-medium text-[hsl(var(--ds-cream))]"
          >
            Obtenir la palette de mon jardin <ArrowRight className="h-4 w-4" />
          </Link>
        </FjSection>
      </main>

      <FjRelated items={FJ_PAGES} currentPath={PATH} />
      <Footer variant="marches" />
    </div>
  );
};

export default FrequenceJardinPalette;
