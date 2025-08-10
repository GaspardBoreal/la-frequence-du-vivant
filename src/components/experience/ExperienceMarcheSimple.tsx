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

  const firstPhoto = legacyMarche.photos?.[0];

  return (
    <div className="relative h-[500px] bg-background rounded-lg overflow-hidden">
      {/* Hero Section - Compact version of MarcheHeroSection */}
      <div className="relative h-60 overflow-hidden">
        {/* Background Image */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {firstPhoto ? (
            <div className="absolute inset-0">
              <img 
                src={firstPhoto} 
                alt={legacyMarche.nomMarche || legacyMarche.ville} 
                className="w-full h-full object-cover" 
                crossOrigin="anonymous" 
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

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col h-full justify-center items-center px-4">
          <motion.div 
            className="text-center space-y-3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="bg-black/20 backdrop-blur-md rounded-xl px-4 py-3">
              <h1 className="text-2xl md:text-3xl font-crimson font-bold text-white leading-tight">
                {legacyMarche.nomMarche || legacyMarche.ville}
              </h1>
            </div>
            
            {legacyMarche.descriptifCourt && (
              <div className="bg-black/15 backdrop-blur-sm rounded-lg px-3 py-2 max-w-md mx-auto">
                <div 
                  className="text-sm text-white/95 leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: legacyMarche.descriptifCourt }}
                />
              </div>
            )}
            
            <div className="bg-black/10 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
              <div className="flex flex-wrap justify-center gap-3 text-white/90 text-sm">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{legacyMarche.ville}, {legacyMarche.departement}</span>
                </div>
                {legacyMarche.date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {(() => {
                        if (legacyMarche.date.includes('-')) {
                          const [year, month, day] = legacyMarche.date.split('-');
                          return `${day.padStart(2, '0')} - ${month.padStart(2, '0')} - ${year}`;
                        } else if (legacyMarche.date.includes('/')) {
                          return legacyMarche.date.split('/').join(' - ');
                        }
                        return legacyMarche.date;
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
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
          className="h-48 overflow-y-auto"
        >
          {activeSection === 'poeme' && (
            <PoeticSection marche={legacyMarche} theme={theme} />
          )}
          {activeSection === 'visual' && (
            <ImmersiveVisualSection marche={legacyMarche} theme={theme} />
          )}
          {activeSection === 'audio' && (
            <AudioExperienceSection marche={legacyMarche} theme={theme} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ExperienceMarcheSimple;
