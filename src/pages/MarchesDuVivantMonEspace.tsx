import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useCommunityParticipations, CommunityRoleKey } from '@/hooks/useCommunityProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

import MonEspaceHeader from '@/components/community/MonEspaceHeader';
import MonEspaceTabBar, { TabKey } from '@/components/community/MonEspaceTabBar';
import AccueilTab from '@/components/community/tabs/AccueilTab';
import MarchesTab from '@/components/community/tabs/MarchesTab';
import CarnetTab from '@/components/community/tabs/CarnetTab';
import OutilsTab from '@/components/community/tabs/OutilsTab';
import PlaceholderTab from '@/components/community/tabs/PlaceholderTab';

const MarchesDuVivantMonEspace = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, loading, signOut, createProfile } = useCommunityAuth();
  const { data: participations = [] } = useCommunityParticipations(user?.id);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const initialTab = (searchParams.get('tab') as TabKey) || 'accueil';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const isMobile = useIsMobile();
  const { trackActivity } = useActivityTracker();

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['upcoming-marche-events-mon-espace'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('marche_events')
        .select('id, title, description, date_marche, lieu, exploration_id, explorations(name)')
        .gte('date_marche', today)
        .order('date_marche', { ascending: true })
        .limit(6);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: totalFrequences = 0 } = useQuery({
    queryKey: ['total-frequences', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data } = await supabase
        .from('frequences_log')
        .select('frequences')
        .eq('user_id', user.id);
      return (data || []).reduce((sum, r) => sum + (r.frequences || 0), 0);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/marches-du-vivant/connexion');
    }
  }, [loading, user, navigate]);

  // Track session start
  useEffect(() => {
    if (user && profile) {
      trackActivity('session_start', 'mon-espace', {
        metadata: { role: profile.role },
      });
    }
  }, [user?.id, profile?.id]);

  // Track tab switches
  useEffect(() => {
    if (user && profile) {
      trackActivity('tab_switch', `tab:mon-espace:${activeTab}`);
    }
  }, [activeTab, user?.id]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse flex items-center gap-2">
          <Leaf className="w-5 h-5 animate-spin" />
          Chargement...
        </div>
      </div>
    );
  }

  if (!profile) {
    const handleCreateProfile = async () => {
      setCreatingProfile(true);
      try {
        const emailPrefix = user.email?.split('@')[0] || '';
        const prenom = emailPrefix.split('.')[0] || 'Marcheur';
        const nom = emailPrefix.split('.')[1] || '';
        await createProfile(user.id, prenom.charAt(0).toUpperCase() + prenom.slice(1), nom.charAt(0).toUpperCase() + nom.slice(1));
        toast.success('Profil communautaire créé ! 🌿');
      } catch (e: any) {
        toast.error(e.message || 'Erreur lors de la création du profil');
      } finally {
        setCreatingProfile(false);
      }
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 ring-1 ring-primary/30 mx-auto">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bienvenue parmi les marcheurs du Vivant 🌿</h1>
          <p className="text-muted-foreground text-center">
            Votre profil communautaire n'existe pas encore. Créez-le en un clic pour accéder à votre espace.
          </p>
          <Button
            onClick={handleCreateProfile}
            disabled={creatingProfile}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full"
          >
            {creatingProfile ? 'Création en cours...' : 'Créer mon profil'}
          </Button>
        </motion.div>
      </div>
    );
  }

  const role = (profile.role || 'marcheur_en_devenir') as CommunityRoleKey;
  const registeredEventIds = new Set(participations.map(p => p.marche_event_id));
  const pendingCount = participations.filter(p => !p.validated_at).length;

  const renderTab = () => {
    switch (activeTab) {
      case 'accueil':
        return (
          <AccueilTab
            role={role}
            marchesCount={profile.marches_count}
            formationValidee={profile.formation_validee}
            certificationValidee={profile.certification_validee}
            pendingCount={pendingCount}
            totalFrequences={totalFrequences}
            onNavigate={setActiveTab}
          />
        );
      case 'marches':
        return (
          <MarchesTab
            userId={user.id}
            upcomingEvents={upcomingEvents}
            participations={participations}
            registeredEventIds={registeredEventIds}
          />
        );
      case 'carnet':
        return <CarnetTab userId={user.id} participations={participations} />;
      case 'outils':
        return <OutilsTab role={role} userId={user.id} />;
      case 'territoire':
        return <PlaceholderTab type="territoire" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Mon espace | Les Marches du Vivant</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <MonEspaceHeader
          prenom={profile.prenom}
          nom={profile.nom}
          email={user.email || ''}
          ville={profile.ville}
          role={role}
          totalFrequences={totalFrequences}
          kigoAccueil={profile.kigo_accueil}
          onSignOut={signOut}
        />

        <MonEspaceTabBar role={role} activeTab={activeTab} onTabChange={setActiveTab} />

        <main className={`max-w-2xl mx-auto px-4 py-5 bg-gradient-to-b from-white/[0.02] to-transparent ${isMobile ? 'pb-24' : 'pb-12'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
};

export default MarchesDuVivantMonEspace;
