import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Camera, Volume2, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';
import 'leaflet/dist/leaflet.css';

// Custom marker icon for Dordogne theme
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0z" fill="#8B4513"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#FFFFFF"/>
      <circle cx="12.5" cy="12.5" r="3" fill="#8B4513"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

interface FleuveTemporelProps {
  explorations: MarcheTechnoSensible[];
  explorationName?: string;
}

interface PhotoData {
  id: string;
  url: string;
  titre?: string;
  description?: string;
  marcheId: string;
  marcheName: string;
  ville: string;
  departement: string;
  region: string;
  date: string;
  latitude?: number;
  longitude?: number;
}

interface TimelinePoint {
  date: string;
  marches: MarcheTechnoSensible[];
  photos: PhotoData[];
  coordinates: { lat: number; lng: number }[];
}

const FleuveTemporel: React.FC<FleuveTemporelProps> = ({ explorations, explorationName }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [photoPage, setPhotoPage] = useState(0);

  // Process data into timeline points
  const timelineData = useMemo(() => {
    const dateMap = new Map<string, TimelinePoint>();

    explorations.forEach(marche => {
      const date = marche.date || 'Non daté';
      
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          marches: [],
          photos: [],
          coordinates: []
        });
      }

      const point = dateMap.get(date)!;
      point.marches.push(marche);

      if (marche.latitude && marche.longitude) {
        point.coordinates.push({
          lat: Number(marche.latitude),
          lng: Number(marche.longitude)
        });
      }

      // Add photos - handle both string array and object array formats
      if (marche.photos && Array.isArray(marche.photos)) {
        marche.photos.forEach((photo, index) => {
          let photoData: PhotoData;
          
          if (typeof photo === 'string') {
            // Handle string array format
            photoData = {
              id: `${marche.id}-${index}`,
              url: photo,
              titre: `Photo ${index + 1}`,
              description: '',
              marcheId: marche.id!,
              marcheName: marche.nomMarche || marche.ville,
              ville: marche.ville,
              departement: marche.departement || '',
              region: marche.region || '',
              date: marche.date || '',
              latitude: marche.latitude ? Number(marche.latitude) : undefined,
              longitude: marche.longitude ? Number(marche.longitude) : undefined,
            };
          } else {
            // Handle object format (with url_supabase, titre, etc.)
            photoData = {
              id: `${marche.id}-${index}`,
              url: (photo as any).url_supabase || (photo as any).url || '',
              titre: (photo as any).titre || `Photo ${index + 1}`,
              description: (photo as any).description || '',
              marcheId: marche.id!,
              marcheName: marche.nomMarche || marche.ville,
              ville: marche.ville,
              departement: marche.departement || '',
              region: marche.region || '',
              date: marche.date || '',
              latitude: marche.latitude ? Number(marche.latitude) : undefined,
              longitude: marche.longitude ? Number(marche.longitude) : undefined,
            };
          }
          
          if (photoData.url) {
            point.photos.push(photoData);
          }
        });
      }

      // Also check for photosData (full photo objects from Supabase)
      if ((marche as any).photosData && Array.isArray((marche as any).photosData)) {
        (marche as any).photosData.forEach((photo: any, index: number) => {
          const photoData: PhotoData = {
            id: `${marche.id}-photos-${index}`,
            url: photo.url_supabase || '',
            titre: photo.titre || `Photo ${index + 1}`,
            description: photo.description || '',
            marcheId: marche.id!,
            marcheName: marche.nomMarche || marche.ville,
            ville: marche.ville,
            departement: marche.departement || '',
            region: marche.region || '',
            date: marche.date || '',
            latitude: marche.latitude ? Number(marche.latitude) : undefined,
            longitude: marche.longitude ? Number(marche.longitude) : undefined,
          };
          
          if (photoData.url) {
            point.photos.push(photoData);
          }
        });
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => {
      if (a.date === 'Non daté') return 1;
      if (b.date === 'Non daté') return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [explorations]);

  // Get current photos to display
  const currentPhotos = useMemo(() => {
    if (selectedDate) {
      const point = timelineData.find(p => p.date === selectedDate);
      return point?.photos || [];
    }
    return timelineData.flatMap(point => point.photos);
  }, [timelineData, selectedDate]);

  // Get photos per page based on device
  const photosPerPage = isMobile ? 1 : 3;
  const totalPages = Math.max(1, Math.ceil(currentPhotos.length / photosPerPage));
  const currentPagePhotos = currentPhotos.slice(photoPage * photosPerPage, (photoPage + 1) * photosPerPage);

  // Map markers
  const mapMarkers = useMemo(() => {
    if (selectedDate) {
      const point = timelineData.find(p => p.date === selectedDate);
      return point ? point.marches : [];
    }
    return explorations.filter(m => m.latitude && m.longitude);
  }, [timelineData, selectedDate, explorations]);

  const handlePhotoClick = useCallback((photo: PhotoData, index: number) => {
    if (isMobile) {
      setSelectedPhoto(photo);
    } else {
      // Desktop/landscape: set clicked photo as first in pagination
      const globalIndex = photoPage * photosPerPage + index;
      const newPage = Math.floor(globalIndex / photosPerPage);
      setPhotoPage(newPage);
      setSelectedPhoto(photo);
    }
  }, [isMobile, photoPage, photosPerPage]);

  const nextPhotoPage = () => {
    setPhotoPage((prev) => (prev + 1) % totalPages);
  };

  const prevPhotoPage = () => {
    setPhotoPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  // Helper functions for timeline formatting
  const formatTimelineDate = (date: string) => {
    if (date === 'Non daté') return date;
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch {
      return date;
    }
  };

  const getTotalAudios = (marches: MarcheTechnoSensible[]) => {
    return marches.reduce((total, marche) => {
      return total + (marche.audioFiles?.length || 0) + (marche.audioData?.length || 0);
    }, 0);
  };

  // Handle marker click to sync with timeline
  const handleMarkerClick = useCallback((marche: MarcheTechnoSensible) => {
    const marcheDate = marche.date;
    if (marcheDate) {
      setSelectedDate(marcheDate);
      setPhotoPage(0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent/80 to-secondary text-primary-foreground">
      {/* Navigation Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => window.location.href = `/galerie-fleuve/exploration/${window.location.pathname.split('/')[3]}`}
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-white/10"
          >
            <Home className="h-4 w-4 mr-2" />
            Accueil
          </Button>
          <Badge className="bg-white/20 text-primary-foreground border-white/30">
            <Calendar className="h-4 w-4 mr-2" />
            Fleuve temporel
          </Badge>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold mb-2">
          {explorationName || 'Chronologie du Périple'}
        </h1>
        <p className="text-lg opacity-80 mb-8">
          Naviguez dans le temps de {explorationName ? 'cette exploration' : 'la remontée Dordogne'} • {explorations.length} marches
        </p>
      </div>

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Map Section - Now on the left */}
        <div className="space-y-4 order-2 lg:order-1">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Carte des marches
          </h2>
          <div className="h-96 rounded-lg overflow-hidden border border-white/20">
            <MapContainer
              center={[45.1, 1.2]}
              zoom={8}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mapMarkers.map((marche, index) => (
                <Marker 
                  key={`${marche.id}-${index}`}
                  position={[Number(marche.latitude), Number(marche.longitude)]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => handleMarkerClick(marche)
                  }}
                >
                  <Popup>
                    <div className="text-slate-800">
                      <h3 className="font-semibold">{marche.nomMarche || marche.ville}</h3>
                      <p className="text-sm">{marche.ville}, {marche.departement}</p>
                      <p className="text-sm">{marche.region}</p>
                      <div className="flex items-center text-xs">
                        <Camera className="h-3 w-3 mr-1" />
                        {marche.photos?.length || 0} photos
                      </div>
                      <div className="flex items-center text-xs">
                        <Volume2 className="h-3 w-3 mr-1" />
                        {marche.audioFiles?.length || marche.audioData?.length || 0} audio
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Timeline Section - Now on the right */}
        <div className="space-y-4 order-1 lg:order-2">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Timeline des marches
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <Button
              onClick={() => setSelectedDate(null)}
              variant={selectedDate === null ? "secondary" : "ghost"}
              className={`w-full justify-start ${selectedDate === null ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Toutes les dates ({explorations.length} marches)
            </Button>
            {timelineData.map((point) => (
              <Button
                key={point.date}
                onClick={() => {
                  setSelectedDate(point.date);
                  setPhotoPage(0);
                }}
                variant={selectedDate === point.date ? "secondary" : "ghost"}
                className={`w-full justify-start text-left ${selectedDate === point.date ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <div>
                    {formatTimelineDate(point.date)} ({point.marches.length} marche{point.marches.length > 1 ? 's' : ''})
                  </div>
                  <div className="text-xs opacity-80">
                    {point.marches.map(m => m.ville).join(', ')} • {point.photos.length} photo{point.photos.length > 1 ? 's' : ''} • {getTotalAudios(point.marches)} audio{getTotalAudios(point.marches) > 1 ? 's' : ''}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Photo Gallery Section */}
      {currentPhotos.length > 0 && (
        <div className="container mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Photos {selectedDate ? `du ${selectedDate}` : 'du périple'} 
              <Badge variant="secondary" className="ml-2">
                {currentPhotos.length}
              </Badge>
            </h2>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button onClick={prevPhotoPage} size="sm" variant="ghost" className="hover:bg-white/10">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {photoPage + 1} / {totalPages}
                </span>
                <Button onClick={nextPhotoPage} size="sm" variant="ghost" className="hover:bg-white/10">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Photo Grid */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-6`}>
            {currentPagePhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="cursor-pointer"
                onClick={() => handlePhotoClick(photo, index)}
              >
                <Card className="bg-white/10 border-white/20 overflow-hidden hover:bg-white/20 transition-all duration-300">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.titre || 'Photo du périple'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm mb-1">
                      {photo.titre || photo.marcheName}
                    </h3>
                    <p className="text-xs opacity-80">
                      {photo.ville} • {photo.departement}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              className="max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.titre || 'Photo'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {selectedPhoto.titre || selectedPhoto.marcheName}
                </h3>
                <p className="text-slate-600 mb-2">
                  {selectedPhoto.ville} • {selectedPhoto.departement} • {selectedPhoto.region}
                </p>
                {selectedPhoto.description && (
                  <p className="text-slate-700">{selectedPhoto.description}</p>
                )}
                <Button
                  onClick={() => setSelectedPhoto(null)}
                  className="mt-4"
                  variant="outline"
                >
                  Fermer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FleuveTemporel;