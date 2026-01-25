import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Flower2, TreeDeciduous, MapPin, Calendar } from 'lucide-react';
import type { RandomSpecies } from '@/hooks/useRandomExplorationData';

interface SpeciesApparitionProps {
  species: RandomSpecies;
  position: { x: number; y: number };
  onExpire: () => void;
  ttl: number;
  zIndex?: number;
}

const SpeciesApparition: React.FC<SpeciesApparitionProps> = ({
  species,
  position,
  onExpire,
  ttl,
  zIndex = 100,
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Auto-expire après TTL
  useEffect(() => {
    if (isPinned) return;
    const timer = setTimeout(onExpire, ttl);
    return () => clearTimeout(timer);
  }, [ttl, onExpire, isPinned]);

  // Charger la photo depuis iNaturalist
  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const response = await fetch(
          `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(species.scientificName)}&per_page=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results[0]?.default_photo?.medium_url) {
            setPhotoUrl(data.results[0].default_photo.medium_url);
          }
        }
      } catch (error) {
        console.error('Error fetching iNaturalist photo:', error);
      }
    };

    fetchPhoto();
  }, [species.scientificName]);

  const handleClick = () => {
    setIsPinned(!isPinned);
  };

  // Icône selon le royaume
  const getKingdomIcon = () => {
    const kingdom = species.kingdom.toLowerCase();
    if (kingdom.includes('plant')) return <Flower2 className="h-5 w-5" />;
    if (kingdom.includes('fungi')) return <TreeDeciduous className="h-5 w-5" />;
    return <Leaf className="h-5 w-5" />;
  };

  const formattedDate = species.observationDate 
    ? new Date(species.observationDate).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long' 
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ 
        opacity: isPinned ? 1 : 0.8,
        scale: isPinned ? 1.05 : 1,
      }}
      exit={{ opacity: 0, scale: 0.7, filter: 'blur(10px)' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      style={{ 
        left: `${Math.min(position.x, 50)}%`,
        top: `${position.y}%`,
        zIndex,
      }}
      className="absolute w-64 sm:w-72 max-w-[calc(100vw-2rem)] cursor-pointer"
      onClick={handleClick}
    >
      <div className={`
        rounded-2xl backdrop-blur-md overflow-hidden
        bg-emerald-950/30 border border-emerald-500/15
        ${isPinned ? 'ring-2 ring-emerald-400/30' : ''}
        transition-all duration-300
      `}>
        {/* Photo iNaturalist */}
        {photoUrl && (
          <div className="relative h-24 overflow-hidden">
            <img
              src={photoUrl}
              alt={species.commonName || species.scientificName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent" />
          </div>
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"
            >
              {getKingdomIcon()}
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-emerald-200 text-sm truncate">
                {species.commonName || species.scientificName}
              </h3>
              <p className="font-crimson text-xs text-emerald-400/60 italic truncate">
                {species.scientificName}
              </p>
            </div>
          </div>

          {/* Royaume */}
          <div className="mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/70">
              {species.kingdom}
            </span>
          </div>

          {/* Métadonnées */}
          <div className="mt-3 flex items-center gap-3 text-xs text-emerald-300/50">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {species.location}
            </span>
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            )}
          </div>

          {/* Indicateur pinned */}
          {isPinned && (
            <p className="mt-2 text-xs text-emerald-400/40 text-center">
              ✧ Fixé — toucher pour libérer
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SpeciesApparition;
