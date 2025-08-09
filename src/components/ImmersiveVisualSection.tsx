
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Play, 
  Pause, 
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  Video as VideoIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface ImmersiveVisualSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const ImmersiveVisualSection: React.FC<ImmersiveVisualSectionProps> = ({
  marche,
  theme
}) => {
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: 'photo' | 'video'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const galleryRef = useRef<HTMLDivElement | null>(null);

  // Récupérer les photos et vidéos depuis les props (maintenant depuis Supabase)
  const photos = marche.photos || [];
  const videos = marche.videos || [];
  
  // Combiner photos et vidéos pour la galerie
  const mediaItems = [
    ...photos.map(url => ({ url, type: 'photo' as const })),
    ...videos.map(url => ({ url, type: 'video' as const }))
  ];

console.log(`🎥 Galerie ${marche.ville}:`, {
  photos: photos.length,
  videos: videos.length,
  total: mediaItems.length
});

// Pagination (6 éléments par page)
const [currentPage, setCurrentPage] = useState(0);
const pageSize = 6;
const totalPages = Math.ceil(mediaItems.length / pageSize);
const startIndex = currentPage * pageSize;
const pageItems = mediaItems.slice(startIndex, startIndex + pageSize);

// Réinitialiser la page quand les médias changent
useEffect(() => {
  setCurrentPage(0);
}, [marche.ville, mediaItems.length]);

// Scroll doux vers la galerie au changement de page
useEffect(() => {
  if (galleryRef.current) {
    galleryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}, [currentPage]);

// Navigation clavier (flèches gauche/droite)
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (totalPages <= 1) return;
    if (e.key === 'ArrowLeft') {
      setCurrentPage((p) => Math.max(0, p - 1));
    } else if (e.key === 'ArrowRight') {
      setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
    }
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, [totalPages]);

const MediaItem: React.FC<{ 
  src: string; 
  type: 'photo' | 'video';
  alt: string; 
  className?: string; 
  onClick?: () => void 
}> = ({ src, type, alt, className = "", onClick }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  if (type === 'video') {
    return (
      <div className={`relative ${className}`} onClick={onClick}>
        <video
          src={src}
          className="w-full h-full object-cover"
          onLoadedData={() => setMediaLoaded(true)}
          onError={() => setMediaError(true)}
          preload="metadata"
          muted
        />
        {/* Overlay vidéo */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 rounded-full p-2">
            <VideoIcon className="h-6 w-6 text-gray-800" />
          </div>
        </div>
        {!mediaLoaded && !mediaError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-500 text-sm">Chargement vidéo...</div>
          </div>
        )}
        {mediaError && (
          <div className="absolute inset-0 bg-red-100 flex items-center justify-center">
            <div className="text-red-500 text-sm text-center">
              <AlertCircle className="h-4 w-4 mx-auto mb-1" />
              Erreur vidéo
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        onLoad={() => setMediaLoaded(true)}
        onError={() => setMediaError(true)}
        crossOrigin="anonymous"
      />
      {!mediaLoaded && !mediaError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-500 text-sm">Chargement...</div>
        </div>
      )}
      {mediaError && (
        <div className="absolute inset-0 bg-red-100 flex items-center justify-center">
          <div className="text-red-500 text-sm text-center">
            <AlertCircle className="h-4 w-4 mx-auto mb-1" />
            Erreur
          </div>
        </div>
      )}
    </div>
  );
};

  if (mediaItems.length === 0) {
    return (
      <div className="pt-16 flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">Aucune image ou vidéo disponible</p>
          <p className="text-sm">Les médias de {marche.ville} seront bientôt disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-16">
      {/* Section Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-crimson font-bold flex items-center justify-center gap-3">
          <ImageIcon className="h-8 w-8" />
          Exploration Visuelle
        </h2>
      </motion.div>

      {/* Main Media Gallery */}
      <div ref={galleryRef} className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageItems.map((media, index) => (
            <motion.div
              key={`${media.type}-${startIndex + index}-${media.url}`}
              className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedMedia(media)}
            >
              <MediaItem
                src={media.url}
                type={media.type}
                alt={`${marche.ville} - ${media.type === 'video' ? 'Vidéo' : 'Photo'} ${startIndex + index + 1}`}
                className="w-full h-full"
              />
              
              {/* Type Badge */}
              {media.type === 'video' && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                  <VideoIcon className="h-3 w-3 mr-1" />
                  Vidéo
                </Badge>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Media Counter */}
              <div className="absolute bottom-3 left-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {startIndex + index + 1} / {mediaItems.length}
              </div>
            </motion.div>
          ))}
        </div>

        {totalPages > 1 && (
          <>
            <Button
              type="button"
              aria-label="Page précédente"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              size="icon"
              variant="outline"
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-foreground/60 text-background ring-1 ring-ring/30 hover:bg-foreground/70 backdrop-blur-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              aria-label="Page suivante"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              size="icon"
              variant="outline"
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-foreground/60 text-background ring-1 ring-ring/30 hover:bg-foreground/70 backdrop-blur-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pagination de la galerie" className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Page précédente"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>

            <div className="flex items-center gap-2" role="group" aria-label="Choisir la page">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={`dot-${i}`}
                  type="button"
                  aria-label={`Aller à la page ${i + 1}`}
                  onClick={() => setCurrentPage(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${i === currentPage ? 'bg-primary' : 'bg-foreground/20 hover:bg-foreground/40'}`}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Page suivante"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground font-medium select-none">
            {currentPage + 1} / {totalPages}
          </div>
        </nav>
      )}


      {/* Additional Videos Section */}
      {videos.length > 0 && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <VideoIcon className="h-6 w-6" />
            Séquences Vidéo ({videos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.slice(0, 4).map((video, index) => (
              <motion.div
                key={`video-${index}-${video}`}
                className="relative group rounded-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <video
                  src={video}
                  className="w-full h-64 object-cover"
                  controls
                  preload="metadata"
                  poster={photos[0] || undefined}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lightbox Modal */}
      {selectedMedia && (
        <motion.div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedMedia(null)}
        >
          <motion.div
            className="relative max-w-4xl max-h-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {selectedMedia.type === 'video' ? (
              <video
                src={selectedMedia.url}
                className="max-w-full max-h-full object-contain rounded-lg"
                controls
                autoPlay
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt="Média agrandi"
                className="max-w-full max-h-full object-contain rounded-lg"
                crossOrigin="anonymous"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
            >
              ×
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Gallery Actions */}
      <motion.div
        className="flex justify-center space-x-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Télécharger la galerie
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Partager les médias
        </Button>
      </motion.div>
    </div>
  );
};

export default ImmersiveVisualSection;
