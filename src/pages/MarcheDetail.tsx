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
import PoeticMarkerCard from '../components/PoeticMarkerCard';
import { Button } from '../components/ui/button';
import PoeticSection from '../components/PoeticSection';
import Footer from '../components/Footer';

import { fetchMarchesTechnoSensibles, MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { findMarcheBySlug, createSlug } from '../utils/slugGenerator';
import { REGIONAL_THEMES, RegionalTheme } from '../utils/regionalThemes';

const MarcheDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'visual' | 'audio'>('visual');
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);

  // Fetch marches data
  const {
    data: marchesData = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['marchesTechnoSensibles'],
    queryFn: fetchMarchesTechnoSensibles,
    staleTime: 5 * 60 * 1000
  });

  // Find the specific marche
  const marche = slug ? findMarcheBySlug(marchesData, slug) : null;

  // Calculate previous and next marches based on date
  const { previousMarche, nextMarche } = useMemo(() => {
    if (!marche || !marchesData.length) {
      return { previousMarche: null, nextMarche: null };
    }

    // Filter marches with valid dates and sort by date
    const marchesWithDates = marchesData
      .filter(m => m.date && m.date.trim())
      .sort((a, b) => {
        // Parse dates (assuming format DD/MM/YYYY or similar)
        const parseDate = (dateStr: string) => {
          const [day, month, year] = dateStr.split('/').map(Number);
          return new Date(year, month - 1, day);
        };
        
        const dateA = parseDate(a.date!);
        const dateB = parseDate(b.date!);
        return dateA.getTime() - dateB.getTime();
      });

    const currentIndex = marchesWithDates.findIndex(m => m.id === marche.id);
    
    if (currentIndex === -1) {
      return { previousMarche: null, nextMarche: null };
    }

    const previousMarche = currentIndex > 0 ? marchesWithDates[currentIndex - 1] : null;
    const nextMarche = currentIndex < marchesWithDates.length - 1 ? marchesWithDates[currentIndex + 1] : null;

    return { previousMarche, nextMarche };
  }, [marche, marchesData]);

  // Set theme based on region
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

  // Set CSS variables for theme
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

  // SEO data
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

        {/* Hero Section */}
        <MarcheHeroSection
          marche={marche}
          theme={theme}
          onBack={handleBack}
        />

        {/* Multi-Sensory Navigation */}
        <div className="max-w-6xl mx-auto px-6">
          <MultiSensoryNavigation
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            theme={theme}
          />
        </div>

        {/* Content Sections with Navigation */}
        <div className="max-w-6xl mx-auto px-6 py-8 relative">
          {/* Navigation Buttons */}
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
              <div className="text-center py-16">
                <h2 className="text-3xl font-bold mb-4">Expérience Audio</h2>
                <p className="text-gray-600">Section audio en cours de développement...</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default MarcheDetail;
