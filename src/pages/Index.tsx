import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { RegionalTheme, REGIONAL_THEMES } from '../utils/regionalThemes';
import { useNavigate } from 'react-router-dom';
import BioacousticHero from '@/components/landing/BioacousticHero';

const Index = () => {
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-primary', theme.colors.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.colors.secondary);
    document.documentElement.style.setProperty('--theme-accent', theme.colors.accent);
    document.documentElement.style.setProperty('--theme-background', theme.colors.background);
  }, [theme]);

  const handleExploreClick = () => {
    navigate('/marche/entre-deux-frequences-bonzac-bonzac');
  };
  const handlePodcastClick = () => navigate('/explorations');

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <SEOHead />

        {/* Hero */}
        <BioacousticHero onExplore={handleExploreClick} onPodcast={handlePodcastClick} />

        {/* Footer */}
        <Footer />

        {/* Ambient overlay */}
        <div className="fixed inset-0 bg-primary/5 pointer-events-none z-0" />
      </div>
    </HelmetProvider>
  );
};

export default Index;
