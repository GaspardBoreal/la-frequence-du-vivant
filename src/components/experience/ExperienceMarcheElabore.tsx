import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ExplorationMarcheComplete } from '@/hooks/useExplorations';
import { REGIONAL_THEMES, RegionalTheme } from '@/utils/regionalThemes';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import MultiSensoryNavigation from '@/components/MultiSensoryNavigation';
import TextualExplorationSection from '@/components/textual/TextualExplorationSection';
import ImmersiveVisualSection from '@/components/ImmersiveVisualSection';
import AudioExperienceSection from '@/components/AudioExperienceSection';
import BioacousticHeroSection from '@/components/BioacousticHeroSection';
import { useSmartImagePreloader } from '@/hooks/useSmartImagePreloader';

interface Props {
  marche: ExplorationMarcheComplete;
  isModal?: boolean;
  previousMarche?: ExplorationMarcheComplete | null;
  nextMarche?: ExplorationMarcheComplete | null;
  onNavigateToPrevious?: () => void;
  onNavigateToNext?: () => void;
  onBack?: () => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
}

const ExperienceMarcheElabore: React.FC<Props> = ({ 
  marche, 
  isModal = false, 
  previousMarche, 
  nextMarche, 
  onNavigateToPrevious, 
  onNavigateToNext, 
  onBack,
  canNavigatePrev = false,
  canNavigateNext = false
}) => {
  const [activeSection, setActiveSection] = useState<'visual' | 'audio' | 'poeme'>('poeme');
  const [theme, setTheme] = useState<RegionalTheme>(REGIONAL_THEMES['nouvelle-aquitaine']);
  const { preloadImage, getPreloadedImage } = useSmartImagePreloader(6);

  console.log('🔄 [ExperienceMarcheElabore] Render:', { 
    marcheId: marche.marche?.id, 
    ville: marche.marche?.ville 
  });

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

  // Preload hero images
  useEffect(() => {
    const currentPhoto = legacyMarche?.photos?.[0];
    const prevPhoto = previousMarche?.marche?.photos?.[0]?.url_supabase;
    const nextPhoto = nextMarche?.marche?.photos?.[0]?.url_supabase;

    console.log('🖼️ [ExperienceMarcheElabore] Preloading images:', { 
      currentPhoto, prevPhoto, nextPhoto 
    });

    if (currentPhoto) preloadImage(currentPhoto, { priority: 'high' });
    if (prevPhoto) preloadImage(prevPhoto, { priority: 'medium' });
    if (nextPhoto) preloadImage(nextPhoto, { priority: 'medium' });
  }, [legacyMarche?.photos, previousMarche?.marche?.photos, nextMarche?.marche?.photos, preloadImage]);

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

  // Handler to navigate using the legacy marche format expected by BioacousticHeroSection
  const handleNavigateToMarche = (targetMarche: MarcheTechnoSensible) => {
    // Find the matching marche by ID and call the appropriate navigation function
    if (previousMarche && targetMarche.id === previousMarche.marche?.id) {
      onNavigateToPrevious?.();
    } else if (nextMarche && targetMarche.id === nextMarche.marche?.id) {
      onNavigateToNext?.();
    }
};

console.log('🧭 ExperienceMarcheElabore:', { marcheId: legacyMarche.id, ville: legacyMarche.ville });

return (
    <div className={`relative bg-background rounded-lg overflow-hidden ${isModal ? 'h-auto' : 'h-[650px]'}`}>
      {/* Use BioacousticHeroSection for the élaboré model */}
      <BioacousticHeroSection
        key={`bioacoustic-hero-${legacyMarche.id}`}
        marche={legacyMarche}
        theme={theme}
        onBack={onBack || (() => {})}
        onNavigateToMarche={handleNavigateToMarche}
        preloadedImage={legacyMarche.photos?.[0] ? getPreloadedImage(legacyMarche.photos[0])?.element : undefined}
        previousMarche={previousMarche?.marche ? {
          id: previousMarche.marche.id,
          ville: previousMarche.marche.ville,
          departement: previousMarche.marche.departement || '',
          region: previousMarche.marche.region || 'nouvelle-aquitaine',
          theme: previousMarche.marche.theme_principal || '',
          nomMarche: previousMarche.marche.nom_marche || previousMarche.marche.ville,
          descriptifCourt: previousMarche.marche.descriptif_court || '',
          descriptifLong: previousMarche.marche.descriptif_long || '',
          poeme: previousMarche.marche.etudes?.[0]?.contenu || '',
          date: previousMarche.marche.date || '',
          latitude: previousMarche.marche.latitude || 0,
          longitude: previousMarche.marche.longitude || 0,
          photos: previousMarche.marche.photos?.map(photo => photo.url_supabase) || [],
          videos: previousMarche.marche.videos?.map(video => video.url_supabase) || [],
          audioFiles: previousMarche.marche.audio?.map(audio => audio.url_supabase) || [],
          audioData: previousMarche.marche.audio?.map(audio => ({
            id: audio.id,
            url: audio.url_supabase,
            nom_fichier: audio.titre || 'Audio',
            titre: audio.titre,
            description: audio.description,
            duree_secondes: audio.duree_secondes,
            ordre: audio.ordre
          })) || [],
          supabaseTags: previousMarche.marche.tags?.map(tag => tag.tag) || []
        } : undefined}
        nextMarche={nextMarche?.marche ? {
          id: nextMarche.marche.id,
          ville: nextMarche.marche.ville,
          departement: nextMarche.marche.departement || '',
          region: nextMarche.marche.region || 'nouvelle-aquitaine',
          theme: nextMarche.marche.theme_principal || '',
          nomMarche: nextMarche.marche.nom_marche || nextMarche.marche.ville,
          descriptifCourt: nextMarche.marche.descriptif_court || '',
          descriptifLong: nextMarche.marche.descriptif_long || '',
          poeme: nextMarche.marche.etudes?.[0]?.contenu || '',
          date: nextMarche.marche.date || '',
          latitude: nextMarche.marche.latitude || 0,
          longitude: nextMarche.marche.longitude || 0,
          photos: nextMarche.marche.photos?.map(photo => photo.url_supabase) || [],
          videos: nextMarche.marche.videos?.map(video => video.url_supabase) || [],
          audioFiles: nextMarche.marche.audio?.map(audio => audio.url_supabase) || [],
          audioData: nextMarche.marche.audio?.map(audio => ({
            id: audio.id,
            url: audio.url_supabase,
            nom_fichier: audio.titre || 'Audio',
            titre: audio.titre,
            description: audio.description,
            duree_secondes: audio.duree_secondes,
            ordre: audio.ordre
          })) || [],
          supabaseTags: nextMarche.marche.tags?.map(tag => tag.tag) || []
        } : undefined}
      />

      {/* Navigation */}
      {!isModal && (
        <div className="px-6 py-3">
          <MultiSensoryNavigation
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            theme={theme}
          />
        </div>
      )}

      {/* Content Section */}
      {!isModal && (
        <div className="px-6 pb-6">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-56 overflow-y-auto"
          >
            {activeSection === 'poeme' && (
              <TextualExplorationSection marche={legacyMarche} theme={theme} />
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

export default ExperienceMarcheElabore;