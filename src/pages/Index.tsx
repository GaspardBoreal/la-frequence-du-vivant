import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import DecorativeElements from '../components/DecorativeElements';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { RegionalTheme, REGIONAL_THEMES } from '../utils/regionalThemes';
import BioacousticPortal from '../components/home/BioacousticPortal';
import TerritoryPortal from '../components/home/TerritoryPortal';
import PoetryPortal from '../components/home/PoetryPortal';

const Index = () => {
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-primary', theme.colors.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.colors.secondary);
    document.documentElement.style.setProperty('--theme-accent', theme.colors.accent);
    document.documentElement.style.setProperty('--theme-background', theme.colors.background);
  }, [theme]);

  return (
    <HelmetProvider>
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
                  <span style={{ color: '#4ade80' }}>du Vivant</span>
                </h1>
                
                {/* Sous-titre */}
                <p className="gaspard-subtitle max-w-2xl mx-auto text-center text-2xl">
                  Marche techno-sensible entre vivant, humain et machine
                </p>
                
                {/* Meta informations */}
                <div className="flex items-center justify-center space-x-4 pt-8">
                  <span className="text-white text-base">2025 - 2026 • Gaspard Boréal</span>
                </div>
              </div>
            </div>
          </header>

          {/* Les Trois Portails du Vivant */}
          <div className="max-w-6xl mx-auto px-6 py-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <BioacousticPortal />
              <TerritoryPortal />
              <PoetryPortal />
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
        
        {/* Overlay d'ambiance vert émeraude */}
        <div className="fixed inset-0 bg-primary/5 pointer-events-none z-0"></div>
      </div>
    </HelmetProvider>
  );
};

export default Index;
