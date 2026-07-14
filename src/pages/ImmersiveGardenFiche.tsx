import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Search, Sprout, Bug, Feather, Trees, Worm, Leaf, ArrowRight, ArrowLeft, Sparkles, Sun } from 'lucide-react';
import { useGardenFiche } from '@/hooks/useGardenFiche';
import { useSiblingGardenEvents } from '@/hooks/useSiblingGardenEvents';
import KenBurnsCarousel from '@/components/immersive-garden/KenBurnsCarousel';
import OrganicButton from '@/components/immersive-garden/OrganicButton';
import SeasonOverlay, { type Season } from '@/components/immersive-garden/SeasonOverlay';
import StratPanel from '@/components/immersive-garden/StratPanel';
import CursorAurora from '@/components/immersive-garden/CursorAurora';
import GardenSiblingNav from '@/components/immersive-garden/GardenSiblingNav';
import GardenTransitionOverlay from '@/components/immersive-garden/GardenTransitionOverlay';
import SeasonSpeciesCarousel from '@/components/immersive-garden/SeasonSpeciesCarousel';


const SEASONS: { key: Season; label: string; emoji: string }[] = [
  { key: 'printemps', label: 'Printemps', emoji: '🌸' },
  { key: 'ete', label: 'Été', emoji: '☀️' },
  { key: 'automne', label: 'Automne', emoji: '🍂' },
  { key: 'hiver', label: 'Hiver', emoji: '❄️' },
];

/** SVG stylisé de coupe de sol (racines + mycorhizes) — teinté par saison via currentColor. */
const RhizosphereSVG: React.FC<{ tint: string }> = ({ tint }) => (
  <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2a1b0e" />
        <stop offset="60%" stopColor="#1a1006" />
        <stop offset="100%" stopColor="#0a0603" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stopColor={tint} stopOpacity="0.35" />
        <stop offset="100%" stopColor={tint} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="800" height="600" fill="url(#soil)" />
    <rect width="800" height="600" fill="url(#glow)" />
    {/* Racines principales */}
    {Array.from({ length: 8 }).map((_, i) => {
      const x = 60 + i * 95;
      return (
        <g key={i} stroke={tint} strokeOpacity="0.55" fill="none" strokeLinecap="round">
          <path d={`M${x},0 C${x + 20},80 ${x - 30},160 ${x + 10},260 C${x + 40},360 ${x - 20},460 ${x + 5},600`} strokeWidth="2.5" />
          {Array.from({ length: 6 }).map((_, j) => {
            const y = 80 + j * 80;
            return (
              <path
                key={j}
                d={`M${x + (j % 2 ? 8 : -8)},${y} q${(j % 2 ? 40 : -40)},20 ${(j % 2 ? 70 : -70)},${20 + j * 5}`}
                strokeWidth="1"
                strokeOpacity="0.35"
              />
            );
          })}
        </g>
      );
    })}
    {/* Réseau mycorhizien : points scintillants */}
    {Array.from({ length: 60 }).map((_, i) => {
      const cx = (i * 137) % 800;
      const cy = 100 + ((i * 71) % 480);
      return <circle key={i} cx={cx} cy={cy} r={1.6} fill={tint} opacity={0.55} />;
    })}
  </svg>
);

const SEASON_TINT: Record<Season, string> = {
  printemps: '#c9d97a',
  ete: '#e8c66a',
  automne: '#c17032',
  hiver: '#a9c9e6',
};

const ImmersiveGardenFiche: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event, heroPhotos, metrics, isLoading, notFound } = useGardenFiche(slug);
  const [season, setSeason] = useState<Season>('ete');
  const [flash, setFlash] = useState<{ key: number; color: string; x: number; y: number } | null>(null);
  const [transition, setTransition] = useState<{ href: string; origin: { x: number; y: number } } | null>(null);
  const [hideIndexLabels, setHideIndexLabels] = useState(false);
  const rhizosphereSectionRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const sibling = useSiblingGardenEvents(event?.id);

  const { scrollYProgress } = useScroll();
  const titleOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.15], ['0%', '-30%']);
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 1.15]);
  const heroDim = useTransform(scrollYProgress, [0.15, 0.45], [0, 1]);

  useEffect(() => {
    const updateIndexLabelsVisibility = () => {
      const section = rhizosphereSectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportMiddle = window.innerHeight / 2;
      setHideIndexLabels(rect.top <= viewportMiddle && rect.bottom >= viewportMiddle);
    };

    updateIndexLabelsVisibility();
    window.addEventListener('scroll', updateIndexLabelsVisibility, { passive: true });
    window.addEventListener('resize', updateIndexLabelsVisibility);

    return () => {
      window.removeEventListener('scroll', updateIndexLabelsVisibility);
      window.removeEventListener('resize', updateIndexLabelsVisibility);
    };
  }, []);

  const cover = event?.cover_image_url ?? null;
  const heroPhotoList = useMemo(
    () => heroPhotos.map((p) => ({ id: p.id, url: p.url })),
    [heroPhotos],
  );
  const strataOnePhotos = useMemo(() => {
    const firstPhotos = heroPhotoList.slice(0, 3);
    return firstPhotos.length > 0 ? firstPhotos : heroPhotoList;
  }, [heroPhotoList]);

  const triggerTransition = useCallback(
    (direction: 'prev' | 'next', origin: { x: number; y: number }) => {
      const href = direction === 'prev' ? sibling.prevHref : sibling.nextHref;
      const target = direction === 'prev' ? sibling.prev : sibling.next;
      if (!href) return;
      // Précharge la cover pour éviter le flash blanc
      if (target?.cover_image_url) {
        const img = new Image();
        img.src = target.cover_image_url;
      }
      setTransition({ href, origin });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [sibling.prev, sibling.next, sibling.prevHref, sibling.nextHref],
  );

  const handleTransitionDone = useCallback(() => {
    if (!transition) return;
    navigate(transition.href);
    // laisser le temps à la nouvelle route de monter avant de retirer l'overlay
    setTimeout(() => setTransition(null), 60);
  }, [transition, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-[#f4ecd4] font-serif italic">
        <div className="animate-pulse">Éveil du jardin…</div>
      </div>
    );
  }

  if (notFound || !event) {
    return <Navigate to="/marches-du-vivant/carte-marches-du-vivant" replace />;
  }

  // Événement non-jardin → route classique (slug si publié, sinon admin)
  if (event.category !== 'jardin') {
    const fallback = event.public_slug ? `/m/${event.public_slug}` : `/admin/marche-events/${event.id}`;
    return <Navigate to={fallback} replace />;
  }

  const slugOrId = event.public_slug ?? event.id;
  const tint = SEASON_TINT[season];

  const m = metrics ?? {
    trees: 0, plants: 0, insects: 0, birds: 0, fungi: 0, others: 0, total: 0,
    mycorhization: 0, pollinators: 0, microfauna: 0, carbon: 'Faible' as const,
  };

  const fallbackDisplay = (raw: number, formatted?: string) =>
    raw === 0 ? 'En cours' : (formatted ?? String(raw));

  const canonicalUrl = `https://la-frequence-du-vivant.com/jardin/${slugOrId}`;
  const ogImage = event.cover_image_url
    ? (event.cover_image_url.startsWith('http') ? event.cover_image_url : `https://la-frequence-du-vivant.com${event.cover_image_url.startsWith('/') ? '' : '/'}${event.cover_image_url}`)
    : 'https://la-frequence-du-vivant.com/og-image.jpg';
  // Variantes orthographiques (ex : Deviat / Déviat) pour capter les deux requêtes
  // sans dupliquer d'URL. La forme officielle INSEE reste canonique.
  const LIEU_SPELLING_VARIANTS: Record<string, string[]> = {
    'Deviat': ['Déviat'],
    'Déviat': ['Deviat'],
  };
  const lieuVariants = event.lieu ? (LIEU_SPELLING_VARIANTS[event.lieu] ?? []) : [];
  const lieuSpellingsInline = lieuVariants.length
    ? ` (aussi orthographié ${lieuVariants.join(', ')})`
    : '';

  const seoTitle = `${event.lieu ?? 'Jardin'} — ${event.title} | La Fréquence du Vivant`;
  const seoDescription = `${event.lieu ? `À ${event.lieu}${lieuSpellingsInline}, ` : ''}immersion sensible dans le jardin ${event.title} : canopée, strates herbacées, rhizosphère et biodiversité observée par les marcheurs.`;
  const keywordsBase = [
    event.lieu,
    ...lieuVariants,
    event.lieu ? `jardin ${event.lieu}` : null,
    ...lieuVariants.map((v) => `jardin ${v}`),
    event.lieu ? `biodiversité ${event.lieu}` : null,
    event.title,
    'Marches du Vivant',
    'La Fréquence du Vivant',
  ].filter(Boolean);
  const placeSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `Jardin ${event.title}${event.lieu ? ` — ${event.lieu}` : ''}`,
    ...(lieuVariants.length
      ? { alternateName: lieuVariants.map((v) => `Jardin ${event.title} — ${v}`) }
      : {}),
    description: seoDescription,
    url: canonicalUrl,
    image: ogImage,
    ...(event.lieu ? { address: { '@type': 'PostalAddress', addressLocality: event.lieu, addressCountry: 'FR' } } : {}),
    ...(event.latitude != null && event.longitude != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: event.latitude, longitude: event.longitude } }
      : {}),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Marches du Vivant', item: 'https://la-frequence-du-vivant.com/marches-du-vivant' },
      { '@type': 'ListItem', position: 2, name: 'Carte des jardins', item: 'https://la-frequence-du-vivant.com/marches-du-vivant/carte-marches-du-vivant' },
      { '@type': 'ListItem', position: 3, name: event.lieu ? `Jardin de ${event.lieu}` : event.title, item: canonicalUrl },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={keywordsBase.join(', ')} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="La Fréquence du Vivant" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify(placeSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* H1 sémantique pour crawlers (le H1 visuel utilise RevealText qui fragmente le texte) */}
      <h1 className="sr-only">
        {event.lieu ? `Jardin de ${event.lieu} — ${event.title}` : event.title}
      </h1>

      <div className="relative bg-black text-[#f4ecd4] overflow-x-hidden">
        {/* Aurore dorée qui suit le curseur */}
        <CursorAurora />

        {/* Saison overlay global */}
        <SeasonOverlay season={season} />

        {/* Capsule flottante : Retour + prev/next entre jardins filtrés */}
        <GardenSiblingNav
          index={Math.max(0, sibling.index)}
          total={sibling.total}
          categoryLabel={sibling.categoryLabel}
          hasPrev={!!sibling.prevHref}
          hasNext={!!sibling.nextHref}
          backHref={sibling.backHref}
          onNavigate={triggerTransition}
          onBack={() => navigate(sibling.backHref)}
        />

        {/* Overlay portail végétal lors du swap de fiche */}
        <GardenTransitionOverlay
          active={!!transition}
          origin={transition?.origin ?? null}
          tint={tint}
          onDone={handleTransitionDone}
        />

        {/* SEO : liens prev/next */}
        {sibling.prev && (
          <Helmet>
            <link rel="prev" href={`https://la-frequence-du-vivant.com/jardin/${sibling.prev.public_slug ?? sibling.prev.id}`} />
          </Helmet>
        )}
        {sibling.next && (
          <Helmet>
            <link rel="next" href={`https://la-frequence-du-vivant.com/jardin/${sibling.next.public_slug ?? sibling.next.id}`} />
          </Helmet>
        )}

        {/* Indicateur strates */}
        <StratIndicator hideLabels={hideIndexLabels} />

        {/* ============ SECTION 0 : CANOPÉE ============ */}
        <section className="relative h-screen sticky top-0 z-10">
          <motion.div style={{ scale: reduce ? 1 : heroScale }} className="absolute inset-0">
            <KenBurnsCarousel photos={heroPhotoList} fallback={cover} intervalMs={7000} />
          </motion.div>

          <motion.div
            style={{ opacity: heroDim }}
            className="absolute inset-0 bg-black pointer-events-none"
          />

          <motion.div
            style={{ opacity: titleOpacity, y: titleY }}
            className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6"
          >
            <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-[#c9a24a] mb-4 flex items-center gap-2">
              <Leaf className="w-3 h-3" /> Jardin des Marches du Vivant
            </div>
            <h1 className="font-serif italic text-4xl md:text-6xl lg:text-7xl leading-[1.05] text-[#f4ecd4] drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] max-w-4xl">
              <RevealText text={event.title} />
            </h1>
            {event.lieu && (
              <p className="mt-4 text-sm md:text-base text-[#f4ecd4]/75 tracking-wide">
                {event.lieu}
              </p>
            )}

            <div className="mt-10">
              <OrganicButton
                variant="gold"
                pulse
                icon={<Search className="w-4 h-4" />}
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              >
                Explorer les strates du vivant
              </OrganicButton>
            </div>

            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#f4ecd4]/60 text-[10px] tracking-[0.3em] uppercase"
              animate={{ y: [0, 6, 0], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              ↓ Descendez dans le jardin
            </motion.div>
          </motion.div>
        </section>

        {/* ============ SECTION 1 : ARBUSTIVE & HERBACÉE ============ */}
        <section className="relative min-h-screen py-24 px-6 md:px-12">
          <div className="absolute inset-0 opacity-70">
            <KenBurnsCarousel photos={strataOnePhotos} fallback={cover} intervalMs={9000} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-emerald-950/60 to-black/80" />

          <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center min-h-[80vh]">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.9 }}
            >
              <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#c9a24a] mb-3 flex items-center gap-2">
                <Sprout className="w-3.5 h-3.5" /> Strate 1 — Arbustive & herbacée
              </div>
              <h2 className="font-serif italic text-3xl md:text-5xl leading-tight text-[#f4ecd4]">
                À hauteur de fleurs, à hauteur d'ailes
              </h2>
              <p className="mt-5 text-[#f4ecd4]/70 leading-relaxed max-w-md">
                Fraises des bois, framboisiers, plantes médicinales. C'est l'étage
                fréquenté par les pollinisateurs, les oiseaux du sous-bois et les papillons.
              </p>
            </motion.div>

            <div className="md:justify-self-end">
              <StratPanel
                title="Biodiversité active"
                subtitle="Panneau vivant"
                accent="#e8c66a"
                gauges={[
                  { label: 'Pollinisateurs', value: m.pollinators, display: fallbackDisplay(m.insects, `${m.insects} obs.`), icon: <Bug className="w-3.5 h-3.5" /> },
                  { label: 'Oiseaux', value: Math.min(100, m.birds * 5), display: fallbackDisplay(m.birds, `${m.birds} esp.`), icon: <Feather className="w-3.5 h-3.5" /> },
                  { label: 'Plantes recensées', value: Math.min(100, m.plants * 2), display: fallbackDisplay(m.plants, `${m.plants} esp.`), icon: <Leaf className="w-3.5 h-3.5" /> },
                ]}
              />
            </div>
          </div>
        </section>

        {/* ============ SECTION 2 : RHIZOSPHÈRE ============ */}
        <section ref={rhizosphereSectionRef} className="relative min-h-screen py-24 px-6 md:px-12">
          <div className="absolute inset-0">
            <RhizosphereSVG tint={tint} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

          <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center min-h-[80vh]">
            <div>
              <StratPanel
                title="Vitalité du sol"
                subtitle="Sous-sol vivant"
                accent="#c9d97a"
                side="left"
                gauges={[
                  { label: 'Mycorhization', value: m.mycorhization, display: fallbackDisplay(m.fungi, `${Math.round(m.mycorhization)}%`), icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { label: 'Microfaune', value: m.microfauna, display: fallbackDisplay(m.others, `${m.others} obs.`), icon: <Worm className="w-3.5 h-3.5" /> },
                  { label: 'Stockage carbone', value: m.carbon === 'Élevé' ? 90 : m.carbon === 'Moyen' ? 55 : 20, display: m.carbon, icon: <Trees className="w-3.5 h-3.5" /> },
                ]}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.9 }}
              className="relative z-30 md:justify-self-end md:text-right"
            >
              <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#c9d97a] mb-3 md:justify-end flex items-center gap-2">
                <Worm className="w-3.5 h-3.5" /> Strate 2 — Rhizosphère
              </div>
              <h2 className="font-serif italic text-3xl md:text-5xl leading-tight text-[#f4ecd4]">
                Le silence fertile des racines
              </h2>
              <p className="mt-5 text-[#f4ecd4]/70 leading-relaxed max-w-md md:ml-auto">
                Ce que l'œil ne voit pas : réseaux mycorhiziens, vers de terre,
                bactéries. Un jardin en bonne santé se lit d'abord ici, dans la respiration du sol.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ============ SECTION 3 : MATRICE SAISONNIÈRE + CTA ============ */}
        <section className="relative min-h-screen py-24 px-6 md:px-12 flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-emerald-950 to-black" />

          <div className="relative max-w-3xl mx-auto">
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#c9a24a] mb-3 flex items-center justify-center gap-2">
              <Sun className="w-3.5 h-3.5" /> Matrice d'évolution saisonnière
            </div>
            <h2 className="font-serif italic text-3xl md:text-5xl leading-tight text-[#f4ecd4] text-center">
              Le jardin change de peau
            </h2>
            <p className="mt-4 text-[#f4ecd4]/70 text-center">
              Déplacez le curseur. La lumière, la palette et l'air respirent avec la saison.
            </p>

            {/* Slider saisons — 4 crans organiques */}
            <div className="mt-10 flex items-center justify-center gap-2 md:gap-4 flex-wrap">
              {SEASONS.map((s) => {
                const active = season === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={(e) => {
                      const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                      setFlash({
                        key: Date.now(),
                        color: SEASON_TINT[s.key],
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                      });
                      setSeason(s.key);
                    }}
                    className={`relative px-5 py-3 rounded-full font-serif text-sm transition-all border ${
                      active
                        ? 'bg-[#c9a24a] text-[#1a1408] border-[#c9a24a] shadow-[0_10px_30px_-5px_rgba(201,162,74,0.6)] scale-105'
                        : 'bg-white/5 text-[#f4ecd4]/70 border-white/15 hover:bg-white/10 hover:text-[#f4ecd4]'
                    }`}
                  >
                    <span className="mr-2">{s.emoji}</span>
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Carrousel espèces saisonnier — vraies photos terrain + iNat */}
            <SeasonSpeciesCarousel
              explorationId={event.exploration_id}
              season={season}
              tint={tint}
            />

            <div className="mt-16 flex flex-col items-center gap-5">
              <p className="max-w-xl font-serif italic text-base md:text-lg text-[#f4ecd4]/80 leading-relaxed">
                Inscrivez-vous pour entrer dans ce jardin et devenir sentinelle du vivant qui l'habite.
              </p>
              <OrganicButton
                variant="emerald"
                pulse
                href={`/marches-du-vivant/connexion?redirect=${encodeURIComponent(`/jardin/${slugOrId}`)}`}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Rejoindre ce jardin
              </OrganicButton>
              {event.public_slug && (
                <Link
                  to={`/m/${event.public_slug}`}
                  className="text-xs text-[#f4ecd4]/60 hover:text-[#f4ecd4] underline underline-offset-4 transition inline-flex items-center gap-1"
                >
                  Voir la fiche événement classique <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          <div className="absolute bottom-4 text-[10px] text-[#f4ecd4]/40 tracking-[0.2em] uppercase">
            Marches du Vivant · Immersion stratifiée
          </div>
        </section>

        {/* Flash coloré au changement de saison */}
        <AnimatePresence>
          {flash && (
            <motion.div
              key={flash.key}
              onAnimationComplete={() => setFlash(null)}
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 40, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
              className="fixed pointer-events-none z-[60] rounded-full mix-blend-screen"
              style={{
                left: flash.x - 40,
                top: flash.y - 40,
                width: 80,
                height: 80,
                background: `radial-gradient(circle, ${flash.color}, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

/** Titre révélé mot par mot avec léger blur → clarté. */
const RevealText: React.FC<{ text: string }> = ({ text }) => {
  const reduce = useReducedMotion();
  if (reduce) return <>{text}</>;
  const words = text.split(' ');
  return (
    <span className="inline-block">
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: 0.15 + i * 0.09, ease: [0.19, 1, 0.22, 1] }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
};

const IndicatorDot: React.FC<{ label: string; start: number; hideLabel?: boolean }> = ({ label, start, hideLabel }) => {
  const { scrollYProgress } = useScroll();
  const end = start + 0.25;
  const opacity = useTransform(scrollYProgress, [start, end - 0.01, end], [0.35, 1, 0.35]);
  const scale = useTransform(scrollYProgress, [start, (start + end) / 2, end], [1, 1.6, 1]);
  return (
    <div className="flex items-center gap-3 justify-end">
      <motion.span
        className="text-[10px] tracking-[0.25em] uppercase text-[#f4ecd4]/70 font-serif italic"
        aria-hidden={hideLabel}
        style={{ visibility: hideLabel ? 'hidden' : 'visible' }}
      >
        {label}
      </motion.span>
      <motion.span className="block w-1.5 h-1.5 rounded-full bg-[#c9a24a]" style={{ opacity, scale }} />
    </div>
  );
};

const StratIndicator: React.FC<{ hideLabels?: boolean }> = ({ hideLabels = false }) => {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-4">
      <IndicatorDot label="Canopée" start={0} hideLabel={hideLabels} />
      <IndicatorDot label="Arbustive" start={0.25} hideLabel={hideLabels} />
      <IndicatorDot label="Rhizosphère" start={0.5} hideLabel={hideLabels} />
      <IndicatorDot label="Saisons" start={0.75} hideLabel={hideLabels} />
    </div>
  );
};



export default ImmersiveGardenFiche;
