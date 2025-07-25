
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Play, 
  Pause, 
  Maximize, 
  Heart,
  Download,
  Share2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';
import { extractPhotosFromGoogleDrive, PhotoData } from '../utils/googleDriveApi';

interface ImmersiveVisualSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const ImmersiveVisualSection: React.FC<ImmersiveVisualSectionProps> = ({
  marche,
  theme
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [photosData, setPhotosData] = useState<PhotoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<string>('');

  useEffect(() => {
    const loadPhotos = async () => {
      setIsLoading(true);
      setLoadingStatus('Chargement des photos...');
      
      console.log(`\n=== Chargement des photos pour ${marche.ville} ===`);
      console.log('Lien Google Drive:', marche.lien);
      
      if (marche.lien) {
        try {
          const loadedPhotos = await extractPhotosFromGoogleDrive(marche.lien);
          console.log(`Photos récupérées pour ${marche.ville}:`, loadedPhotos);
          
          if (Array.isArray(loadedPhotos) && loadedPhotos.length > 0) {
            setPhotosData(loadedPhotos);
            setLoadingStatus(`${loadedPhotos.length} photos chargées`);
          } else {
            setPhotosData([]);
            setLoadingStatus('Aucune photo trouvée');
          }
        } catch (error) {
          console.error('Erreur lors du chargement des photos:', error);
          setPhotosData([]);
          setLoadingStatus('Erreur lors du chargement');
        }
      } else {
        console.log(`Aucun lien Google Drive pour ${marche.ville}`);
        setPhotosData([]);
        setLoadingStatus('Aucun lien Google Drive');
      }
      
      setIsLoading(false);
    };

    loadPhotos();
  }, [marche]);

  const toggleFavorite = (imageUrl: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(imageUrl)) {
      newFavorites.delete(imageUrl);
    } else {
      newFavorites.add(imageUrl);
    }
    setFavorites(newFavorites);
  };

  const PhotoImage: React.FC<{ src: string; alt: string; className?: string; onClick?: () => void }> = ({ 
    src, 
    alt, 
    className = "", 
    onClick 
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    return (
      <div className={`relative ${className}`} onClick={onClick}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          crossOrigin="anonymous"
        />
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-500 text-sm">Chargement...</div>
          </div>
        )}
        {imageError && (
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

  const videos = marche.videos || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingStatus}</p>
        </div>
      </div>
    );
  }

  if (photosData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">Aucune photo disponible</p>
          <p className="text-sm">Vérifiez le lien Google Drive pour {marche.ville}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-crimson font-bold flex items-center justify-center gap-3">
          <ImageIcon className="h-8 w-8" />
          Exploration Visuelle
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Découvrez {marche.ville} à travers {photosData.length} images captivantes
        </p>
      </motion.div>

      {/* Main Photo Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photosData.slice(0, 6).map((photo, index) => (
          <motion.div
            key={index}
            className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setSelectedImage(photo.urls[0])}
          >
            <PhotoImage
              src={photo.urls[0]}
              alt={`${marche.ville} - Photo ${index + 1}`}
              className="w-full h-full"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Actions */}
            <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(photo.urls[0]);
                }}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
              >
                <Heart 
                  className={`h-4 w-4 ${favorites.has(photo.urls[0]) ? 'fill-red-500 text-red-500' : ''}`} 
                />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Image Counter */}
            <div className="absolute bottom-3 left-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {index + 1} / {photosData.length}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Video Section */}
      {videos.length > 0 && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <Play className="h-6 w-6" />
            Séquences Vidéo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video, index) => (
              <motion.div
                key={index}
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
                  poster={photosData[0]?.urls[0] || undefined}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <motion.div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            className="relative max-w-4xl max-h-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={selectedImage}
              alt="Image agrandie"
              className="max-w-full max-h-full object-contain rounded-lg"
              crossOrigin="anonymous"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedImage(null)}
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
          Partager les images
        </Button>
      </motion.div>
    </div>
  );
};

export default ImmersiveVisualSection;
