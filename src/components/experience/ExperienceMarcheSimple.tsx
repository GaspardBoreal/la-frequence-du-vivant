import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ExplorationMarche } from '@/hooks/useExplorations';
import { REGIONAL_THEMES, RegionalTheme } from '@/utils/regionalThemes';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import MultiSensoryNavigation from '@/components/MultiSensoryNavigation';
import PoeticSection from '@/components/PoeticSection';

interface Props {
  marche: ExplorationMarche;
}

const ExperienceMarcheSimple: React.FC<Props> = ({ marche }) => {
  const [activeSection, setActiveSection] = useState<'visual' | 'audio' | 'poeme'>('poeme');
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);

  // Transform marche data to legacy format for compatibility
  const legacyMarche: MarcheTechnoSensible | null = marche.marche ? {
    id: marche.marche.id,
    ville: marche.marche.ville,
    departement: '',
    region: 'nouvelle-aquitaine',
    theme: '',
    nomMarche: marche.marche.nom_marche || marche.marche.ville,
    descriptifCourt: marche.marche.descriptif_court || '',
    descriptifLong: '',
    poeme: '',
    date: marche.marche.date || '',
    latitude: marche.marche.latitude || 0,
    longitude: marche.marche.longitude || 0,
    photos: [],
    videos: [],
    audioFiles: [],
    audioData: [],
    supabaseTags: []
  } : null;

  useEffect(() => {
    if (legacyMarche?.region) {
      const regionKey = legacyMarche.region.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const regionTheme = REGIONAL_THEMES[regionKey];
      if (regionTheme) {
        setTheme(regionTheme);
      }
    }
  }, [legacyMarche]);

  useEffect(() => {
    if (theme) {
      document.documentElement.style.setProperty('--theme-primary', theme.colors.primary);
      document.documentElement.style.setProperty('--theme-secondary', theme.colors.secondary);
      document.documentElement.style.setProperty('--theme-accent', theme.colors.accent);
      document.documentElement.style.setProperty('--theme-background', theme.colors.background);
    }
  }, [theme]);

  if (!legacyMarche) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Données de marche non disponibles</p>
      </div>
    );
  }

  const handleSectionChange = (section: 'visual' | 'audio' | 'poeme') => {
    setActiveSection(section);
  };

  return (
    <div className="min-h-[600px] bg-background rounded-lg overflow-hidden">
      {/* Mini Hero Section - Simplified version */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0">
          {legacyMarche.photos?.[0] ? (
            <img 
              src={legacyMarche.photos[0]} 
              alt={legacyMarche.nomMarche || legacyMarche.ville} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div 
              className="w-full h-full bg-gradient-to-br"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}40)` 
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <h2 className="text-2xl md:text-3xl font-crimson font-bold text-white mb-2">
            {legacyMarche.nomMarche || legacyMarche.ville}
          </h2>
          <p className="text-white/80 text-sm">
            {legacyMarche.ville}, {legacyMarche.departement}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-2">
        <MultiSensoryNavigation
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          theme={theme}
        />
      </div>

      {/* Content Section */}
      <div className="px-4 pb-4">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-64 overflow-y-auto"
        >
          {activeSection === 'poeme' && (
            <PoeticSection marche={legacyMarche} theme={theme} />
          )}
          {activeSection === 'visual' && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Section visuelle - Prévisualisation</p>
            </div>
          )}
          {activeSection === 'audio' && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Section audio - Prévisualisation</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ExperienceMarcheSimple;
