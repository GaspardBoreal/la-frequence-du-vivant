import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, Users, ChevronRight } from 'lucide-react';
import { SpeciesName } from '@/components/species/SpeciesName';
import { getLatLng, type AttributionLike } from '@/utils/speciesIndividualCount';

interface Props {
  scientificName: string;
  commonName: string | null;
  colorToken: string; // e.g. '--trophic-l1'
  photos: string[];
  attributions: AttributionLike[];
  onOpen: () => void;
}

/**
 * "Pétale" : ligne d'espèce vivante dans le panneau d'un niveau trophique.
 * Révèle d'un coup d'œil photos, points GPS et contributeurs ; le tap ouvre
 * le drawer immersif (SpeciesGpsDrawer).
 */
export const SpeciesPetalRow: React.FC<Props> = ({
  scientificName,
  commonName,
  colorToken,
  photos,
  attributions,
  onOpen,
}) => {
  const { gpsCount, observers, photoCount } = useMemo(() => {
    const gps = attributions.filter((a) => getLatLng(a) !== null).length;
    const names = new Set<string>();
    attributions.forEach((a) => {
      const n = (a.observerName || '').trim();
      if (n) names.add(n);
    });
    return {
      gpsCount: gps,
      observers: Array.from(names),
      photoCount: photos.length,
    };
  }, [attributions, photos]);

  const thumbs = photos.slice(0, 3);
  const extraPhotos = Math.max(0, photoCount - thumbs.length);
  const extraObs = Math.max(0, observers.length - 3);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileTap={{ scale: 0.985 }}
      className="group w-full text-left rounded-xl border border-border/60 bg-card/60 hover:bg-card hover:border-border transition-colors p-2.5 flex flex-col gap-2"
      aria-label={`Ouvrir la fiche de ${commonName || scientificName}`}
    >
      {/* Ligne 1 — nom */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: `hsl(var(${colorToken}))` }}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          <SpeciesName scientificName={scientificName} commonName={commonName} size="sm" truncate />
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition flex-shrink-0" />
      </div>

      {/* Ligne 2 — facettes */}
      <div className="flex items-center gap-2 flex-wrap pl-4">
        {/* Mosaïque photos */}
        {thumbs.length > 0 ? (
          <div className="flex -space-x-1.5">
            {thumbs.map((src, i) => (
              <span
                key={i}
                className="w-8 h-8 rounded-md overflow-hidden ring-2 ring-card bg-muted flex-shrink-0"
                style={{ zIndex: 10 - i }}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.2')}
                />
              </span>
            ))}
            {extraPhotos > 0 && (
              <span className="w-8 h-8 rounded-md ring-2 ring-card bg-muted/80 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                +{extraPhotos}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 px-2 py-1 rounded-full bg-muted/40">
            <Camera className="w-3 h-3" /> pas de photo
          </span>
        )}

        {/* Pastille marches / GPS */}
        {gpsCount > 0 && (
          <span className="relative inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping opacity-40" />
            <MapPin className="w-3 h-3 relative" />
            <span className="relative tabular-nums">{gpsCount} pt{gpsCount > 1 ? 's' : ''}</span>
          </span>
        )}

        {/* Contributeurs */}
        {observers.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full">
            <Users className="w-3 h-3" />
            <span className="truncate max-w-[120px]">
              {observers.slice(0, 2).join(', ')}
              {extraObs > 0 && ` +${extraObs}`}
            </span>
          </span>
        )}
      </div>
    </motion.button>
  );
};

export default SpeciesPetalRow;
