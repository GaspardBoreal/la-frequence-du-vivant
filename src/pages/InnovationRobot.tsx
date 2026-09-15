import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  FlaskConical,
  Footprints,
  Gauge,
  Grape,
  Leaf,
  Map,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sprout,
  Wrench,
  X,
} from 'lucide-react';
import PublicTopBar from '@/components/layout/PublicTopBar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AUDIENCE_COPY,
  DOSSIER_QUOTES,
  ROBOT_SOLUTIONS,
  ROBOT_SOURCES,
  type RobotAudience,
  type RobotBudget,
  type RobotDecision,
  type RobotFunction,
  type RobotMaturity,
} from '@/content/innovationRobot';
import heroImage from '@/assets/innovation-robot/hero-jardin-porteur.jpg';
import acousticImage from '@/assets/innovation-robot/station-bioacoustique.jpg';
import walkImage from '@/assets/innovation-robot/marche-chariot-capteurs.jpg';
import soilImage from '@/assets/innovation-robot/carotte-sol-sondes.jpg';
import vineyardImage from '@/assets/innovation-robot/vignoble-robot-solaire.jpg';
import workshopImage from '@/assets/innovation-robot/atelier-open-hardware.jpg';

const CANONICAL = 'https://la-frequence-du-vivant.com/innovation-robot';

const AUDIENCE_ICONS = { jardin: Sprout, marche: Footprints, vignoble: Grape, partenaire: CircleDollarSign };
const DECISION_META: Record<RobotDecision, { label: string; className: string }> = {
  acheter: { label: 'Acheter', className: 'bg-primary/12 text-primary' },
  fabriquer: { label: 'Fabriquer', className: 'bg-secondary text-secondary-foreground' },
  louer: { label: 'Louer / mutualiser', className: 'bg-accent text-accent-foreground' },
  surveiller: { label: 'Surveiller', className: 'bg-muted text-muted-foreground' },
  ecarter: { label: 'Écarter du pilote', className: 'bg-destructive/10 text-destructive' },
};

const NAV_ITEMS = [
  ['these', 'La thèse'], ['mesurer', 'Mesurer'], ['agir', 'Agir'], ['choisir', 'Choisir'],
  ['budgets', 'Budgets'], ['plan-action', 'Plan d’action'], ['preuves', 'Preuves & sources'],
] as const;

const FUNCTION_LABELS: Record<RobotFunction, string> = {
  observer: 'Observer', sol: 'Analyser le sol', cartographier: 'Cartographier', transporter: 'Transporter', agir: 'Agir',
};
const BUDGET_LABELS: Record<RobotBudget, string> = {
  'moins-3000': '< 3 000 €', '3000-10000': '3–10 k€', '10000-30000': '10–30 k€', 'plus-30000': '> 30 k€',
};
const MATURITY_LABELS: Record<RobotMaturity, string> = { commercial: 'Disponible', pilote: 'Pilote', recherche: 'Recherche' };

const FieldImage: React.FC<{ src: string; alt: string; caption: string; priority?: boolean; className?: string }> = ({ src, alt, caption, priority, className }) => (
  <figure className={cn('overflow-hidden', className)}>
    <img
      src={src}
      alt={alt}
      width={priority ? 1600 : 1200}
      height={priority ? 1008 : 912}
      loading={priority ? 'eager' : 'lazy'}
      className="h-full w-full object-cover"
    />
    <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">Illustration de principe — {caption}</figcaption>
  </figure>
);

const InnovationRobot: React.FC = () => {
  const [audience, setAudience] = React.useState<RobotAudience>('jardin');
  const [functionFilter, setFunctionFilter] = React.useState<RobotFunction | 'all'>('all');
  const [budgetFilter, setBudgetFilter] = React.useState<RobotBudget | 'all'>('all');
  const [maturityFilter, setMaturityFilter] = React.useState<RobotMaturity | 'all'>('all');

  const copy = AUDIENCE_COPY[audience];
  const filtered = ROBOT_SOLUTIONS.filter((solution) =>
    solution.audiences.includes(audience)
    && (functionFilter === 'all' || solution.functions.includes(functionFilter))
    && (budgetFilter === 'all' || solution.budget === budgetFilter)
    && (maturityFilter === 'all' || solution.maturity === maturityFilter)
  );

  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'TechArticle', headline: 'Robotique frugale pour jardins, marches et vignobles',
      description: 'Plan d’action sourcé pour mesurer la biodiversité et le sol, puis automatiser seulement les gestes utiles.',
      url: CANONICAL, inLanguage: 'fr-FR', dateModified: '2026-09-15',
      author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
      about: ['Robotique frugale', 'Biodiversité', 'Analyse de sol', 'Viticulture', 'Agriculture de précision'],
    },
    {
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Solutions de robotique frugale comparées',
      itemListElement: ROBOT_SOLUTIONS.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, description: item.summary })),
    },
  ];

  const resetFilters = () => {
    setFunctionFilter('all');
    setBudgetFilter('all');
    setMaturityFilter('all');
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-ink))]">
      <Helmet>
        <title>Robotique frugale : plan d’action biodiversité & sol</title>
        <meta name="description" content="Quoi acheter, fabriquer, louer ou écarter pour mesurer la biodiversité et le sol, puis agir dans les jardins, marches et vignobles." />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="Robotique frugale : capteurs d’abord, robots ensuite" />
        <meta property="og:description" content="Solutions comparées, budgets par paliers, preuves et plan d’action terrain sur 12 mois." />
        <meta property="og:url" content={CANONICAL} />
        <meta name="twitter:card" content="summary_large_image" />
        {jsonLd.map((node, index) => <script key={index} type="application/ld+json">{JSON.stringify(node)}</script>)}
      </Helmet>

      <PublicTopBar tone="dark" leftSlot={<Link to="/" className="text-sm font-medium text-primary-foreground">La Fréquence du Vivant</Link>} />

      <header className="relative min-h-[min(780px,88svh)] overflow-hidden bg-[hsl(var(--ds-forest-deep))]">
        <img src={heroImage} alt="Écologue poussant un petit porteur de capteurs dans un jardin vivant" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--ds-forest-deep))]/95 via-[hsl(var(--ds-forest-deep))]/72 to-transparent" />
        <div className="relative mx-auto flex min-h-[min(780px,88svh)] max-w-6xl items-end px-5 pb-14 pt-20 sm:px-8 md:items-center md:pb-20">
          <div className="max-w-3xl text-[hsl(var(--ds-cream))]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--ds-gold))]">Innovation robot · feuille de route 2026</p>
            <h1 className="mt-5 font-serif text-4xl leading-[1.04] sm:text-6xl md:text-7xl">Capteurs d’abord.<br />Robots ensuite.</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[hsl(var(--ds-cream))]/85 sm:text-xl">
              La robotique la plus frugale n’imite pas l’humain. Elle mesure mieux, transporte ce qui fatigue et n’agit que lorsque le bénéfice est prouvé.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#choisir" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[hsl(var(--ds-gold))] px-5 py-3 font-medium text-[hsl(var(--ds-forest-deep))]">Comparer les solutions <ArrowRight className="h-4 w-4" /></a>
              <a href="#plan-action" className="inline-flex min-h-11 items-center rounded-md border border-[hsl(var(--ds-cream))]/45 px-5 py-3 font-medium">Voir le plan sur 12 mois</a>
            </div>
            <p className="mt-5 max-w-xl text-xs leading-relaxed text-[hsl(var(--ds-cream))]/65">Illustration de principe. Aucun produit représenté n’est une recommandation commerciale.</p>
          </div>
        </div>
      </header>

      <div className="sticky top-14 z-40 border-b border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2" aria-label="Sections de la page">
          {NAV_ITEMS.map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-md px-3 py-2 text-xs font-medium text-[hsl(var(--ds-ink-soft))] hover:bg-[hsl(var(--ds-forest))]/8 hover:text-[hsl(var(--ds-forest-deep))]">{label}</a>)}
        </nav>
      </div>

      <main>
        <section id="these" className="scroll-mt-28 border-b border-[hsl(var(--ds-line))] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-earth))]">Votre parcours</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
              {(Object.keys(AUDIENCE_COPY) as RobotAudience[]).map((key) => {
                const Icon = AUDIENCE_ICONS[key];
                return <Button key={key} variant={audience === key ? 'default' : 'outline'} onClick={() => setAudience(key)} className="justify-start sm:justify-center"><Icon className="h-4 w-4" />{AUDIENCE_COPY[key].label}</Button>;
              })}
            </div>
            <div className="mt-9 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
              <div>
                <h2 className="font-serif text-3xl leading-tight text-[hsl(var(--ds-forest-deep))] sm:text-5xl">{copy.title}</h2>
                <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[hsl(var(--ds-ink-soft))]">{copy.lead}</p>
              </div>
              <blockquote className="border-l-2 border-[hsl(var(--ds-gold))] pl-5 font-serif text-xl italic leading-relaxed text-[hsl(var(--ds-forest))]">
                « Le robot n’est justifié que si la mesure, la sécurité ou le geste s’améliore davantage que son coût total. »
              </blockquote>
            </div>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-line))] sm:grid-cols-5">
              {['Observer', 'Comprendre', 'Décider', 'Agir', 'Vérifier'].map((step, index) => (
                <li key={step} className="bg-[hsl(var(--ds-cream))] p-4"><span className="text-xs text-[hsl(var(--ds-earth))]">0{index + 1}</span><p className="mt-2 font-serif text-lg text-[hsl(var(--ds-forest-deep))]">{step}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section id="mesurer" className="scroll-mt-28 bg-[hsl(var(--ds-forest-deep))] py-16 text-[hsl(var(--ds-cream))] sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-gold))]">Mesurer</p>
            <h2 className="mt-3 max-w-3xl font-serif text-3xl sm:text-5xl">Le vivant laisse plusieurs traces. Aucune ne suffit seule.</h2>
            <div className="mt-12 grid gap-10 lg:grid-cols-2">
              <div>
                <FieldImage src={acousticImage} alt="Station bioacoustique ouverte fixée sur un arbre" caption="station d’écoute passive en lisière" className="aspect-[4/3] [&_figcaption]:text-[hsl(var(--ds-cream))]/60" />
                <h3 className="mt-6 font-serif text-2xl">Biodiversité : croiser les modalités</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[hsl(var(--ds-cream))]/78">
                  <li className="flex gap-3"><Radio className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ds-gold))]" />AudioMoth/BirdNET pour écouter longtemps, avec validation des détections.</li>
                  <li className="flex gap-3"><Map className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ds-gold))]" />Photographies et coordonnées comme preuve inspectable et partageable.</li>
                  <li className="flex gap-3"><FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ds-gold))]" />eDNA ponctuel sous-traité quand la question le justifie, jamais comme substitut universel.</li>
                </ul>
              </div>
              <div>
                <FieldImage src={soilImage} alt="Carotte de sol mesurée avec plusieurs sondes calibrées" caption="sondes confrontées à une carotte de sol observable" className="aspect-[4/3] [&_figcaption]:text-[hsl(var(--ds-cream))]/60" />
                <h3 className="mt-6 font-serif text-2xl">Sol : une série, pas un chiffre magique</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[hsl(var(--ds-cream))]/78">
                  <li className="flex gap-3"><Gauge className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ds-gold))]" />Humidité, température et conductivité répétées aux mêmes points.</li>
                  <li className="flex gap-3"><RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ds-gold))]" />pH étalonné et contrôlé avec les méthodes terrain de Fréquence Jardin.</li>
                  <li className="flex gap-3"><X className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ds-gold))]" />Aucune prescription NPK fondée sur un testeur grand public non validé.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="agir" className="scroll-mt-28 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-earth))]">Agir</p>
            <h2 className="mt-3 font-serif text-3xl text-[hsl(var(--ds-forest-deep))] sm:text-5xl">Du portage manuel à l’action mutualisée</h2>
            <div className="mt-12 grid gap-10 md:grid-cols-2">
              <FieldImage src={walkImage} alt="Groupe de marcheurs utilisant un chariot de capteurs à un point d’arrêt" caption="kit collectif standardisé pour une Marche du Vivant" className="aspect-[4/3]" />
              <div className="self-center">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ds-earth))]">Marches du Vivant</p>
                <h3 className="mt-3 font-serif text-3xl text-[hsl(var(--ds-forest-deep))]">Le chariot avant le rover</h3>
                <p className="mt-4 leading-relaxed text-[hsl(var(--ds-ink-soft))]">Un chariot garantit la hauteur des capteurs, transporte le matériel et répète le protocole sans introduire une autonomie dangereuse au milieu du groupe. Le rover ne vient qu’après, sur parcours fermé.</p>
              </div>
              <div className="self-center md:order-3">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ds-earth))]">Vignobles</p>
                <h3 className="mt-3 font-serif text-3xl text-[hsl(var(--ds-forest-deep))]">Léger si possible. Mutualisé si lourd.</h3>
                <p className="mt-4 leading-relaxed text-[hsl(var(--ds-ink-soft))]">Tester une petite machine légère pendant une saison peut être rationnel. Acheter un porte-outils à six chiffres avant de connaître son taux d’usage, sa maintenance et son effet sur les refuges ne l’est pas.</p>
              </div>
              <FieldImage src={vineyardImage} alt="Petit robot solaire circulant entre des rangs de vigne avec une bande fleurie préservée" caption="entretien léger avec zone refuge explicitement préservée" className="aspect-[4/3] md:order-4" />
            </div>
          </div>
        </section>

        <section id="choisir" className="scroll-mt-28 border-y border-[hsl(var(--ds-line))] bg-card/45 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-earth))]">Choisir</p><h2 className="mt-3 font-serif text-3xl text-[hsl(var(--ds-forest-deep))] sm:text-5xl">Acheter, fabriquer, louer ou écarter</h2></div>
              <p className="max-w-md text-sm leading-relaxed text-[hsl(var(--ds-ink-soft))]">Les prix sont ceux publiquement vérifiables au 15 septembre 2026. « Sur devis » vaut mieux qu’un faux chiffre précis.</p>
            </div>

            <div className="mt-8 grid gap-3 rounded-lg border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-4 sm:grid-cols-3">
              <label className="space-y-1.5 text-xs font-medium text-[hsl(var(--ds-ink-soft))]">Fonction
                <select value={functionFilter} onChange={(event) => setFunctionFilter(event.target.value as RobotFunction | 'all')} className="h-11 w-full rounded-md border border-[hsl(var(--ds-line))] bg-background px-3 text-sm text-foreground">
                  <option value="all">Toutes</option>{Object.entries(FUNCTION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-medium text-[hsl(var(--ds-ink-soft))]">Budget
                <select value={budgetFilter} onChange={(event) => setBudgetFilter(event.target.value as RobotBudget | 'all')} className="h-11 w-full rounded-md border border-[hsl(var(--ds-line))] bg-background px-3 text-sm text-foreground">
                  <option value="all">Tous</option>{Object.entries(BUDGET_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-medium text-[hsl(var(--ds-ink-soft))]">Maturité
                <select value={maturityFilter} onChange={(event) => setMaturityFilter(event.target.value as RobotMaturity | 'all')} className="h-11 w-full rounded-md border border-[hsl(var(--ds-line))] bg-background px-3 text-sm text-foreground">
                  <option value="all">Toutes</option>{Object.entries(MATURITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-[hsl(var(--ds-ink-soft))]"><span>{filtered.length} solution{filtered.length > 1 ? 's' : ''}</span><Button variant="ghost" size="sm" onClick={resetFilters}><RefreshCw className="h-4 w-4" />Réinitialiser</Button></div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {filtered.map((solution) => {
                const decision = DECISION_META[solution.decision];
                return (
                  <article key={solution.id} className="rounded-lg border border-[hsl(var(--ds-line))] bg-background p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{solution.type}</p><h3 className="mt-1 font-serif text-2xl text-[hsl(var(--ds-forest-deep))]">{solution.name}</h3></div><span className={cn('rounded-full px-3 py-1 text-xs font-semibold', decision.className)}>{decision.label}</span></div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{solution.summary}</p>
                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-4 text-sm">
                      <div><dt className="text-xs text-muted-foreground">Coût</dt><dd className="mt-1 font-medium">{solution.cost}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Maturité</dt><dd className="mt-1 font-medium">{MATURITY_LABELS[solution.maturity]}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Énergie</dt><dd className="mt-1">{solution.energy}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Réparabilité</dt><dd className="mt-1">{solution.repairability}</dd></div>
                    </dl>
                    <p className="mt-4 text-sm"><strong>Pourquoi ce choix ?</strong> <span className="text-muted-foreground">{solution.why}</span></p>
                    <details className="mt-4 border-t border-border pt-3">
                      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-sm font-medium">Données, intégration et limites <ChevronDown className="h-4 w-4" /></summary>
                      <div className="space-y-2 pb-2 text-sm leading-relaxed text-muted-foreground"><p><strong className="text-foreground">Produit :</strong> {solution.output}</p><p><strong className="text-foreground">Intégration :</strong> {solution.integration}</p><p><strong className="text-foreground">Limites :</strong> {solution.limits}</p></div>
                    </details>
                  </article>
                );
              })}
            </div>
            {filtered.length === 0 && <div className="mt-5 rounded-lg border border-dashed border-border p-8 text-center"><p>Aucune solution ne correspond à ces trois filtres.</p><Button className="mt-4" variant="outline" onClick={resetFilters}>Voir toutes les solutions</Button></div>}
          </div>
        </section>

        <section id="budgets" className="scroll-mt-28 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-earth))]">Budgets par paliers</p>
            <h2 className="mt-3 max-w-3xl font-serif text-3xl text-[hsl(var(--ds-forest-deep))] sm:text-5xl">Chaque palier doit mériter le suivant</h2>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {[
                { n: '01', price: '< 3 000 €', title: 'Prouver la valeur', items: ['Deux kits terrain interchangeables', 'Bioacoustique et sondes contrôlées', 'Chariot manuel réparable'], gate: 'Passer si les données valides et le temps gagné progressent sur 2 jardins + 2 marches.' },
                { n: '02', price: '3 000–10 000 €', title: 'Motoriser sans lâcher la main', items: ['Téléopération basse vitesse', 'Arrêt d’urgence et reprise manuelle', 'Une seule action réversible'], gate: 'Passer après zéro incident et un coût par mission inférieur au protocole précédent.' },
                { n: '03', price: '10 000–30 000 €', title: 'Mutualiser le terrain', items: ['Pilote robot léger', 'Drone en prestation', 'Machine lourde via CUMA ou coop'], gate: 'Acheter seulement après une saison et un coût total documenté.' },
              ].map((tier) => (
                <article key={tier.n} className="border-t-2 border-[hsl(var(--ds-forest))] pt-5"><div className="flex items-baseline justify-between"><span className="font-mono text-xs text-[hsl(var(--ds-earth))]">PALIER {tier.n}</span><strong className="text-[hsl(var(--ds-forest))]">{tier.price}</strong></div><h3 className="mt-4 font-serif text-2xl text-[hsl(var(--ds-forest-deep))]">{tier.title}</h3><ul className="mt-5 space-y-3">{tier.items.map((item) => <li key={item} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul><p className="mt-6 rounded-md bg-[hsl(var(--ds-forest))]/8 p-4 text-sm leading-relaxed"><strong>Critère de passage :</strong> {tier.gate}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section id="plan-action" className="scroll-mt-28 bg-[hsl(var(--ds-forest-deep))] py-16 text-[hsl(var(--ds-cream))] sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-gold))]">Plan d’action</p><h2 className="mt-3 font-serif text-3xl sm:text-5xl">Douze mois pour décider sans s’enfermer</h2><FieldImage src={workshopImage} alt="Atelier d’un petit porteur ouvert avec pièces remplaçables et simulation" caption="atelier ouvert, pièces remplaçables et simulation avant terrain" className="mt-8 aspect-[4/3] [&_figcaption]:text-[hsl(var(--ds-cream))]/60" /></div>
              <ol className="space-y-8 border-l border-[hsl(var(--ds-cream))]/20 pl-6">
                {[
                  ['0–90 jours', 'Écrire les protocoles, acheter le palier 1, instrumenter deux jardins, une marche et un vignoble. Mesurer temps, coût/point, validité, données supplémentaires et action mieux ciblée.'],
                  ['3–6 mois', 'Comparer humain seul, capteurs et chariot. Construire le porteur seulement si le déplacement est le vrai goulot. Publier les limites et tester une solution viticole en prestation.'],
                  ['6–12 mois', 'Motoriser sur site fermé, intégrer les mesures validées, calculer le bilan économique et écologique, puis décider : acheter, louer ou arrêter.'],
                ].map(([period, text]) => <li key={period} className="relative"><span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-[hsl(var(--ds-gold))] ring-4 ring-[hsl(var(--ds-forest-deep))]" /><p className="font-mono text-sm text-[hsl(var(--ds-gold))]">{period}</p><p className="mt-3 text-base leading-relaxed text-[hsl(var(--ds-cream))]/80">{text}</p></li>)}
              </ol>
            </div>
          </div>
        </section>

        <section id="dossier" className="scroll-mt-28 border-b border-[hsl(var(--ds-line))] py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-earth))]">Analyse du document fourni</p>
            <h2 className="mt-3 max-w-3xl font-serif text-3xl text-[hsl(var(--ds-forest-deep))] sm:text-5xl">Ce que le dossier ouvre — et ce qu’il ne résout pas</h2>
            <p className="mt-5 max-w-3xl leading-relaxed text-[hsl(var(--ds-ink-soft))]">Le dossier décrit avec justesse l’écosystème ouvert — logiciels, données, simulation, plans et nomenclatures. Mais il traite d’abord de robotique humanoïde d’apprentissage. Nous en retenons les briques, pas la forme du robot.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-2">{DOSSIER_QUOTES.map((item) => <blockquote key={item.quote} className="rounded-lg border border-[hsl(var(--ds-line))] bg-background p-5"><p className="font-serif text-lg leading-relaxed text-[hsl(var(--ds-forest-deep))]">{item.quote}</p><footer className="mt-3 text-xs text-muted-foreground">Document fourni, {item.page}</footer><p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed"><strong>Notre lecture :</strong> {item.verdict}</p></blockquote>)}</div>
          </div>
        </section>

        <section id="preuves" className="scroll-mt-28 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-earth))]">Preuves & sources</p><h2 className="mt-3 font-serif text-3xl text-[hsl(var(--ds-forest-deep))] sm:text-5xl">Une promesse n’est pas une preuve</h2><p className="mt-5 leading-relaxed text-[hsl(var(--ds-ink-soft))]">Robotiser une mesure ne la rend pas exacte. Calibration, protocole, témoin humain, traçabilité et validation restent obligatoires.</p><div className="mt-6 flex items-start gap-3 rounded-lg bg-[hsl(var(--ds-gold))]/15 p-4 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--ds-forest))]" /><p>Les promesses constructeur, travaux de recherche, règles publiques et prix sont volontairement distingués.</p></div></div>
              <ul className="divide-y divide-[hsl(var(--ds-line))] border-y border-[hsl(var(--ds-line))]">{ROBOT_SOURCES.map((source) => <li key={source.id} className="py-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{source.status}</span><p className="mt-2 font-medium text-[hsl(var(--ds-forest-deep))]">{source.label}</p><p className="mt-1 text-xs text-muted-foreground">{source.publisher} · consulté le {source.checked}</p></div>{source.url.startsWith('#') ? <a href={source.url} className="shrink-0 text-sm text-primary underline underline-offset-4">Voir les verbatims</a> : <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm text-primary underline underline-offset-4">Source <ExternalLink className="h-3.5 w-3.5" /></a>}</div></li>)}</ul>
            </div>
          </div>
        </section>

        <section className="bg-[hsl(var(--ds-forest-deep))] py-16 text-[hsl(var(--ds-cream))]">
          <div className="mx-auto max-w-6xl px-5 text-center"><Wrench className="mx-auto h-7 w-7 text-[hsl(var(--ds-gold))]" /><h2 className="mt-4 font-serif text-3xl sm:text-4xl">Commencer par un pilote que l’on peut arrêter</h2><p className="mx-auto mt-4 max-w-2xl text-[hsl(var(--ds-cream))]/75">Deux kits, quatre terrains, cinq indicateurs et une décision documentée avant tout investissement lourd.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><a href="mailto:contact@la-frequence-du-vivant.com?subject=Pilote%20robotique%20frugale" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[hsl(var(--ds-gold))] px-5 py-3 font-medium text-[hsl(var(--ds-forest-deep))]">Étudier un pilote <ArrowRight className="h-4 w-4" /></a><Link to="/ia-frugale/outils-de-mesure" className="inline-flex min-h-11 items-center rounded-md border border-[hsl(var(--ds-cream))]/40 px-5 py-3">Mesurer l’impact numérique</Link></div></div>
        </section>
      </main>
      <Footer variant="marches" />
    </div>
  );
};

export default InnovationRobot;