import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, Headphones, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createSlug } from '@/utils/slugGenerator';
import type { FeaturedMarche } from '@/hooks/useFeaturedMarches';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface CarnetTerrainCardProps {
  marche: FeaturedMarche;
  index: number;
}

const CarnetTerrainCard: React.FC<CarnetTerrainCardProps> = ({ marche, index }) => {
  const slug = createSlug(marche.nom_marche || '', marche.ville);
  const displayName = marche.nom_marche || marche.ville;

  // Format date
  const formattedDate = marche.date
    ? new Date(marche.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        to={`/marches-du-vivant/carnets-de-terrain/${slug}`}
        className="group block rounded-xl overflow-hidden bg-white/[0.06] border border-emerald-500/10 backdrop-blur-sm hover:border-emerald-400/30 transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(16,185,129,0.2)]"
      >
        {/* Cover photo */}
        <div className="relative overflow-hidden">
          <AspectRatio ratio={4 / 3}>
            {marche.cover_photo_url ? (
              <img
                src={marche.cover_photo_url}
                alt={displayName}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-900/60 to-emerald-800/40 flex items-center justify-center">
                <Leaf className="w-12 h-12 text-emerald-500/30" />
              </div>
            )}
          </AspectRatio>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Region chip */}
          {marche.region && (
            <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 backdrop-blur-sm">
              {marche.region}
            </span>
          )}

          {/* Date */}
          {formattedDate && (
            <span className="absolute top-3 right-3 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur-sm bg-black/30 rounded-full">
              {formattedDate}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Title */}
          <h3 className="font-crimson text-lg md:text-xl text-foreground leading-snug line-clamp-2 group-hover:text-emerald-300 transition-colors duration-300">
            {displayName}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <MapPin className="w-3.5 h-3.5 text-emerald-500/60" />
            <span>{marche.ville}{marche.departement ? `, ${marche.departement}` : ''}</span>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 pt-1">
            {marche.total_species > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-400/80 bg-emerald-500/10 px-2 py-1 rounded-full">
                <Leaf className="w-3 h-3" />
                {marche.total_species}
              </span>
            )}
            {marche.photos_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-sky-400/80 bg-sky-500/10 px-2 py-1 rounded-full">
                <Camera className="w-3 h-3" />
                {marche.photos_count}
              </span>
            )}
            {marche.audio_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded-full">
                <Headphones className="w-3 h-3" />
                {marche.audio_count}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CarnetTerrainCard;
