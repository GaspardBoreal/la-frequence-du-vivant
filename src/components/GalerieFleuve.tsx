import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Map as MapIcon, 
  Clock, 
  Palette, 
  Heart, 
  Eye, 
  Wind, 
  Sun, 
  Droplets,
  TreePine,
  Sparkles,
  Compass,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  Grid3X3,
  Search,
  Filter,
  Share2,
  Download,
  ZoomIn,
  X,
  Waves,
  Star,
  Music,
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

interface GalerieFluveProps {
  explorations: any[];
  themes: RegionalTheme[];
  showWelcome?: boolean;
  initialViewMode?: ViewMode;
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

type ViewMode = 'galerie' | 'fleuve-temporel' | 'mosaique-vivante' | 'ecoute-contemplative';
type FilterMode = 'all' | 'biodiversite' | 'bioacoustique' | 'botanique' | 'couleur' | 'saison';

const GalerieFleuve: React.FC<GalerieFluveProps> = memo(({ explorations, themes, showWelcome = false, initialViewMode }) => {
  console.log('🔧 DEBUG GalerieFleuve - initialViewMode reçue:', initialViewMode);
  const [allPhotos, setAllPhotos] = useState<EnrichedPhoto[]>([]);
  const [visiblePhotos, setVisiblePhotos] = useState<EnrichedPhoto[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode || 'galerie');
  console.log('🔧 DEBUG GalerieFleuve - viewMode initialisé à:', viewMode);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Sync when initialViewMode prop changes after mount (e.g., URL param set after navigation)
  useEffect(() => {
    if (initialViewMode && initialViewMode !== viewMode) {
      console.log('🔧 DEBUG GalerieFleuve - sync viewMode depuis prop:', initialViewMode);
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
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

  // Auto-navigation pour le mode immersion
  useEffect(() => {
    if (isPlaying && viewMode === 'ecoute-contemplative') {
      intervalRef.current = setInterval(() => {
        setCurrentPhoto(prev => (prev + 1) % allPhotos.length);
      }, 4000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, viewMode, allPhotos.length]);

  // Filtrage intelligent avec mémoïsation
  const filteredPhotos = useMemo(() => {
    const photos = allPhotos;
    if (filterMode === 'all') return photos;
    
    switch (filterMode) {
      case 'biodiversite':
        return photos.filter(p => p.thematicIcons.includes('🦋') || p.emotionalTags.includes('Éclat'));
      case 'bioacoustique':
        return photos.filter(p => p.thematicIcons.includes('🎵') || p.emotionalTags.includes('Mélodie'));
      case 'botanique':
        return photos.filter(p => p.thematicIcons.includes('🌿') || p.titre?.toLowerCase().includes('plante'));
      case 'couleur':
        return photos.filter(p => p.titre?.toLowerCase().includes('couleur') || p.titre?.toLowerCase().includes('fleur'));
      case 'saison':
        return photos.filter(p => p.titre?.toLowerCase().includes('printemps') || p.titre?.toLowerCase().includes('automne'));
      default:
        return photos;
    }
  }, [allPhotos, filterMode]);

  // Reset currentPage when filters change
  useEffect(() => {
    setCurrentPage(0);
    setCurrentPhoto(0);
  }, [filteredPhotos.length, filterMode]);

  // Navigation logic based on device type
  const getImagesPerPage = useCallback(() => {
    return deviceType === 'mobile-portrait' ? 1 : 3;
  }, [deviceType]);

  const imagesPerPage = getImagesPerPage();
  const totalPages = Math.ceil(filteredPhotos.length / imagesPerPage);

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

              {/* Position Counter */}
              <div className="bg-white/15 px-2 py-0.5 rounded-lg">
                <span className="text-white text-sm font-medium">
                  {currentPage + 1}/{totalPages}
                </span>
              </div>

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

  const FleuveTemporelView = () => (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Remontée Temporelle du Vivant
        </motion.h2>

        {/* Timeline interactive */}
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-purple-400 to-pink-400 h-full" />
          
          {filteredPhotos.map((photo, index) => (
            <motion.div
              key={`${photo.id}-temporal`}
              className={`flex items-center mb-8 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
              initial={{ x: index % 2 === 0 ? -100 : 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`w-full ${deviceType !== 'desktop' ? 'px-2' : 'px-8'}`}>
                <Card className="p-4 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
                  {/* No click action - image interaction disabled */}
                  <div className="flex gap-4">
                    <img
                      src={photo.url}
                      alt={photo.titre || 'Photo exploration'}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{photo.ville}</h4>
                      <p className="text-xs text-gray-600">{photo.departement}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {photo.date || 'Intemporel'}
                        </Badge>
                        {photo.emotionalTags.slice(0, 1).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Timeline dot */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full border-4 border-purple-400 z-10" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const MosaiqueVivanteView = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 p-4">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Mosaïque Vivante du Territoire
        </h2>

        <div className={`grid gap-4 ${deviceType !== 'desktop' ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-4'}`}>
          {filteredPhotos.map((photo, index) => (
            <motion.div
              key={`${photo.id}-mosaic`}
              className="relative group cursor-pointer aspect-square overflow-hidden rounded-xl"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.05, type: "spring" }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              // No click action - image interaction disabled
            >
              <img
                src={photo.url}
                alt={photo.titre || 'Photo exploration'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs font-bold truncate">{photo.ville}</p>
                <p className="text-xs opacity-75">{photo.region}</p>
                <div className="flex gap-1 mt-1">
                  {photo.thematicIcons.slice(0, 2).map((icon, i) => (
                    <span key={i} className="text-xs">{icon}</span>
                  ))}
                </div>
              </div>

              {/* Indicateur sensoriel */}
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const EcouteContemplativeView = () => {
    if (filteredPhotos.length === 0) return null;
    
    const photo = filteredPhotos[currentPhoto];
    
    return (
      <div className="fixed inset-0 bg-black z-40">
        <motion.img
          key={currentPhoto}
          src={photo.url}
          alt={photo.titre || 'Photo exploration'}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Overlay narratif */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-6 text-white"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-4xl font-bold mb-4">
              {photo.ville}, {photo.departement}
            </h3>
            <p className="text-lg opacity-90 mb-4">
              {photo.nomMarche || photo.titre}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {photo.emotionalTags.slice(0, 3).map(tag => (
                <Badge key={tag} className="bg-white/20 text-white border-white/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {photo.thematicIcons.slice(0, 2).map((icon, i) => (
                <Badge key={i} className="bg-white/20 text-white border-white/30">
                  <span className="mr-1">{icon}</span>
                  Essence
                </Badge>
              ))}
            </div>

            {/* Navigation immersive */}
            <div className="hidden md:flex justify-between items-center">
               <Button
                variant="ghost"
                onClick={navigatePrevious}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
               {imagesPerPage === 1 ? 'Précédent' : `${imagesPerPage} précédentes`}
              </Button>
              
              <span className="text-sm opacity-75">
                {currentPhoto + 1} / {filteredPhotos.length}
              </span>
              
              <Button
                variant="ghost"
                onClick={navigateNext}
                className="text-white hover:bg-white/20"
              >
                {imagesPerPage === 1 ? 'Suivant' : `${imagesPerPage} suivantes`}
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const PhotoModal = () => {
    if (selectedPhoto === null) return null;
    
    const photo = filteredPhotos[selectedPhoto];
    
    return (
      <Dialog open={selectedPhoto !== null} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl w-full h-full md:h-auto bg-black/90 border-none p-0">
          <DialogClose className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full p-2">
            <X className="h-6 w-6" />
          </DialogClose>
          
          <div className="relative">
            <img
              src={photo.url}
              alt={photo.titre || 'Photo exploration'}
              className="w-full h-auto max-h-screen object-contain"
            />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
              <h3 className="text-xl font-bold mb-2">{photo.ville}</h3>
              <p className="text-sm opacity-90 mb-4">{photo.departement} • {photo.region}</p>
              
              <div className="flex gap-2 mb-4">
                {photo.emotionalTags.slice(0, 2).map(tag => (
                  <Badge key={tag} className="bg-white/20 text-white border-white/30">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <motion.div
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <p className="text-lg font-medium text-gray-700">
            Révélation des fragments visuels...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {loadingProgress < 100 
              ? `Chargement ${Math.round(loadingProgress)}% • ${allPhotos.length} photos découvertes` 
              : "Finalisation de l'expérience visuelle..."
            }
          </p>
          
          {allPhotos.length > 0 && (
            <motion.p 
              className="text-xs text-primary mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Premières images disponibles ! Finalisation en cours...
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Render current view */}
      {viewMode === 'galerie' && <GalerieView />}
      {viewMode === 'fleuve-temporel' && <FleuveTemporelView />}
      {viewMode === 'mosaique-vivante' && <MosaiqueVivanteView />}
      {viewMode === 'ecoute-contemplative' && <EcouteContemplativeView />}

      {/* Global navigation controls */}
      <NavigationControls />

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
    </div>
  );
});

export default GalerieFleuve;