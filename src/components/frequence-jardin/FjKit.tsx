import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight } from 'lucide-react';
import { FJ_BASE } from '@/content/frequenceJardin/pilier';

const SITE = 'https://la-frequence-du-vivant.com';

/** En-tête <head> commun aux pages Fréquence Jardin : titre, description, canonique, fil d'Ariane. */
export const FjHead: React.FC<{
  title: string;
  description: string;
  path: string;
  breadcrumb: { name: string; path: string }[];
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}> = ({ title, description, path, breadcrumb, jsonLd }) => {
  const url = `${SITE}${path}`;
  const extra = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description.slice(0, 158)} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description.slice(0, 200)} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="La Fréquence du Vivant" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description.slice(0, 200)} />
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumb.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: b.name,
            item: `${SITE}${b.path}`,
          })),
        })}
      </script>
      {extra.map((node, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(node)}
        </script>
      ))}
    </Helmet>
  );
};

/** Fil d'Ariane visible. */
export const FjBreadcrumb: React.FC<{ items: { name: string; path?: string }[] }> = ({ items }) => (
  <nav
    aria-label="Fil d’Ariane"
    className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-5 pt-6 text-[13px] text-[hsl(var(--ds-ink-soft))]"
  >
    {items.map((it, i) => (
      <span key={it.name} className="flex items-center gap-1">
        {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden />}
        {it.path ? (
          <Link to={it.path} className="underline-offset-4 hover:underline">
            {it.name}
          </Link>
        ) : (
          <span className="text-[hsl(var(--ds-ink))]">{it.name}</span>
        )}
      </span>
    ))}
  </nav>
);

/** Section de page, ancrable. */
export const FjSection: React.FC<{
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
  tone?: 'cream' | 'forest';
}> = ({ id, eyebrow, title, lead, children, tone = 'cream' }) => (
  <section
    id={id}
    className={
      tone === 'forest'
        ? 'bg-[hsl(var(--ds-forest-deep))] py-16 text-[hsl(var(--ds-cream))] md:py-20'
        : 'py-16 md:py-20'
    }
  >
    <div className="mx-auto max-w-5xl px-5">
      {eyebrow && (
        <p
          className={`mb-3 text-[11px] uppercase tracking-[0.22em] ${
            tone === 'forest' ? 'text-[hsl(var(--ds-gold))]' : 'text-[hsl(var(--ds-earth))]'
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-serif text-[26px] leading-tight md:text-[34px] ${
          tone === 'forest' ? '' : 'text-[hsl(var(--ds-forest-deep))]'
        }`}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={`mt-4 max-w-3xl text-[15px] leading-relaxed md:text-[17px] ${
            tone === 'forest' ? 'text-[hsl(var(--ds-cream))]/80' : 'text-[hsl(var(--ds-ink-soft))]'
          }`}
        >
          {lead}
        </p>
      )}
      {children && <div className="mt-8">{children}</div>}
    </div>
  </section>
);

/** Cartes « à lire ensuite » : le maillage interne du groupe Fréquence Jardin. */
export const FjRelated: React.FC<{
  items: { path: string; short: string; desc: string }[];
  currentPath?: string;
}> = ({ items, currentPath }) => {
  const list = items.filter((i) => i.path !== currentPath);
  return (
    <section className="border-t border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] py-14">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-serif text-[22px] text-[hsl(var(--ds-forest-deep))] md:text-[26px]">
          À lire ensuite
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {list.map((i) => (
            <Link
              key={i.path}
              to={i.path}
              className="group rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-5 transition hover:border-[hsl(var(--ds-forest-soft))] hover:shadow-sm"
            >
              <p className="font-serif text-[18px] text-[hsl(var(--ds-forest-deep))]">{i.short}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">{i.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-[hsl(var(--ds-forest))]">
                Lire <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
          <Link
            to={FJ_BASE.replace(SITE, '')}
            className="group rounded-2xl border border-dashed border-[hsl(var(--ds-line))] p-5 transition hover:border-[hsl(var(--ds-forest-soft))]"
          >
            <p className="font-serif text-[18px] text-[hsl(var(--ds-forest-deep))]">Fréquence Jardin</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">
              Revenir à la présentation générale de l’application.
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
};
