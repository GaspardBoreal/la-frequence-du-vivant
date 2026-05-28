import { SpeciesName } from '@/components/species/SpeciesName';
import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { useSpeciesPhoto } from '@/hooks/useSpeciesPhoto';
import { Loader2 } from 'lucide-react';

interface TopSpecies {
  name: string;
  scientificName: string;
  commonNameFr?: string | null;
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
  viewMode?: 'immersion' | 'fiche';
}

const SpeciesCardWithPhoto: React.FC<SpeciesCardWithPhotoProps> = ({
  species,
  onClick,
  getKingdomColor,
  getKingdomEmoji,
  index,
  viewMode = 'immersion',
}) => {
  // Une URL iNaturalist brute (inaturalist-open-data / static.inaturalist.org)
  // provient d'une observation : elle n'est PAS fiable comme illustration
  // d'espèce (ex. Pic épeiche identifié au chant → photo d'habitat).
  // → On la remplace par la photo de référence du taxon via useSpeciesPhoto.
  const firstPhoto = species.photos?.[0];
  const isInatObsUrl = !!firstPhoto && /inaturalist(-open-data|\.org|\.com)/i.test(firstPhoto);
  const trustedLocalPhoto = firstPhoto && !isInatObsUrl ? firstPhoto : null;

  const shouldFetch = !trustedLocalPhoto;
  const { data: photoData, isLoading } = useSpeciesPhoto(
    shouldFetch ? species.scientificName : undefined
  );

  const photoUrl = trustedLocalPhoto || photoData?.photos?.[0];
  const hasPhoto = !!photoUrl;
  const isInatPhoto = !trustedLocalPhoto && !!photoData?.photos?.[0];

  if (viewMode === 'immersion') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: Math.min(index * 0.02, 0.5) }}
        className="group"
      >
        <div
          className="relative overflow-hidden rounded-2xl cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 hover:scale-[1.03]"
          onClick={onClick}
        >
          <div className="aspect-[3/4] relative">
            {isLoading && shouldFetch ? (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getKingdomColor(species.kingdom)}`}>
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              </div>
            ) : hasPhoto ? (
              <img
                src={photoUrl}
                alt={species.commonNameFr || species.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getKingdomColor(species.kingdom)}`}>
                <span className="text-4xl md:text-5xl opacity-60">{getKingdomEmoji(species.kingdom)}</span>
              </div>
            )}

            {/* Hover-only overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {isInatPhoto && (
              <span
                title="Photo de référence iNaturalist"
                className="absolute bottom-2 right-2 rounded-full bg-background/85 backdrop-blur-sm border border-border/60 text-muted-foreground text-[9px] font-medium px-1.5 py-0.5 leading-none"
              >
                iNat
              </span>
            )}

            {/* Hover-only name */}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              <SpeciesName scientificName={species.scientificName} commonName={species.commonNameFr || species.name} size="sm" truncate className="text-white [&>span]:text-white" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Mode "fiche"
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
        <div className="aspect-square relative">
          {isLoading && shouldFetch ? (
            <div className="w-full h-full flex items-center justify-center bg-white/20">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          ) : hasPhoto ? (
            <img
              src={photoUrl}
              alt={species.commonNameFr || species.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/20">
              <span className="text-4xl md:text-6xl opacity-80">{getKingdomEmoji(species.kingdom)}</span>
            </div>
          )}
          
          {/* Lighter overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          
          {/* Common name only */}
          <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 text-white">
            <SpeciesName scientificName={species.scientificName} commonName={species.commonNameFr || species.name} size="sm" truncate className="text-white [&>span]:text-white" />
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
          {isInatPhoto && (
            <span
              title="Photo de référence iNaturalist"
              className="absolute top-2 left-2 rounded-full bg-background/85 backdrop-blur-sm border border-border/60 text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 leading-none"
            >
              iNat
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SpeciesCardWithPhoto;
