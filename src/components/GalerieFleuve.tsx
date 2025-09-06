import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Map as MapIcon, 
  Palette, 
  Heart, 
  Eye, 
  Wind, 
  Sun, 
  Droplets,
  TreePine,
  Sparkles,
  Compass,
  Grid3X3,
  Search,
  Filter,
  Share2,
  Download,
  ZoomIn,
  X,
  Waves,
  Star,
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogClose } from './ui/dialog';
import { useIsMobile } from '../hooks/use-mobile';
import { ExplorationMarcheComplete } from '../hooks/useExplorations';
import FleuveTemporel from './FleuveTemporel';
import MarcheSelector from './MarcheSelector';

interface GalerieFluveProps {
  explorations: any[];
  themes: RegionalTheme[];
  showWelcome?: boolean;
  viewMode?: ViewMode;
  explorationName?: string;
}

interface EnrichedPhoto {
  id: string;
  url: string;
  titre?: string;
  description?: string;
  ordre?: number;
  exploration: any;
  nomMarche: string;
  latitude?: number;
  longitude?: number;
  ville: string;
  departement: string;
  region: string;
  date?: string;
  emotionalTags: string[];
  thematicIcons: string[];
}

type ViewMode = 'galerie' | 'fleuve-temporel';
type FilterMode = 'all' | 'biodiversite' | 'bioacoustique' | 'botanique' | 'couleur' | 'saison';

const GalerieFleuve: React.FC<GalerieFluveProps> = memo(({ explorations, themes, showWelcome = false, viewMode: initialViewMode = 'galerie', explorationName }) => {
  const [allPhotos, setAllPhotos] = useState<EnrichedPhoto[]>([]);
  const [visiblePhotos, setVisiblePhotos] = useState<EnrichedPhoto[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [selectedMarcheId, setSelectedMarcheId] = useState<string | null>(null);
  const [isMarcheSelectorOpen, setIsMarcheSelectorOpen] = useState(false);
  const isMobile = useIsMobile();

  // Navigation par marche - nouvelle logique
  const [currentMarcheIndex, setCurrentMarcheIndex] = useState(0);
  const [currentPhotoInMarche, setCurrentPhotoInMarche] = useState(0);

  // Device detection
  const [deviceType, setDeviceType] = useState<'mobile-portrait' | 'mobile-landscape' | 'desktop'>('desktop');
  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobileSize = width < 1024;
      const isPortrait = height > width;
      
      let newDeviceType: 'mobile-portrait' | 'mobile-landscape' | 'desktop';
      
      if (isMobileSize && isPortrait) {
        newDeviceType = 'mobile-portrait';
      } else if (isMobileSize && !isPortrait) {
        newDeviceType = 'mobile-landscape';
      } else {
        newDeviceType = 'desktop';
      }
      
      setDeviceType(newDeviceType);
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    
    return () => {
      window.removeEventListener('resize', updateDeviceType);
    };
  }, []);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const metadataCache = useRef<Map<string, { emotionalTags: string[], thematicIcons: string[] }>>(new Map());

  // Menu visibility: always show except on welcome page
  const shouldShowMenu = !showWelcome;

  // Cache des métadonnées avec mémoïsation
  const generateMetadata = useCallback((photo: any, marche: any) => {
    const cacheKey = `${photo.id || photo.titre}-${marche.ville}`;
    
    if (metadataCache.current.has(cacheKey)) {
      return metadataCache.current.get(cacheKey)!;
    }

    const name = photo.titre?.toLowerCase() || '';
    const desc = photo.description?.toLowerCase() || '';
    const ville = marche.ville?.toLowerCase() || '';
    const themes = marche.sous_themes || [];
    
    // Générer tags émotionnels
    const emotionalTags: string[] = [];
    if (name.includes('eau') || name.includes('rivière') || desc.includes('eau')) emotionalTags.push('Fluidité');
    if (name.includes('fleur') || name.includes('plante') || desc.includes('botanique')) emotionalTags.push('Éclat');
    if (name.includes('oiseau') || name.includes('chant') || desc.includes('sonore')) emotionalTags.push('Mélodie');
    if (name.includes('matin') || name.includes('aube')) emotionalTags.push('Éveil');
    if (name.includes('soir') || name.includes('crépuscule')) emotionalTags.push('Intimité');
    if (ville.includes('bord') || ville.includes('fleuve')) emotionalTags.push('Contemplation');
    
    // Générer icônes thématiques
    const thematicIcons: string[] = [];
    if (themes.includes('biodiversité') || name.includes('espèce')) thematicIcons.push('🦋');
    if (themes.includes('bioacoustique') || name.includes('son')) thematicIcons.push('🎵');
    if (themes.includes('botanique') || name.includes('plante')) thematicIcons.push('🌿');
    if (name.includes('eau') || name.includes('rivière')) thematicIcons.push('💧');
    if (name.includes('ciel') || name.includes('nuage')) thematicIcons.push('☁️');
    
    const result = {
      emotionalTags: emotionalTags.length > 0 ? emotionalTags : ['Mystère'],
      thematicIcons: thematicIcons.length > 0 ? thematicIcons : ['✨']
    };

    metadataCache.current.set(cacheKey, result);
    return result;
  }, []);

  // Chargement asynchrone et progressif des photos
  useEffect(() => {
    const loadAndEnrichPhotos = async () => {
      setIsLoading(true);
      setLoadingProgress(0);
      
      // Collecter toutes les photos des explorations
      const photoTasks: Array<() => Promise<EnrichedPhoto[]>> = [];
      
      explorations.forEach(exploration => {
        if (exploration.marche?.photos && exploration.marche.photos.length > 0) {
          // Photos Supabase
          const validPhotos = exploration.marche.photos.filter((photo: any) => photo.url_supabase);
          if (validPhotos.length > 0) {
            photoTasks.push(async () => {
              const metadata = generateMetadata(validPhotos[0], exploration.marche);
              return validPhotos.map((photo: any) => ({
                id: photo.id,
                url: photo.url_supabase,
                titre: photo.titre,
                description: photo.description,
                ordre: photo.ordre,
                exploration,
                nomMarche: exploration.marche?.nom_marche || exploration.marche?.nom || `Marche à ${exploration.marche?.ville || ''}`,
                latitude: exploration.marche?.latitude,
                longitude: exploration.marche?.longitude,
                ville: exploration.marche?.ville || 'Lieu mystérieux',
                departement: exploration.marche?.departement || '',
                region: exploration.marche?.region || '',
                date: exploration.marche?.date,
                emotionalTags: metadata.emotionalTags,
                thematicIcons: metadata.thematicIcons
              }));
            });
          }
        } else if (exploration.photos && Array.isArray(exploration.photos)) {
          // Photos legacy
          if (exploration.photos.length > 0) {
            photoTasks.push(async () => {
              const metadata = generateMetadata({ titre: 'Photo 1' }, exploration);
              return exploration.photos.map((photoUrl: string, index: number) => ({
                id: `${exploration.id || exploration.ville}-${index}`,
                url: photoUrl,
                titre: `Photo ${index + 1}`,
                description: exploration.descriptif_court,
                ordre: index,
                exploration,
                nomMarche: exploration.nomMarche || exploration.nom_marche || exploration.nom || `Marche à ${exploration.ville}`,
                latitude: exploration.latitude,
                longitude: exploration.longitude,
                ville: exploration.ville || 'Lieu mystérieux',
                departement: exploration.departement || '',
                region: exploration.region || '',
                date: exploration.date,
                emotionalTags: metadata.emotionalTags,
                thematicIcons: metadata.thematicIcons
              }));
            });
          }
        }
      });

      console.log(`Traitement de ${photoTasks.length} groupes de photos...`);
      
      // Traitement parallèle par batches
      const BATCH_SIZE = 5;
      const enrichedPhotos: EnrichedPhoto[] = [];
      
      for (let i = 0; i < photoTasks.length; i += BATCH_SIZE) {
        const batch = photoTasks.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(task => task()));
        
        batchResults.forEach(photos => {
          enrichedPhotos.push(...photos);
        });
        
        // Mise à jour progressive
        const progress = Math.min(((i + BATCH_SIZE) / photoTasks.length) * 100, 100);
        setLoadingProgress(progress);
        setAllPhotos([...enrichedPhotos]);
        
        // Petit délai pour éviter le blocage UI
        if (i + BATCH_SIZE < photoTasks.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      console.log(`${enrichedPhotos.length} photos enrichies chargées avec succès`);
      setAllPhotos(enrichedPhotos);
      setVisiblePhotos(enrichedPhotos.slice(0, 20));
      setIsLoading(false);
    };

    if (explorations.length > 0) {
      loadAndEnrichPhotos();
    }
  }, [explorations, generateMetadata]);

  // Auto-navigation removed - only galerie mode supported

  // Groupement des photos par marche avec filtres thématiques
  const marcheGroups = useMemo(() => {
    const filteredPhotos = filterMode === 'all' ? allPhotos : (() => {
      switch (filterMode) {
        case 'biodiversite':
          return allPhotos.filter(p => p.thematicIcons.includes('🦋') || p.emotionalTags.includes('Éclat'));
        case 'bioacoustique':
          return allPhotos.filter(p => p.thematicIcons.includes('🎵') || p.emotionalTags.includes('Mélodie'));
        case 'botanique':
          return allPhotos.filter(p => p.thematicIcons.includes('🌿') || p.titre?.toLowerCase().includes('plante'));
        case 'couleur':
          return allPhotos.filter(p => p.titre?.toLowerCase().includes('couleur') || p.titre?.toLowerCase().includes('fleur'));
        case 'saison':
          return allPhotos.filter(p => p.titre?.toLowerCase().includes('printemps') || p.titre?.toLowerCase().includes('automne'));
        default:
          return allPhotos;
      }
    })();

    const groups = new Map<string, EnrichedPhoto[]>();
    
    filteredPhotos.forEach(photo => {
      const marcheKey = `${photo.ville}-${photo.nomMarche}`;
      if (!groups.has(marcheKey)) {
        groups.set(marcheKey, []);
      }
      groups.get(marcheKey)!.push(photo);
    });

    // Convertir en array et trier chaque groupe par ordre
    return Array.from(groups.entries()).map(([marcheKey, photos]) => ({
      marcheKey,
      photos: photos.sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
    }));
  }, [allPhotos, filterMode]);

  // Photos actuelles basées sur la marche sélectionnée
  const currentMarchePhotos = useMemo(() => {
    if (marcheGroups.length === 0) return [];
    return marcheGroups[currentMarcheIndex]?.photos || [];
  }, [marcheGroups, currentMarcheIndex]);

  // Photo actuelle pour l'affichage
  const currentDisplayPhoto = useMemo(() => {
    if (currentMarchePhotos.length === 0) return null;
    return currentMarchePhotos[currentPhotoInMarche] || null;
  }, [currentMarchePhotos, currentPhotoInMarche]);

  // Reset navigation when filters change
  useEffect(() => {
    setCurrentMarcheIndex(0);
    setCurrentPhotoInMarche(0);
  }, [filterMode]);

  // Reset photo index when marche changes
  useEffect(() => {
    setCurrentPhotoInMarche(0);
  }, [currentMarcheIndex]);

  // Navigation par marche
  const navigateNext = useCallback(() => {
    if (currentPhotoInMarche < currentMarchePhotos.length - 1) {
      // Photo suivante dans la même marche
      setCurrentPhotoInMarche(prev => prev + 1);
    } else if (currentMarcheIndex < marcheGroups.length - 1) {
      // Marche suivante
      setCurrentMarcheIndex(prev => prev + 1);
      setCurrentPhotoInMarche(0);
    }
  }, [currentPhotoInMarche, currentMarchePhotos.length, currentMarcheIndex, marcheGroups.length]);

  const navigatePrevious = useCallback(() => {
    if (currentPhotoInMarche > 0) {
      // Photo précédente dans la même marche
      setCurrentPhotoInMarche(prev => prev - 1);
    } else if (currentMarcheIndex > 0) {
      // Marche précédente, aller à la dernière photo
      const prevMarcheIndex = currentMarcheIndex - 1;
      const prevMarchePhotos = marcheGroups[prevMarcheIndex]?.photos || [];
      setCurrentMarcheIndex(prevMarcheIndex);
      setCurrentPhotoInMarche(Math.max(0, prevMarchePhotos.length - 1));
    }
  }, [currentPhotoInMarche, currentMarcheIndex, marcheGroups]);

  // Helper functions pour les états de navigation
  const canNavigatePrevious = useMemo(() => {
    return currentMarcheIndex > 0 || currentPhotoInMarche > 0;
  }, [currentMarcheIndex, currentPhotoInMarche]);

  const canNavigateNext = useMemo(() => {
    return currentMarcheIndex < marcheGroups.length - 1 || 
           currentPhotoInMarche < currentMarchePhotos.length - 1;
  }, [currentMarcheIndex, marcheGroups.length, currentPhotoInMarche, currentMarchePhotos.length]);

  // Position globale pour l'affichage
  const globalPosition = useMemo(() => {
    let totalPhotos = 0;
    let currentPosition = 0;
    
    for (let i = 0; i < marcheGroups.length; i++) {
      if (i < currentMarcheIndex) {
        totalPhotos += marcheGroups[i].photos.length;
        currentPosition += marcheGroups[i].photos.length;
      } else if (i === currentMarcheIndex) {
        totalPhotos += marcheGroups[i].photos.length;
        currentPosition += currentPhotoInMarche;
      } else {
        totalPhotos += marcheGroups[i].photos.length;
      }
    }
    
    return { currentPosition: currentPosition + 1, totalPhotos };
  }, [marcheGroups, currentMarcheIndex, currentPhotoInMarche]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        navigateNext();
      } else if (e.key === 'ArrowLeft') {
        navigatePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateNext, navigatePrevious]);

  // Contextual Navigation Controls
  const NavigationControls = () => {
    if (!shouldShowMenu) return null;
    
    return (
      <motion.div 
        className="fixed top-0 left-0 right-0 z-[60] px-4 pt-[env(safe-area-inset-top)]"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between">
          
          {/* Home Button - Left */}
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/40 backdrop-blur-md text-white active:bg-white/30 touch-manipulation pointer-events-auto border border-white/10 shadow-xl"
            whileTap={{ scale: 0.9 }}
          >
            <Home className="h-5 w-5" />
          </motion.button>

          {/* Navigation Controls - Center */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10 shadow-xl pointer-events-auto">
            <div className="flex items-center gap-1">
              {/* Previous Button */}
              <motion.button
                onClick={navigatePrevious}
                disabled={!canNavigatePrevious}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 touch-manipulation ${
                  !canNavigatePrevious 
                    ? 'bg-white/10 text-white/30' 
                    : 'bg-white/20 text-white active:bg-white/30'
                }`}
                whileTap={canNavigatePrevious ? { scale: 0.9 } : {}}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>

              {/* Position Counter - Clickable */}
              <motion.button
                onClick={() => setIsMarcheSelectorOpen(true)}
                className="bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-lg transition-all duration-200 touch-manipulation"
                whileTap={{ scale: 0.95 }}
              >
                 <span className="text-white text-sm font-medium">
                   {globalPosition.currentPosition}/{globalPosition.totalPhotos}
                 </span>
              </motion.button>

              {/* Next Button */}
              <motion.button
                onClick={navigateNext}
                disabled={!canNavigateNext}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 touch-manipulation ${
                  !canNavigateNext
                    ? 'bg-white/10 text-white/30' 
                    : 'bg-white/20 text-white active:bg-white/30'
                }`}
                whileTap={canNavigateNext ? { scale: 0.9 } : {}}
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>
             </div>
          </div>
          
          {/* Spacer to balance centering */}
          <div className="w-10"></div>
        </div>
      </motion.div>
    );
  };

  const GalerieView = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-green-50 to-blue-100">
      <div className="relative h-screen overflow-hidden">
        {currentDisplayPhoto && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            key={`${currentMarcheIndex}-${currentPhotoInMarche}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.4
            }}
          >
            <motion.div
              className="w-full h-full relative"
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={currentDisplayPhoto.url}
                alt={currentDisplayPhoto.titre || 'Photo exploration'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Métadonnées géopoétiques */}
              <div className={`absolute bottom-6 left-4 text-white ${deviceType !== 'desktop' ? 'right-20' : 'right-4'}`}>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge className="mb-2 bg-emerald-600/80 text-white border-emerald-400/30 backdrop-blur-sm">
                    {currentDisplayPhoto.ville}
                  </Badge>
                  <h3 className="text-lg font-bold mb-1">
                    {currentDisplayPhoto.nomMarche}
                  </h3>
                  <p className="text-sm opacity-90">
                    Photo {currentPhotoInMarche + 1} / {currentMarchePhotos.length}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Render based on view mode */}
      {viewMode === 'fleuve-temporel' ? (
        <FleuveTemporel explorations={explorations} explorationName={explorationName} />
      ) : (
        <>
          {/* Render current view - only galerie mode supported */}
          <GalerieView />

          {/* Global navigation controls */}
          <NavigationControls />

          {/* Marche Selector */}
          <MarcheSelector
            isOpen={isMarcheSelectorOpen}
            onClose={() => setIsMarcheSelectorOpen(false)}
            photos={marcheGroups.flatMap(group => group.photos)}
            onMarcheSelect={(marcheId) => {
              // Trouver l'index de cette marche
              const marcheIndex = marcheGroups.findIndex(group => group.marcheKey === marcheId);
              
              if (marcheIndex !== -1) {
                setCurrentMarcheIndex(marcheIndex);
                setCurrentPhotoInMarche(0);
              }
              
              setSelectedMarcheId(marcheId);
              setIsMarcheSelectorOpen(false);
            }}
            selectedMarcheId={marcheGroups[currentMarcheIndex]?.marcheKey || null}
            currentIndex={globalPosition.currentPosition - 1}
          />

          {/* Photo detail modal - DISABLED */}
          {/* <PhotoModal /> */}

          {/* Filter indicator */}
          {filterMode !== 'all' && (
            <motion.div
              className={`fixed ${deviceType !== 'desktop' ? 'top-4 left-4' : 'top-6 right-6'} z-40`}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-400/30 px-3 py-1 rounded-full backdrop-blur-sm border border-amber-300/20">
                🌿 {filterMode}
              </Badge>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
});

export default GalerieFleuve;