import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import { FjHead, FjBreadcrumb, FjSection, FjRelated } from '@/components/frequence-jardin/FjKit';
import { FJ_PAGES } from '@/content/frequenceJardin/pilier';
import { PLANT_INDICATORS, type PlantIndicator } from '@/lib/plantIndicatorKb';

const PATH = '/frequence-jardin/plantes-bio-indicatrices';
const SITE = 'https://la-frequence-du-vivant.com';

const FAMILLE_LABEL: Record<PlantIndicator['famille'], string> = {
  herbacee: 'Herbacées',
  arbuste: 'Arbustes',
  liane: 'Lianes',
  arbre: 'Arbres',
};
const FAMILLE_ORDER: PlantIndicator['famille'][] = ['herbacee', 'arbuste', 'liane', 'arbre'];

const AXES: { key: keyof Pick<PlantIndicator, 'eau' | 'texture' | 'nutri' | 'ph'>; label: string; low: string; high: string }[] = [
  { key: 'eau', label: 'Eau', low: 'très sec', high: 'très humide' },
  { key: 'texture', label: 'Texture', low: 'sable, limon léger', high: 'argile lourde' },
  { key: 'nutri', label: 'Nutrition', low: 'pauvre', high: 'riche' },
  { key: 'ph', label: 'pH', low: 'acide', high: 'calcaire' },
];

/** Barre -3..+3 : lecture immédiate de l'indice. */
const IndexBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="flex items-center gap-[3px]" aria-label={`Indice ${value} sur une échelle de -3 à +3`}>
    {[-3, -2, -1, 0, 1, 2, 3].map((n) => {
      const active =
        (value >= 0 && n > 0 && n <= value) ||
        (value <= 0 && n < 0 && n >= value) ||
        (value === 0 && n === 0);
      return (
        <span
          key={n}
          className={`h-3 w-[6px] rounded-sm ${
            active ? 'bg-[hsl(var(--ds-forest))]' : 'bg-[hsl(var(--ds-line))]'
          }`}
        />
      );
    })}
    <span className="ml-1.5 w-6 text-[12px] tabular-nums text-[hsl(var(--ds-ink-soft))]">
      {value > 0 ? `+${value}` : value}
    </span>
  </div>
);

/** Page publique : table des plantes bio-indicatrices utilisées par Fréquence Jardin. */
const FrequenceJardinBioIndicatrices: React.FC = () => {
  const [famille, setFamille] = React.useState<PlantIndicator['famille'] | 'toutes'>('toutes');
  const [q, setQ] = React.useState('');

  const norm = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const groups = React.useMemo(() => {
    const needle = norm(q.trim());
    const filtered = PLANT_INDICATORS.filter((p) => {
      if (famille !== 'toutes' && p.famille !== famille) return false;
      if (!needle) return true;
      return norm(p.nom).includes(needle) || norm(p.latin ?? '').includes(needle);
    });
    return FAMILLE_ORDER.map((f) => ({
      famille: f,
      items: filtered.filter((p) => p.famille === f),
    })).filter((g) => g.items.length > 0);
  }, [famille, q]);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Plantes bio-indicatrices : ce que la flore spontanée dit du sol',
    description: `Table de ${PLANT_INDICATORS.length} plantes bio-indicatrices avec leurs indices d'eau, de texture, de nutrition et de pH, utilisée par Fréquence Jardin pour lire un sol.`,
    inLanguage: 'fr-FR',
    mainEntityOfPage: `${SITE}${PATH}`,
    about: ['Plantes bio-indicatrices', 'Flore spontanée', 'Lecture du sol', 'Agroécologie'],
    author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
    publisher: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))] font-sans">
      <FjHead
        title="Plantes bio-indicatrices : lire le sol par la flore — Fréquence Jardin"
        description={`Ortie, pissenlit, joncs, prunellier… ${PLANT_INDICATORS.length} plantes bio-indicatrices et leurs indices d'eau, texture, nutrition et pH, tels qu'utilisés par Fréquence Jardin.`}
        path={PATH}
        breadcrumb={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: 'Plantes bio-indicatrices', path: PATH },
        ]}
        jsonLd={articleLd}
      />
      <FjBreadcrumb
        items={[
          { name: 'Accueil', path: '/' },
          { name: 'Fréquence Jardin', path: '/frequence-jardin' },
          { name: 'Plantes bio-indicatrices' },
        ]}
      />

      <header className="mx-auto max-w-5xl px-5 pb-10 pt-8">
        <h1 className="font-serif text-[32px] leading-tight text-[hsl(var(--ds-forest-deep))] md:text-[46px]">
          Ce que la flore spontanée dit du sol
        </h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-[hsl(var(--ds-ink))] md:text-[18px]">
          Une ortie ne pousse pas n’importe où : elle signale un sol riche en azote. Un jonc signale
          l’eau qui stagne. Une petite oseille, un sol acide et pauvre. Les plantes qui s’installent
          sans invitation sont les premières analystes d’un terrain — gratuites, permanentes et
          déjà sur place.
        </p>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">
          Fréquence Jardin s’appuie sur la table ci-dessous : {PLANT_INDICATORS.length} espèces,
          chacune portant quatre indices notés de −3 à +3. Confrontés aux mesures de terrain, ces
          indices donnent l’accord — ou le désaccord — entre ce que dit la terre et ce que dit la flore.
        </p>
      </header>

      <main>
        <FjSection eyebrow="Mode d’emploi" title="Quatre indices, une échelle de sept crans">
          <div className="grid gap-4 sm:grid-cols-2">
            {AXES.map((a) => (
              <div key={a.key} className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-5">
                <h3 className="font-serif text-[18px] text-[hsl(var(--ds-forest-deep))]">{a.label}</h3>
                <p className="mt-2 text-[14px] text-[hsl(var(--ds-ink-soft))]">
                  −3 : {a.low} &nbsp;·&nbsp; +3 : {a.high}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[14px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">
            Une plante isolée ne prouve rien. C’est le cortège — plusieurs espèces relevées ensemble
            sur une même zone — qui fait le diagnostic. Plus le relevé est récent et fourni, plus la
            lecture est fiable.
          </p>
        </FjSection>

        <FjSection eyebrow="La table" title={`${PLANT_INDICATORS.length} plantes et leurs indices`}>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Chercher une plante…"
              aria-label="Chercher une plante bio-indicatrice"
              className="w-full rounded-full border border-[hsl(var(--ds-line))] bg-white/70 px-5 py-2.5 text-[15px] text-[hsl(var(--ds-ink))] outline-none focus:border-[hsl(var(--ds-forest-soft))] sm:w-72"
            />
            {(['toutes', ...FAMILLE_ORDER] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFamille(f as typeof famille)}
                className={`rounded-full border px-4 py-2 text-[13px] transition ${
                  famille === f
                    ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                    : 'border-[hsl(var(--ds-line))] text-[hsl(var(--ds-ink))] hover:border-[hsl(var(--ds-forest-soft))]'
                }`}
              >
                {f === 'toutes' ? 'Toutes' : FAMILLE_LABEL[f]}
              </button>
            ))}
          </div>

          {groups.length === 0 && (
            <p className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-6 text-[15px] text-[hsl(var(--ds-ink-soft))]">
              Aucune plante ne correspond à cette recherche.
            </p>
          )}

          <div className="space-y-10">
            {groups.map((g) => (
              <section key={g.famille}>
                <h3 className="mb-3 text-[12px] uppercase tracking-[0.2em] text-[hsl(var(--ds-earth))]">
                  {FAMILLE_LABEL[g.famille]} · {g.items.length}
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {g.items.map((p) => (
                    <article
                      key={p.id}
                      className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-5"
                    >
                      <h4 className="font-serif text-[18px] text-[hsl(var(--ds-forest-deep))]">{p.nom}</h4>
                      {p.latin && (
                        <p className="mt-0.5 text-[13px] italic text-[hsl(var(--ds-earth))]">{p.latin}</p>
                      )}
                      <dl className="mt-4 space-y-2">
                        {AXES.map((a) => (
                          <div key={a.key} className="flex items-center justify-between gap-4">
                            <dt className="text-[13px] text-[hsl(var(--ds-ink-soft))]">{a.label}</dt>
                            <dd>
                              <IndexBar value={p[a.key]} />
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </FjSection>

        <FjSection
          tone="forest"
          eyebrow="Et ensuite"
          title="La flore seule ne suffit pas"
          lead="La lecture bio-indicatrice se confronte toujours aux tests de terrain : bêche, boudin, sédimentation, pH. Quand les deux voix s’accordent, le diagnostic est solide ; quand elles divergent, Fréquence Jardin affiche l’écart au lieu de le lisser."
        >
          <div className="flex flex-wrap gap-3">
            <a
              href={FJ_SIGNUP_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-gold))] px-5 py-2.5 text-[14px] font-medium text-[hsl(var(--ds-forest-deep))]"
            >
              Démarrer mon jardin <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/frequence-jardin/diagnostiquer-son-jardin"
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-cream))] px-5 py-2.5 text-[14px] font-medium text-[hsl(var(--ds-forest-deep))]"
            >
              Le guide du diagnostic <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/frequence-jardin/palette-vegetale"
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-cream))]/40 px-5 py-2.5 text-[14px]"
            >
              Choisir ses plantes ensuite
            </Link>
          </div>
        </FjSection>
      </main>

      <FjRelated items={FJ_PAGES} currentPath={PATH} />
      <Footer variant="marches" />
    </div>
  );
};

export default FrequenceJardinBioIndicatrices;
