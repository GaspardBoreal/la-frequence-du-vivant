import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { useSpeciesPhoto } from '@/hooks/useSpeciesPhoto';
import { Loader2 } from 'lucide-react';

interface TopSpecies {
  name: string;
  scientificName: string;
  count: number;
  kingdom: string;
  photos?: string[];
}

interface SpeciesCardWithPhotoProps {
  species: TopSpecies;
  onClick: () => void;
  getKingdomColor: (kingdom: string) => string;
  getKingdomEmoji: (kingdom: string) => string;
  index: number;
}

const SpeciesCardWithPhoto: React.FC<SpeciesCardWithPhotoProps> = ({
  species,
  onClick,
  getKingdomColor,
  getKingdomEmoji,
  index,
}) => {
  // Only fetch from iNaturalist if no photos already exist
  const shouldFetch = !species.photos || species.photos.length === 0;
  const { data: photoData, isLoading } = useSpeciesPhoto(
    shouldFetch ? species.scientificName : undefined
  );

  // Priority: 1. Existing photo (from marcheur/snapshot), 2. iNaturalist, 3. Placeholder
  const photoUrl = species.photos?.[0] || photoData?.photos?.[0];
  const hasPhoto = !!photoUrl;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: Math.min(index * 0.02, 0.5) }}
      className="group"
    >
      <div 
        className={`relative bg-gradient-to-br ${getKingdomColor(species.kingdom)} 
        rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300
        hover:scale-105 cursor-pointer`}
        onClick={onClick}
      >
        {/* Photo or placeholder */}
        <div className="aspect-square relative">
          {isLoading && shouldFetch ? (
            <div className="w-full h-full flex items-center justify-center bg-white/20">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          ) : hasPhoto ? (
            <img
              src={photoUrl}
              alt={species.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Fallback to placeholder on error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.classList.add('photo-error');
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/20">
              <span className="text-4xl md:text-6xl opacity-80">{getKingdomEmoji(species.kingdom)}</span>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 text-white">
            <h3 className="font-bold text-xs md:text-sm truncate">{species.name}</h3>
            <p className="text-[10px] md:text-xs text-white/70 italic truncate">{species.scientificName}</p>
          </div>

          {/* Badge */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-white/20 backdrop-blur-sm text-white text-[10px] md:text-xs">
              {species.count} obs.
            </Badge>
          </div>

          {/* Photo source indicator */}
          {hasPhoto && species.photos?.[0] && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-emerald-500/80 backdrop-blur-sm text-white text-[10px]">
                📸
              </Badge>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SpeciesCardWithPhoto;
