import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TreePine, MapPin, Leaf } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';
import { useUserAppsAccess } from '@/hooks/useUserAppsAccess';
import AppSwitcher from '@/components/community/AppSwitcher';
import ThemeToggle from '@/components/community/ThemeToggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { NudgeMarcheBanner } from '@/components/propriete/NudgeMarcheBanner';
import { TabObserve } from '@/components/propriete/tabs/TabObserve';
import { TabAnalyze } from '@/components/propriete/tabs/TabAnalyze';
import { TabIdentify } from '@/components/propriete/tabs/TabIdentify';
import { TabSynthesize } from '@/components/propriete/tabs/TabSynthesize';
import { TabPalette } from '@/components/propriete/tabs/TabPalette';

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
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2">
            <Link
              to="/marches-du-vivant/mon-espace"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Retour"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-400/40 to-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <TreePine className="w-4 h-4 text-emerald-700 dark:text-emerald-200" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {propriete.nom}
              </div>
              {propriete.ville && (
                <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {propriete.ville}
                </div>
              )}
            </div>
            <AppSwitcher userId={user?.id} currentContext={slug} />
            <ThemeToggle />
          </div>
        </div>

        {/* Hero */}
        {propriete.photo_hero_url && (
          <div className="relative w-full h-52 md:h-72 overflow-hidden">
            <img
              src={propriete.photo_hero_url}
              alt={propriete.nom}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        )}

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wide text-primary bg-primary/10 rounded-full px-2 py-0.5">
              <Leaf className="w-3 h-3" /> Votre rôle : {myRole ?? '—'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{propriete.nom}</h1>
            {propriete.description && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {propriete.description}
              </p>
            )}
          </motion.div>

          {/* D.S. tabs */}
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
