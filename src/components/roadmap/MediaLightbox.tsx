import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { RoadmapMedia } from '@/lib/roadmap/types';

interface Props {
  media: RoadmapMedia | null;
  onClose: () => void;
}

/** Ouverture plein écran d'une capture. */
const MediaLightbox: React.FC<Props> = ({ media, onClose }) => (
  <Dialog open={Boolean(media)} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-w-5xl border-border/60 bg-card p-2">
      {media && (
        <figure className="space-y-2">
          <img
            src={media.public_url}
            alt={media.caption ?? 'Capture de l’application'}
            className="max-h-[80vh] w-full rounded-lg object-contain"
          />
          {media.caption && (
            <figcaption className="px-2 pb-2 text-center text-sm text-muted-foreground">
              {media.caption}
            </figcaption>
          )}
        </figure>
      )}
    </DialogContent>
  </Dialog>
);

export default MediaLightbox;
