import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Leaf, Download, FileText, Copy, Check, ArrowUpRight, Footprints } from 'lucide-react';
import Footer from '@/components/Footer';
import RoadmapNav from '@/components/roadmap/RoadmapNav';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fiche, ficheToMarkdown, FICHE_URL } from '@/content/frequenceJardinFiche';

/** Fiche application publique « Fréquence Jardin », référençable par les IA. */
const FrequenceJardinFiche: React.FC = () => {
  const [copied, setCopied] = React.useState(false);
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const markdown = React.useMemo(() => ficheToMarkdown(), []);

  const download = (content: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success('Fiche copiée en Markdown');
    setTimeout(() => setCopied(false), 2200);
  };

  const onPdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadFichePdf } = await import('@/components/roadmap/FrequenceJardinPdf');
      await downloadFichePdf();
    } catch {
      toast.error("Le PDF n'a pas pu être généré");
    } finally {
      setPdfBusy(false);
    }
  };

  const title = 'Fréquence Jardin — fiche application';
  const description = fiche.baseline;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description.slice(0, 158)} />
        <link rel="canonical" href={FICHE_URL} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={FICHE_URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: fiche.name,
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            inLanguage: 'fr',
            url: FICHE_URL,
            description: fiche.summary,
            author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
            isPartOf: {
              '@type': 'WebSite',
              name: 'La Fréquence du Vivant',
              url: 'https://la-frequence-du-vivant.com/',
            },
          })}
        </script>
      </Helmet>

      <RoadmapNav />

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-12">
        {/* En-tête */}
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
            <Leaf className="h-3.5 w-3.5" /> Fiche application
          </div>
          <p className="mt-4 text-sm font-medium tracking-wide text-muted-foreground">
            Publiée le {fiche.publishedAt}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {fiche.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-primary">{fiche.baseline}</p>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {fiche.summary}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => download(markdown, 'frequence-jardin-fiche-application.md', 'text/markdown;charset=utf-8')}>
              <FileText className="mr-2 h-4 w-4" /> Markdown
            </Button>
            <Button variant="secondary" onClick={onPdf} disabled={pdfBusy}>
              <Download className="mr-2 h-4 w-4" /> {pdfBusy ? 'Génération…' : 'PDF'}
            </Button>
            <Button variant="outline" onClick={onCopy}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copier la fiche
            </Button>
          </div>
        </header>

        {/* Carte d'identité */}
        <section className="mb-14 overflow-hidden rounded-2xl border border-border/60 bg-card/50">
          <div className="border-b border-border/60 px-5 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Carte d'identité
          </div>
          <dl className="divide-y divide-border/50">
            {fiche.meta.map((m) => (
              <div key={m.label} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:gap-6">
                <dt className="w-32 shrink-0 text-sm font-medium text-primary">{m.label}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{m.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Sections */}
        {fiche.sections.map((sec, i) => {
          const isMarches = sec.id === 'marches';
          return (
            <section key={sec.id} id={sec.id} className="mb-14 scroll-mt-24">
              <div className="mb-5 flex items-baseline gap-3 border-b border-border/60 pb-3">
                <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="text-2xl font-semibold text-foreground">
                  {isMarches ? (
                    <span className="inline-flex items-center gap-2">
                      <Footprints className="h-5 w-5 text-primary" /> {sec.title}
                    </span>
                  ) : (
                    sec.title
                  )}
                </h2>
              </div>

              {sec.intro && (
                <p className="mb-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
                  {sec.intro}
                </p>
              )}

              {sec.bullets && (
                <ul className="space-y-3">
                  {sec.bullets.map((b, k) => (
                    <li key={k} className="flex gap-3">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-[15px] leading-relaxed text-foreground/90">{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {sec.items && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {sec.items.map((it) => (
                    <article
                      key={it.name}
                      className="rounded-xl border border-border/60 bg-card/40 p-5 transition hover:border-primary/40"
                    >
                      <h3 className="mb-2 text-base font-semibold text-foreground">{it.name}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
                    </article>
                  ))}
                </div>
              )}

              {isMarches && (
                <a
                  href="/marches-du-vivant"
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm text-primary transition hover:bg-primary/20"
                >
                  Découvrir Les Marches du Vivant <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </section>
          );
        })}

        {/* Pied de fiche */}
        <section className="mb-12 rounded-2xl border border-border/60 bg-card/50 p-6">
          <h2 className="text-lg font-semibold text-foreground">Éditeur de la fiche</h2>
          <address className="mt-3 not-italic text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">{fiche.imprint.association}</p>
            {fiche.imprint.address.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="mt-2">Contact : {fiche.imprint.contact}</p>
          </address>
        </section>

        {/* Reprendre cette fiche */}
        <section className="rounded-2xl border border-primary/25 bg-primary/5 p-6">
          <h2 className="text-lg font-semibold text-foreground">Reprendre cette fiche</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            La fiche est disponible en Markdown et en PDF, sous une forme identique à cette page.
            Elle peut être citée, indexée ou fournie telle quelle à un modèle de langage.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => download(markdown, 'frequence-jardin-fiche-application.md', 'text/markdown;charset=utf-8')}>
              <FileText className="mr-2 h-4 w-4" /> Télécharger le Markdown
            </Button>
            <Button variant="secondary" onClick={onPdf} disabled={pdfBusy}>
              <Download className="mr-2 h-4 w-4" /> {pdfBusy ? 'Génération…' : 'Télécharger le PDF'}
            </Button>
          </div>
          <p className="mt-4 font-mono text-xs text-muted-foreground">{FICHE_URL}</p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FrequenceJardinFiche;
