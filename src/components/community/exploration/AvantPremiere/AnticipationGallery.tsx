import React from 'react';
import { motion } from 'framer-motion';
import { useAnticipationPhotos } from '@/hooks/useAvantPremiere';

interface AnticipationGalleryProps {
  eventType?: string | null;
  excludeExplorationId?: string | null;
}

/**
 * « Ailleurs, une marche du vivant » — inspiration, jamais confusion :
 * les images viennent d'autres marches du même type, et c'est dit.
 */
const AnticipationGallery: React.FC<AnticipationGalleryProps> = ({
  eventType,
  excludeExplorationId,
}) => {
  const { data: photos = [], isLoading } = useAnticipationPhotos(eventType, excludeExplorationId);

  if (isLoading || photos.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Ailleurs, une marche du vivant
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((p, i) => (
          <motion.figure
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
          >
            <img
              src={p.url}
              alt={p.titre || 'Photographie d’une marche du vivant'}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </motion.figure>
        ))}
      </div>
    </div>
  );
};

export default AnticipationGallery;
