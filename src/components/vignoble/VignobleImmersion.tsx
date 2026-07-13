import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar, MapPin, Grape, Sprout, Leaf, ChevronDown, ChevronRight, ChevronLeft,
  BookOpen, Eye, Users, Wine, Share2, Sparkles, Info, ArrowRight, Camera,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  usePublicEventMedias,
  type PublicEvent, type PublicEventStats, type PublicBiodiversity, type PublicSpecies, type PublicMedia,
} from '@/hooks/usePublicEvent';
import { useExplorationSpeciesCount } from '@/hooks/useExplorationSpeciesCount';
import { getVerdict, TONE_STYLES, type VignobleAxis } from '@/lib/vignobleVerdicts';
import { SpeciesName } from '@/components/species/SpeciesName';

interface Props {
  event: PublicEvent;
  stats: PublicEventStats | null | undefined;
  biodiversity: PublicBiodiversity | null | undefined;
  slug: string;
  onShare: () => void;
}

/* ─────────────────────────────────────────────────────────────────
 *  Ornement — filet doré + branche de vigne stylisée
 * ────────────────────────────────────────────────────────────── */
const OrnamentalDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center gap-4 my-16 select-none" aria-hidden>
    <div className="flex-1 vignoble-gold-rule" />
    <svg width="34" height="34" viewBox="0 0 34 34" className="text-[hsl(var(--vignoble-gold))]">
      <circle cx="17" cy="17" r="2.2" fill="currentColor" />
      <circle cx="17" cy="8" r="1.6" fill="currentColor" opacity="0.7" />
      <circle cx="17" cy="26" r="1.6" fill="currentColor" opacity="0.7" />
      <circle cx="8" cy="17" r="1.6" fill="currentColor" opacity="0.7" />
      <circle cx="26" cy="17" r="1.6" fill="currentColor" opacity="0.7" />
      <path d="M17 10 L17 24 M10 17 L24 17" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
    </svg>
    {label && (
      <span className="font-vignoble italic text-xs uppercase tracking-[0.4em] text-[hsl(var(--vignoble-wine))]">
        {label}
      </span>
    )}
    <div className="flex-1 vignoble-gold-rule" />
  </div>
);

/* ─────────────────────────────────────────────────────────────────
 *  Chapter progress — barre verticale dorée (droite)
 * ────────────────────────────────────────────────────────────── */
const CHAPTERS = [
  { id: 'ouverture', label: 'Ouverture' },
  { id: 'domaine',   label: 'Le Domaine' },
  { id: 'pepites',   label: 'Rencontres' },
  { id: 'vigne-mouton', label: 'Vigne & Mouton' },
  { id: 'story',     label: 'Millésime' },
  { id: 'rejoindre', label: 'Rejoindre' },
] as const;

const ChapterProgress: React.FC<{ active: string }> = ({ active }) => (
  <nav aria-label="Chapitres" className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col gap-3">
    {CHAPTERS.map((c) => {
      const isActive = c.id === active;
      return (
        <a
          key={c.id}
          href={`#${c.id}`}
          className={cn(
            'group flex items-center gap-3 justify-end text-[10px] uppercase tracking-[0.32em] transition-all',
            isActive ? 'text-[hsl(var(--vignoble-wine))]' : 'text-[hsl(var(--vignoble-ink)/0.4)] hover:text-[hsl(var(--vignoble-wine))]',
          )}
        >
          <span className={cn(
            'font-vignoble italic transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-80',
          )}>{c.label}</span>
          <span className={cn(
            'block rounded-full transition-all',
            isActive
              ? 'w-6 h-[2px] bg-[hsl(var(--vignoble-gold))]'
              : 'w-3 h-[1px] bg-[hsl(var(--vignoble-ink)/0.35)] group-hover:bg-[hsl(var(--vignoble-gold))]',
          )} />
        </a>
      );
    })}
  </nav>
);

/* ─────────────────────────────────────────────────────────────────
 *  Pastille "double lecture" — signale un bloc à double valeur
 * ────────────────────────────────────────────────────────────── */
const DoubleReadPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--vignoble-gold)/0.5)] bg-[hsl(var(--vignoble-gold)/0.12)] text-[9px] uppercase tracking-[0.3em] font-medium text-[hsl(var(--vignoble-ink))]">
    <Sparkles className="h-3 w-3 text-[hsl(var(--vignoble-gold))]" />
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────────
 *  ACTE 0 — Cartel d'ouverture
 * ────────────────────────────────────────────────────────────── */
const VignobleHero: React.FC<{ event: PublicEvent; onShare: () => void }> = ({ event, onShare }) => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.25]);
  const vineY = useTransform(scrollY, [0, 600], [0, -60]);
  const dateLabel = format(new Date(event.date_marche), 'PPP', { locale: fr }).toUpperCase();

  // Split title in 2 lignes propres pour la composition « cartel »
  const titleWords = (event.title || '').split(/\s+/);
  const cut = Math.max(1, Math.min(titleWords.length - 1, Math.ceil(titleWords.length / 2)));
  const line1 = titleWords.slice(0, cut).join(' ');
  const line2 = titleWords.slice(cut).join(' ');

  return (
    <header
      id="ouverture"
      ref={heroRef}
      className="relative overflow-hidden min-h-screen flex flex-col vignoble-hero-bg"
    >
      {/* Photo de couverture (si présente) — overlay renforcé pour préserver contraste */}
      {event.cover_image_url && (
        <>
          <motion.img
            src={event.cover_image_url}
            alt=""
            aria-hidden
            style={{ y: heroY, opacity: heroOpacity }}
            className="absolute inset-0 w-full h-[115%] object-cover -z-20"
          />
          <div
            className="absolute inset-0 -z-10 bg-[hsl(var(--vignoble-ink)/0.82)]"
            aria-hidden
          />
        </>
      )}

      {/* Grain lithographique */}
      <div className="absolute inset-0 vignoble-grain pointer-events-none" aria-hidden />

      {/* Branche de vigne décorative (desktop) */}
      <motion.svg
        aria-hidden
        style={{ y: vineY }}
        viewBox="0 0 120 900"
        className="hidden lg:block absolute left-4 top-0 h-full w-24 opacity-[0.22] text-[hsl(var(--vignoble-gold-soft))] pointer-events-none"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      >
        <path d="M60 0 C 50 120, 72 220, 58 340 S 46 560, 62 700 S 54 840, 60 900" />
        {[80, 190, 310, 430, 560, 690, 810].map((y, i) => (
          <g key={i} transform={`translate(${i % 2 === 0 ? 40 : 74}, ${y})`}>
            <path d={`M0 0 C ${i % 2 === 0 ? -18 : 18} -8, ${i % 2 === 0 ? -22 : 22} 8, 0 18 Z`} fill="currentColor" opacity="0.55" />
            <circle cx={i % 2 === 0 ? -6 : 6} cy="24" r="3" fill="currentColor" opacity="0.8" />
            <circle cx={i % 2 === 0 ? -12 : 12} cy="30" r="3" fill="currentColor" opacity="0.7" />
            <circle cx={i % 2 === 0 ? 0 : 0} cy="32" r="3" fill="currentColor" opacity="0.75" />
          </g>
        ))}
      </motion.svg>

      {/* Sceau de cire — coin haut-droit */}
      <div className="absolute top-24 right-6 md:right-12 z-10 vignoble-seal-in pointer-events-none" aria-hidden>
        <svg viewBox="0 0 140 140" className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]">
          <defs>
            <radialGradient id="wax" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="hsl(var(--vignoble-wine))" stopOpacity="1" />
              <stop offset="70%" stopColor="hsl(18 55% 14%)" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(18 55% 6%)" stopOpacity="1" />
            </radialGradient>
            <path id="sealCircle" d="M 70,70 m -48,0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0" />
          </defs>
          <circle cx="70" cy="70" r="62" fill="url(#wax)" />
          <circle cx="70" cy="70" r="58" fill="none" stroke="hsl(var(--vignoble-gold))" strokeWidth="0.8" opacity="0.9" />
          <circle cx="70" cy="70" r="50" fill="none" stroke="hsl(var(--vignoble-gold))" strokeWidth="0.5" opacity="0.6" strokeDasharray="1 3" />
          <text fill="hsl(var(--vignoble-gold-soft))" fontSize="8.5" letterSpacing="3" fontFamily="'Cormorant Garamond', serif" fontStyle="italic">
            <textPath href="#sealCircle" startOffset="0">· GRAND CRU · DU VIVANT · MMXXVI ·</textPath>
          </text>
          {/* grappe centrale */}
          <g transform="translate(70 70)" fill="hsl(var(--vignoble-gold))">
            <circle cx="-6" cy="0" r="3" />
            <circle cx="6" cy="0" r="3" />
            <circle cx="0" cy="-4" r="3" />
            <circle cx="-3" cy="6" r="3" />
            <circle cx="3" cy="6" r="3" />
            <circle cx="0" cy="12" r="3" />
            <path d="M0 -8 C -2 -14, 4 -16, 6 -20" stroke="hsl(var(--vignoble-gold-soft))" strokeWidth="0.8" fill="none" />
          </g>
        </svg>
      </div>

      {/* Top bar */}
      <div className="relative z-20 max-w-6xl w-full mx-auto px-6 pt-8 flex items-center justify-between gap-3">
        <Link
          to="/marches-du-vivant"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs backdrop-blur-md bg-[hsl(var(--vignoble-ink)/0.55)] border border-[hsl(var(--vignoble-gold)/0.55)] text-[hsl(var(--vignoble-paper))] hover:bg-[hsl(var(--vignoble-ink)/0.75)] transition"
        >
          <ChevronRight className="h-3 w-3 rotate-180" />
          Les Marches du Vivant
        </Link>
        <button
          onClick={onShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs backdrop-blur-md bg-[hsl(var(--vignoble-ink)/0.55)] border border-[hsl(var(--vignoble-gold)/0.55)] text-[hsl(var(--vignoble-paper))] hover:bg-[hsl(var(--vignoble-ink)/0.75)] transition"
        >
          <Share2 className="h-3 w-3" />
          <span className="hidden sm:inline">Partager</span>
        </button>
      </div>

      {/* Cartel centré */}
      <div className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 flex flex-col justify-center items-center text-center">
        <div className="space-y-8">
          {/* Numérotation romaine */}
          <div className="font-vignoble italic text-[10px] uppercase tracking-[0.55em] text-[hsl(var(--vignoble-gold))]">
            ✦ &nbsp;Acte I / VII&nbsp; ✦
          </div>

          {/* Cartouche */}
          <div className="inline-flex items-center gap-3 px-6 py-2.5 border-y border-[hsl(var(--vignoble-gold))] bg-[hsl(var(--vignoble-ink)/0.55)] backdrop-blur-sm">
            <Grape className="h-4 w-4 text-[hsl(var(--vignoble-gold))]" />
            <span className="font-vignoble italic text-xs uppercase tracking-[0.5em] text-[hsl(var(--vignoble-paper))]">
              Grand Cru du Vivant
            </span>
            <Grape className="h-4 w-4 text-[hsl(var(--vignoble-gold))]" />
          </div>

          {/* H1 en 2 lignes */}
          <h1
            className="font-vignoble font-medium text-[hsl(var(--vignoble-paper))] tracking-tight leading-[0.95]"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)' }}
          >
            {line1 && (
              <span className="block italic vignoble-title-reveal" style={{ animationDelay: '150ms' }}>
                {line1}
              </span>
            )}
            {line2 && (
              <span
                className="block uppercase tracking-[0.02em] vignoble-title-reveal"
                style={{
                  animationDelay: '450ms',
                  fontSize: '0.72em',
                  color: 'hsl(var(--vignoble-gold-soft))',
                }}
              >
                {line2}
              </span>
            )}
          </h1>

          {/* Filet or */}
          <div className="mx-auto w-32 h-[2px] bg-[hsl(var(--vignoble-gold))] vignoble-rule-draw" />

          {/* Meta */}
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-[hsl(var(--vignoble-paper)/0.92)] text-[11px] tracking-[0.35em] uppercase">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[hsl(var(--vignoble-gold))]" />
              {dateLabel}
            </span>
            {event.lieu && (
              <>
                <span className="text-[hsl(var(--vignoble-gold))]">·</span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[hsl(var(--vignoble-gold))]" />
                  {event.lieu}
                </span>
              </>
            )}
          </div>

          {/* CTA double */}
          <div className="flex flex-wrap justify-center gap-3 pt-6">
            <a href="#rejoindre">
              <Button
                size="lg"
                className="bg-[hsl(var(--vignoble-wine))] hover:bg-[hsl(var(--vignoble-wine)/0.85)] text-[hsl(var(--vignoble-paper))] border border-[hsl(var(--vignoble-gold))] rounded-none px-8 h-12 font-vignoble tracking-[0.2em] uppercase text-xs shadow-[0_10px_30px_-10px_hsl(var(--vignoble-wine))]"
              >
                Marcher ce vignoble
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
            <a href="#domaine">
              <Button
                size="lg"
                variant="outline"
                className="border-[hsl(var(--vignoble-gold))] bg-[hsl(var(--vignoble-ink)/0.55)] backdrop-blur-sm hover:bg-[hsl(var(--vignoble-gold)/0.15)] text-[hsl(var(--vignoble-paper))] rounded-none px-8 h-12 font-vignoble tracking-[0.2em] uppercase text-xs"
              >
                Explorer le domaine
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="relative z-10 pb-10 flex flex-col items-center gap-3 text-[hsl(var(--vignoble-paper)/0.75)]">
        <span className="font-vignoble italic text-[10px] uppercase tracking-[0.45em]">
          Descendre au domaine
        </span>
        <span className="block w-[1px] h-10 bg-[hsl(var(--vignoble-gold))] vignoble-scroll-cue" />
      </div>

      {/* Fondu de raccord vers le paper de l'acte I */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 vignoble-hero-fade-bottom pointer-events-none"
        aria-hidden
      />
    </header>
  );
};


/* ─────────────────────────────────────────────────────────────────
 *  ACTE 1 — Domaine en chiffres (bandeau or)
 * ────────────────────────────────────────────────────────────── */
const DomaineChiffres: React.FC<{
  stats: PublicEventStats | null | undefined;
  biodiversity: PublicBiodiversity | null | undefined;
  event: PublicEvent;
  unifiedSpeciesCount?: number | null;
}> = ({ stats, biodiversity, event, unifiedSpeciesCount }) => {
  const speciesValue = unifiedSpeciesCount ?? biodiversity?.species_count ?? 0;
  return (
    <section id="domaine" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="font-vignoble italic text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--vignoble-wine))]">
            Chapitre I
          </span>
          <h2 className="font-vignoble text-4xl md:text-5xl font-medium mt-3 text-[hsl(var(--vignoble-ink))]">
            Le Domaine
          </h2>
        </div>

        <div className="border-y-2 border-[hsl(var(--vignoble-gold))] bg-[hsl(var(--vignoble-paper-warm)/0.6)] py-8 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <ChiffreCell value={speciesValue} label="Espèces recensées" />
            <ChiffreCell value={stats?.marcheurs_count ?? 0} label="Marcheurs" />
            <ChiffreCell value={stats?.observations_count ?? 0} label="Observations" />
            <ChiffreCell value={biodiversity?.biodiversity_index ? Math.round(biodiversity.biodiversity_index * 10) / 10 : '—'} label="Indice biodiversité" />
          </div>
        </div>

        {event.organisateur?.description && (
          <div className="mt-12 max-w-3xl mx-auto">
            <p className="font-vignoble italic text-lg md:text-xl leading-relaxed text-[hsl(var(--vignoble-ink)/0.85)] text-center">
              « {event.organisateur.description} »
            </p>
            {event.organisateur.nom && (
              <p className="mt-4 text-center text-xs uppercase tracking-[0.35em] text-[hsl(var(--vignoble-wine))]">
                — {event.organisateur.nom}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const ChiffreCell: React.FC<{ value: number | string; label: string }> = ({ value, label }) => (
  <div>
    <div className="font-vignoble text-4xl md:text-5xl font-medium text-[hsl(var(--vignoble-wine))] tabular-nums">
      {value}
    </div>
    <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--vignoble-ink)/0.65)]">
      {label}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────
 *  Album du Domaine — carrousel photos (marcheurs · convivialité · waypoints)
 * ────────────────────────────────────────────────────────────── */
const AlbumDomaineCarousel: React.FC<{ slug: string }> = ({ slug }) => {
  const { data: medias } = usePublicEventMedias(slug);
  const reduce = useReducedMotion();

  const photos = useMemo<PublicMedia[]>(
    () => (medias ?? []).filter((m) => m.type_media === 'photo' && (m.url_fichier || m.external_url)),
    [medias],
  );

  // Responsive tuiles par page
  const [perPage, setPerPage] = useState(4);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setPerPage(w < 640 ? 1 : w < 1024 ? 2 : 4);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const pages = useMemo(() => {
    const out: PublicMedia[][] = [];
    for (let i = 0; i < photos.length; i += perPage) out.push(photos.slice(i, i + perPage));
    return out;
  }, [photos, perPage]);

  const [page, setPage] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => { setPage(0); }, [perPage]);

  useEffect(() => {
    if (pages.length <= 1) return;
    const t = setInterval(() => {
      setPage((p) => (p + 1) % pages.length);
      setFlashKey((k) => k + 1);
    }, 4500);
    return () => clearInterval(t);
  }, [pages.length]);

  if (photos.length === 0) return null;

  const current = pages[page] ?? [];
  const goto = (n: number) => { setPage(((n % pages.length) + pages.length) % pages.length); setFlashKey((k) => k + 1); };

  return (
    <section id="album" className="py-20 px-6 bg-[hsl(var(--vignoble-ink))] text-[hsl(var(--vignoble-paper))] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 20% 20%, hsl(var(--vignoble-wine)/0.55), transparent 55%), radial-gradient(ellipse at 80% 80%, hsl(var(--vignoble-gold)/0.18), transparent 60%)' }}
        aria-hidden
      />

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-10">
          <span className="font-vignoble italic text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--vignoble-gold))]">
            Album du domaine
          </span>
          <h2 className="font-vignoble text-3xl md:text-4xl font-medium mt-3 text-[hsl(var(--vignoble-paper))]">
            Ce que les marcheurs ont vu
          </h2>
          <div className="mx-auto mt-4 w-16 h-[1px] bg-[hsl(var(--vignoble-gold))]" />
        </div>

        <div className="relative group">
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 60 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -60 }}
                transition={{ duration: reduce ? 0.4 : 0.75, ease: [0.19, 1, 0.22, 1] }}
                className={cn(
                  'grid gap-4',
                  perPage === 1 ? 'grid-cols-1' : perPage === 2 ? 'grid-cols-2' : 'grid-cols-4',
                )}
              >
                {current.map((m, i) => {
                  const url = (m.url_fichier || m.external_url)!;
                  const dy = reduce ? 0 : (i % 2 === 0 ? -4 : 4);
                  return (
                    <motion.figure
                      key={m.id}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, y: dy, scale: 1 }}
                      transition={{ duration: 0.7, delay: i * 0.09, ease: [0.19, 1, 0.22, 1] }}
                      className="relative overflow-hidden aspect-[4/5] border border-[hsl(var(--vignoble-gold)/0.55)] shadow-[0_20px_45px_-20px_hsl(var(--vignoble-ink)/0.9)]"
                    >
                      <motion.img
                        src={url}
                        alt={m.titre || 'Photo du domaine'}
                        loading="lazy"
                        initial={{ scale: 1.05 }}
                        animate={reduce ? { scale: 1.05 } : { scale: 1.14 }}
                        transition={{ duration: 4.5, ease: 'linear' }}
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                      />
                      <div className="absolute inset-x-0 top-0 h-[1px] vignoble-gold-rule opacity-80" />
                      <figcaption className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-[hsl(var(--vignoble-ink)/0.85)] via-[hsl(var(--vignoble-ink)/0.35)] to-transparent">
                        <div className="font-vignoble italic text-[11px] text-[hsl(var(--vignoble-paper)/0.95)] leading-snug">
                          {m.author_name ? <>— {m.author_name}</> : <>— Marcheur du domaine</>}
                        </div>
                        {m.titre && (
                          <div className="text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--vignoble-gold))] mt-1 truncate">
                            {m.titre}
                          </div>
                        )}
                      </figcaption>
                    </motion.figure>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Flash doré au changement */}
            {!reduce && (
              <AnimatePresence>
                <motion.div
                  key={`flash-${flashKey}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.45, 0] }}
                  transition={{ duration: 0.4, times: [0, 0.25, 1], ease: 'easeOut' }}
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse at center, hsl(var(--vignoble-gold)/0.9) 0%, transparent 65%)',
                    mixBlendMode: 'screen',
                  }}
                />
              </AnimatePresence>
            )}
          </div>

          {/* Chevrons */}
          {pages.length > 1 && (
            <>
              <button
                onClick={() => goto(page - 1)}
                aria-label="Précédent"
                className="absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[hsl(var(--vignoble-gold))] bg-[hsl(var(--vignoble-ink)/0.6)] backdrop-blur-md text-[hsl(var(--vignoble-gold))] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => goto(page + 1)}
                aria-label="Suivant"
                className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[hsl(var(--vignoble-gold))] bg-[hsl(var(--vignoble-ink)/0.6)] backdrop-blur-md text-[hsl(var(--vignoble-gold))] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Pastilles progression */}
        {pages.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => goto(i)}
                aria-label={`Aller à la planche ${i + 1}`}
                className={cn(
                  'h-[3px] transition-all duration-500',
                  i === page ? 'w-8 bg-[hsl(var(--vignoble-gold))]' : 'w-3 bg-[hsl(var(--vignoble-paper)/0.35)] hover:bg-[hsl(var(--vignoble-paper)/0.6)]',
                )}
              />
            ))}
          </div>
        )}

        <p className="mt-6 text-center font-vignoble italic text-[11px] uppercase tracking-[0.35em] text-[hsl(var(--vignoble-paper)/0.55)]">
          {photos.length} planche{photos.length > 1 ? 's' : ''} · marcheurs & points de marche
        </p>
      </div>
    </section>
  );
};


const PepitesGrid: React.FC<{ species: PublicSpecies[] }> = ({ species }) => {
  const pepites = useMemo(() => {
    return [...species]
      .filter((s) => s.photo_url)
      .sort((a, b) => (b.observations_count ?? 0) - (a.observations_count ?? 0))
      .slice(0, 4);
  }, [species]);

  if (pepites.length === 0) return null;

  return (
    <section id="pepites" className="py-24 px-6 bg-[hsl(var(--vignoble-paper-warm)/0.35)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="font-vignoble italic text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--vignoble-wine))]">
            Chapitre II
          </span>
          <h2 className="font-vignoble text-4xl md:text-5xl font-medium mt-3 text-[hsl(var(--vignoble-ink))]">
            Ce que vous rencontrerez
          </h2>
          <p className="mt-3 font-vignoble italic text-lg text-[hsl(var(--vignoble-ink)/0.7)] max-w-xl mx-auto">
            Quatre présences vivantes de ce domaine, choisies pour la marche.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {pepites.map((s, i) => (
            <motion.article
              key={s.scientific_name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group relative bg-[hsl(var(--vignoble-paper))] border border-[hsl(var(--vignoble-ink)/0.08)] shadow-[0_1px_0_hsl(var(--vignoble-gold))] overflow-hidden"
            >
              <div className="aspect-square overflow-hidden bg-[hsl(var(--vignoble-ink)/0.08)]">
                <img
                  src={s.photo_url!}
                  alt={s.common_name || s.scientific_name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-3 relative">
                <div className="absolute -top-[1px] left-3 right-3 h-[1px] vignoble-gold-rule" />
                <SpeciesName
                  scientificName={s.scientific_name}
                  commonName={s.common_name}
                  size="sm"
                  truncate
                  showScientific
                  scientificClassName="text-[10px] italic text-[hsl(var(--vignoble-ink)/0.55)]"
                  className="font-vignoble text-[hsl(var(--vignoble-ink))]"
                />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
 *  ACTE 3 — Fiche croisée Vigne / Mouton (composant phare)
 * ────────────────────────────────────────────────────────────── */
const FicheVigneMouton: React.FC<{ species: PublicSpecies[] }> = ({ species }) => {
  const [axis, setAxis] = useState<VignobleAxis | 'both'>('both');
  const [taxonFilter, setTaxonFilter] = useState<string | null>(null);

  const taxa = useMemo(() => {
    const set = new Set<string>();
    species.forEach((s) => s.iconic_taxon && set.add(s.iconic_taxon));
    return Array.from(set);
  }, [species]);

  const filtered = useMemo(() => {
    return taxonFilter ? species.filter((s) => s.iconic_taxon === taxonFilter) : species;
  }, [species, taxonFilter]);

  const stats = useMemo(() => {
    let allyVigne = 0, watchVigne = 0, allyMouton = 0;
    species.forEach((s) => {
      const v = getVerdict(s.iconic_taxon, 'vigne');
      const m = getVerdict(s.iconic_taxon, 'mouton');
      if (v.tone === 'ally') allyVigne++;
      if (v.tone === 'watch' || v.tone === 'threat') watchVigne++;
      if (m.tone === 'ally') allyMouton++;
    });
    return { allyVigne, watchVigne, allyMouton, total: species.length };
  }, [species]);

  if (species.length === 0) return null;

  return (
    <section id="vigne-mouton" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <span className="font-vignoble italic text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--vignoble-wine))]">
            Chapitre III · Pièce maîtresse
          </span>
          <h2 className="font-vignoble text-4xl md:text-5xl font-medium mt-3 text-[hsl(var(--vignoble-ink))]">
            Inventaire Vigne <span className="text-[hsl(var(--vignoble-gold))]">&</span> Mouton
          </h2>
        </div>

        <div className="flex justify-center mb-4">
          <DoubleReadPill>Données certifiées GBIF · lecture double</DoubleReadPill>
        </div>

        {/* Barre d'utilité — signal fort */}
        <div className="max-w-3xl mx-auto mt-10 mb-8 border-y border-[hsl(var(--vignoble-gold)/0.5)] py-5 grid grid-cols-3 text-center">
          <div>
            <div className="font-vignoble text-3xl text-[hsl(var(--vignoble-wine))] tabular-nums">{stats.allyVigne}</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--vignoble-ink)/0.6)] mt-1">Alliées vigne</div>
          </div>
          <div className="border-x border-[hsl(var(--vignoble-ink)/0.1)]">
            <div className="font-vignoble text-3xl text-[hsl(var(--vignoble-wine))] tabular-nums">{stats.allyMouton}</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--vignoble-ink)/0.6)] mt-1">Alliées troupeau</div>
          </div>
          <div>
            <div className="font-vignoble text-3xl text-[hsl(var(--vignoble-wine))] tabular-nums">{stats.total}</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--vignoble-ink)/0.6)] mt-1">Espèces recensées</div>
          </div>
        </div>

        {/* Toggle axe */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="inline-flex rounded-none border border-[hsl(var(--vignoble-ink)/0.2)] overflow-hidden">
            {(['vigne', 'mouton', 'both'] as const).map((a) => {
              const active = axis === a;
              const label = a === 'vigne' ? 'Côté Vigne' : a === 'mouton' ? 'Côté Mouton' : 'Les deux';
              const Icon = a === 'vigne' ? Grape : a === 'mouton' ? Sprout : Leaf;
              return (
                <button
                  key={a}
                  onClick={() => setAxis(a)}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.25em] transition',
                    active
                      ? 'bg-[hsl(var(--vignoble-ink))] text-[hsl(var(--vignoble-paper))]'
                      : 'bg-transparent text-[hsl(var(--vignoble-ink)/0.65)] hover:bg-[hsl(var(--vignoble-ink)/0.05)]',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          {taxa.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTaxonFilter(null)}
                className={cn(
                  'px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] rounded-full border transition',
                  taxonFilter === null
                    ? 'bg-[hsl(var(--vignoble-gold)/0.25)] border-[hsl(var(--vignoble-gold))] text-[hsl(var(--vignoble-ink))]'
                    : 'border-[hsl(var(--vignoble-ink)/0.2)] text-[hsl(var(--vignoble-ink)/0.6)] hover:border-[hsl(var(--vignoble-gold))]',
                )}
              >
                Tous
              </button>
              {taxa.map((t) => (
                <button
                  key={t}
                  onClick={() => setTaxonFilter(t)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] rounded-full border transition',
                    taxonFilter === t
                      ? 'bg-[hsl(var(--vignoble-gold)/0.25)] border-[hsl(var(--vignoble-gold))] text-[hsl(var(--vignoble-ink))]'
                      : 'border-[hsl(var(--vignoble-ink)/0.2)] text-[hsl(var(--vignoble-ink)/0.6)] hover:border-[hsl(var(--vignoble-gold))]',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Liste éditoriale */}
        <ul className="divide-y divide-[hsl(var(--vignoble-ink)/0.08)] border-y border-[hsl(var(--vignoble-ink)/0.15)]">
          {filtered.slice(0, 40).map((s) => {
            const vigne = getVerdict(s.iconic_taxon, 'vigne');
            const mouton = getVerdict(s.iconic_taxon, 'mouton');
            const showVigne = axis === 'vigne' || axis === 'both';
            const showMouton = axis === 'mouton' || axis === 'both';
            return (
              <li key={s.scientific_name} className="py-5 grid grid-cols-12 gap-4 items-center group">
                {/* Thumb */}
                <div className="col-span-2 sm:col-span-1">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[hsl(var(--vignoble-ink)/0.08)] ring-1 ring-[hsl(var(--vignoble-gold)/0.3)]">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[hsl(var(--vignoble-ink)/0.3)]">
                        <Leaf className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Nom */}
                <div className="col-span-10 sm:col-span-4">
                  <h3 className="font-vignoble text-xl text-[hsl(var(--vignoble-ink))] leading-tight">
                    <SpeciesName scientificName={s.scientific_name} commonName={s.common_name} />
                  </h3>
                  <p className="font-vignoble italic text-xs text-[hsl(var(--vignoble-ink)/0.55)] mt-0.5">
                    {s.scientific_name}
                    {s.iconic_taxon && <span className="ml-2 uppercase tracking-[0.25em] text-[9px] not-italic text-[hsl(var(--vignoble-wine)/0.7)]">· {s.iconic_taxon}</span>}
                  </p>
                </div>

                {/* Verdicts */}
                <div className="col-span-12 sm:col-span-7 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {showVigne && (
                    <VerdictChip icon={Grape} verdict={vigne} axisLabel="Vigne" />
                  )}
                  {showMouton && (
                    <VerdictChip icon={Sprout} verdict={mouton} axisLabel="Mouton" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {filtered.length > 40 && (
          <p className="mt-4 text-center text-xs italic text-[hsl(var(--vignoble-ink)/0.5)]">
            {filtered.length - 40} espèces supplémentaires observées — inventaire complet en cours d'enrichissement éditorial.
          </p>
        )}

        {/* Encart discret certification */}
        <div className="mt-10 flex items-start gap-3 max-w-3xl mx-auto p-4 border-l-2 border-[hsl(var(--vignoble-gold))] bg-[hsl(var(--vignoble-paper-warm)/0.4)]">
          <Info className="h-4 w-4 text-[hsl(var(--vignoble-wine))] mt-0.5 shrink-0" />
          <p className="text-xs text-[hsl(var(--vignoble-ink)/0.75)] leading-relaxed">
            <strong className="text-[hsl(var(--vignoble-ink))]">Verdicts éditoriaux</strong> — heuristiques basées sur l'iconic_taxon GBIF et la littérature agronomique.
            Chaque ligne fera l'objet d'une validation espèce-par-espèce dans la Fiche Vigne/Mouton curée
            (P1 · feuille de route Château Boutinet). Les données brutes sont certifiées <em>tampon GBIF</em>.
          </p>
        </div>
      </div>
    </section>
  );
};

const VerdictChip: React.FC<{ icon: React.ComponentType<{ className?: string }>; verdict: ReturnType<typeof getVerdict>; axisLabel: string }> = ({ icon: Icon, verdict, axisLabel }) => {
  const styles = TONE_STYLES[verdict.tone];
  return (
    <div className={cn('flex-1 border px-3 py-2 rounded-none', styles.chip)}>
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.3em] opacity-70">
        <Icon className="h-3 w-3" />
        {axisLabel}
        <span className={cn('ml-auto w-1.5 h-1.5 rounded-full', styles.dot)} />
      </div>
      <div className="font-vignoble text-sm mt-1 leading-tight">{verdict.label}</div>
      <div className="text-[11px] mt-0.5 opacity-80 leading-snug">{verdict.detail}</div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
 *  ACTE 4 — Story du millésime
 * ────────────────────────────────────────────────────────────── */
const MillesimeStory: React.FC<{ event: PublicEvent }> = ({ event }) => {
  if (!event.description) return null;

  // Retire HTML tags mais garde ponctuation
  const plain = event.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const paragraphs = plain.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/).filter(Boolean);

  return (
    <section id="story" className="py-24 px-6 bg-[hsl(var(--vignoble-ink))] text-[hsl(var(--vignoble-paper))]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <span className="font-vignoble italic text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--vignoble-gold))]">
            Chapitre IV
          </span>
          <h2 className="font-vignoble text-4xl md:text-5xl font-medium mt-3 text-[hsl(var(--vignoble-paper))]">
            Histoire du Millésime
          </h2>
          <div className="mt-6 mx-auto w-16 h-[1px] bg-[hsl(var(--vignoble-gold))]" />
        </div>

        <article className="font-vignoble text-lg md:text-xl leading-[1.85] text-[hsl(var(--vignoble-paper)/0.9)] space-y-6">
          {paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? 'vignoble-drop-cap' : ''}>
              {p}
            </p>
          ))}
        </article>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
 *  ACTE 5 — Rejoindre (bouteille supprimée)
 * ────────────────────────────────────────────────────────────── */


/* ─────────────────────────────────────────────────────────────────
 *  ACTE 6 — Rejoindre
 * ────────────────────────────────────────────────────────────── */
const RejoindreSection: React.FC<{ event: PublicEvent; slug: string }> = ({ event, slug }) => {
  const dateLabel = format(new Date(event.date_marche), 'PPP', { locale: fr });
  return (
    <section id="rejoindre" className="py-24 px-6 bg-gradient-to-b from-[hsl(var(--vignoble-paper))] to-[hsl(var(--vignoble-paper-warm))]">
      <div className="max-w-3xl mx-auto text-center">
        <span className="font-vignoble italic text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--vignoble-wine))]">
          Chapitre V
        </span>
        <h2 className="font-vignoble text-5xl md:text-6xl font-medium mt-3 text-[hsl(var(--vignoble-ink))]">
          Marcher ce vignoble
        </h2>
        <div className="mt-6 mx-auto w-16 h-[1px] bg-[hsl(var(--vignoble-gold))]" />

        <div className="mt-10 border-y-2 border-[hsl(var(--vignoble-gold))] py-8 space-y-3">
          <p className="font-vignoble italic text-xl text-[hsl(var(--vignoble-ink))]">{dateLabel}</p>
          {event.lieu && (
            <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-[hsl(var(--vignoble-wine))]">
              <MapPin className="h-3.5 w-3.5" />
              {event.lieu}
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/apprendre/${slug}`}>
            <Button size="lg" className="bg-[hsl(var(--vignoble-ink))] hover:bg-[hsl(var(--vignoble-wine))] text-[hsl(var(--vignoble-paper))] border border-[hsl(var(--vignoble-gold))] rounded-none px-8 h-12 font-vignoble tracking-[0.15em] uppercase text-sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Préparer sa marche
            </Button>
          </Link>
          <Link to="/marches-du-vivant">
            <Button size="lg" variant="outline" className="border-[hsl(var(--vignoble-ink))] bg-transparent text-[hsl(var(--vignoble-ink))] rounded-none px-8 h-12 font-vignoble tracking-[0.15em] uppercase text-sm hover:bg-[hsl(var(--vignoble-ink)/0.05)]">
              Toutes les marches
            </Button>
          </Link>
        </div>

        <p className="mt-12 font-vignoble italic text-xs uppercase tracking-[0.4em] text-[hsl(var(--vignoble-ink)/0.5)]">
          La Fréquence du Vivant · Marches en viticulture vivante
        </p>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────────────
 *  Layout racine
 * ────────────────────────────────────────────────────────────── */
const VignobleImmersion: React.FC<Props> = ({ event, stats, biodiversity, slug, onShare }) => {
  const [activeChapter, setActiveChapter] = useState<string>('ouverture');
  const species = biodiversity?.species ?? [];
  const { data: speciesCountData } = useExplorationSpeciesCount(event.exploration_id);
  const unifiedSpeciesCount = speciesCountData?.total ?? null;

  // Simple scroll-spy
  React.useEffect(() => {
    const handler = () => {
      const positions = CHAPTERS.map((c) => {
        const el = document.getElementById(c.id);
        if (!el) return { id: c.id, top: Infinity };
        return { id: c.id, top: Math.abs(el.getBoundingClientRect().top - 120) };
      });
      positions.sort((a, b) => a.top - b.top);
      if (positions[0]) setActiveChapter(positions[0].id);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="vignoble-scope min-h-screen">
      <ChapterProgress active={activeChapter} />

      <VignobleHero event={event} onShare={onShare} />
      <OrnamentalDivider label="I · Le Domaine" />
      <DomaineChiffres stats={stats} biodiversity={biodiversity} event={event} unifiedSpeciesCount={unifiedSpeciesCount} />
      <AlbumDomaineCarousel slug={slug} />
      <OrnamentalDivider label="II · Rencontres" />
      <PepitesGrid species={species} />
      <OrnamentalDivider label="III · Vigne & Mouton" />
      <FicheVigneMouton species={species} />
      <OrnamentalDivider label="IV · Millésime" />
      <MillesimeStory event={event} />
      <OrnamentalDivider label="V · Rejoindre" />
      <RejoindreSection event={event} slug={slug} />

      {/* Footer signature */}
      <footer className="py-10 border-t border-[hsl(var(--vignoble-gold)/0.4)] text-center text-[10px] uppercase tracking-[0.4em] text-[hsl(var(--vignoble-ink)/0.5)]">
        Immersion Vignoble · Grand Cru du Vivant
      </footer>
    </div>
  );
};

export default VignobleImmersion;
