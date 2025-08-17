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
  Music
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
  explorations: any[]; // Temporarily allow any to fix the immediate typing issue
  themes: RegionalTheme[];
}

interface EnrichedPhoto {
  id: string;
  url: string;
  titre?: string;
  description?: string;
  ordre?: number;
  exploration: any; // Temporarily allow any
  latitude?: number;
  longitude?: number;
  ville: string;
  departement: string;
  region: string;
  date?: string;
  emotionalTags: string[];
  thematicIcons: string[];
}

type ViewMode = 'constellation' | 'fleuve-temporel' | 'mosaique-vivante' | 'immersion-totale';
type FilterMode = 'all' | 'biodiversite' | 'bioacoustique' | 'botanique' | 'couleur' | 'saison';

const GalerieFleuve: React.FC<GalerieFluveProps> = memo(({ explorations, themes }) => {
  const [allPhotos, setAllPhotos] = useState<EnrichedPhoto[]>([]);
  const [visiblePhotos, setVisiblePhotos] = useState<EnrichedPhoto[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('constellation');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isMobile = useIsMobile();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const metadataCache = useRef<Map<string, { emotionalTags: string[], thematicIcons: string[] }>>(new Map());

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
      setVisiblePhotos(enrichedPhotos.slice(0, 20)); // Lazy loading initial
      setIsLoading(false);
    };

    if (explorations.length > 0) {
      loadAndEnrichPhotos();
    }
  }, [explorations, generateMetadata]);

  // Auto-navigation pour le mode immersion
  useEffect(() => {
    if (isPlaying && viewMode === 'immersion-totale') {
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

  const NavigationControls = () => (
    <motion.div 
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-2 bg-black/20 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20">
        {/* Mode selector */}
        <div className="flex gap-1">
          {[
            { mode: 'constellation' as ViewMode, icon: Star, color: 'from-blue-500 to-cyan-500' },
            { mode: 'fleuve-temporel' as ViewMode, icon: Waves, color: 'from-purple-500 to-pink-500' },
            { mode: 'mosaique-vivante' as ViewMode, icon: Grid3X3, color: 'from-green-500 to-emerald-500' },
            { mode: 'immersion-totale' as ViewMode, icon: Eye, color: 'from-orange-500 to-red-500' }
          ].map(({ mode, icon: Icon, color }) => (
            <Button
              key={mode}
              size={isMobile ? "sm" : "default"}
              variant={viewMode === mode ? "default" : "ghost"}
              onClick={() => setViewMode(mode)}
              className={`p-2 ${viewMode === mode ? `bg-gradient-to-r ${color}` : 'bg-white/10'} hover:scale-110 transition-all`}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        {/* Playback controls for immersion mode */}
        {viewMode === 'immersion-totale' && (
          <Button
            size={isMobile ? "sm" : "default"}
            variant="ghost"
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-white/10 hover:bg-white/20"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        )}

        {/* Filter button */}
        <Button
          size={isMobile ? "sm" : "default"}
          variant="ghost"
          onClick={() => {
            const filters: FilterMode[] = ['all', 'biodiversite', 'bioacoustique', 'botanique', 'couleur', 'saison'];
            const currentIndex = filters.indexOf(filterMode);
            setFilterMode(filters[(currentIndex + 1) % filters.length]);
          }}
          className="bg-white/10 hover:bg-white/20"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  const ConstellationView = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-green-50 to-blue-100">
      {/* Vue constellation interactive */}
      <div className="relative h-screen overflow-hidden">
        <motion.div 
          className="absolute inset-0 flex items-center"
          animate={{ x: `-${currentPhoto * (isMobile ? 100 : 33.33)}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
          {filteredPhotos.map((photo, index) => (
            <motion.div
              key={`${photo.id}-${index}`}
              className={`flex-shrink-0 ${isMobile ? 'w-full' : 'w-1/3'} h-full relative cursor-pointer`}
              onClick={() => setSelectedPhoto(index)}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={photo.url}
                alt={photo.titre || 'Photo exploration'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Métadonnées géopoétiques */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge className="mb-2 bg-white/20 text-white border-white/30">
                    {photo.ville}
                  </Badge>
                  <h3 className="text-lg font-bold mb-1">
                    Fragments de {photo.departement}
                  </h3>
                  <p className="text-sm opacity-90">
                    Latitude vivante : {photo.latitude?.toFixed(4)}°
                  </p>
                  <div className="flex gap-1 mt-2">
                    {photo.thematicIcons.slice(0, 3).map((icon, i) => (
                      <span key={i} className="text-white/80">{icon}</span>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Éléments décoratifs selon le thème */}
              <div className="absolute top-4 right-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="h-6 w-6 text-white/60" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation dots */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
          {filteredPhotos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPhoto(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentPhoto ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
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
              <div className={`w-full ${isMobile ? 'px-2' : 'px-8'}`}>
                <Card className="p-4 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => setSelectedPhoto(index)}>
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

        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-4'}`}>
          {filteredPhotos.map((photo, index) => (
            <motion.div
              key={`${photo.id}-mosaic`}
              className="relative group cursor-pointer aspect-square overflow-hidden rounded-xl"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.05, type: "spring" }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              onClick={() => setSelectedPhoto(index)}
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

  const ImmersionTotaleView = () => {
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
              {photo.titre || 'Fragment d\'une exploration bioacoustique révélant les secrets du vivant'}
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
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={() => setCurrentPhoto(prev => prev > 0 ? prev - 1 : filteredPhotos.length - 1)}
                className="text-white hover:bg-white/20"
              >
                <ArrowUp className="h-5 w-5 mr-2" />
                Précédent
              </Button>
              
              <span className="text-sm opacity-75">
                {currentPhoto + 1} / {filteredPhotos.length}
              </span>
              
              <Button
                variant="ghost"
                onClick={() => setCurrentPhoto(prev => (prev + 1) % filteredPhotos.length)}
                className="text-white hover:bg-white/20"
              >
                Suivant
                <ArrowDown className="h-5 w-5 ml-2" />
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
      {viewMode === 'constellation' && <ConstellationView />}
      {viewMode === 'fleuve-temporel' && <FleuveTemporelView />}
      {viewMode === 'mosaique-vivante' && <MosaiqueVivanteView />}
      {viewMode === 'immersion-totale' && <ImmersionTotaleView />}

      {/* Global navigation controls */}
      <NavigationControls />

      {/* Photo detail modal */}
      <PhotoModal />

      {/* Filter indicator */}
      {filterMode !== 'all' && (
        <motion.div
          className="fixed top-4 left-4 z-50"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <Badge className="bg-black/20 backdrop-blur-lg text-white border-white/30">
            <Filter className="h-3 w-3 mr-1" />
            {filterMode}
          </Badge>
        </motion.div>
      )}
    </div>
  );
});

export default GalerieFleuve;