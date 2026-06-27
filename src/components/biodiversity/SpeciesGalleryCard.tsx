import React, { useEffect, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { useSpeciesPhoto } from '@/hooks/useSpeciesPhoto';
import { useSpeciesPhotoMode } from '@/contexts/SpeciesPhotoModeContext';
import type { SpeciesTranslation } from '@/hooks/useSpeciesTranslation';

interface Props {
  species: BiodiversitySpecies;
  translation?: SpeciesTranslation;
  onClick?: (species: BiodiversitySpecies) => void;
}

/**
 * Tuile « Galerie » plein cadre pour l'explorateur d'espèces.
 * Aligne la qualité photo sur l'écran « Apprendre › L'œil » :
 *  - aspect-square + object-cover
 *  - source : photo marcheur prioritaire (via SpeciesPhotoModeContext),
 *    fallback taxon iNat de référence (useSpeciesPhoto)
 *  - pill compteur d'observations bas-gauche
 *  - pastille source discrète haut-droite
 *  - hover : léger zoom + ring émeraude
 */
const SpeciesGalleryCard: React.FC<Props> = ({ species, translation, onClick }) => {
  const [imageError, setImageError] = useState(false);

  const { data: fetchedPhotoData, isLoading: photoLoading } = useSpeciesPhoto(
    species.scientificName,
  );
  const taxonRefUrl = fetchedPhotoData?.photos?.[0] ?? null;

  const { getPreferredPhoto } = useSpeciesPhotoMode();
  const preferred = getPreferredPhoto(species.scientificName, taxonRefUrl ?? undefined);
  const isFieldPhoto =
    preferred?.source === 'marcheur' || preferred?.source === 'citizen';

  const photoUrl = isFieldPhoto
    ? preferred?.url ?? null
    : taxonRefUrl;

  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  const displayName =
    translation?.commonName?.trim() ||
    species.commonName?.trim() ||
    species.scientificName;

  const showLatin =
    !!species.scientificName && displayName !== species.scientificName;

  const handleClick = () => onClick?.(species);

  return (
    <motion.div
      layout
      className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10"
      data-chat-card
      data-chat-title={displayName}
      data-chat-subtitle={species.scientificName}
      data-chat-badges={`${species.observations} obs.`}
    >
      <button
        type="button"
        onClick={handleClick}
        className="block w-full text-left cursor-zoom-in"
      >
        <div className="aspect-square bg-muted relative overflow-hidden">
          {photoUrl && !imageError ? (
            <img
              src={photoUrl}
              alt={displayName}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : photoLoading ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
              <ImageOff className="w-8 h-8" />
            </div>
          )}

          {/* Voile bas discret au survol */}

          {/* Voile bas pour lisibilité du nom au survol */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="px-2.5 py-2 space-y-0.5">
          <p className="text-xs font-semibold text-foreground line-clamp-1">
            {displayName}
          </p>
          {showLatin && (
            <p className="text-[10px] italic text-muted-foreground line-clamp-1">
              {species.scientificName}
            </p>
          )}
        </div>
      </button>
    </motion.div>
  );
};

export default SpeciesGalleryCard;
