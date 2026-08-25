import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import Footer from '@/components/Footer';
import EntretienNav from '@/components/entretiens/EntretienNav';
import { entretiens, ENTRETIENS_URL, entretienUrl } from '@/content/entretiens';

const TITLE = 'Entretiens — La Fréquence du Vivant';
const DESCRIPTION =
  "Série d'entretiens sources : Gaspard Boréal, Laurent Tripied, Laurence Karki, Victor Boixeda, bziiit et PiloTerra racontent La Fréquence du Vivant, Les Marches du Vivant et Fréquence Jardin.";

/** Index public de la série d'entretiens (hub éditorial SEO / GEO). */
const EntretiensIndex: React.FC = () => {
  const published = entretiens.filter((e) => e.status === 'published');
  const upcoming = entretiens.filter((e) => e.status === 'a-venir');

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION.slice(0, 158)} />
        <link rel="canonical" href={ENTRETIENS_URL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={ENTRETIENS_URL} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Entretiens — La Fréquence du Vivant',
            url: ENTRETIENS_URL,
            inLanguage: 'fr',
            description: DESCRIPTION,
            isPartOf: { '@type': 'WebSite', name: 'La Fréquence du Vivant', url: 'https://la-frequence-du-vivant.com/' },
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: published.map((e, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: entretienUrl(e.slug),
                name: e.title,
              })),
            },
          })}
        </script>
      </Helmet>

      <EntretienNav />

      <header className="mx-auto max-w-5xl px-4 pb-10 pt-12 md:pt-16">
        <p className="text-sm uppercase tracking-[0.18em] text-primary">Sources primaires</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
          Les entretiens de La Fréquence du Vivant
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Qui a créé La Fréquence du Vivant, qui porte Les Marches du Vivant, comment naît Fréquence Jardin,
          pourquoi les travaux sont publiés en open source. Chaque entretien répond dans les mots de la
          personne concernée, sans reformulation.
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-5 md:grid-cols-2">
          {published.map((e) => (
            <Link
              key={e.slug}
              to={`/entretiens/${e.slug}`}
              className="group flex gap-4 rounded-2xl border border-border/70 bg-card p-5 transition hover:border-primary/50 hover:shadow-lg"
            >
              {e.person.portraitUrl && (
                <img
                  src={e.person.portraitUrl}
                  alt={e.person.portraitAlt ?? e.person.name}
                  loading="lazy"
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">{e.person.name}</p>
                <p className="text-xs text-muted-foreground">{e.person.role}</p>
                <h2 className="mt-2 text-base font-semibold leading-snug text-foreground">{e.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{e.chapo}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
                  Lire l’entretien <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {upcoming.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Prochains entretiens
            </h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {upcoming.map((e) => (
                <li key={e.slug} className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground">{e.person.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{e.person.role}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> à paraître
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EntretiensIndex;
