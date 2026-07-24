import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TreePine, MapPin, Leaf, Users, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';
import { useUserAppsAccess } from '@/hooks/useUserAppsAccess';
import AppSwitcher from '@/components/community/AppSwitcher';
import ThemeToggle from '@/components/community/ThemeToggle';

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

          {/* Quick actions grid — placeholders for next phases */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ActionCard icon={<Leaf className="w-5 h-5" />} title="Diagnostic Vivant" subtitle="Méthode D.S. multi-device (à venir)" />
            <ActionCard icon={<Users className="w-5 h-5" />} title="Équipe & rôles" subtitle={`${apps?.proprietesAccessibles.length ?? 0} espace(s) accessible(s)`} />
            <ActionCard icon={<Settings className="w-5 h-5" />} title="Paramètres" subtitle="Bientôt disponible" />
          </div>
        </main>
      </div>
    </>
  );
};

const ActionCard: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({
  icon,
  title,
  subtitle,
}) => (
  <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 hover:bg-card transition-colors">
    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-3">
      {icon}
    </div>
    <div className="text-sm font-semibold text-foreground">{title}</div>
    <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>
  </div>
);

export default ProprieteEspace;
