import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';
import type { ExplorationMarche } from '@/hooks/useExplorations';
import { REGIONAL_THEMES, RegionalTheme } from '@/utils/regionalThemes';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import MultiSensoryNavigation from '@/components/MultiSensoryNavigation';
import PoeticSection from '@/components/PoeticSection';
import ImmersiveVisualSection from '@/components/ImmersiveVisualSection';
import AudioExperienceSection from '@/components/AudioExperienceSection';

interface Props {
  marche: ExplorationMarche;
}

const ExperienceMarcheElabore: React.FC<Props> = ({ marche }) => {
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
    <div className="min-h-[700px] bg-background rounded-lg overflow-hidden">
      {/* Enhanced Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {legacyMarche.photos?.[0] ? (
            <div className="absolute inset-0">
              <img 
                src={legacyMarche.photos[0]} 
                alt={legacyMarche.nomMarche || legacyMarche.ville} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
            </div>
          ) : (
            <div 
              className="absolute inset-0 bg-gradient-to-br"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}40)` 
              }}
            />
          )}
        </motion.div>

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="bg-black/20 backdrop-blur-md rounded-xl px-6 py-4">
              <h2 className="text-3xl md:text-4xl font-crimson font-bold text-white leading-tight">
                {legacyMarche.nomMarche || legacyMarche.ville}
              </h2>
            </div>
            
            <div className="bg-black/10 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
              <div className="flex flex-wrap justify-center gap-4 text-white/90 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{legacyMarche.ville}, {legacyMarche.departement}</span>
                </div>
                {legacyMarche.date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{legacyMarche.date}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-4">
        <MultiSensoryNavigation
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          theme={theme}
        />
      </div>

      {/* Content Section */}
      <div className="px-6 pb-6">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-80 overflow-y-auto"
        >
          {activeSection === 'visual' && (
            <ImmersiveVisualSection marche={legacyMarche} theme={theme} />
          )}
          {activeSection === 'audio' && (
            <AudioExperienceSection marche={legacyMarche} theme={theme} />
          )}
          {activeSection === 'poeme' && (
            <PoeticSection marche={legacyMarche} theme={theme} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ExperienceMarcheElabore;
