import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ExplorationMarcheComplete } from '@/hooks/useExplorations';
import { REGIONAL_THEMES, RegionalTheme } from '@/utils/regionalThemes';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import MultiSensoryNavigation from '@/components/MultiSensoryNavigation';
import PoeticSection from '@/components/PoeticSection';
import ImmersiveVisualSection from '@/components/ImmersiveVisualSection';
import AudioExperienceSection from '@/components/AudioExperienceSection';
import MarcheHeroSection from '@/components/MarcheHeroSection';

interface Props {
  marche: ExplorationMarcheComplete;
  isModal?: boolean;
}

const ExperienceMarcheSimple: React.FC<Props> = ({ marche, isModal = false }) => {
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

  return (
    <div className={`relative bg-background rounded-lg overflow-hidden ${isModal ? 'h-auto' : 'h-[500px]'}`}>
      {/* Use the actual MarcheHeroSection */}
      <MarcheHeroSection
        marche={legacyMarche}
        theme={theme}
        onBack={() => {}} // No navigation in modal context
        isModal={isModal}
      />

      {/* Navigation */}
      {!isModal && (
        <div className="px-4 py-2">
          <MultiSensoryNavigation
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            theme={theme}
          />
        </div>
      )}

      {/* Content Section */}
      {!isModal && (
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
      )}
    </div>
  );
};

export default ExperienceMarcheSimple;