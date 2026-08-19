import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Download } from 'lucide-react';
import Footer from '@/components/Footer';
import RoadmapNav from '@/components/roadmap/RoadmapNav';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  fiche,
  ficheLogos,
  findLogo,
  logoImageUrl,
  logoPageUrl,
  logoStatusLabels,
  FICHE_URL,
  SITE_URL,
} from '@/content/frequenceJardinFiche';

/** Page dédiée à un logo Fréquence Jardin — URL stable, indexable en recherche d'images. */
const FrequenceJardinLogo: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const logo = findLogo(slug);
  const [copied, setCopied] = React.useState<string | null>(null);

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success('URL copiée');
    setTimeout(() => setCopied(null), 2000);
  };

  if (!logo) {
    return (
      <div className="min-h-screen bg-background">
        <RoadmapNav />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Logo introuvable</h1>
          <p className="mt-3 text-muted-foreground">
            Cette proposition de logo n'existe pas ou n'est plus publiée.
          </p>
          <Link
            to="/roadmap/frequence-jardin"
            className="mt-6 inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la fiche Fréquence Jardin
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const imageUrl = logoImageUrl(logo);
  const pageUrl = logoPageUrl(logo);
  const title = `${logo.name} — logo Fréquence Jardin | La Fréquence du Vivant`;
  const description = `${logo.name} : proposition de logo pour Fréquence Jardin, l'application de diagnostic du vivant éditée par l'association La Fréquence du Vivant. Image libre d'accès par URL directe.`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title.slice(0, 70)}</title>
        <meta name="description" content={description.slice(0, 158)} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={`${logo.name} — logo Fréquence Jardin`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:alt" content={logo.alt} />
        <meta property="og:image:width" content={String(logo.width)} />
        <meta property="og:image:height" content={String(logo.height)} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content={logo.alt} />
        <meta itemProp="image" content={imageUrl} />
        <link rel="image_src" href={imageUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ImageObject',
            name: `${logo.name} — logo ${famLabel}`,
            alternateName: logo.alt,
            description: logo.intention,
            caption: logo.alt,
            contentUrl: imageUrl,
            url: pageUrl,
            thumbnailUrl: imageUrl,
            width: logo.width,
            height: logo.height,
            encodingFormat: 'image/png',
            inLanguage: 'fr',
            representativeOfPage: true,
            creditText: 'La Fréquence du Vivant',
            creator: { '@type': 'Organization', name: 'La Fréquence du Vivant', url: SITE_URL },
            copyrightHolder: { '@type': 'Organization', name: 'La Fréquence du Vivant', url: SITE_URL },
            copyrightNotice: fiche.imprint.association,
            license: 'https://creativecommons.org/licenses/by-nd/4.0/',
            acquireLicensePage: pageUrl,
            keywords: [`logo ${famLabel}`, famLabel, logo.name, 'La Fréquence du Vivant'],
            mainEntityOfPage: pageUrl,
            isPartOf: { '@type': 'WebPage', name: 'Fréquence Jardin — fiche application', url: FICHE_URL },
          })}
        </script>

        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Fréquence Jardin', item: FICHE_URL },
              { '@type': 'ListItem', position: 2, name: logo.name, item: pageUrl },
            ],
          })}
        </script>
      </Helmet>

      <RoadmapNav />

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-12">
        <Link
          to="/roadmap/frequence-jardin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Fiche Fréquence Jardin
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">
              Identité visuelle — proposition
            </p>
            {logo.status && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                  logo.status === 'retenu'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border/60 text-muted-foreground'
                }`}
              >
                {logoStatusLabels[logo.status]}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
            {logo.name} — logo Fréquence Jardin
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {logo.intention}
          </p>
          {logo.usage && (
            <p className="mt-3 max-w-2xl rounded-xl border border-border/60 bg-card/50 p-4 text-sm leading-relaxed text-foreground/85">
              <span className="font-medium">Emploi : </span>
              {logo.usage}
            </p>
          )}
        </header>


        <figure className="mt-10 overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-6 sm:p-10">
          <img
            src={logo.src}
            alt={logo.alt}
            title={`${logo.name} — logo Fréquence Jardin, La Fréquence du Vivant`}
            width={logo.width}
            height={logo.height}
            loading="eager"
            decoding="async"
            className="mx-auto h-auto w-full max-w-lg rounded-2xl"
          />
          <figcaption className="mt-6 text-center text-sm text-muted-foreground">
            {logo.alt}
          </figcaption>
        </figure>

        <section className="mt-10 rounded-2xl border border-border/60 bg-card/50 p-6">
          <h2 className="text-lg font-semibold text-foreground">URL directes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            À utiliser telles quelles dans un annuaire, une fiche partenaire ou un champ « logo ».
          </p>

          {[
            { label: 'Image (PNG)', value: imageUrl, key: 'img' },
            { label: 'Page du logo', value: pageUrl, key: 'page' },
          ].map((row) => (
            <div
              key={row.key}
              className="mt-4 flex flex-col gap-2 rounded-xl border border-border/50 bg-background/50 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-primary">{row.label}</p>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{row.value}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copy(row.value, row.key)}>
                {copied === row.key ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copier
              </Button>
            </div>
          ))}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <a href={logo.src} download={`frequence-jardin-logo-${logo.slug}.png`}>
                <Download className="mr-2 h-4 w-4" /> Télécharger le PNG
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                copy(
                  `<img src="${imageUrl}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}" />`,
                  'html',
                )
              }
            >
              {copied === 'html' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copier la balise HTML
            </Button>
          </div>
        </section>

        {/* Autres propositions */}
        <section className="mt-12">
          <h2 className="mb-5 border-b border-border/60 pb-3 text-xl font-semibold text-foreground">
            Les autres propositions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ficheLogos
              .filter((l) => l.slug !== logo.slug)
              .map((l) => (
                <Link
                  key={l.slug}
                  to={`/roadmap/frequence-jardin/logo/${l.slug}`}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/40 p-4 transition hover:border-primary/40"
                >
                  <img
                    src={l.src}
                    alt={l.alt}
                    title={`${l.name} — logo Fréquence Jardin`}
                    width={l.width}
                    height={l.height}
                    loading="lazy"
                    decoding="async"
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{l.name}</p>
                    <p className="text-xs text-muted-foreground">Voir la page du logo</p>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-border/60 bg-card/50 p-6">
          <h2 className="text-lg font-semibold text-foreground">Éditeur</h2>
          <address className="mt-3 not-italic text-sm leading-snug text-muted-foreground">
            <p className="text-foreground">
              {fiche.imprint.association} · {fiche.imprint.address.join(' · ')} · Contact :{' '}
              {fiche.imprint.contact}
            </p>
          </address>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FrequenceJardinLogo;
