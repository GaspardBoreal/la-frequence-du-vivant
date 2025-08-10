import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';
import type { ExplorationMarcheComplete } from '@/hooks/useExplorations';
import { REGIONAL_THEMES, RegionalTheme } from '@/utils/regionalThemes';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import MultiSensoryNavigation from '@/components/MultiSensoryNavigation';
import PoeticSection from '@/components/PoeticSection';
import ImmersiveVisualSection from '@/components/ImmersiveVisualSection';
import AudioExperienceSection from '@/components/AudioExperienceSection';

interface Props {
  marche: ExplorationMarcheComplete;
}

const ExperienceMarcheElabore: React.FC<Props> = ({ marche }) => {
  const [activeSection, setActiveSection] = useState<'visual' | 'audio' | 'poeme'>('poeme');
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);

  // Transform marche data to legacy format for compatibility  
  const legacyMarche: MarcheTechnoSensible | null = marche.marche ? {
    id: marche.marche.id,
    ville: marche.marche.ville,
    departement: marche.marche.departement || '',
    region: marche.marche.region || 'nouvelle-aquitaine',
    theme: marche.marche.theme_principal || '',
    nomMarche: marche.marche.nom_marche || marche.marche.ville,
    descriptifCourt: marche.marche.descriptif_court || '',
    descriptifLong: marche.marche.descriptif_long || '',
    poeme: marche.marche.etudes?.[0]?.contenu || '',
    date: marche.marche.date || '',
    latitude: marche.marche.latitude || 0,
    longitude: marche.marche.longitude || 0,
    photos: marche.marche.photos?.map(photo => photo.url_supabase) || [],
    videos: marche.marche.videos?.map(video => video.url_supabase) || [],
    audioFiles: marche.marche.audio?.map(audio => audio.url_supabase) || [],
    audioData: marche.marche.audio?.map(audio => ({
      id: audio.id,
      url: audio.url_supabase,
      nom_fichier: audio.titre || 'Audio',
      titre: audio.titre,
      description: audio.description,
      duree_secondes: audio.duree_secondes,
      ordre: audio.ordre
    })) || [],
    supabaseTags: marche.marche.tags?.map(tag => tag.tag) || []
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
    <div className="relative h-[650px] bg-background rounded-lg overflow-hidden">
      {/* Full Hero Section - Enhanced version of MarcheHeroSection */}
      <div className="relative h-80 overflow-hidden">
        {/* Background Image with Parallax Effect */}
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
        <div className="relative z-10 flex flex-col h-full justify-center items-center px-6">
          <motion.div 
            className="text-center space-y-4 max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="bg-black/20 backdrop-blur-md rounded-2xl px-6 py-4">
              <h1 className="text-3xl md:text-5xl font-crimson font-bold text-white leading-tight">
                {legacyMarche.nomMarche || legacyMarche.ville}
              </h1>
            </div>
            
            {legacyMarche.descriptifCourt && (
              <div className="bg-black/15 backdrop-blur-sm rounded-xl px-4 py-3 max-w-2xl mx-auto">
                <div 
                  className="text-lg text-white/95 leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: legacyMarche.descriptifCourt }}
                />
              </div>
            )}
            
            <div className="bg-black/10 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
              <div className="flex flex-wrap justify-center gap-4 text-white/90 text-base">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{legacyMarche.ville}, {legacyMarche.departement}</span>
                </div>
                {legacyMarche.date && (
                  <div className="flex items-center space-x-2">
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

        {/* Progress Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="flex space-x-2">
              {['visuel', 'audio', 'poétique', 'social'].map((section, index) => (
                <div key={section} className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ 
                      delay: 1.2 + index * 0.15,
                      duration: 0.6,
                      ease: "easeOut" 
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-3">
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
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-56 overflow-y-auto"
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

export default ExperienceMarcheElabore;
