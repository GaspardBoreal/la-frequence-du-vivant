import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Leaf } from 'lucide-react';
import Footer from '@/components/Footer';
import NotFound from '@/pages/NotFound';
import { FjHead, FjBreadcrumb, FjSection, FjRelated } from '@/components/frequence-jardin/FjKit';
import { FJ_PAGES, FJ_SIGNUP_URL } from '@/content/frequenceJardin/pilier';
import { FJ_GUIDE_MAP, type FjGuide, type FjQuestion } from '@/content/frequenceJardin/guides';
import {
  FJ_PLANT_MAP,
  FJ_PLANTS,
  AXES,
  axisLabel,
  getIndicator,
  type FjPlantPage,
} from '@/content/frequenceJardin/plantes';
import { PUBLIC_METHODS } from '@/content/etudeDeSolMethodes';
import { PLANT_INDICATORS } from '@/lib/plantIndicatorKb';

const SITE = 'https://la-frequence-du-vivant.com';

/** Réponse courte, mise en avant : c'est le bloc que citent les moteurs et les IA. */
const AnswerBox: React.FC<{ text: string }> = ({ text }) => (
  <div className="mt-6 max-w-3xl rounded-2xl border border-[hsl(var(--ds-line))] bg-white/70 p-5 md:p-6">
    <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--ds-earth))]">En bref</p>
    <p className="mt-2 text-[16px] leading-relaxed text-[hsl(var(--ds-ink))] md:text-[17px]">{text}</p>
  </div>
);

const Questions: React.FC<{ items: FjQuestion[] }> = ({ items }) => (
  <FjSection eyebrow="Questions fréquentes" title="Ce qu’on nous demande le plus souvent">
    <div className="space-y-4">
      {items.map((it) => (
        <div key={it.q} className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-5">
          <h3 className="font-serif text-[18px] text-[hsl(var(--ds-forest-deep))]">{it.q}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">{it.a}</p>
        </div>
      ))}
    </div>
  </FjSection>
);

const SignupCta: React.FC<{ label: string }> = ({ label }) => (
  <FjSection
    tone="forest"
    eyebrow="Passer au terrain"
    title="Vos mesures, dans un carnet daté"
    lead="Chaque prélèvement garde sa position, ses photographies et ses valeurs. La synthèse s’imprime en carnet A4."
  >
    <a
      href={FJ_SIGNUP_URL}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-cream))] px-6 py-3 text-[15px] font-medium text-[hsl(var(--ds-forest-deep))]"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </a>
  </FjSection>
);

/** Table complète des plantes bio-indicatrices, groupée par famille. */
const PlantTable: React.FC = () => {
  const families: { key: string; label: string }[] = [
    { key: 'herbacee', label: 'Herbacées' },
    { key: 'arbuste', label: 'Arbustes' },
    { key: 'liane', label: 'Lianes' },
    { key: 'arbre', label: 'Arbres' },
  ];
  return (
    <div className="space-y-10">
      {families.map((f) => {
        const rows = PLANT_INDICATORS.filter((p) => p.famille === f.key);
        if (!rows.length) return null;
        return (
          <div key={f.key}>
            <h3 className="mb-3 font-serif text-[20px] text-[hsl(var(--ds-forest-deep))]">{f.label}</h3>
            <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60">
              <table className="w-full min-w-[560px] text-left text-[14px]">
                <thead>
                  <tr className="border-b border-[hsl(var(--ds-line))] text-[12px] uppercase tracking-wider text-[hsl(var(--ds-earth))]">
                    <th className="px-4 py-3 font-normal">Plante</th>
                    {AXES.map((a) => (
                      <th key={a.key} className="px-3 py-3 font-normal">
                        {a.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-[hsl(var(--ds-line))]/60 last:border-0">
                      <td className="px-4 py-3">
                        <span className="text-[hsl(var(--ds-ink))]">{p.nom}</span>
                        {p.latin && (
                          <span className="block text-[12px] italic text-[hsl(var(--ds-ink-soft))]">
                            {p.latin}
                          </span>
                        )}
                      </td>
                      {AXES.map((a) => (
                        <td key={a.key} className="px-3 py-3 text-[hsl(var(--ds-ink-soft))]">
                          <span className="font-mono text-[13px] text-[hsl(var(--ds-forest))]">
                            {p[a.key] > 0 ? `+${p[a.key]}` : p[a.key]}
                          </span>
                          <span className="ml-2 text-[12px]">{axisLabel(a.key, p[a.key])}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MethodBlock: React.FC<{ ids: string[] }> = ({ ids }) => {
  const methods = ids
    .map((id) => PUBLIC_METHODS.find((m) => m.id === id))
    .filter((m): m is (typeof PUBLIC_METHODS)[number] => Boolean(m));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {methods.map((m) => (
        <article key={m.id} className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-5">
          <h3 className="font-serif text-[19px] text-[hsl(var(--ds-forest-deep))]">{m.name}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">{m.summary}</p>
          {m.material && (
            <p className="mt-3 text-[13px] text-[hsl(var(--ds-earth))]">Matériel : {m.material}</p>
          )}
          <ol className="mt-3 space-y-2 text-[13px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">
            {m.steps.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="font-mono text-[hsl(var(--ds-forest))]">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {m.benchmarks && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {m.benchmarks.map((b) => (
                <li
                  key={b}
                  className="rounded-full border border-[hsl(var(--ds-line))] px-3 py-1 text-[12px] text-[hsl(var(--ds-forest))]"
                >
                  {b}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[13px] text-[hsl(var(--ds-ink))]">Résultat : {m.deliverable}</p>
        </article>
      ))}
    </div>
  );
};

const GuideView: React.FC<{ guide: FjGuide }> = ({ guide }) => {
  const path = `/frequence-jardin/${guide.slug}`;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.h1,
    description: guide.description,
    inLanguage: 'fr-FR',
    mainEntityOfPage: `${SITE}${path}`,
    author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    publisher: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    isPartOf: { '@type': 'WebPage', name: 'Fréquence Jardin', url: `${SITE}/frequence-jardin` },
  };
  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))] font-sans">
      <FjHead
        title={`${guide.metaTitle} — Fréquence Jardin`}
        description={guide.description}
        path={path}
        breadcrumb={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: guide.h1, path },
        ]}
        jsonLd={articleLd}
      />
      <FjBreadcrumb
        items={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: guide.eyebrow },
        ]}
      />
      <header className="mx-auto max-w-5xl px-5 pb-8 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--ds-earth))]">
          {guide.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-[32px] leading-tight text-[hsl(var(--ds-forest-deep))] md:text-[44px]">
          {guide.h1}
        </h1>
        <AnswerBox text={guide.answer} />
        <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-[hsl(var(--ds-ink))]">
          {guide.intro}
        </p>
      </header>

      <main>
        {guide.blocks.map((b) => (
          <FjSection key={b.title} title={b.title} lead={b.lead}>
            {b.bullets && (
              <ul className="space-y-2 text-[15px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">
                {b.bullets.map((x) => (
                  <li key={x} className="flex gap-2">
                    <Leaf className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--ds-forest))]" aria-hidden />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            )}
            {b.methodIds && <MethodBlock ids={b.methodIds} />}
          </FjSection>
        ))}

        {guide.showPlantTable && (
          <FjSection
            eyebrow="Table de lecture"
            title="Les plantes et leurs quatre indices"
            lead="Indices notés de -3 à +3. Un indice à 0 signifie que la plante est indifférente à ce facteur."
          >
            <PlantTable />
            <div className="mt-8 flex flex-wrap gap-3">
              {FJ_PLANTS.map((p) => (
                <Link
                  key={p.slug}
                  to={`/frequence-jardin/${p.slug}`}
                  className="rounded-full border border-[hsl(var(--ds-line))] px-4 py-2 text-[14px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest-soft))]"
                >
                  {p.h1.split(' :')[0]}
                </Link>
              ))}
            </div>
          </FjSection>
        )}

        <Questions items={guide.questions} />
        <SignupCta label={guide.ctaLabel} />
      </main>

      <FjRelated items={FJ_PAGES} currentPath={path} />
      <Footer variant="marches" />
    </div>
  );
};

const PlantView: React.FC<{ page: FjPlantPage }> = ({ page }) => {
  const path = `/frequence-jardin/${page.slug}`;
  const kb = getIndicator(page.kbId);
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.h1,
    description: page.description,
    inLanguage: 'fr-FR',
    mainEntityOfPage: `${SITE}${path}`,
    author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    publisher: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
  };
  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))] font-sans">
      <FjHead
        title={`${page.metaTitle} — Fréquence Jardin`}
        description={page.description}
        path={path}
        breadcrumb={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: 'Plantes bio-indicatrices', path: '/frequence-jardin/plantes-bio-indicatrices' },
          { name: page.h1, path },
        ]}
        jsonLd={articleLd}
      />
      <FjBreadcrumb
        items={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: 'Plantes bio-indicatrices', path: '/frequence-jardin/plantes-bio-indicatrices' },
          { name: kb?.nom ?? 'Plante' },
        ]}
      />
      <header className="mx-auto max-w-5xl px-5 pb-8 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--ds-earth))]">
          Plante bio-indicatrice
        </p>
        <h1 className="mt-3 font-serif text-[32px] leading-tight text-[hsl(var(--ds-forest-deep))] md:text-[44px]">
          {page.h1}
        </h1>
        {kb?.latin && (
          <p className="mt-2 text-[15px] italic text-[hsl(var(--ds-ink-soft))]">{kb.latin}</p>
        )}
        <AnswerBox text={page.answer} />
        <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-[hsl(var(--ds-ink))]">
          {page.intro}
        </p>
      </header>

      <main>
        {kb && (
          <FjSection
            eyebrow="Ses quatre indices"
            title="Ce que la table de lecture retient"
            lead="Valeurs issues de la base utilisée par l’application, sur une échelle de -3 à +3."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AXES.map((a) => (
                <div
                  key={a.key}
                  className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-5"
                >
                  <p className="text-[12px] uppercase tracking-wider text-[hsl(var(--ds-earth))]">
                    {a.label}
                  </p>
                  <p className="mt-2 font-serif text-[30px] text-[hsl(var(--ds-forest-deep))]">
                    {kb[a.key] > 0 ? `+${kb[a.key]}` : kb[a.key]}
                  </p>
                  <p className="mt-1 text-[14px] text-[hsl(var(--ds-ink-soft))]">
                    {axisLabel(a.key, kb[a.key])}
                  </p>
                </div>
              ))}
            </div>
          </FjSection>
        )}

        <FjSection title="Ce qu’il est raisonnable de faire ensuite">
          <ul className="space-y-3 text-[15px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">
            {page.suites.map((s) => (
              <li key={s} className="flex gap-2">
                <Leaf className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--ds-forest))]" aria-hidden />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/frequence-jardin/tableau-plantes-bio-indicatrices"
              className="rounded-full border border-[hsl(var(--ds-line))] px-5 py-2.5 text-[14px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest-soft))]"
            >
              Voir le tableau complet
            </Link>
            <Link
              to="/frequence-jardin/comment-analyser-le-sol-de-son-jardin"
              className="rounded-full border border-[hsl(var(--ds-line))] px-5 py-2.5 text-[14px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest-soft))]"
            >
              Vérifier par les tests de sol
            </Link>
          </div>
        </FjSection>

        <Questions items={page.questions} />
        <SignupCta label="Relever la flore de mon jardin" />
      </main>

      <FjRelated items={FJ_PAGES} currentPath={path} />
      <Footer variant="marches" />
    </div>
  );
};

/** Résout un guide ou une fiche plante à partir du slug. */
const FrequenceJardinArticle: React.FC = () => {
  const { slug = '' } = useParams();
  const guide = FJ_GUIDE_MAP[slug];
  if (guide) return <GuideView guide={guide} />;
  const plant = FJ_PLANT_MAP[slug];
  if (plant) return <PlantView page={plant} />;
  return <NotFound />;
};

export default FrequenceJardinArticle;
