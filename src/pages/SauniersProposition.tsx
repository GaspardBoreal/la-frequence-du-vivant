import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  Camera,
  CheckCircle2,
  Compass,
  Droplets,
  Ear,
  Footprints,
  Leaf,
  Mail,
  MapPin,
  Mountain,
  Printer,
  Sparkles,
  Waves,
} from 'lucide-react';
import { usePublicGlobalStats } from '@/hooks/usePublicGlobalStats';
import { BRAND_LOGO_LOCKUP_VERTICAL, BRAND_LOGO_MARK } from '@/content/brandLogo';
import Footer from '@/components/Footer';

/* ------------------------------------------------------------------ *
 * Page de conviction — Coopérative des Sauniers de l'Île de Ré.
 * Lien privé (noindex), lu sur téléphone.
 * Direction artistique alignée sur Les Marches du Vivant :
 * fond Forêt Émeraude, accents emerald, titres crimson, cartes verre.
 * ------------------------------------------------------------------ */

const MAILTO =
  'mailto:contact@la-frequence-du-vivant.com?subject=Marche%20du%20Vivant%20%E2%80%94%20Coop%C3%A9rative%20des%20Sauniers%20d%27Ars-en-R%C3%A9';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Apparition au défilement — discrète, désactivée si l'utilisateur la refuse. */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [seen, setSeen] = React.useState(false);

  React.useEffect(() => {
    if (reduced) {
      setSeen(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        seen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`}
      style={{ transitionDelay: seen ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

/* ---------------------------------- contenu ---------------------------------- */

const STATIONS_AMONT = [
  { n: 1, titre: 'Le clocher noir et blanc', mot: 'Amer de mer — se repérer avant de marcher' },
  { n: 2, titre: 'Le port et ses gabares', mot: 'Par où le sel partait' },
  { n: 3, titre: 'La maison du saunier', mot: 'Habiter au bord de son travail' },
  { n: 4, titre: 'Les venelles blanches', mot: 'La chaux, le vent, la lumière' },
  { n: 5, titre: 'Le chai à sel', mot: 'Stocker une récolte qui craint la pluie' },
  { n: 6, titre: 'La coopérative', mot: 'Se réunir pour tenir un prix' },
  { n: 7, titre: 'La levée du marais', mot: 'La frontière entre le village et l’eau' },
  { n: 8, titre: 'Le seuil du marais', mot: 'On quitte le récit, on entre dans la matière' },
];

const ELEMENTS = [
  {
    icon: Sparkles,
    nom: 'Le Sel',
    geste: 'Réfractomètre de poche, de la vasière à l’aire saunante',
    donnee: 'Le gradient de salinité, station par station',
    couleur: '#5eead4',
  },
  {
    icon: Droplets,
    nom: 'L’Eau',
    geste: 'Le circuit relevé au GPS, marée après bassin',
    donnee: 'Le tracé réel du parcours de l’eau, cartographié',
    couleur: '#7dd3fc',
  },
  {
    icon: Mountain,
    nom: 'L’Argile',
    geste: 'Test tactile et photo calibrée du bousseau',
    donnee: 'La texture du fond, comparable d’une saison à l’autre',
    couleur: '#fbbf24',
  },
  {
    icon: Leaf,
    nom: 'Le Vivant',
    geste: 'Halophytes et avifaune, photographiées et identifiées',
    donnee: 'Des observations versées à la science participative',
    couleur: '#34d399',
  },
];

const LIVRABLES = [
  {
    titre: 'Une page web à votre nom',
    detail:
      'Une adresse publique, vos couleurs, votre logo. Le récit des huit stations, la carte du marais, les espèces relevées, la parole du saunier. Vous pouvez la partagez.',
  },
  {
    titre: 'La liste nommée du vivant du marais',
    detail:
      'Chaque espèce photographiée, identifiée, datée, géolocalisée. Nom français et nom scientifique. Exportable en tableur, en carte, en PDF.',
  },
  {
    titre: 'La parole du saunier, archivée',
    detail:
      'Le geste filmé, le savoir enregistré en son. Une transmission qui reste quand la marche est finie.',
  },
  {
    titre: 'Le relevé de terrain',
    detail:
      'Salinité, texture d’argile, tracé de l’eau. Un état zéro daté du marais — la première ligne d’une série.',
  },
];

const BESOINS = [
  'Le tracé du marais que vous souhaitez faire découvrir avec quatre points d’arrêt.',
  'Un saunier volontaire pour être filmé et enregistré une quinzaine de minutes.',
  'Votre logo et vos couleurs, pour que la page soit la vôtre.',
  "La disponibilité d'un de vos collaborateurs pour un moment le 12 Septembre 2026.",
];

/* ---------------------------------- atomes ---------------------------------- */

const MaraisHorizon: React.FC = () => (
  <svg
    viewBox="0 0 400 120"
    className="h-full w-full"
    preserveAspectRatio="none"
    aria-hidden="true"
    role="presentation"
  >
    <defs>
      <linearGradient id="sau-eau" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#065f46" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    {/* Les bassins vus du ciel : des quadrilatères, jamais des cercles. */}
    <path d="M0,70 L400,55 L400,120 L0,120 Z" fill="url(#sau-eau)" />
    <g stroke="#5eead4" strokeOpacity="0.28" strokeWidth="0.8" fill="none">
      <path d="M0,78 L400,64" />
      <path d="M0,92 L400,80" />
      <path d="M0,106 L400,96" />
      <path d="M60,70 L52,120" />
      <path d="M150,66 L146,120" />
      <path d="M245,62 L248,120" />
      <path d="M330,58 L340,120" />
    </g>
  </svg>
);

const Chiffre: React.FC<{ valeur: number | undefined; libelle: string }> = ({ valeur, libelle }) => (
  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-4 text-center backdrop-blur-sm">
    <div className="text-2xl font-semibold tabular-nums text-emerald-300">
      {valeur === undefined ? '—' : valeur.toLocaleString('fr-FR')}
    </div>
    <div className="mt-1 text-[11px] leading-tight text-muted-foreground">{libelle}</div>
  </div>
);

const Section: React.FC<{
  eyebrow: string;
  titre: string;
  children: React.ReactNode;
  fond?: string;
}> = ({ eyebrow, titre, children, fond = 'transparent' }) => (
  <section className="px-5 py-14 sm:px-8 sm:py-20" style={{ background: fond }}>
    <div className="mx-auto w-full max-w-2xl">
      <Reveal>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-crimson text-3xl leading-tight text-foreground sm:text-4xl">
          {titre}
        </h2>
      </Reveal>
      <div className="mt-6">{children}</div>
    </div>
  </section>
);

/* ---------------------------------- page ---------------------------------- */

const SauniersProposition: React.FC = () => {
  const { data: stats } = usePublicGlobalStats();

  return (
    <div className="dark min-h-screen bg-background text-foreground antialiased selection:bg-emerald-500/30 [&_li]:text-left [&_p]:text-left">
      <Helmet>
        <title>Une marche dans le marais — Coopérative des Sauniers de l’Île de Ré</title>
        <meta
          name="description"
          content="Proposition de marche inaugurale avec la Coopérative des Sauniers de l’Île de Ré : huit stations patrimoniales à Ars-en-Ré, puis le marais salant et sa première mesure du vivant."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* ------------------------------- Le seuil ------------------------------- */}
      <header className="relative overflow-hidden px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/25 to-secondary/20" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0], opacity: [0.08, 0.16, 0.08] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-80">
          <MaraisHorizon />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-2xl">
          <div className="relative w-[168px] sm:w-[196px]">
            <div className="pointer-events-none absolute -inset-6 rounded-full bg-emerald-400/10 blur-2xl" />
            <img
              src={BRAND_LOGO_LOCKUP_VERTICAL.path}
              alt={BRAND_LOGO_LOCKUP_VERTICAL.alt}
              className="relative h-auto w-full drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
              width={1254}
              height={1254}
              loading="eager"
            />
          </div>


          <Reveal delay={60}>
            <p className="mt-10 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
              Proposition · Coopérative des Sauniers de l’Île de Ré
            </p>
            <h1 className="mt-3 font-crimson text-[2.4rem] leading-[1.05] text-foreground sm:text-6xl">
              Le marais sait des choses
              <br />
              <span className="text-emerald-400">que personne n’a encore écrites.</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Vous avez déjà le récit : huit stations, un village, un métier qui tient depuis mille
              ans. Nous proposons d’y ajouter la mesure collective de la biodiversité. Une demi-journée, et le marais d’Ars-en-Ré possède son premier relevé du
              vivant.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-8">
              <a
                href="#deroule"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-6 py-3.5 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-900/50"
              >
                Voir le déroulé <ArrowDown className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Ars-en-Ré · 3 heures · Entre 10 et 30 participants
            </p>
          </Reveal>
        </div>
      </header>

      {/* --------------------------- Ce qui existe déjà --------------------------- */}
      <Section eyebrow="LE PROJET" titre="Un parcours riche en thématiques">
        <Reveal>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Vos huit stations dans le village racontent le sel par le bâti, le port, la chaux, la
            coopérative. Elles se marchent sans écran, avec une besace, une boussole, un peu
            d’argile et une loupe. C’est exactement ce qu’il faut pour ouvrir les sens avant
            d’entrer dans le marais.
          </p>
        </Reveal>

        <ol className="mt-7 space-y-0">
          {STATIONS_AMONT.map((s, i) => (
            <Reveal key={s.n} delay={i * 40}>
              <li className="flex gap-3.5 border-l border-emerald-500/20 pb-5 pl-4 last:pb-0">
                <span className="-ml-[1.55rem] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.titre}</p>
                  <p className="text-[13px] leading-snug text-muted-foreground">{s.mot}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* ------------------------------ La bascule ------------------------------ */}
      <Section eyebrow="Notre apport" titre="L'observation du Vivant">
        <Reveal>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Nous emmenons le groupe dans le marais et nous y faisons une chose simple : nous
            identifions la biodiversité. Pas avec des capteurs dans les mains des visiteurs. Avec
            des gestes simples faits par des humains.
          </p>
        </Reveal>

        <div className="mt-7 grid gap-3.5 sm:grid-cols-2">
          {ELEMENTS.map((el, i) => {
            const Icon = el.icon;
            return (
              <Reveal key={el.nom} delay={i * 80}>
                <div className="h-full rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm transition-colors hover:border-emerald-500/40">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `${el.couleur}1f`, color: el.couleur }}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <h3 className="text-[15px] font-semibold text-foreground">{el.nom}</h3>
                  </div>
                  <p className="mt-3 text-[13px] leading-snug text-muted-foreground">{el.geste}</p>
                  <p
                    className="mt-2 border-t border-dashed pt-2 text-[13px] font-medium leading-snug"
                    style={{ borderColor: `${el.couleur}33`, color: el.couleur }}
                  >
                    {el.donnee}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-950/40 p-4">
            <Ear className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <p className="text-[14px] leading-relaxed text-emerald-50/85">
              <strong className="font-semibold text-white">Le principe :&nbsp;</strong>les marcheurs
              n'utilisent pas leurs écrans durant toute la marche. Le guide et deux ou trois
              ambassadeurs captent le vivant, tout le monde regarde le marais. Le numérique arrive
              après, quand il ne dérange plus personne.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------- Le déroulé ------------------------------- */}
      <section id="deroule" className="scroll-mt-4 px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-2xl">
          <Reveal>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
              Trois heures
            </p>
            <h2 className="mt-2 font-crimson text-3xl leading-tight text-foreground sm:text-4xl">
              Le déroulé, heure par heure.
            </h2>
          </Reveal>

          <div className="mt-7 space-y-3.5">
            {[
              {
                h: '09 h 30',
                d: '15 min',
                t: 'L’accordage',
                icon: Compass,
                c: 'Devant la coopérative. On distribue la besace, on choisit le mot de la saison, on dit ce qu’on va chercher.',
              },
              {
                h: '09 h 45',
                d: '1 h 15',
                t: 'Le village : vos huit stations',
                icon: Footprints,
                c: 'Du clocher au seuil du marais. Le sel raconté par le bâti et par les hommes. Tout est ressenti.',
              },
              {
                h: '11 h 00',
                d: '1 h 45',
                t: 'Le marais : les quatre éléments',
                icon: Waves,
                c: 'Quatre arrêts : la vasière, le circuit d’eau, le bousseau, l’aire saunante. À chaque arrêt, un geste, une mesure, une photo.',
              },
              {
                h: '12 h 15',
                d: '20 min',
                t: 'La parole du saunier',
                icon: Camera,
                c: 'Un de de vos collaborateurs montre le geste du saunier.',
              },
              {
                h: '12 h 35',
                d: '25 min',
                t: 'Le partage',
                icon: Sparkles,
                c: 'On pose ce qu’on a trouvé. On annonce ce qui sera publié, et quand.',
              },
            ].map((t, i) => {
              const Icon = t.icon;
              return (
                <Reveal key={t.h} delay={i * 60}>
                  <div className="flex gap-3.5 rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm">
                    <div className="w-[68px] shrink-0">
                      <div className="text-[13px] font-semibold tabular-nums text-emerald-300">
                        {t.h}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{t.d}</div>
                    </div>
                    <div className="min-w-0 flex-1 border-l border-border/40 pl-3.5">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-emerald-400" />
                        <h3 className="text-[15px] font-semibold text-foreground">{t.t}</h3>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{t.c}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------- Livrables ------------------------------- */}
      <Section eyebrow="Quinze jours après" titre="Ce qui reste, une fois tout le monde reparti.">
        <div className="space-y-3.5">
          {LIVRABLES.map((l, i) => (
            <Reveal key={l.titre} delay={i * 70}>
              <div className="flex gap-3 rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-foreground">{l.titre}</h3>
                  <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{l.detail}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* -------------------------------- Preuve -------------------------------- */}
      <Section eyebrow="REJOIGNEZ LA DYNAMIQUE DES MARCHES DU VIVANT" titre="Plus de 60 marcheurs">
        <Reveal>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Quelques chiffres pour découvrir les marches réalisées.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Chiffre valeur={stats?.especes_tracees} libelle="espèces tracées" />
            <Chiffre valeur={stats?.marcheurs} libelle="marcheurs" />
            <Chiffre valeur={stats?.observations_citoyennes} libelle="observations" />
            <Chiffre valeur={stats?.photos_collectees} libelle="photos" />
          </div>
        </Reveal>
        <Reveal>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground/70">
            Réseau Les Marches du Vivant, édité par l’association La Fréquence du Vivant. Les
            observations d’espèces sont versées à la science participative — elles ne restent pas
            dans un tiroir.
          </p>
        </Reveal>
      </Section>

      {/* ------------------------------- Ce qu'il faut ------------------------------- */}
      <Section eyebrow="De votre côté" titre="Les prochaines étapes">
        <ul className="space-y-2.5">
          {BESOINS.map((b, i) => (
            <Reveal key={b} delay={i * 60}>
              <li className="flex gap-3 rounded-xl border border-border/40 bg-card/40 px-4 py-3 backdrop-blur-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="text-[14px] leading-snug text-foreground/85">{b}</span>
              </li>
            </Reveal>
          ))}
        </ul>
        <Reveal>
          <p className="mt-5 text-[14px] leading-relaxed text-muted-foreground">
            Tout le reste, l’animation, l’identification des espèces, la page publique, l’archivage
            de la parole, est de notre côté.
          </p>
        </Reveal>
      </Section>

      {/* --------------------------------- Clôture --------------------------------- */}
      <footer className="px-5 pb-16 pt-6 sm:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-emerald-950/30 p-6 text-center backdrop-blur-sm sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
              <img
                src={BRAND_LOGO_MARK.path}
                alt=""
                aria-hidden="true"
                className="relative mx-auto h-10 w-10"
                width={40}
                height={40}
              />
              <h2 className="relative mt-4 font-crimson text-2xl leading-tight text-foreground sm:text-3xl">
                Contactez nos ambassadeurs locaux
              </h2>
              <p className="relative mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground !text-center">
                Laurence KARKI : 06 24 87 25 98
                <br />
                Laurent TRIPIED : 06 70 76 14 99
              </p>
              <a
                href={MAILTO}
                className="relative mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                <Mail className="h-4 w-4" /> Écrire à l’équipe
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="relative mt-3 flex w-full items-center justify-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground print:hidden"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimer cette proposition
              </button>
            </div>
            <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground/60 !text-center">
              Les Marches du Vivant · association La Fréquence du Vivant
              <br />
              Document de travail, transmis à la Coopérative des Sauniers de l’Île de Ré.
            </p>
          </Reveal>
        </div>
      </footer>

      <Footer variant="marches" />
    </div>
  );
};

export default SauniersProposition;
