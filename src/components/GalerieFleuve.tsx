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
  const [currentPhoto, setCurrentPhoto] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [selectedMarcheId, setSelectedMarcheId] = useState<string | null>(null);
  const [isMarcheSelectorOpen, setIsMarcheSelectorOpen] = useState(false);
  const isMobile = useIsMobile();

  // Device detection
  const [deviceType, setDeviceType] = useState<'mobile-portrait' | 'mobile-landscape' | 'desktop'>('desktop');
  
  const [currentPage, setCurrentPage] = useState(0);
  const prevDeviceTypeRef = useRef<'mobile-portrait' | 'mobile-landscape' | 'desktop'>('desktop');
  
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
  
  // Preserve position when device type changes (orientation rotation)
  useEffect(() => {
    const prev = prevDeviceTypeRef.current;
    if (prev === deviceType) return;

    // Determine count according to current filter
    const getFilteredCount = () => {
      if (filterMode === 'all') return allPhotos.length;
      switch (filterMode) {
        case 'biodiversite':
          return allPhotos.filter(p => p.thematicIcons.includes('🦋') || p.emotionalTags.includes('Éclat')).length;
        case 'bioacoustique':
          return allPhotos.filter(p => p.thematicIcons.includes('🎵') || p.emotionalTags.includes('Mélodie')).length;
        case 'botanique':
          return allPhotos.filter(p => p.thematicIcons.includes('🌿') || p.titre?.toLowerCase().includes('plante')).length;
        case 'couleur':
          return allPhotos.filter(p => p.titre?.toLowerCase().includes('couleur') || p.titre?.toLowerCase().includes('fleur')).length;
        case 'saison':
          return allPhotos.filter(p => p.titre?.toLowerCase().includes('printemps') || p.titre?.toLowerCase().includes('automne')).length;
        default:
          return allPhotos.length;
      }
    };

    const count = getFilteredCount();
    if (count === 0) {
      prevDeviceTypeRef.current = deviceType;
      return;
    }

    const ipp = (t: 'mobile-portrait' | 'mobile-landscape' | 'desktop') => (t === 'mobile-portrait' ? 1 : 3);
    const prevIPP = ipp(prev);
    const newIPP = ipp(deviceType);

    const currentFirstIndex = currentPage * prevIPP;
    const newPage = Math.floor(currentFirstIndex / newIPP);

    const maxPages = Math.max(0, Math.ceil(count / newIPP) - 1);
    const targetPage = Math.min(Math.max(0, newPage), maxPages);

    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      setCurrentPhoto(targetPage * newIPP);
    }

    prevDeviceTypeRef.current = deviceType;
  }, [deviceType, allPhotos.length, filterMode]);
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

  // Base photos avec seulement les filtres thématiques (pour navigation globale)
  const basePhotos = useMemo(() => {
    if (filterMode === 'all') return allPhotos;
    
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
  }, [allPhotos, filterMode]);

  // Photos filtrées pour l'affichage (avec filtre marche)
  const filteredPhotos = useMemo(() => {
    if (!selectedMarcheId) return basePhotos;
    
    return basePhotos.filter(photo => {
      const marcheId = `${photo.ville}-${photo.nomMarche}`;
      return marcheId === selectedMarcheId;
    });
  }, [basePhotos, selectedMarcheId]);

  // Reset currentPage when thematic filters change
  useEffect(() => {
    setCurrentPage(0);
    setCurrentPhoto(0);
  }, [basePhotos.length, filterMode]);

  // Navigation logic based on device type
  const getImagesPerPage = useCallback(() => {
    return deviceType === 'mobile-portrait' ? 1 : 3;
  }, [deviceType]);

  const imagesPerPage = getImagesPerPage();
  const totalPages = Math.ceil(basePhotos.length / imagesPerPage);

  // Simple navigation functions
  const navigateNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setCurrentPhoto(nextPage * imagesPerPage);
    }
  }, [currentPage, totalPages, imagesPerPage]);

  const navigatePrevious = useCallback(() => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      setCurrentPhoto(prevPage * imagesPerPage);
    }
  }, [currentPage, imagesPerPage]);

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
                disabled={currentPage === 0}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 touch-manipulation ${
                  currentPage === 0 
                    ? 'bg-white/10 text-white/30' 
                    : 'bg-white/20 text-white active:bg-white/30'
                }`}
                whileTap={currentPage > 0 ? { scale: 0.9 } : {}}
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
                   {currentPhoto + 1}/{basePhotos.length}
                 </span>
              </motion.button>

              {/* Next Button */}
              <motion.button
                onClick={navigateNext}
                disabled={currentPage >= totalPages - 1}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 touch-manipulation ${
                  currentPage >= totalPages - 1
                    ? 'bg-white/10 text-white/30' 
                    : 'bg-white/20 text-white active:bg-white/30'
                }`}
                whileTap={currentPage < totalPages - 1 ? { scale: 0.9 } : {}}
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
        <motion.div 
          className="absolute inset-0 flex items-center"
          animate={{ x: `-${currentPage * 100}%` }}
          transition={{ 
            type: "tween",
            duration: 0.4,
            ease: "easeInOut"
          }}
        >
          {filteredPhotos.map((photo, index) => (
            <motion.div
              key={`${photo.id}-${index}`}
              className={`flex-shrink-0 ${deviceType === 'mobile-portrait' ? 'w-full' : 'w-1/3'} h-full relative`}
              // No click action on any device
              // No hover effect
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={photo.url}
                alt={photo.titre || 'Photo exploration'}
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
                    {photo.ville}
                  </Badge>
                  <h3 className="text-lg font-bold mb-1">
                    {photo.nomMarche}
                  </h3>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
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
            photos={basePhotos}
            onMarcheSelect={(marcheId) => {
              // Trouver l'index global de la première photo de cette marche
              const marchePhotoIndex = basePhotos.findIndex(photo => {
                const photoMarcheId = `${photo.ville}-${photo.nomMarche}`;
                return photoMarcheId === marcheId;
              });
              
              if (marchePhotoIndex !== -1) {
                // Calculer la page correspondante
                const targetPage = Math.floor(marchePhotoIndex / imagesPerPage);
                setCurrentPage(targetPage);
                setCurrentPhoto(marchePhotoIndex);
              }
              
              setSelectedMarcheId(marcheId);
              setIsMarcheSelectorOpen(false);
            }}
            selectedMarcheId={selectedMarcheId}
            currentIndex={currentPhoto}
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