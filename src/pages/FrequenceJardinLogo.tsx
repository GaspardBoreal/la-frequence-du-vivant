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
import { BRAND_LOGO_VARIANTS, brandLogoImageObject } from '@/content/brandLogo';


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
  /** Marque à laquelle ce logo appartient — mot-clé principal en recherche d'images. */
  const famLabel =
    logo.family === 'marches'
      ? 'Les Marches du Vivant'
      : logo.family === 'lfdv'
        ? 'La Fréquence du Vivant'
        : 'Fréquence Jardin';
  const title = `${logo.name} — logo ${famLabel} | La Fréquence du Vivant`;
  const description = `${logo.name} : logo ${famLabel}, application éditée par l'association La Fréquence du Vivant. Image PNG haute définition, libre d'accès par URL directe.`;


  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title.slice(0, 70)}</title>
        <meta name="description" content={description.slice(0, 158)} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={`${logo.name} — logo ${famLabel}`} />
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
            {logo.name} — logo {famLabel}

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
            title={`${logo.name} — logo ${famLabel}, La Fréquence du Vivant`}
            width={logo.width}
            height={logo.height}
            loading="eager"
            decoding="async"
            className="mx-auto h-auto w-full max-w-lg rounded-2xl"
          />
          <figcaption className="mt-6 text-center text-sm text-muted-foreground">
            {logo.alt}
            <span className="mt-2 block text-xs">
              © La Fréquence du Vivant — réutilisation autorisée sans modification (
              <a
                href="https://creativecommons.org/licenses/by-nd/4.0/"
                target="_blank"
                rel="noopener noreferrer license"
                className="underline underline-offset-2"
              >
                CC BY-ND 4.0
              </a>
              ), crédit « {famLabel} — La Fréquence du Vivant ».
            </span>

          </figcaption>
        </figure>

        {logo.slug === 'empreinte-vivante' && (
          <section className="mt-10 rounded-2xl border border-border/60 bg-card/50 p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Logo officiel Les Marches du Vivant — déclinaisons
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Le logo officiel des Marches du Vivant est une empreinte de pas dont l'intérieur est un
              feuillage, entourée d'ondes concentriques : la trace du marcheur est faite de vivant et
              se propage. Il est édité par l'association La Fréquence du Vivant et identifie l'agent
              IA de mesure collaborative de la biodiversité. Usage libre pour citer le projet, sans
              modification (licence CC BY-ND 4.0).
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              La première déclinaison, sur fond vert profond, est la version de référence : c'est
              elle qu'il faut fournir aux annuaires, aux moteurs et aux partenaires, parce que le nom
              en blanc de la version transparente disparaîtrait sur un fond clair.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {BRAND_LOGO_VARIANTS.map((v) => (
                <figure
                  key={v.key}
                  className="m-0 flex flex-col overflow-hidden rounded-xl border border-border/50 bg-background/40"
                >
                  <img
                    src={v.path}
                    alt={v.alt}
                    title={`${v.label} — logo Les Marches du Vivant`}
                    width={v.width}
                    height={v.height}
                    loading="lazy"
                    decoding="async"
                    className={`h-auto w-full ${v.key === 'index' ? 'bg-background' : 'bg-[#10251c]'}`}
                  />

                  <figcaption className="flex flex-1 flex-col gap-2 p-4">
                    <span className="text-sm font-semibold text-foreground">{v.label}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{v.usage}</span>
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => copy(v.url, `var-${v.key}`)}>
                        {copied === `var-${v.key}` ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Copier l'URL
                      </Button>
                      <Button asChild variant="secondary" size="sm">
                        <a href={v.path} download={`marches-du-vivant-logo-${v.key}.png`}>
                          <Download className="mr-2 h-4 w-4" /> PNG
                        </a>
                      </Button>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(
                  BRAND_LOGO_VARIANTS.map((v) => brandLogoImageObject(pageUrl, false, v)),
                ),
              }}
            />
          </section>
        )}


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
