import React from 'react';
import { Helmet } from 'react-helmet-async';
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
import { BRAND_LOGO_MARK } from '@/content/brandLogo';

/* ------------------------------------------------------------------ *
 * Page de conviction — Coopérative des Sauniers de l'Île de Ré.
 * Lien privé (noindex) destiné à être envoyé et lu sur téléphone.
 * Palette locale sel / marais / argile : la page doit ressembler au
 * marais, pas au reste de l'application.
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
    couleur: '#0f766e',
  },
  {
    icon: Droplets,
    nom: 'L’Eau',
    geste: 'Le circuit relevé au GPS, marée après bassin',
    donnee: 'Le tracé réel du parcours de l’eau, cartographié',
    couleur: '#0369a1',
  },
  {
    icon: Mountain,
    nom: 'L’Argile',
    geste: 'Test tactile et photo calibrée du bousseau',
    donnee: 'La texture du fond, comparable d’une saison à l’autre',
    couleur: '#b45309',
  },
  {
    icon: Leaf,
    nom: 'Le Vivant',
    geste: 'Halophytes et avifaune, photographiées et identifiées',
    donnee: 'Des observations versées à la science participative',
    couleur: '#4d7c0f',
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
  'Le tracé du marais que vous acceptez d’ouvrir, et quatre points d’arrêt.',
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
        <stop offset="0%" stopColor="#5eead4" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#0f766e" stopOpacity="0.15" />
      </linearGradient>
    </defs>
    {/* Les bassins vus du ciel : des quadrilatères, jamais des cercles. */}
    <path d="M0,70 L400,55 L400,120 L0,120 Z" fill="url(#sau-eau)" />
    <g stroke="#0f766e" strokeOpacity="0.35" strokeWidth="0.8" fill="none">
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
  <div className="rounded-2xl border border-teal-900/10 bg-white/70 px-3 py-4 text-center">
    <div className="text-2xl font-semibold tabular-nums text-teal-900">
      {valeur === undefined ? '—' : valeur.toLocaleString('fr-FR')}
    </div>
    <div className="mt-1 text-[11px] leading-tight text-teal-900/60">{libelle}</div>
  </div>
);

const Section: React.FC<{
  eyebrow: string;
  titre: string;
  children: React.ReactNode;
  fond?: string;
  /** Fond sombre : inverse la couleur du sur-titre et du titre. */
  sombre?: boolean;
}> = ({ eyebrow, titre, children, fond = 'transparent', sombre = false }) => (
  <section className="px-5 py-14 sm:px-8 sm:py-20" style={{ background: fond }}>
    <div className="mx-auto w-full max-w-2xl">
      <Reveal>
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
            sombre ? 'text-teal-300/80' : 'text-teal-700/70'
          }`}
        >
          {eyebrow}
        </p>
        <h2
          className={`mt-2 text-2xl font-semibold leading-tight sm:text-3xl ${
            sombre ? 'text-white' : 'text-teal-950'
          }`}
        >
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
    <div className="min-h-screen bg-[#fbfaf7] text-teal-950 antialiased selection:bg-teal-200 [&_li]:text-left [&_p]:text-left">
      <Helmet>
        <title>Une marche dans le marais — Coopérative des Sauniers de l’Île de Ré</title>
        <meta
          name="description"
          content="Proposition de marche inaugurale avec la Coopérative des Sauniers de l’Île de Ré : huit stations patrimoniales à Ars-en-Ré, puis le marais salant et sa première mesure du vivant."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* ------------------------------- Le seuil ------------------------------- */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#e7f2f0] via-[#f4f7f4] to-[#fbfaf7] px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-70">
          <MaraisHorizon />
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="flex items-center gap-2.5">
            <img
              src={BRAND_LOGO_MARK.path}
              alt={BRAND_LOGO_MARK.alt}
              className="h-8 w-8 shrink-0"
              width={32}
              height={32}
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800/70">
              Les Marches du Vivant
            </span>
          </div>

          <Reveal delay={60}>
            <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700/70">
              Proposition · Coopérative des Sauniers de l’Île de Ré
            </p>
            <h1 className="mt-3 text-[2rem] font-semibold leading-[1.1] text-teal-950 sm:text-5xl">
              Le marais sait des choses
              <br />
              que personne n’a encore écrites.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-teal-900/80 sm:text-lg">
              Vous avez déjà le récit : huit stations, un village, un métier qui tient depuis mille
              ans. Nous proposons d’y ajouter ce qui manque : la mesure collective de la
              biodiversité. Une demi-journée, et le marais d’Ars-en-Ré possède son premier relevé du
              vivant.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={MAILTO}
                className="flex items-center justify-center gap-2 rounded-full bg-teal-800 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-900"
              >
                <Mail className="h-4 w-4" /> Fixer une date
              </a>
              <a
                href="#deroule"
                className="flex items-center justify-center gap-2 rounded-full border border-teal-900/15 bg-white/70 px-6 py-3.5 text-sm font-semibold text-teal-900 transition-colors hover:bg-white"
              >
                Voir le déroulé <ArrowDown className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-teal-900/55">
              <MapPin className="h-3.5 w-3.5" /> Ars-en-Ré · 3 heures · une trentaine de participants
            </p>
          </Reveal>
        </div>
      </header>

      {/* --------------------------- Ce qui existe déjà --------------------------- */}
      <Section eyebrow="LE PROJET" titre="Nous ne touchons pas à votre première heure.">
        <Reveal>
          <p className="text-[15px] leading-relaxed text-teal-900/80">
            Vos huit stations dans le village racontent le sel par le bâti, le port, la chaux, la
            coopérative. Elles se marchent sans écran, avec une besace, une boussole, un peu
            d’argile et une loupe. C’est exactement ce qu’il faut pour ouvrir les sens avant
            d’entrer dans le marais.
          </p>
        </Reveal>

        <ol className="mt-7 space-y-0">
          {STATIONS_AMONT.map((s, i) => (
            <Reveal key={s.n} delay={i * 40}>
              <li className="flex gap-3.5 border-l border-teal-900/15 pb-5 pl-4 last:pb-0">
                <span className="-ml-[1.55rem] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fbfaf7] text-[11px] font-semibold text-teal-800 ring-1 ring-teal-900/20">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-teal-950">{s.titre}</p>
                  <p className="text-[13px] leading-snug text-teal-900/60">{s.mot}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal>
          <p className="mt-7 rounded-2xl border border-amber-900/10 bg-amber-50/70 p-4 text-[14px] leading-relaxed text-amber-950/85">
            <strong className="font-semibold">Notre seule réserve :</strong> une marche qui s’arrête
            au village laisse une belle matinée et rien derrière elle. Le lendemain, il ne reste que
            des souvenirs — et vous ne pouvez rien en montrer à une collectivité, à un client, ni à
            la génération suivante.
          </p>
        </Reveal>
      </Section>

      {/* ------------------------------ La bascule ------------------------------ */}
      <Section
        eyebrow="Notre apport"
        titre="La deuxième heure change la nature de la journée."
        fond="linear-gradient(180deg,#eef5f3 0%,#f7faf8 100%)"
      >
        <Reveal>
          <p className="text-[15px] leading-relaxed text-teal-900/80">
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
                <div className="h-full rounded-2xl border border-teal-900/10 bg-white p-4 shadow-[0_1px_2px_rgba(15,118,110,0.06)]">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `${el.couleur}14`, color: el.couleur }}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <h3 className="text-[15px] font-semibold text-teal-950">{el.nom}</h3>
                  </div>
                  <p className="mt-3 text-[13px] leading-snug text-teal-900/70">{el.geste}</p>
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
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-teal-900 p-4 text-teal-50">
            <Ear className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
            <p className="text-[14px] leading-relaxed">
              <strong className="font-semibold text-white">Le principe :&nbsp;</strong>les marcheurs
              n'utilisent pas leurs écrans durant toute la marche. Le guide et deux ou trois
              ambassadeurs relais captent, tout le monde regarde le marais. Le numérique arrive
              après, quand il ne dérange plus personne.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------- Le déroulé ------------------------------- */}
      <section id="deroule" className="scroll-mt-4 px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-2xl">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700/70">
              Trois heures
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-teal-950 sm:text-3xl">
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
                c: 'Un des vôtres, sur son aire. Le geste filmé, le savoir enregistré. C’est le cœur de la journée, et c’est ce qui restera le plus longtemps.',
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
                  <div className="flex gap-3.5 rounded-2xl border border-teal-900/10 bg-white p-4">
                    <div className="w-[68px] shrink-0">
                      <div className="text-[13px] font-semibold tabular-nums text-teal-900">
                        {t.h}
                      </div>
                      <div className="text-[11px] text-teal-900/50">{t.d}</div>
                    </div>
                    <div className="min-w-0 flex-1 border-l border-teal-900/10 pl-3.5">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-teal-700" />
                        <h3 className="text-[15px] font-semibold text-teal-950">{t.t}</h3>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-snug text-teal-900/70">{t.c}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------- Livrables ------------------------------- */}
      <Section
        eyebrow="Quinze jours après"
        titre="Ce qui reste, une fois tout le monde reparti."
        fond="linear-gradient(180deg,#f7faf8 0%,#eef5f3 100%)"
      >
        <div className="space-y-3.5">
          {LIVRABLES.map((l, i) => (
            <Reveal key={l.titre} delay={i * 70}>
              <div className="flex gap-3 rounded-2xl border border-teal-900/10 bg-white p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-teal-950">{l.titre}</h3>
                  <p className="mt-1 text-[13px] leading-snug text-teal-900/70">{l.detail}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* -------------------------------- Preuve -------------------------------- */}
      <Section eyebrow="REJOIGNEZ LA DYNAMIQUE DES MARCHES DU VIVANT" titre="Plus de 60 marcheurs">
        <Reveal>
          <p className="text-[15px] leading-relaxed text-teal-900/80">
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
          <p className="mt-4 text-xs leading-relaxed text-teal-900/50">
            Réseau Les Marches du Vivant, édité par l’association La Fréquence du Vivant. Les
            observations d’espèces sont versées à la science participative — elles ne restent pas
            dans un tiroir.
          </p>
        </Reveal>
      </Section>

      {/* -------------------------------- La suite -------------------------------- */}
      <Section
        eyebrow="Et après"
        titre="Une marche est un point. Quatre en font une courbe."
        fond="linear-gradient(180deg,#0f3d38 0%,#0b2f2b 100%)"
        sombre
      >
        <Reveal>
          <div className="space-y-4 text-[15px] leading-relaxed text-teal-50/85">
            <p>
              Le vrai sujet n’est pas la journée du mois prochain. C’est ce que vous pourrez dire du
              marais dans trois ans. Les mêmes quatre stations, relevées à chaque saison, produisent
              une série : la salinité qui monte, l’argile qui change, les halophytes qui avancent ou
              reculent.
            </p>
            <p className="font-medium text-white">
              À ce moment-là, la coopérative n’est plus seulement celle qui récolte le sel. C’est
              celle qui mesure son marais — et qui peut le prouver.
            </p>
            <p className="text-teal-100/70">
              La marche inaugurale sert d’état zéro. Elle n’engage à rien de plus.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------- Ce qu'il faut ------------------------------- */}
      <Section eyebrow="De votre côté" titre="Quatre choses, et nous partons.">
        <ul className="space-y-2.5">
          {BESOINS.map((b, i) => (
            <Reveal key={b} delay={i * 60}>
              <li className="flex gap-3 rounded-xl border border-teal-900/10 bg-white px-4 py-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                <span className="text-[14px] leading-snug text-teal-900/85">{b}</span>
              </li>
            </Reveal>
          ))}
        </ul>
        <Reveal>
          <p className="mt-5 text-[14px] leading-relaxed text-teal-900/70">
            Tout le reste, l’animation, le matériel, l’identification des espèces, la page publique,
            l’archivage de la parole, est de notre côté.
          </p>
        </Reveal>
      </Section>

      {/* --------------------------------- Clôture --------------------------------- */}
      <footer className="px-5 pb-28 pt-6 sm:px-8 sm:pb-16">
        <div className="mx-auto w-full max-w-2xl">
          <Reveal>
            <div className="rounded-3xl border border-teal-900/10 bg-gradient-to-b from-[#e7f2f0] to-white p-6 text-center sm:p-8">
              <img
                src={BRAND_LOGO_MARK.path}
                alt=""
                aria-hidden="true"
                className="mx-auto h-10 w-10"
                width={40}
                height={40}
              />
              <h2 className="mt-4 text-xl font-semibold leading-tight text-teal-950 sm:text-2xl">
                Contactez nos ambassadeurs locaux
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-teal-900/70 !text-center">
                Laurence KARKI : 06 24 87 25 98
                <br />
                Laurent TRIPIED : 06 70 76 14 99
              </p>
              <a
                href={MAILTO}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-teal-800 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-teal-900"
              >
                <Mail className="h-4 w-4" /> Écrire à l’équipe
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="mt-3 flex w-full items-center justify-center gap-2 text-xs font-medium text-teal-900/60 transition-colors hover:text-teal-900 print:hidden"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimer cette proposition
              </button>
            </div>
            <p className="mt-6 text-[11px] leading-relaxed text-teal-900/45 !text-center">
              Les Marches du Vivant · association La Fréquence du Vivant
              <br />
              Document de travail, transmis à la Coopérative des Sauniers de l’Île de Ré.
            </p>
          </Reveal>
        </div>
      </footer>

      {/* --------------------- Barre d'action fixe (mobile) --------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-teal-900/10 bg-white/90 py-3 pl-4 pr-[5.5rem] backdrop-blur-md sm:hidden print:hidden">
        <a
          href={MAILTO}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-800 px-5 py-3 text-sm font-semibold text-white"
        >
          <Mail className="h-4 w-4" /> Fixer une date
        </a>
      </div>
    </div>
  );
};

export default SauniersProposition;
