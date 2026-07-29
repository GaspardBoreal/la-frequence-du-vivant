import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowLeft, TreePine, MapPin, Leaf, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';
import { useUserAppsAccess } from '@/hooks/useUserAppsAccess';
import AppSwitcher from '@/components/community/AppSwitcher';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { useProprieteHeroPhotos } from '@/hooks/propriete/useProprieteHeroPhotos';
import { NudgeMarcheBanner } from '@/components/propriete/NudgeMarcheBanner';
import { TabObserve } from '@/components/propriete/tabs/TabObserve';
import { TabAnalyze } from '@/components/propriete/tabs/TabAnalyze';
import { TabIdentify } from '@/components/propriete/tabs/TabIdentify';
import { TabSynthesize } from '@/components/propriete/tabs/TabSynthesize';
import { TabPalette } from '@/components/propriete/tabs/TabPalette';
import { TabPortrait } from '@/components/propriete/portrait/TabPortrait';
import KenBurnsCarousel from '@/components/immersive-garden/KenBurnsCarousel';
import { ProprieteVivantScopeProvider } from '@/contexts/ProprieteVivantScopeContext';
import OrganicButton from '@/components/immersive-garden/OrganicButton';

const ProprieteEspace: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading } = useCommunityAuth();
  const { data: apps, isLoading: appsLoading } = useUserAppsAccess(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate('/marches-du-vivant/connexion');
  }, [loading, user, navigate]);

  const { data: propriete, isLoading: propLoading } = useQuery({
    queryKey: ['propriete-espace', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proprietes')
        .select('*')
        .eq('slug', slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug && !!user,
  });

  const hasAccess = !!apps?.proprietesAccessibles.some((p) => p.slug === slug);

  if (loading || appsLoading || propLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary animate-pulse">
        Chargement de l'espace…
      </div>
    );
  }

  if (!propriete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-muted-foreground">Cet espace propriété est introuvable.</p>
        <Link to="/marches-du-vivant/mon-espace" className="text-primary underline text-sm">
          Retour à Mon Espace
        </Link>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-muted-foreground">
          Vous n'êtes pas rattaché·e à cette propriété.
        </p>
        <Link to="/marches-du-vivant/mon-espace" className="text-primary underline text-sm">
          Retour à Mon Espace
        </Link>
      </div>
    );
  }

  const myRole = apps?.proprietesAccessibles.find((p) => p.slug === slug)?.role;

  return (
    <ProprieteVivantScopeProvider proprieteId={propriete.id}>
      <Helmet>
        <title>{propriete.nom} — Espace Propriété | Marches du Vivant</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <CanopyHero
          proprieteId={propriete.id}
          nom={propriete.nom}
          ville={propriete.ville}
          description={propriete.description}
          role={myRole}
          heroUrl={propriete.photo_hero_url}
          userId={user?.id}
          slug={slug!}
        />

        <main id="diagnostic" className="max-w-4xl mx-auto px-4 py-10 space-y-6 scroll-mt-0">
          <PropTabs
            proprieteId={propriete.id}
            proprieteNom={propriete.nom}
            proprieteVille={propriete.ville}
            proprieteAdresse={propriete.adresse}
            proprieteCodePostal={propriete.code_postal}
            proprieteCenter={
              propriete.latitude != null && propriete.longitude != null
                ? [Number(propriete.latitude), Number(propriete.longitude)]
                : null
            }
          />
        </main>
      </div>
    </ProprieteVivantScopeProvider>
  );

};

/** Id du conteneur sticky de la barre d'onglets. */
const TABS_BAR_ID = 'diagnostic-tabs-bar';

/** Position de défilement plaçant la barre d'onglets exactement en haut de l'écran. */
const getDiagnosticTarget = () => {
  const bar = document.getElementById(TABS_BAR_ID);
  if (bar) {
    // La barre est sticky top-0 : sa position "naturelle" se déduit de son parent.
    const anchor = bar.parentElement ?? bar;
    const top = anchor.getBoundingClientRect().top + window.scrollY;
    return Math.max(top, 0);
  }
  const el = document.getElementById('diagnostic');
  if (!el) return null;
  const top = el.getBoundingClientRect().top + window.scrollY;
  return Math.max(top, 0);
};


/** Repositionne la vue sur l'ancre #diagnostic (barre d'onglets sous le header). */
const scrollToDiagnostic = () => {
  const top = getDiagnosticTarget();
  if (top === null) return;
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
};

/**
 * Rejoue le repositionnement pendant une courte fenêtre : le contenu d'un onglet
 * peut grandir après coup (données async, cartes, photos). S'annule dès que
 * l'utilisateur interagit avec la page.
 */
const scrollToDiagnosticPersistent = () => {
  if (typeof window === 'undefined') return () => {};
  let cancelled = false;
  const timers: number[] = [];
  let ro: ResizeObserver | null = null;

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    timers.forEach((t) => window.clearTimeout(t));
    ro?.disconnect();
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('keydown', cancel);
  };

  const attempt = () => {
    if (cancelled) return;
    const target = getDiagnosticTarget();
    if (target === null) return;
    if (Math.abs(window.scrollY - target) > 4) scrollToDiagnostic();
  };

  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('keydown', cancel);

  requestAnimationFrame(() => {
    attempt();
    requestAnimationFrame(attempt);
  });
  [60, 150, 300, 600].forEach((d) => timers.push(window.setTimeout(attempt, d)));

  const el = document.getElementById('diagnostic');
  if (el && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => attempt());
    ro.observe(el);
  }
  timers.push(window.setTimeout(cancel, 700));

  return cancel;
};


/* ============================================================
 * HERO CANOPÉE — inspiré de /jardin/:slug
 * ============================================================ */

const CanopyHero: React.FC<{
  proprieteId: string;
  nom: string;
  ville?: string | null;
  description?: string | null;
  role?: string;
  heroUrl?: string | null;
  userId?: string;
  slug: string;
}> = ({ proprieteId, nom, ville, description, role, heroUrl, userId, slug }) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroDim = useTransform(scrollYProgress, [0.2, 0.9], [0, 0.85]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.55], [0, -40]);

  const { data: heroPhotos } = useProprieteHeroPhotos(proprieteId, heroUrl);
  const photos = (heroPhotos ?? []).map((p) => ({ id: p.id, url: p.url }));


  return (
    <section
      ref={ref}
      className="relative h-[85vh] min-h-[560px] w-full overflow-hidden bg-black"
    >
      {/* Fond animé */}
      <motion.div style={{ scale: reduce ? 1 : heroScale }} className="absolute inset-0">
        <KenBurnsCarousel photos={photos} fallback={heroUrl ?? undefined} intervalMs={7000} />
      </motion.div>

      {/* Voile de lecture + fondu vers le contenu */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-background pointer-events-none" />
      <motion.div
        style={{ opacity: heroDim }}
        className="absolute inset-0 bg-black pointer-events-none"
      />

      {/* Header verre sombre */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 backdrop-blur-md bg-black/25 border-b border-white/10">
          <Link
            to="/marches-du-vivant/mon-espace"
            className="text-[#f4ecd4]/80 hover:text-[#f4ecd4]"
            aria-label="Retour"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#c9a24a]/50 to-emerald-500/40 flex items-center justify-center flex-shrink-0 ring-1 ring-[#c9a24a]/30">
            <TreePine className="w-4 h-4 text-[#f4ecd4]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#f4ecd4] truncate drop-shadow">{nom}</div>
            {ville && (
              <div className="text-[11px] text-[#f4ecd4]/70 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {ville}
              </div>
            )}
          </div>
          <AppSwitcher userId={userId} currentContext={slug} />

        </div>
      </div>

      {/* Contenu du hero */}
      <motion.div
        style={{ opacity: titleOpacity, y: titleY }}
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6"
      >
        <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-[#c9a24a] mb-4 flex items-center gap-2">
          <Leaf className="w-3 h-3" /> Espace Propriétaire · Marches du Vivant
        </div>

        <h1 className="font-serif italic text-4xl md:text-6xl lg:text-7xl leading-[1.05] text-[#f4ecd4] drop-shadow-[0_4px_20px_rgba(0,0,0,0.65)] max-w-4xl">
          <RevealText text={nom} />
        </h1>

        {ville && (
          <p className="mt-4 text-sm md:text-base text-[#f4ecd4]/80 tracking-wide">
            <MapPin className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
            {ville}
          </p>
        )}

        {description && (
          <p className="mt-4 text-[13px] md:text-sm text-[#f4ecd4]/70 leading-relaxed max-w-xl">
            {description}
          </p>
        )}

        {role && (
          <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f4ecd4] backdrop-blur-md bg-white/10 border border-[#c9a24a]/40 rounded-full px-3 py-1.5">
            <Leaf className="w-3 h-3 text-[#c9a24a]" /> Votre rôle · {role}
          </div>
        )}

        <div className="mt-16 md:mt-24">
          <OrganicButton
            variant="gold"
            pulse
            icon={<Search className="w-4 h-4" />}
            onClick={() => scrollToDiagnosticPersistent()}
          >
            Explorer votre diagnostic vivant
          </OrganicButton>
        </div>

      </motion.div>
    </section>
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

const PropTabs: React.FC<{
  proprieteId: string;
  proprieteNom: string;
  proprieteVille?: string | null;
  proprieteAdresse?: string | null;
  proprieteCodePostal?: string | null;
  proprieteCenter?: [number, number] | null;
}> = ({ proprieteId, proprieteNom, proprieteVille, proprieteAdresse, proprieteCodePostal, proprieteCenter }) => {
  const { data: bio } = usePropertyBiodiversity(proprieteId);
  const [tab, setTab] = React.useState<string>('portrait');

  const handleTabChange = React.useCallback((value: string) => {
    setTab(value);
    scrollToDiagnosticPersistent();
  }, []);

  React.useEffect(() => {
    const onGoto = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string') handleTabChange(detail);
    };
    window.addEventListener('propriete:goto-tab', onGoto);
    return () => window.removeEventListener('propriete:goto-tab', onGoto);
  }, [handleTabChange]);
  return (
    <div className="space-y-5">
      <NudgeMarcheBanner
        proprieteNom={proprieteNom}
        monthsSinceLastEvent={bio?.monthsSinceLastEvent ?? null}
      />
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <div id={TABS_BAR_ID} className="sticky top-0 z-[60]">
          <div
            className="w-screen ml-[50%] -translate-x-1/2 bg-background border-b border-border shadow-md"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
          <TabsList className="mx-auto max-w-5xl w-full flex overflow-x-auto justify-start md:justify-center bg-transparent rounded-none h-auto py-1.5">
            <TabsTrigger value="portrait">Portrait</TabsTrigger>
            <span aria-hidden className="mx-2 self-center h-4 w-px shrink-0 rounded-full bg-gradient-to-b from-transparent via-primary/35 to-transparent" />
            <TabsTrigger value="observe">J'observe</TabsTrigger>
            <TabsTrigger value="analyze">J'analyse</TabsTrigger>
            <TabsTrigger value="identify">J'identifie</TabsTrigger>
            <TabsTrigger value="synthesize">Je synthétise</TabsTrigger>
            <span aria-hidden className="mx-2 self-center h-4 w-px shrink-0 rounded-full bg-gradient-to-b from-transparent via-primary/35 to-transparent" />
            <TabsTrigger value="palette">Palette végétale</TabsTrigger>
          </TabsList>
          </div>
        </div>



        <TabsContent value="portrait" className="pt-5 min-h-[calc(100vh-8rem)]">
          <TabPortrait
            proprieteId={proprieteId}
            proprieteNom={proprieteNom}
            proprieteVille={proprieteVille}
            proprieteAdresse={proprieteAdresse}
            proprieteCodePostal={proprieteCodePostal}
            proprieteCenter={proprieteCenter}
          />
        </TabsContent>
        <TabsContent value="observe" className="pt-5 min-h-[calc(100vh-8rem)]">
          <TabObserve
            bio={bio}
            proprieteId={proprieteId}
            propertyName={proprieteNom}
            proprieteVille={proprieteVille}
            proprieteAdresse={proprieteAdresse}
            proprieteCodePostal={proprieteCodePostal}
            proprieteCenter={proprieteCenter}
          />
        </TabsContent>
        <TabsContent value="analyze" className="pt-5 min-h-[calc(100vh-8rem)]">
          <TabAnalyze
            bio={bio}
            proprieteId={proprieteId}
            proprieteCenter={proprieteCenter}
            propertyName={proprieteNom}
            proprieteVille={proprieteVille}
            proprieteAdresse={proprieteAdresse}
            proprieteCodePostal={proprieteCodePostal}
          />

        </TabsContent>
        <TabsContent value="identify" className="pt-5 min-h-[calc(100vh-8rem)]">
          <TabIdentify
            proprieteId={proprieteId}
            proprieteNom={proprieteNom}
            bio={bio}
            proprieteCenter={proprieteCenter}
            proprieteVille={proprieteVille}
            proprieteAdresse={proprieteAdresse}
            proprieteCodePostal={proprieteCodePostal}
          />
        </TabsContent>
        <TabsContent value="synthesize" className="pt-5 min-h-[calc(100vh-8rem)]">
          <TabSynthesize
            proprieteNom={proprieteNom}
            proprieteVille={proprieteVille}
            proprieteId={proprieteId}
            proprieteAdresse={proprieteAdresse}
            proprieteCodePostal={proprieteCodePostal}
            bio={bio}
          />

        </TabsContent>
        <TabsContent value="palette" className="pt-5 min-h-[calc(100vh-8rem)]">
          <TabPalette
            proprieteId={proprieteId}
            proprieteNom={proprieteNom}
            proprieteVille={proprieteVille}
            proprieteAdresse={proprieteAdresse}
            proprieteCodePostal={proprieteCodePostal}
            proprieteCenter={proprieteCenter}
            bio={bio}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProprieteEspace;
