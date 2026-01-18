import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, Leaf, Bird, Bug, HelpCircle, Loader2, 
  X, MapPin, List, Music, Camera, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useSpeciesPhoto } from '@/hooks/useSpeciesPhoto';
import { useSpeciesTranslation } from '@/hooks/useSpeciesTranslation';
import { useSpeciesMarches } from '@/hooks/useSpeciesMarches';
import { useSpeciesXenoCanto } from '@/hooks/useSpeciesXenoCanto';
import SpeciesMarchesTab from './species-modal/SpeciesMarchesTab';
import SpeciesAudioPlayer from './species-modal/SpeciesAudioPlayer';
import SpeciesMiniMap from './species-modal/SpeciesMiniMap';

interface SpeciesGalleryDetailModalProps {
  species: {
    name: string;
    scientificName: string;
    count: number;
    kingdom: string;
    photos?: string[];
  } | null;
  explorationId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const getKingdomInfo = (kingdom: string) => {
  const lowerKingdom = kingdom?.toLowerCase() || '';
  if (lowerKingdom.includes('plant') || lowerKingdom.includes('flore') || lowerKingdom === 'plantae') {
    return { icon: Leaf, label: 'Flore', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
  if (lowerKingdom.includes('bird') || lowerKingdom.includes('aves')) {
    return { icon: Bird, label: 'Oiseau', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
  }
  if (lowerKingdom.includes('insect') || lowerKingdom.includes('arthropod')) {
    return { icon: Bug, label: 'Insecte', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  }
  if (lowerKingdom.includes('animal') || lowerKingdom.includes('faune') || lowerKingdom === 'animalia') {
    return { icon: Bird, label: 'Faune', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  }
  if (lowerKingdom.includes('fung')) {
    return { icon: Leaf, label: 'Champignon', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  }
  return { icon: HelpCircle, label: kingdom || 'Inconnu', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
};

const SpeciesGalleryDetailModal: React.FC<SpeciesGalleryDetailModalProps> = ({
  species,
  explorationId,
  isOpen,
  onClose,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Fetch real-time photo data from iNaturalist when modal opens
  const { data: photoData, isLoading: photoLoading } = useSpeciesPhoto(
    isOpen ? species?.scientificName : undefined
  );

  // Fetch French translation
  const { data: translation, isLoading: translationLoading } = useSpeciesTranslation(
    species?.scientificName || '',
    species?.name
  );

  // Fetch marches where this species was observed
  const { data: speciesMarches = [], isLoading: marchesLoading } = useSpeciesMarches(
    isOpen ? species?.scientificName : undefined,
    explorationId
  );

  // Fetch audio from Xeno-Canto
  const { data: xenoCantoData, isLoading: audioLoading } = useSpeciesXenoCanto(
    isOpen ? species?.scientificName : undefined,
    species?.kingdom
  );

  if (!species) return null;

  // Use fetched data if available, otherwise fall back to props
  const photos = (photoData?.photos && photoData.photos.length > 0) 
    ? photoData.photos 
    : species.photos || [];
  const kingdom = (photoData?.kingdom && photoData.kingdom !== 'Unknown') 
    ? photoData.kingdom 
    : species.kingdom;

  // French name priority: translation > photoData > original
  const frenchName = translation?.commonName || photoData?.commonName || species.name;
  const isEnglishFallback = frenchName === species.name && translation?.source === 'fallback';

  const hasPhoto = photos.length > 0;
  const hasMarches = speciesMarches.length > 0;
  const hasAudio = xenoCantoData && xenoCantoData.recordings.length > 0;
  const kingdomInfo = getKingdomInfo(kingdom);
  const KingdomIcon = kingdomInfo.icon;

  // Check if current photo is from marcheur (personal photo)
  const isMarcheurPhoto = species.photos && species.photos.length > 0 && currentPhotoIndex === 0 && 
    species.photos[0]?.includes('supabase') || species.photos?.[0]?.includes('storage');

  // Build external search URLs
  const gbifSearchUrl = `https://www.gbif.org/species/search?q=${encodeURIComponent(species.scientificName)}`;
  const inaturalistSearchUrl = `https://www.inaturalist.org/taxa/search?q=${encodeURIComponent(species.scientificName)}`;
  const xenoCantoSearchUrl = `https://xeno-canto.org/explore?query=${encodeURIComponent(species.scientificName)}`;

  const totalMarchesCount = speciesMarches.length;
  const isLoading = photoLoading || translationLoading;

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-slate-900/98 backdrop-blur-xl border-white/10 text-white max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Hero Image Section */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-white/40" />
              </div>
            ) : hasPhoto ? (
              <>
                <motion.img
                  key={currentPhotoIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={photos[currentPhotoIndex]}
                  alt={frenchName}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowLightbox(true)}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                
                {/* Navigation arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Photo badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {isMarcheurPhoto && (
                    <Badge className="bg-amber-500/90 text-white text-xs">
                      📸 Photo marcheur
                    </Badge>
                  )}
                </div>

                {/* Photo counter */}
                {photos.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.slice(0, 5).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentPhotoIndex
                            ? 'bg-white'
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                      />
                    ))}
                    {photos.length > 5 && (
                      <span className="text-xs text-white/60 ml-1">+{photos.length - 5}</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white/40 space-y-2">
                  <KingdomIcon className="w-16 h-16 mx-auto opacity-30" />
                  <p className="text-sm">Photo non disponible</p>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* Identity Section */}
            <div className="space-y-2">
              {/* French name - prominent */}
              <h2 className="text-2xl font-semibold text-white leading-tight">
                {frenchName}
                {isEnglishFallback && (
                  <span className="ml-2 text-xs text-white/40 font-normal">(nom anglais)</span>
                )}
              </h2>
              
              {/* Scientific name */}
              <p className="text-sm text-white/50 italic">{species.scientificName}</p>
              
              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <Badge variant="outline" className={`${kingdomInfo.color} flex items-center gap-1`}>
                  <KingdomIcon className="w-3 h-3" />
                  {kingdomInfo.label}
                </Badge>
                
                <Badge variant="outline" className="bg-white/5 text-white/70 border-white/20">
                  {species.count} observation{species.count > 1 ? 's' : ''}
                  {hasMarches && ` sur ${totalMarchesCount} marche${totalMarchesCount > 1 ? 's' : ''}`}
                </Badge>
              </div>
            </div>

            {/* Marches Section - with tabs */}
            {(hasMarches || marchesLoading) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Observé sur ces marches</span>
                </div>
                
                <Tabs defaultValue="list" className="w-full">
                  <TabsList className="w-full bg-white/5 border border-white/10">
                    <TabsTrigger value="list" className="flex-1 data-[state=active]:bg-white/10">
                      <List className="w-3 h-3 mr-1.5" />
                      Liste
                    </TabsTrigger>
                    <TabsTrigger value="map" className="flex-1 data-[state=active]:bg-white/10">
                      <MapPin className="w-3 h-3 mr-1.5" />
                      Carte
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="list" className="mt-3">
                    <SpeciesMarchesTab marches={speciesMarches} isLoading={marchesLoading} />
                  </TabsContent>
                  
                  <TabsContent value="map" className="mt-3">
                    <SpeciesMiniMap marches={speciesMarches} isLoading={marchesLoading} />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Audio Section */}
            {(hasAudio || audioLoading) && (
              <SpeciesAudioPlayer
                recordings={xenoCantoData?.recordings || []}
                numRecordings={xenoCantoData?.numRecordings || 0}
                scientificName={species.scientificName}
                isLoading={audioLoading}
              />
            )}

            {/* External links */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-white/40 mb-2">Rechercher sur :</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-[80px] bg-white/5 border-white/10 hover:bg-white/10 text-white/70 text-xs"
                  onClick={() => window.open(gbifSearchUrl, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  GBIF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-[80px] bg-white/5 border-white/10 hover:bg-white/10 text-white/70 text-xs"
                  onClick={() => window.open(inaturalistSearchUrl, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  iNaturalist
                </Button>
                {(hasAudio || kingdom.toLowerCase().includes('animal') || kingdom.toLowerCase().includes('aves')) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[80px] bg-white/5 border-white/10 hover:bg-white/10 text-white/70 text-xs"
                    onClick={() => window.open(xenoCantoSearchUrl, '_blank')}
                  >
                    <Music className="w-3 h-3 mr-1" />
                    Xeno-Canto
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && hasPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setShowLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              onClick={() => setShowLightbox(false)}
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={photos[currentPhotoIndex]}
              alt={frenchName}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Navigation in lightbox */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Caption */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <p className="text-lg text-white font-medium">{frenchName}</p>
              <p className="text-sm text-white/60 italic">{species.scientificName}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SpeciesGalleryDetailModal;
