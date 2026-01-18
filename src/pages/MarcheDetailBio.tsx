import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { AudioProvider } from '../contexts/AudioContext';
import { FloatingAudioPlayer } from '../components/audio/FloatingAudioPlayer';

import SEOHead from '../components/SEOHead';
import BioacousticHeroSection from '../components/BioacousticHeroSection';
import SimplifiedMultiSensoryNavigation from '../components/SimplifiedMultiSensoryNavigation';
import ImmersiveVisualSection from '../components/ImmersiveVisualSection';
import AudioExperienceSection from '../components/AudioExperienceSection';
import TextualExplorationSection from '@/components/textual/TextualExplorationSection';
import OpenDataSection from '../components/OpenDataSection';
import HaikuSection from '../components/HaikuSection';
import { Button } from '../components/ui/button';
import Footer from '../components/Footer';
import DebugMarcheData from '../components/DebugMarcheData';

import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { useSupabaseMarches } from '../hooks/useSupabaseMarches';
import { useExplorationMarchesList } from '../hooks/useExplorationMarchesList';
import { findMarcheBySlug, createSlug } from '../utils/slugGenerator';
import { REGIONAL_THEMES, RegionalTheme } from '../utils/regionalThemes';
import { queryClient } from '../lib/queryClient';

const MarcheDetailBio = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'opendata' | 'datacollect' | 'creative'>('opendata');
  const [activeSubSection, setActiveSubSection] = useState<string>('biodiv');
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);

  // Récupérer toutes les marches pour trouver la marche courante par slug
  const {
    data: marchesData = [],
    isLoading,
    error
  } = useSupabaseMarches();

  // Récupérer les marches de l'exploration Dordogne (triées par ordre narratif)
  const { data: explorationMarches = [] } = useExplorationMarchesList();

  const marche = slug ? findMarcheBySlug(marchesData, slug) : null;

  // Navigation basée sur l'ordre de l'exploration Dordogne (pas la date)
  const { previousMarche, nextMarche } = useMemo(() => {
    if (!marche || !explorationMarches.length) {
      return { previousMarche: null, nextMarche: null };
    }

    // Trouver l'index de la marche actuelle dans l'exploration
    const currentIndex = explorationMarches.findIndex(m => m.id === marche.id);
    
    // Si la marche n'est pas dans l'exploration Dordogne, pas de navigation
    if (currentIndex === -1) {
      return { previousMarche: null, nextMarche: null };
    }

    // Navigation basée sur l'ordre narratif de l'exploration
    const prev = currentIndex > 0 
      ? explorationMarches[currentIndex - 1] 
      : null;
      
    const next = currentIndex < explorationMarches.length - 1 
      ? explorationMarches[currentIndex + 1] 
      : null;

    return { previousMarche: prev, nextMarche: next };
  }, [marche, explorationMarches]);

  useEffect(() => {
    if (marche?.region) {
      const regionKey = marche.region.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const regionTheme = REGIONAL_THEMES[regionKey];
      if (regionTheme) {
        setTheme(regionTheme);
      }
    }
  }, [marche]);

  useEffect(() => {
    if (theme) {
      document.documentElement.style.setProperty('--theme-primary', theme.colors.primary);
      document.documentElement.style.setProperty('--theme-secondary', theme.colors.secondary);
      document.documentElement.style.setProperty('--theme-accent', theme.colors.accent);
      document.documentElement.style.setProperty('--theme-background', theme.colors.background);
    }
  }, [theme]);

  const handleBack = () => {
    navigate('/bioacoustique-poetique');
  };

  const handleNavigateToMarche = (targetMarche: MarcheTechnoSensible) => {
    const targetSlug = createSlug(targetMarche.nomMarche || targetMarche.ville, targetMarche.ville);
    navigate(`/bioacoustique/${targetSlug}`);
  };

  const handleSectionChange = (section: 'opendata' | 'datacollect' | 'creative', subSection?: string) => {
    console.log(`🔧 DEBUG: handleSectionChange appelée avec section: ${section}, subSection: ${subSection}`);
    setActiveSection(section);
    
    if (subSection) {
      setActiveSubSection(subSection);
    } else {
      // Définir le sous-menu par défaut selon la section
      switch (section) {
        case 'opendata':
          setActiveSubSection('biodiv');
          break;
        case 'datacollect':
          setActiveSubSection('visual');
          break;
        case 'creative':
          setActiveSubSection('poeme');
          break;
      }
    }
  };

  const handleForceRefresh = () => {
    // Force refresh React Query cache for this specific marche
    queryClient.invalidateQueries({ 
      queryKey: ['supabase-marches'] 
    });
    toast.success('Cache vidé - Actualisation en cours...');
  };

  const renderActiveSection = () => {
    if (!marche) return null;

    if (activeSection === 'opendata') {
      return <OpenDataSection marche={marche} theme={theme} activeSubSection={activeSubSection} />;
    }

    if (activeSection === 'datacollect') {
      if (activeSubSection === 'visual') {
        return <ImmersiveVisualSection marche={marche} theme={theme} />;
      } else if (activeSubSection === 'audio') {
        return <AudioExperienceSection marche={marche} theme={theme} />;
      }
    }

    if (activeSection === 'creative') {
      if (activeSubSection === 'poeme') {
        return <TextualExplorationSection marche={marche} theme={theme} />;
      } else if (activeSubSection === 'haiku') {
        return <HaikuSection marche={marche} theme={theme} />;
      }
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'expérience bioacoustique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Une erreur est survenue lors du chargement de l'expérience.</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  if (!marche) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Expérience non trouvée</h2>
          <p className="text-gray-600 mb-4">L'expérience bioacoustique que vous recherchez n'existe pas.</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const seoTitle = `${marche.nomMarche || marche.ville} - Bioacoustique Poétique`;
  const seoDescription = marche.descriptifCourt || `Découvrez l'expérience bioacoustique poétique de ${marche.ville}, une exploration sonore et créative unique.`;

  return (
    <HelmetProvider>
      <AudioProvider>
        <div className="min-h-screen bg-background">
        <SEOHead
          title={seoTitle}
          description={seoDescription}
          canonicalUrl={`https://la-frequence-du-vivant.lovable.app/bioacoustique/${slug}`}
          ogImage={marche.photos?.[0] || undefined}
        />

        <BioacousticHeroSection
          marche={marche}
          theme={theme}
          onBack={handleBack}
          previousMarche={previousMarche}
          nextMarche={nextMarche}
          onNavigateToMarche={handleNavigateToMarche}
        />


        <div className="max-w-6xl mx-auto px-6">
          <SimplifiedMultiSensoryNavigation
            activeSection={activeSection}
            activeSubSection={activeSubSection}
            onSectionChange={handleSectionChange}
            theme={theme}
          />
        </div>


        <div className="max-w-6xl mx-auto px-6 py-8 relative">
          <motion.div
            key={`${activeSection}-${activeSubSection}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {renderActiveSection()}
          </motion.div>
        </div>

        <FloatingAudioPlayer />
        <Footer />
        </div>
      </AudioProvider>
    </HelmetProvider>
  );
};

export default MarcheDetailBio;
