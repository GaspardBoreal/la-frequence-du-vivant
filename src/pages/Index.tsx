import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import DecorativeElements from '../components/DecorativeElements';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { RegionalTheme, REGIONAL_THEMES } from '../utils/regionalThemes';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

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

  const handleCardClick = (viewMode: string) => {
    console.log('🔧 DEBUG handleCardClick appelée avec viewMode:', viewMode);
    const targetUrl = `/marche/entre-deux-frequences-bonzac-bonzac?view=${viewMode}`;
    console.log('🔧 DEBUG Navigation vers:', targetUrl);
    navigate(targetUrl);
  };

  return <HelmetProvider>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <SEOHead />
        
        {/* Fond avec gradient vert émeraude profond */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/50 to-secondary/30"></div>
        
        {/* Éléments décoratifs */}
        <DecorativeElements className="text-accent/20" />
        
        <div className="relative z-10">
          {/* Header avec typographie exacte */}
          <header className="bg-card/40 backdrop-blur-lg shadow-2xl border-b border-border/20">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <div className="text-center space-y-6 animate-fade-in">
                {/* Catégorie avec design exact */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-950/30 border border-green-500/20 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-mono text-xs uppercase tracking-wide text-green-300">
                    Bioacoustique & Poésie
                  </span>
                </div>
                
                {/* Titre principal - structure exacte avec couleurs spécifiques */}
                <h1 className="font-crimson font-normal leading-tight text-7xl md:text-8xl lg:text-9xl">
                  <span className="text-white">La Fréquence</span><br />
                  <span style={{
                  color: '#4ade80'
                }}>du Vivant</span>
                </h1>
                
                {/* Sous-titre */}
                <p className="gaspard-subtitle max-w-2xl mx-auto text-center text-2xl">
                  Marche techno-sensible entre vivant, humain et machine
                </p>
                
                {/* Meta informations */}
                <div className="flex items-center justify-center space-x-4 pt-8">
                  <span className="text-white text-base">2025</span>
                  <span className="text-white">•</span>
                  <span className="text-white text-base">Gaspard Boréal</span>
                </div>

                {/* Button pour accéder à la carte */}
                <div className="pt-8">
                  <Button onClick={handleExploreClick} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 text-lg font-medium rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">Explorons les Fréquences du Vivant ...</Button>
                </div>
              </div>
            </div>
          </header>

          {/* Content Section */}
          <div className="max-w-6xl mx-auto px-6 py-24">
            <div className="text-center space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <button 
                  onClick={() => handleCardClick('ecoute-contemplative')}
                  className="gaspard-card rounded-xl p-8 space-y-4 hover:scale-105 transition-all duration-300 hover:shadow-2xl cursor-pointer border-0 bg-transparent w-full"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white text-xl">🎵</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Bioacoustique</h3>
                  <p className="text-gray-300">
                    Exploration des paysages sonores et des fréquences du vivant
                  </p>
                </button>

                <button 
                  onClick={() => handleCardClick('fleuve-temporel')}
                  className="gaspard-card rounded-xl p-8 space-y-4 hover:scale-105 transition-all duration-300 hover:shadow-2xl cursor-pointer border-0 bg-transparent w-full"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white text-xl">🌱</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Territoires</h3>
                  <p className="text-gray-300">
                    Cartographie interactive des marches techno-sensibles
                  </p>
                </button>

                <button 
                  onClick={() => handleCardClick('mosaique-vivante')}
                  className="gaspard-card rounded-xl p-8 space-y-4 hover:scale-105 transition-all duration-300 hover:shadow-2xl cursor-pointer border-0 bg-transparent w-full"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white text-xl">📖</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Poésie</h3>
                  <p className="text-gray-300">
                    Création poétique à l'intersection de l'art et de la science
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
        
        {/* Overlay d'ambiance vert émeraude */}
        <div className="fixed inset-0 bg-primary/5 pointer-events-none z-0"></div>
      </div>
    </HelmetProvider>;
};

export default Index;
