import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Eye,
  BookOpen
} from 'lucide-react';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useIsMobile } from '../hooks/use-mobile';
import { ExplorationMarcheComplete } from '../hooks/useExplorations';
import FleuveTemporel from './FleuveTemporel';
import MarcheSelector from './MarcheSelector';
import { OptimizedImage } from './OptimizedImage';
import { useSmartImagePreloader } from '../hooks/useSmartImagePreloader';
import PortalOverlay from './ui/PortalOverlay';
import { createSlug } from '@/utils/slugGenerator';

// Component for the read text navigation button
const ReadTextButton = memo(({ explorationSlug, photo }: { explorationSlug?: string, photo: EnrichedPhoto }) => {
  const navigate = useNavigate();
  
  const handleReadText = useCallback(() => {
    if (!explorationSlug) return;
    
    const marcheSlug = createSlug(photo.nomMarche || '', photo.ville || '');
    const readUrl = `/galerie-fleuve/exploration/${explorationSlug}/lire?marche=${marcheSlug}`;
    navigate(readUrl);
  }, [explorationSlug, photo, navigate]);

  if (!explorationSlug) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReadText}
            className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
          >
            <BookOpen className="h-4 w-4 text-white" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Lire les textes de {photo.nomMarche}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

ReadTextButton.displayName = 'ReadTextButton';

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
  
  // Smart image preloader
  const { preloadImage, preloadImageSet, getPreloadedImage, getCacheStats } = useSmartImagePreloader(15);

  // Debug mode
  const [debugMode] = useState(() => {
    return new URLSearchParams(window.location.search).get('debug') === '1' || 
           localStorage.getItem('galerie-debug') === '1';
  });

  // Navigation states - Fluid Navigation System
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [committedIndex, setCommittedIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Simplified preparation states
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareProgress, setPrepareProgress] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  
  // Smart overlay system - only for cross-march or slow loads
  const [showCrossMarche, setShowCrossMarche] = useState(false);
  const [crossMarcheInfo, setCrossMarcheInfo] = useState<{from: string, to: string} | null>(null);
  const [showProgressBar, setShowProgressBar] = useState(false);
  
  // Timing refs for intelligent overlays
  const isPreparingRef = useRef(false);
  const prepStartAtRef = useRef<number>(0);
  const overlayTimeoutRef = useRef<number | null>(null);
  const initializedFromURLRef = useRef(false);

  useEffect(() => {
    isPreparingRef.current = isPreparing;
  }, [isPreparing]);

  // Block page interactions while cross-march overlay is visible
  useEffect(() => {
    const root = document.getElementById('root');
    if (showCrossMarche) {
      document.body.style.overflow = 'hidden';
      root?.classList.add('pointer-events-none');
    } else {
      document.body.style.overflow = '';
      root?.classList.remove('pointer-events-none');
    }
    return () => {
      document.body.style.overflow = '';
      root?.classList.remove('pointer-events-none');
    };
  }, [showCrossMarche]);
  
  // Accessibility and user preferences
  const [reduceMotion, setReduceMotion] = useState(false);

  // Détection préférences utilisateur pour les animations
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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
  const transitionCommittedRef = useRef(false);
  const lastNavAtRef = useRef(0);
  const MIN_NAV_INTERVAL = 180;

  // Velvet Smooth: Enhanced state for ultra-smooth transitions
  const [imageFullyLoaded, setImageFullyLoaded] = useState(false);
  const [phantomFadeActive, setPhantomFadeActive] = useState(false);
  const [visualComfortMode, setVisualComfortMode] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // Photos filtrées globales pour navigation
  const filteredPhotos = useMemo(() => {
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

  // Groupement des photos par marche pour le sélecteur (optionnel)
  const marcheGroups = useMemo(() => {
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
  }, [filteredPhotos]);

  // Photo actuelle pour l'affichage  
  const currentDisplayPhoto = useMemo(() => {
    return filteredPhotos[currentPhotoIndex] || null;
  }, [filteredPhotos, currentPhotoIndex]);

  // Reset navigation when filters change
  useEffect(() => {
    setCurrentPhotoIndex(0);
    setCommittedIndex(0);
  }, [filterMode]);

  // Handle march URL parameter to set correct photo index (once)
  useEffect(() => {
    if (!filteredPhotos.length || isLoading || initializedFromURLRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const marcheSlug = urlParams.get('marche');

    if (!marcheSlug) return;

    const targetIndex = filteredPhotos.findIndex(photo => {
      try {
        return createSlug(photo.nomMarche || '', photo.ville || '') === marcheSlug;
      } catch {
        return false;
      }
    });

    if (targetIndex !== -1) {
      setCurrentPhotoIndex(targetIndex);
      setCommittedIndex(targetIndex);
      initializedFromURLRef.current = true;
      if (debugMode) {
        console.debug('[GalerieFleuve] Initialized from URL', { marcheSlug, targetIndex });
      }
    }
  }, [filteredPhotos, isLoading, debugMode]);


  // Dynamic neighbor preloading utility
  const preloadNeighbors = useCallback(async (centerIndex: number, depth: number = 1) => {
    if (!filteredPhotos || filteredPhotos.length === 0) return [];

    const tasks: Promise<any>[] = [];

    // High priority for current image via shared cache
    const currentPhoto = filteredPhotos[centerIndex];
    if (currentPhoto?.url) {
      tasks.push(preloadImage(currentPhoto.url, { priority: 'high' }).catch(() => null));
    }

    // Medium priority for neighbors via shared cache
    for (let offset = -depth; offset <= depth; offset++) {
      if (offset === 0) continue;
      const idx = centerIndex + offset;
      if (idx >= 0 && idx < filteredPhotos.length) {
        const p = filteredPhotos[idx];
        if (p?.url) {
          tasks.push(preloadImage(p.url, { priority: 'medium' }).catch(() => null));
        }
      }
    }

    if (debugMode) {
      console.log(`🖼️ Smart preload (cache): center=${centerIndex}, depth=${depth}, tasks=${tasks.length}`);
    }

    return tasks;
  }, [filteredPhotos, preloadImage, debugMode]);

  // Proactive neighbor preloading on index changes
  useEffect(() => {
    if (!filteredPhotos || filteredPhotos.length === 0) return;

    const depth = deviceType === 'desktop' ? 3 : 1;
    preloadNeighbors(committedIndex, depth);
  }, [committedIndex, filteredPhotos, deviceType, preloadNeighbors]);

  // Helper: Détection cross-marche
  const detectCrossMarche = useCallback((fromIndex: number, toIndex: number) => {
    if (!filteredPhotos[fromIndex] || !filteredPhotos[toIndex]) return false;
    const fromKey = `${filteredPhotos[fromIndex].ville}-${filteredPhotos[fromIndex].nomMarche}`;
    const toKey = `${filteredPhotos[toIndex].ville}-${filteredPhotos[toIndex].nomMarche}`;
    return fromKey !== toKey;
  }, [filteredPhotos]);

  // Fluid Navigation System - Enhanced preparation function
  const prepareNavigation = useCallback(async (newIndex: number) => {
    if (isPreparing || newIndex === committedIndex || newIndex < 0 || newIndex >= filteredPhotos.length) {
      if (debugMode) {
        console.log('[GalerieFleuve] prepareNavigation: ignored', { isPreparing, newIndex, committedIndex, total: filteredPhotos.length });
      }
      return false;
    }

    const startTime = Date.now();
    const isCross = detectCrossMarche(committedIndex, newIndex);
    const targetPhoto = filteredPhotos[newIndex];
    
    if (debugMode) {
      console.log(`🚀 Starting navigation: ${committedIndex} → ${newIndex} (${isCross ? 'cross-marche' : 'intra-marche'})`);
    }
    
    setIsPreparing(true);
    setPrepareProgress(0);
    setTargetIndex(newIndex);

    // Smart overlay logic - only show for cross-march or if loading > 300ms
    let showingOverlay = false;
    let overlayTimer: NodeJS.Timeout | null = null;

    if (isCross) {
      // Cross-march: immediate cross-march display
      setShowCrossMarche(true);
      setCrossMarcheInfo({
        from: `${filteredPhotos[committedIndex].ville} - ${filteredPhotos[committedIndex].nomMarche}`,
        to: `${targetPhoto.ville} - ${targetPhoto.nomMarche}`
      });
      showingOverlay = true;
    } else {
      // Intra-march: delayed progress bar only if loading > 300ms
      overlayTimer = setTimeout(() => {
        if (isPreparingRef.current) {
          setShowProgressBar(true);
          showingOverlay = true;
        }
      }, 300);
    }

    prepStartAtRef.current = startTime;

    try {
      // Aggressive preloading based on device
      const depth = deviceType === 'desktop' ? 3 : 2;
      const loadPromises = await preloadNeighbors(newIndex, depth);

      let loadedCount = 0;
      const totalImages = loadPromises.length;

      if (debugMode) {
        console.log(`📦 Preloading ${totalImages} images with depth ${depth}`);
      }

      // Track progress as images load
      const trackedPromises = loadPromises.map(async (promise) => {
        try {
          await promise;
          loadedCount++;
          const progress = Math.round((loadedCount / totalImages) * 100);
          setPrepareProgress(progress);
          if (debugMode && loadedCount % 2 === 0) {
            console.log(`📈 Progress: ${loadedCount}/${totalImages} (${progress}%)`);
          }
          return true;
        } catch (error) {
          loadedCount++;
          setPrepareProgress(Math.round((loadedCount / totalImages) * 100));
          return false;
        }
      });

      // Wait for all images with timeout
      await Promise.race([
        Promise.allSettled(trackedPromises),
        new Promise((resolve) => setTimeout(resolve, 800)) // 800ms timeout
      ]);

      // Cancel overlay timer if loading finished quickly
      if (overlayTimer && !showingOverlay) {
        clearTimeout(overlayTimer);
      }

      const elapsed = Date.now() - startTime;
      if (debugMode) {
        console.log(`✅ Preparation completed in ${elapsed}ms, overlay shown: ${showingOverlay}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Navigation preparation failed:', error);
      return false;
    }
  }, [isPreparing, committedIndex, filteredPhotos, detectCrossMarche, deviceType, preloadNeighbors, debugMode]);

  // Seamless navigation completion with smart timing
  const completeNavigation = useCallback(async (toIndex?: number) => {
    const indexToCommit = (typeof toIndex === 'number') ? toIndex : targetIndex;
    if (indexToCommit === null || indexToCommit === undefined) return;
    
    if (debugMode) {
      console.log(`🎯 Completing navigation to index ${indexToCommit}`);
    }
    
    const isCross = detectCrossMarche(committedIndex, indexToCommit);
    const elapsed = Date.now() - prepStartAtRef.current;
    
    // Minimum visibility for cross-march overlays (200ms)
    if (isCross && showCrossMarche && elapsed < 200) {
      await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
    }
    
    // Clear any pending overlay timers
    if (overlayTimeoutRef.current) {
      clearTimeout(overlayTimeoutRef.current);
      overlayTimeoutRef.current = null;
    }
    
    // Use seamless transition with AnimatePresence
    setIsTransitioning(true);

    // Brief transition for smooth visual feedback
    const transitionDelay = reduceMotion ? 50 : 100;
    
    setTimeout(() => {
      setCommittedIndex(indexToCommit);
      setCurrentPhotoIndex(indexToCommit);
      setIsTransitioning(false);
      setIsPreparing(false);
      setPrepareProgress(0);
      setTargetIndex(null);
      
      // Hide overlays
      setShowCrossMarche(false);
      setCrossMarcheInfo(null);
      setShowProgressBar(false);
      
      if (debugMode) {
        console.log(`✅ Navigation completed to index ${indexToCommit}`);
      }
    }, transitionDelay);
  }, [targetIndex, reduceMotion, debugMode, detectCrossMarche, committedIndex, showCrossMarche]);

  // New navigation system with gating
  const navigateNext = useCallback(async () => {
    if (isPreparing || isTransitioning || !filteredPhotos.length) return;

    const now = Date.now();
    if (now - lastNavAtRef.current < MIN_NAV_INTERVAL) return;
    lastNavAtRef.current = now;

    const target = Math.min(committedIndex + 1, filteredPhotos.length - 1);
    if (target === committedIndex) return;

    // Velvet Smooth: Activate phantom fade during navigation
    setPhantomFadeActive(true);
    setImageFullyLoaded(false);

    // Prepare navigation with gating
    const success = await prepareNavigation(target);
    if (success) {
      // Delay completion for ultra-smooth transition
      setTimeout(() => {
        completeNavigation(target);
        setTimeout(() => setPhantomFadeActive(false), visualComfortMode ? 100 : 50);
      }, visualComfortMode ? 100 : 50);
    } else {
      setPhantomFadeActive(false);
    }
  }, [committedIndex, filteredPhotos, isPreparing, isTransitioning, prepareNavigation, completeNavigation, visualComfortMode]);

  const navigatePrevious = useCallback(async () => {
    if (isPreparing || isTransitioning || !filteredPhotos.length) return;

    const now = Date.now();
    if (now - lastNavAtRef.current < MIN_NAV_INTERVAL) return;
    lastNavAtRef.current = now;

    const target = Math.max(committedIndex - 1, 0);
    if (target === committedIndex) return;

    // Velvet Smooth: Activate phantom fade during navigation
    setPhantomFadeActive(true);
    setImageFullyLoaded(false);

    // Prepare navigation with gating
    const success = await prepareNavigation(target);
    if (success) {
      // Delay completion for ultra-smooth transition
      setTimeout(() => {
        completeNavigation(target);
        setTimeout(() => setPhantomFadeActive(false), visualComfortMode ? 100 : 50);
      }, visualComfortMode ? 100 : 50);
    } else {
      setPhantomFadeActive(false);
    }
  }, [committedIndex, filteredPhotos, isPreparing, isTransitioning, prepareNavigation, completeNavigation, visualComfortMode]);

  // Navigation states
  const canNavigatePrevious = committedIndex > 0 && !isPreparing && !isTransitioning;
  const canNavigateNext = committedIndex < filteredPhotos.length - 1 && !isPreparing && !isTransitioning;

  // Synchronization of indices on initialization
  useEffect(() => {
    if (initializedFromURLRef.current) return; // Do not override URL-initialized index
    setCommittedIndex(currentPhotoIndex);
  }, [filteredPhotos.length]);  // Sync when photos load


  // Preload only current and close neighbors using shared cache (lighter on mobile)
  useEffect(() => {
    if (!filteredPhotos.length) return;
    const depth = deviceType === 'desktop' ? 3 : 1;
    const currentUrl = filteredPhotos[committedIndex]?.url;
    if (currentUrl) {
      void preloadImage(currentUrl, { priority: 'high' });
    }
    for (let o = 1; o <= depth; o++) {
      const prevUrl = filteredPhotos[committedIndex - o]?.url;
      const nextUrl = filteredPhotos[committedIndex + o]?.url;
      if (prevUrl) void preloadImage(prevUrl, { priority: 'medium' });
      if (nextUrl) void preloadImage(nextUrl, { priority: 'medium' });
    }
  }, [filteredPhotos, committedIndex, deviceType, preloadImage]);

  // Synchroniser l'index central (pour compteur & préchargement)
  useEffect(() => {
    if (!filteredPhotos.length) return;
    setCurrentPhotoIndex(committedIndex);
  }, [filteredPhotos, committedIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPreparing || isTransitioning) return;
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateNext, navigatePrevious, isPreparing, isTransitioning]);

// Extracted Navigation Controls - Outside component to prevent remounting
const NavigationControls = memo<{
  shouldShowMenu: boolean;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  navigatePrevious: () => void;
  navigateNext: () => void;
  committedIndex: number;
  totalPhotos: number;
  setIsMarcheSelectorOpen: (open: boolean) => void;
  visualComfortMode: boolean;
  setVisualComfortMode: (mode: boolean) => void;
}>(({ 
  shouldShowMenu, 
  canNavigatePrevious, 
  canNavigateNext, 
  navigatePrevious, 
  navigateNext, 
  committedIndex, 
  totalPhotos, 
  setIsMarcheSelectorOpen,
  visualComfortMode,
  setVisualComfortMode
}) => {
  if (!shouldShowMenu) return null;
  
  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 z-[60] px-4 pt-[env(safe-area-inset-top)]"
      initial={false} // Prevent initial animation to avoid flicker
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
                  ? 'bg-white/10 text-white/30 cursor-not-allowed' 
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
               {committedIndex + 1}/{totalPhotos}
             </span>
            </motion.button>

            {/* Next Button */}
            <motion.button
              onClick={navigateNext}
              disabled={!canNavigateNext}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 touch-manipulation ${
                !canNavigateNext
                  ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                  : 'bg-white/20 text-white active:bg-white/30'
              }`}
              whileTap={canNavigateNext ? { scale: 0.9 } : {}}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
           </div>
        </div>
        
        {/* Spacer replaced with Visual Comfort toggle */}
        <motion.button
          onClick={() => setVisualComfortMode(!visualComfortMode)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md transition-all duration-300 touch-manipulation border border-white/10 shadow-xl ${
            visualComfortMode 
              ? 'bg-cyan-500/60 text-cyan-100' 
              : 'bg-black/40 text-white/70 hover:text-white'
          }`}
          whileTap={{ scale: 0.9 }}
          title="Confort visuel"
        >
          <Eye className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.div>
  );
});

// Extracted Galerie View - Outside component to prevent remounting
const GalerieView = memo<{
  filteredPhotos: EnrichedPhoto[];
  committedIndex: number;
  deviceType: 'mobile-portrait' | 'mobile-landscape' | 'desktop';
  getPreloadedImage: (url: string) => any;
  isPreparing: boolean;
  navigatePrevious: () => void;
  navigateNext: () => void;
  reduceMotion: boolean;
  isTransitioning: boolean;
}>(({ 
  filteredPhotos, 
  committedIndex, 
  deviceType, 
  getPreloadedImage, 
  isPreparing, 
  navigatePrevious, 
  navigateNext, 
  reduceMotion,
  isTransitioning
}) => {
  // Current photos to display
  const displayPhotos = useMemo(() => {
    if (!filteredPhotos.length) return [];
    
    const workingIndex = committedIndex;
    const workingPhoto = filteredPhotos[workingIndex];
    
    if (!workingPhoto) return [];
    
    if (deviceType === 'desktop') {
      const indices = [workingIndex - 1, workingIndex, workingIndex + 1]
        .filter(i => i >= 0 && i < filteredPhotos.length);
      return indices.map((i) => ({
        photo: filteredPhotos[i],
        position: i < workingIndex ? 'previous' : i > workingIndex ? 'next' : 'current' as 'previous' | 'current' | 'next'
      }));
    } else {
      return [{ photo: filteredPhotos[workingIndex], position: 'current' }];
    }
  }, [filteredPhotos, committedIndex, deviceType]);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-blue-950/60 to-emerald-950/40 relative">
      {/* Aquatic depth effect with floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-1 h-1 bg-cyan-400/50 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-emerald-400/30 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-10 w-1 h-1 bg-blue-300/40 rounded-full animate-bounce"></div>
      </div>
      
      <div className="relative h-[100dvh] overflow-hidden">
        

        {/* Velvet Smooth: Phantom Fade Overlay */}
        {phantomFadeActive && (
          <div 
            className="absolute inset-0 z-50 pointer-events-none"
            style={{
              background: `linear-gradient(45deg, 
                rgba(15, 23, 42, ${visualComfortMode ? 0.15 : 0.1}) 0%, 
                rgba(15, 23, 42, ${visualComfortMode ? 0.05 : 0.03}) 50%, 
                rgba(15, 23, 42, ${visualComfortMode ? 0.15 : 0.1}) 100%)`,
              opacity: phantomFadeActive ? 1 : 0,
              transition: `opacity ${visualComfortMode ? 400 : 200}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
            }}
          />
        )}

        {/* Main photo display */}
        <AnimatePresence mode="popLayout">
          <div className={`absolute inset-0 ${
            deviceType === 'desktop' 
              ? 'flex items-center justify-center gap-4 px-8' 
              : 'block'
          }`}>

            {displayPhotos.map(({ photo, position }, index) => {
              const preloadedImage = getPreloadedImage(photo.url);
              
              // Enhanced instant mode for mobile: smooth transitions
              const shouldUseInstant = deviceType !== 'desktop' && 
                                     position === 'current' && 
                                     !isTransitioning;
              
              return (
                  <motion.div
                  key={deviceType === 'desktop' ? `photo-${photo.id}-${position}` : 'mobile-current'}
                  className={`
                    relative overflow-hidden rounded-2xl shadow-2xl shadow-cyan-500/10
                    ${deviceType === 'desktop' ? (
                      position === 'current' 
                        ? 'w-[45%] h-[80%] z-10 border border-cyan-400/20' 
                        : 'w-[25%] h-[60%] z-0 opacity-70 hover:opacity-90 cursor-pointer border border-cyan-400/10'
                    ) : 'w-full h-full rounded-none'}
                  `}
                  initial={false}
                  animate={ deviceType === 'desktop' ? { 
                    scale: position === 'current' ? 1 : 0.9,
                    opacity: position === 'current' ? 1 : (visualComfortMode ? 0.8 : 0.7)
                  } : { opacity: 1, scale: 1 } }
                  transition={ deviceType === 'desktop' ? { 
                    type: "tween",
                    duration: (prefersReducedMotion || visualComfortMode) ? 0.4 : 0.2,
                    ease: [0.25, 0.1, 0.25, 1] // Ultra-smooth cubic-bezier
                  } : { duration: 0 } }
                  onClick={() => {
                    if (isPreparing) return;
                    if (position === 'previous') navigatePrevious();
                    if (position === 'next') navigateNext();
                  }}
                  style={{ 
                    cursor: isPreparing ? 'not-allowed' : 'pointer',
                    boxShadow: position === 'current' 
                      ? '0 25px 50px -12px rgba(34, 211, 238, 0.25), 0 0 40px rgba(16, 185, 129, 0.15)' 
                      : '0 10px 25px -5px rgba(34, 211, 238, 0.1)'
                  }}
                  whileHover={deviceType === 'desktop' && position !== 'current' && !isPreparing ? { scale: 0.95, opacity: 0.9 } : {}}
                >
                  <OptimizedImage
                    src={photo.url}
                    alt={photo.titre || 'Photo exploration'}
                    className="w-full h-full"
                    priority={position === 'current' ? 'high' : 'medium'}
                    preloadedImage={preloadedImage?.element}
                    enableCinematicTransitions={false} // Velvet Smooth: Disable concurrent animations
                    instant={shouldUseInstant}
                    transition={{
                      duration: (prefersReducedMotion || visualComfortMode) ? 0.4 : 0.2,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    onLoad={() => {
                      if (position === 'current') {
                        // Delay metadata animation until image is fully rendered
                        setTimeout(() => setImageFullyLoaded(true), visualComfortMode ? 100 : 50);
                      }
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  
                  {/* Velvet Smooth: Metadata synchronized with image loading */}
                  {position === 'current' && !isPreparing && imageFullyLoaded && (
                     <motion.div 
                       className="absolute bottom-6 left-6 right-6 text-white"
                       initial={shouldUseInstant ? false : { y: 15, opacity: 0 }}
                       animate={{ y: 0, opacity: visualComfortMode ? 0.9 : 1 }}
                       transition={shouldUseInstant ? { duration: 0 } : { 
                         delay: visualComfortMode ? 0.15 : 0.1,
                         duration: (prefersReducedMotion || visualComfortMode) ? 0.6 : 0.3,
                         ease: [0.25, 0.1, 0.25, 1]
                       }}
                     >
                       <Badge className="mb-3 bg-cyan-500/80 text-cyan-100 border-cyan-400/30 backdrop-blur-xl shadow-lg shadow-cyan-500/20">
                         {photo.ville}
                       </Badge>
                       <h3 className="text-xl font-bold mb-2 leading-tight text-cyan-50 drop-shadow-lg">
                         {photo.nomMarche}
                       </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-sm opacity-90 text-cyan-100">
                            Photo {committedIndex + 1} / {filteredPhotos.length}
                          </p>
                          <div className="flex items-center gap-2">
                            {photo.emotionalTags.length > 0 && (
                              <div className="flex gap-1">
                                {photo.thematicIcons.slice(0, 3).map((icon, i) => (
                                  <span key={i} className="text-lg drop-shadow-sm">{icon}</span>
                                ))}
                              </div>
                            )}
                            <ReadTextButton 
                              explorationSlug={explorations[0]?.slug} 
                              photo={photo} 
                            />
                          </div>
                        </div>
                     </motion.div>
                  )}

                  {/* Navigation hints for side photos */}
                  {deviceType === 'desktop' && position !== 'current' && !isPreparing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <motion.div
                         className="w-12 h-12 rounded-full bg-slate-900/30 backdrop-blur-xl border border-cyan-400/30 shadow-xl shadow-cyan-500/20 flex items-center justify-center"
                         whileHover={{ scale: 1.1, backgroundColor: 'rgba(34, 211, 238, 0.2)', boxShadow: '0 0 30px rgba(34, 211, 238, 0.4)' }}
                       >
                        {position === 'previous' ? (
                           <ChevronLeft className="h-6 w-6 text-cyan-100" />
                         ) : (
                           <ChevronRight className="h-6 w-6 text-cyan-100" />
                        )}
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>

      </div>
    </div>
  );
});

  return (
    <div className="relative">
      {/* Render based on view mode */}
      {viewMode === 'fleuve-temporel' ? (
        <FleuveTemporel explorations={explorations} explorationName={explorationName} />
      ) : (
        <>
          {/* Render current view - only galerie mode supported */}
          <GalerieView 
            filteredPhotos={filteredPhotos}
            committedIndex={committedIndex}
            deviceType={deviceType}
            getPreloadedImage={getPreloadedImage}
            isPreparing={isPreparing}
            navigatePrevious={navigatePrevious}
            navigateNext={navigateNext}
            reduceMotion={reduceMotion}
            isTransitioning={isTransitioning}
          />

          {/* Global navigation controls */}
          <NavigationControls 
            shouldShowMenu={shouldShowMenu}
            canNavigatePrevious={canNavigatePrevious}
            canNavigateNext={canNavigateNext}
            navigatePrevious={navigatePrevious}
            navigateNext={navigateNext}
            committedIndex={committedIndex}
            totalPhotos={filteredPhotos.length}
            setIsMarcheSelectorOpen={setIsMarcheSelectorOpen}
            visualComfortMode={visualComfortMode}
            setVisualComfortMode={setVisualComfortMode}
          />

          {/* Marche Selector */}
          <MarcheSelector
            isOpen={isMarcheSelectorOpen}
            onClose={() => setIsMarcheSelectorOpen(false)}
            photos={filteredPhotos}
            onMarcheSelect={(marcheId) => {
              const firstPhotoIndex = filteredPhotos.findIndex(photo => 
                `${photo.ville}-${photo.nomMarche}` === marcheId
              );
              console.log('[GalerieFleuve] MarcheSelector: select', { marcheId, firstPhotoIndex });
              if (firstPhotoIndex !== -1) {
                void (async () => {
                  const success = await prepareNavigation(firstPhotoIndex);
                  if (success) {
                    completeNavigation(firstPhotoIndex);
                  }
                })();
              }
              setSelectedMarcheId(marcheId);
              setIsMarcheSelectorOpen(false);
            }}
            selectedMarcheId={currentDisplayPhoto ? `${currentDisplayPhoto.ville}-${currentDisplayPhoto.nomMarche}` : null}
            currentIndex={currentPhotoIndex}
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

        {/* Smart Overlays - Cross March & Progress Bar */}
        {showCrossMarche && crossMarcheInfo && (
          <PortalOverlay 
            visible={true} 
            label={`${crossMarcheInfo.to}`}
            progress={prepareProgress} 
            subtype="cross-marche" 
          />
        )}
        
        {showProgressBar && (
          <div className="fixed top-0 left-0 right-0 h-0.5 bg-cyan-400/20 z-50">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-150 ease-out"
              style={{ width: `${prepareProgress}%` }}
            />
          </div>
        )}
        
        {/* Debug UI */}
        {debugMode && (
          <div className="fixed top-4 left-4 z-50 bg-black/80 text-white text-xs p-3 rounded-lg font-mono max-w-xs">
            <div className="font-bold mb-2">🐛 Debug Info</div>
            <div>Device: {deviceType}</div>
            <div>Index: {committedIndex}/{filteredPhotos?.length || 0}</div>
            <div>Target: {targetIndex ?? 'none'}</div>
            <div>Preparing: {isPreparing ? '✅' : '❌'}</div>
            <div>Cross-March: {showCrossMarche ? '👁️' : '🚫'}</div>
            <div>Progress Bar: {showProgressBar ? '📊' : '🚫'}</div>
            <div>Progress: {prepareProgress}%</div>
            <div>Cache: {getCacheStats().size}/15</div>
          </div>
        )}
      </div>
  );
});

export default GalerieFleuve;