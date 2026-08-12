import React from 'react';
import { Maximize2 } from 'lucide-react';
import type { RoadmapMedia } from '@/lib/roadmap/types';

interface Props {
  media: RoadmapMedia;
  onOpen?: (media: RoadmapMedia) => void;
  className?: string;
}

/** Capture d'écran réelle, habillée d'un cadre type fenêtre. */
const ScreenshotFrame: React.FC<Props> = ({ media, onOpen, className = '' }) => (
  <figure className={`group overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg ${className}`}>
    <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/60 px-3 py-2">
      <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
      {media.source_route && (
        <span className="ml-2 truncate font-mono text-[10px] text-muted-foreground">
          {media.source_route}
        </span>
      )}
      {onOpen && (
        <button
          type="button"
          onClick={() => onOpen(media)}
          aria-label="Agrandir la capture"
          className="ml-auto rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-background hover:text-foreground"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
    <button
      type="button"
      onClick={() => onOpen?.(media)}
      className="block w-full cursor-zoom-in bg-background"
    >
      <img
        src={media.public_url}
        alt={media.caption ?? 'Capture de l’application'}
        loading="lazy"
        className="w-full object-cover transition duration-500 group-hover:scale-[1.01]"
      />
    </button>
    {media.caption && (
      <figcaption className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
        {media.caption}
      </figcaption>
    )}
  </figure>
);

export default ScreenshotFrame;
