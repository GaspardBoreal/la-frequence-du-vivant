import React from 'react';
import type { RoadmapMedia } from '@/lib/roadmap/types';

interface Props {
  medias: RoadmapMedia[];
  onOpen?: (m: RoadmapMedia) => void;
}

/** Planche contact : les preuves en images, légèrement inclinées. */
const PlancheDePreuves: React.FC<Props> = ({ medias, onOpen }) => {
  if (medias.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {medias.slice(0, 12).map((m, i) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onOpen?.(m)}
          className="group relative block overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition duration-500 hover:z-10 hover:-translate-y-1 hover:shadow-xl animate-fade-in"
          style={{
            transform: `rotate(${((i % 4) - 1.5) * 1.1}deg)`,
            animationDelay: `${Math.min(i, 10) * 55}ms`,
          }}
        >
          <img
            src={m.public_url}
            alt={m.caption ?? 'Preuve de terrain'}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent px-2 pb-2 pt-6 text-left text-[11px] leading-tight text-foreground opacity-0 transition group-hover:opacity-100">
            {m.caption ?? m.source_route ?? 'Capture'}
          </span>
        </button>
      ))}
    </div>
  );
};

export default PlancheDePreuves;
