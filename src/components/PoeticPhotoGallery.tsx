import React, { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Badge } from './ui/badge';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Heart, 
  Eye,
  Camera,
  Palette,
  Zap
} from 'lucide-react';
import { extractPhotosFromGoogleDrive } from '../utils/googleDriveApi';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface PoeticPhotoGalleryProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const PoeticPhotoGallery: React.FC<PoeticPhotoGalleryProps> = ({ marche, theme }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid' | 'poetic'>('poetic');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadPhotos = async () => {
      setIsLoading(true);
      setFailedImages(new Set()); // Reset failed images
      
      console.log(`\n=== Chargement des photos pour ${marche.ville} ===`);
      console.log('Lien Google Drive:', marche.lien);
      
      if (marche.lien) {
        try {
          const loadedPhotos = await extractPhotosFromGoogleDrive(marche.lien);
          console.log(`Photos récupérées pour ${marche.ville}:`, loadedPhotos);
          console.log(`Nombre de photos trouvées: ${loadedPhotos.length}`);
          
          setPhotos(loadedPhotos);
        } catch (error) {
          console.error('Erreur lors du chargement des photos:', error);
          setPhotos([]);
        }
      } else {
        console.log(`Aucun lien Google Drive pour ${marche.ville}`);
        setPhotos([]);
      }
      
      setIsLoading(false);
    };

    loadPhotos();
  }, [marche]);

  const handleImageError = (photoUrl: string) => {
    console.error('Erreur de chargement de l\'image:', photoUrl);
    setFailedImages(prev => new Set([...prev, photoUrl]));
  };

  const getValidPhotos = () => {
    return photos.filter(photo => !failedImages.has(photo));
  };

  // Fonction pour convertir les URLs Google Drive en URLs d'images affichables
  const convertToEmbeddableUrl = (url: string): string => {
    if (url.includes('/view')) {
      const fileId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        // Utiliser l'API de thumbnail Google Drive avec une taille plus grande
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
      }
    }
    return url;
  };

  const ViewModeSelector = () => (
    <div className="flex justify-center space-x-1 mb-4">
      <button
        onClick={() => setViewMode('poetic')}
        className={`p-2 rounded-full transition-all duration-300 ${
          viewMode === 'poetic' 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
            : 'bg-white/20 text-gray-600 hover:bg-white/40'
        }`}
      >
        <Sparkles className="h-4 w-4" />
      </button>
      <button
        onClick={() => setViewMode('carousel')}
        className={`p-2 rounded-full transition-all duration-300 ${
          viewMode === 'carousel' 
            ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg' 
            : 'bg-white/20 text-gray-600 hover:bg-white/40'
        }`}
      >
        <Camera className="h-4 w-4" />
      </button>
      <button
        onClick={() => setViewMode('grid')}
        className={`p-2 rounded-full transition-all duration-300 ${
          viewMode === 'grid' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
            : 'bg-white/20 text-gray-600 hover:bg-white/40'
        }`}
      >
        <Palette className="h-4 w-4" />
      </button>
    </div>
  );

  const PoeticView = () => {
    const validPhotos = getValidPhotos();
    
    return (
      <div className="relative">
        <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
          {validPhotos.length > 0 && (
            <div className="absolute inset-0">
              <img
                src={convertToEmbeddableUrl(validPhotos[currentIndex])}
                alt={`${marche.ville} - Vision poétique`}
                className="w-full h-full object-cover opacity-70"
                onError={() => handleImageError(validPhotos[currentIndex])}
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-pink-900/40" />
            </div>
          )}
          
          {/* Overlay poétique */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                {marche.ville}
              </h3>
              <p className="text-sm opacity-90">{validPhotos.length} vision{validPhotos.length > 1 ? 's' : ''} révélée{validPhotos.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          
          {/* Navigation poétique */}
          {validPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-2">
                {validPhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Effets visuels */}
          <div className="absolute top-4 right-4 text-white/60">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
        </div>
        
        {/* Métadonnées poétiques */}
        {validPhotos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {validPhotos.slice(0, 3).map((photo, index) => (
              <div
                key={index}
                className={`relative h-16 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                  index === currentIndex ? 'ring-2 ring-purple-400 scale-105' : 'hover:scale-102'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <img
                  src={convertToEmbeddableUrl(photo)}
                  alt={`Aperçu ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(photo)}
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const CarouselView = () => {
    const validPhotos = getValidPhotos();
    
    return (
      <div className="relative">
        <Carousel className="w-full">
          <CarouselContent>
            {validPhotos.map((photo, index) => (
              <CarouselItem key={index}>
                <div className="relative group">
                  <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={convertToEmbeddableUrl(photo)}
                      alt={`${marche.ville} - Photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => handleImageError(photo)}
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{index + 1}/{validPhotos.length}</span>
                        <Heart className="h-4 w-4 hover:text-red-400 transition-colors cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </div>
    );
  };

  const GridView = () => {
    const validPhotos = getValidPhotos();
    
    return (
      <div className="grid grid-cols-2 gap-3">
        {validPhotos.slice(0, 8).map((photo, index) => (
          <div
            key={index}
            className="relative group aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer"
            onClick={() => setCurrentIndex(index)}
          >
            <img
              src={convertToEmbeddableUrl(photo)}
              alt={`${marche.ville} - Photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => handleImageError(photo)}
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs text-white font-medium">{index + 1}</span>
              </div>
            </div>
          </div>
        ))}
        {validPhotos.length > 8 && (
          <div className="col-span-2 flex justify-center">
            <Badge variant="outline" className="text-xs">
              +{validPhotos.length - 8} autres photos
            </Badge>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Récupération des photos Google Drive...</p>
        </div>
      </div>
    );
  }

  const validPhotos = getValidPhotos();

  if (validPhotos.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune photo trouvée ou accessible</p>
          <p className="text-xs mt-1">Vérifiez le lien Google Drive ou les permissions</p>
          {photos.length > 0 && (
            <p className="text-xs mt-1 text-orange-600">
              {photos.length} photo{photos.length > 1 ? 's' : ''} détectée{photos.length > 1 ? 's' : ''} mais non accessible{photos.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center">
          <ImageIcon className="h-4 w-4 mr-2" />
          Photos réelles ({validPhotos.length})
        </h4>
        <ViewModeSelector />
      </div>
      
      {viewMode === 'poetic' && <PoeticView />}
      {viewMode === 'carousel' && <CarouselView />}
      {viewMode === 'grid' && <GridView />}
    </div>
  );
};

export default PoeticPhotoGallery;
