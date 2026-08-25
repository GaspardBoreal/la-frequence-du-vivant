import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Copy, Check, Download, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import EntretienNav from '@/components/entretiens/EntretienNav';
import PartnerAuditContent from '@/components/partners/PartnerAuditContent';
import { Button } from '@/components/ui/button';
import {
  getEntretien,
  entretienUrl,
  entretienToMarkdown,
  slugifyAnchor,
  entretiens,
  ENTRETIENS_URL,
  SITE_ORIGIN,
} from '@/content/entretiens';

const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_ORIGIN}/#organization`,
  name: 'La Fréquence du Vivant',
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/favicon.png`,
  sameAs: [
    'https://www.gaspardboreal.com',
    'https://bziiit.com',
    'https://piloterra.fr',
    'https://piloterra.fr/agents/les-marches-du-vivant',
  ],
};

/** Ajoute un identifiant d'ancre à chaque question du corps Markdown. */
const withAnchors = (body: string) =>
  body
    .split('\n')
    .map((line) => {
      const t = line.trim();
      if (/^\*\*.+\?\*\*$/.test(t)) {
        const text = t.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\*/g, '');
        return `## ${text}`;
      }
      return line;
    })
    .join('\n');

const EntretienDetail: React.FC = () => {
  const { slug } = useParams();
  const entretien = getEntretien(slug);
  const [copied, setCopied] = React.useState(false);

  if (!entretien) return <Navigate to="/entretiens" replace />;
  if (entretien.status === 'a-venir') return <Navigate to="/entretiens" replace />;

  const url = entretienUrl(entretien.slug);
  const body = withAnchors(entretien.body);
  const markdown = entretienToMarkdown(entretien);
  const related = entretien.related
    .map((s) => entretiens.find((e) => e.slug === s))
    .filter((e): e is NonNullable<typeof e> => Boolean(e && e.status === 'published'));

  const onCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success('Entretien copié en Markdown');
    setTimeout(() => setCopied(false), 2200);
  };

  const onDownload = () => {
    const href = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
    const a = document.createElement('a');
    a.href = href;
    a.download = `${entretien.slug}.md`;
    a.click();
    URL.revokeObjectURL(href);
  };

  const person = {
    '@type': 'Person',
    name: entretien.person.name,
    jobTitle: entretien.person.role,
    affiliation: ORGANIZATION,
    ...(entretien.person.sameAs.length ? { sameAs: entretien.person.sameAs } : {}),
    ...(entretien.person.portraitUrl && !entretien.person.portraitIsArtwork
      ? { image: `${SITE_ORIGIN}${entretien.person.portraitUrl}` }
      : {}),
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entretien.title,
      description: entretien.seoDescription,
      inLanguage: 'fr',
      datePublished: entretien.publishedAt,
      dateModified: entretien.updatedAt,
      author: person,
      publisher: ORGANIZATION,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      about: entretien.entities.map((name) => ({ '@type': 'Thing', name })),
      ...(entretien.person.portraitUrl ? { image: `${SITE_ORIGIN}${entretien.person.portraitUrl}` } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Entretiens', item: ENTRETIENS_URL },
        { '@type': 'ListItem', position: 3, name: entretien.title, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: entretien.questions.map((q, i) => ({
        '@type': 'Question',
        name: q.text,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            entretien.body
              .split(/\*\*.+\?\*\*/)
              [i + 1]?.trim()
              .split('\n\n')[0]
              ?.slice(0, 900) ?? entretien.seoDescription,
        },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{entretien.seoTitle}</title>
        <meta name="description" content={entretien.seoDescription.slice(0, 158)} />
        <link rel="canonical" href={entretien.canonicalOverride ?? url} />
        <meta property="og:title" content={entretien.title} />
        <meta property="og:description" content={entretien.seoDescription} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={entretien.publishedAt} />
        <meta name="twitter:card" content="summary_large_image" />
        {entretien.person.portraitUrl && (
          <meta property="og:image" content={`${SITE_ORIGIN}${entretien.person.portraitUrl}`} />
        )}
        {jsonLd.map((node, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(node)}
          </script>
        ))}
      </Helmet>

      <EntretienNav />

      <article className="mx-auto max-w-3xl px-4 pb-16 pt-10">
        <nav aria-label="Fil d'Ariane" className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Accueil</Link>
          <span className="px-1.5">/</span>
          <Link to="/entretiens" className="hover:text-foreground">Entretiens</Link>
        </nav>

        <header className="mt-5">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            {entretien.title}
          </h1>
          <div className="mt-5 flex items-center gap-3">
            {entretien.person.portraitUrl && (
              <img
                src={entretien.person.portraitUrl}
                alt={entretien.person.portraitAlt ?? entretien.person.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <div className="text-sm">
              <p className="font-medium text-foreground">{entretien.person.name}</p>
              <p className="text-muted-foreground">{entretien.person.role}</p>
            </div>
          </div>
          <p className="mt-6 text-[15px] leading-relaxed text-foreground/85">{entretien.chapo}</p>
        </header>

        {entretien.keyPoints.length > 0 && (
          <section className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-primary">
              <Sparkles className="h-4 w-4" /> À retenir
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/85">
              {entretien.keyPoints.map((k) => (
                <li key={k} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {entretien.questions.length > 0 && (
          <nav className="mt-8 rounded-2xl border border-border/70 bg-muted/30 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Les questions
            </h2>
            <ol className="mt-3 space-y-2 text-sm">
              {entretien.questions.map((q, i) => (
                <li key={q.anchor} className="flex gap-2 text-foreground/80">
                  <span className="text-primary/70">{i + 1}.</span>
                  <a href={`#${q.anchor}`} className="hover:text-primary hover:underline underline-offset-2">
                    {q.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="entretien-body mt-10">
          <PartnerAuditContent content={body} />
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onCopy}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Copier en Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" /> Télécharger le .md
          </Button>
        </div>

        <section className="mt-12 rounded-2xl border border-border/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Pour aller plus loin
          </h2>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {entretien.internalLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-primary underline-offset-2 hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
            {entretien.externalLinks?.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  {l.label} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
          {entretien.entities.length > 0 && (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Entités citées : {entretien.entities.join(' · ')}
            </p>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Poursuivre la série
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/entretiens/${r.slug}`}
                  className="group rounded-xl border border-border/70 p-4 transition hover:border-primary/50"
                >
                  <p className="text-xs text-muted-foreground">{r.person.name}</p>
                  <p className="mt-1 text-sm font-medium leading-snug text-foreground">{r.title}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                    Lire <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <Link to="/entretiens" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Tous les entretiens
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default EntretienDetail;
