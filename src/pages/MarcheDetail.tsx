
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

import SEOHead from '../components/SEOHead';
import MarcheHeroSection from '../components/MarcheHeroSection';
import MultiSensoryNavigation from '../components/MultiSensoryNavigation';
import ImmersiveVisualSection from '../components/ImmersiveVisualSection';
import AudioExperienceSection from '../components/AudioExperienceSection';
import PoeticMarkerCard from '../components/PoeticMarkerCard';
import { Button } from '../components/ui/button';
import PoeticSection from '../components/PoeticSection';
import Footer from '../components/Footer';

import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { useSupabaseMarches } from '../hooks/useSupabaseMarches';
import { findMarcheBySlug, createSlug } from '../utils/slugGenerator';
import { REGIONAL_THEMES, RegionalTheme } from '../utils/regionalThemes';

const MarcheDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'visual' | 'audio' | 'poeme'>('poeme');
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);

  const {
    data: marchesData = [],
    isLoading,
    error
  } = useSupabaseMarches();

  const marche = slug ? findMarcheBySlug(marchesData, slug) : null;

  const { previousMarche, nextMarche } = useMemo(() => {
    if (!marche || !marchesData.length) {
      return { previousMarche: null, nextMarche: null };
    }

    const parseDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    };

    const marchesWithDates = marchesData.filter(m => m.date && m.date.trim());
    
    if (!marche.date) {
      return { previousMarche: null, nextMarche: null };
    }

    const currentDate = parseDate(marche.date);

    // Précédente : date < currentDate, triée par date décroissante, prendre la première
    const previousMarche = marchesWithDates
      .filter(m => parseDate(m.date!).getTime() < currentDate.getTime())
      .sort((a, b) => parseDate(b.date!).getTime() - parseDate(a.date!).getTime())[0] || null;

    // Suivante : date > currentDate, triée par date croissante, prendre la première  
    const nextMarche = marchesWithDates
      .filter(m => parseDate(m.date!).getTime() > currentDate.getTime())
      .sort((a, b) => parseDate(a.date!).getTime() - parseDate(b.date!).getTime())[0] || null;

    return { previousMarche, nextMarche };
  }, [marche, marchesData]);

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
    navigate('/marches-techno-sensibles');
  };

  const handleNavigateToMarche = (targetMarche: MarcheTechnoSensible) => {
    const targetSlug = createSlug(targetMarche.nomMarche || targetMarche.ville, targetMarche.ville);
    navigate(`/marche/${targetSlug}`);
  };

  const handleSectionChange = (section: 'visual' | 'audio' | 'poeme') => {
    console.log(`🔧 DEBUG: handleSectionChange appelée avec section: ${section}`);
    console.log(`🔧 DEBUG: Section actuelle avant changement: ${activeSection}`);
    console.log(`🔧 DEBUG: Marche actuelle:`, marche?.ville);
    console.log(`🔧 DEBUG: Fichiers audio disponibles:`, marche?.audioFiles?.length || 0);
    
    setActiveSection(section);
    
    console.log(`🔧 DEBUG: Section changée vers: ${section}`);
  };

  useEffect(() => {
    console.log(`🔧 DEBUG: activeSection état mis à jour: ${activeSection}`);
  }, [activeSection]);

  useEffect(() => {
    if (marche) {
      console.log(`🔧 DEBUG: Marche chargée: ${marche.ville}`);
      console.log(`🔧 DEBUG: Fichiers audio:`, marche.audioFiles);
      console.log(`🔧 DEBUG: Nombre de fichiers audio:`, marche.audioFiles?.length || 0);
    }
  }, [marche]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la marche...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Une erreur est survenue lors du chargement de la marche.</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la carte
          </Button>
        </div>
      </div>
    );
  }

  if (!marche) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Marche non trouvée</h2>
          <p className="text-gray-600 mb-4">La marche que vous recherchez n'existe pas ou a été supprimée.</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la carte
          </Button>
        </div>
      </div>
    );
  }

  const seoTitle = `${marche.nomMarche || marche.ville} - La Fréquence du Vivant`;
  const seoDescription = marche.descriptifCourt || `Découvrez la marche techno-sensible de ${marche.ville}, une exploration poétique et artistique unique.`;

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background">
        <SEOHead
          title={seoTitle}
          description={seoDescription}
          canonicalUrl={`https://la-frequence-du-vivant.lovable.app/marche/${slug}`}
          ogImage={marche.photos?.[0] || undefined}
        />

        <MarcheHeroSection
          marche={marche}
          theme={theme}
          onBack={handleBack}
        />

        <div className="max-w-6xl mx-auto px-6">
          <MultiSensoryNavigation
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            theme={theme}
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 py-16 relative">
          {previousMarche && (
            <motion.div
              className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigateToMarche(previousMarche)}
                className="bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-lg border border-gray-200 p-3 rounded-full"
                title={`Marche précédente: ${previousMarche.nomMarche || previousMarche.ville}`}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </Button>
            </motion.div>
          )}

          {nextMarche && (
            <motion.div
              className="fixed right-4 top-1/2 transform -translate-y-1/2 z-10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigateToMarche(nextMarche)}
                className="bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-lg border border-gray-200 p-3 rounded-full"
                title={`Marche suivante: ${nextMarche.nomMarche || nextMarche.ville}`}
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </Button>
            </motion.div>
          )}

          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {activeSection === 'visual' && (
              <ImmersiveVisualSection marche={marche} theme={theme} />
            )}
            {activeSection === 'audio' && (
              <AudioExperienceSection marche={marche} theme={theme} />
            )}
            {activeSection === 'poeme' && (
              <PoeticSection marche={marche} theme={theme} />
            )}
          </motion.div>
        </div>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default MarcheDetail;
