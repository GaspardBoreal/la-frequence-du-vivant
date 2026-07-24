import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowLeft, TreePine, MapPin, Leaf, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';
import { useUserAppsAccess } from '@/hooks/useUserAppsAccess';
import AppSwitcher from '@/components/community/AppSwitcher';
import ThemeToggle from '@/components/community/ThemeToggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { useProprieteHeroPhotos } from '@/hooks/propriete/useProprieteHeroPhotos';
import { NudgeMarcheBanner } from '@/components/propriete/NudgeMarcheBanner';
import { TabObserve } from '@/components/propriete/tabs/TabObserve';
import { TabAnalyze } from '@/components/propriete/tabs/TabAnalyze';
import { TabIdentify } from '@/components/propriete/tabs/TabIdentify';
import { TabSynthesize } from '@/components/propriete/tabs/TabSynthesize';
import { TabPalette } from '@/components/propriete/tabs/TabPalette';
import KenBurnsCarousel from '@/components/immersive-garden/KenBurnsCarousel';
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
    <>
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

        <main id="diagnostic" className="max-w-4xl mx-auto px-4 py-10 space-y-6">
          <PropTabs
            proprieteId={propriete.id}
            proprieteNom={propriete.nom}
            proprieteVille={propriete.ville}
          />
        </main>
      </div>
    </>
  );
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

  const scrollToDiagnostic = () => {
    document.getElementById('diagnostic')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          <ThemeToggle />
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

        <div className="mt-10">
          <OrganicButton
            variant="gold"
            pulse
            icon={<Search className="w-4 h-4" />}
            onClick={scrollToDiagnostic}
          >
            Explorer votre diagnostic vivant
          </OrganicButton>
        </div>

        <motion.button
          type="button"
          onClick={scrollToDiagnostic}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#f4ecd4]/70 text-[10px] tracking-[0.3em] uppercase hover:text-[#f4ecd4]"
          animate={reduce ? undefined : { y: [0, 6, 0], opacity: [0.5, 0.95, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          ↓ Descendez dans votre jardin
        </motion.button>
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
}> = ({ proprieteId, proprieteNom, proprieteVille }) => {
  const { data: bio } = usePropertyBiodiversity(proprieteId);
  return (
    <div className="space-y-5">
      <NudgeMarcheBanner
        proprieteNom={proprieteNom}
        monthsSinceLastEvent={bio?.monthsSinceLastEvent ?? null}
      />
      <Tabs defaultValue="observe" className="w-full">
        <TabsList className="w-full flex overflow-x-auto justify-start md:justify-center">
          <TabsTrigger value="observe">J'observe</TabsTrigger>
          <TabsTrigger value="analyze">J'analyse</TabsTrigger>
          <TabsTrigger value="identify">J'identifie</TabsTrigger>
          <TabsTrigger value="synthesize">Je synthétise</TabsTrigger>
          <TabsTrigger value="palette">Palette végétale</TabsTrigger>
        </TabsList>
        <TabsContent value="observe" className="pt-5">
          <TabObserve bio={bio} />
        </TabsContent>
        <TabsContent value="analyze" className="pt-5">
          <TabAnalyze bio={bio} />
        </TabsContent>
        <TabsContent value="identify" className="pt-5">
          <TabIdentify proprieteId={proprieteId} />
        </TabsContent>
        <TabsContent value="synthesize" className="pt-5">
          <TabSynthesize
            proprieteNom={proprieteNom}
            proprieteVille={proprieteVille}
            proprieteId={proprieteId}
            bio={bio}
          />
        </TabsContent>
        <TabsContent value="palette" className="pt-5">
          <TabPalette bio={bio} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProprieteEspace;
