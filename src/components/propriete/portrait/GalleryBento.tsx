import React, { useEffect, useState } from 'react';
import { X, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  photos: GalleryPhoto[];
}

// Ratio d'aire (col-span × row-span) par index — grille asymétrique jusqu'à 12 photos.
const TILE_CLASSES = [
  'col-span-2 row-span-2', // 0 hero
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
];

export const GalleryBento: React.FC<Props> = ({ photos }) => {
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i! + 1) % photos.length);
      if (e.key === 'ArrowLeft') setLightbox((i) => (i! - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <div
        className="grid grid-cols-4 auto-rows-[110px] md:auto-rows-[150px] gap-2 md:gap-3"
        style={{ gridAutoFlow: 'dense' }}
      >
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setLightbox(i)}
            className={`relative overflow-hidden rounded-2xl group ${TILE_CLASSES[i] ?? 'col-span-1 row-span-1'} bg-muted`}
          >
            <img
              src={p.url}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition">
              {p.author_name && (
                <div className="text-[10px] text-white/90 flex items-center gap-1 truncate">
                  <User className="w-2.5 h-2.5" /> {p.author_name}
                </div>
              )}
              {p.photo_date && (
                <div className="text-[10px] text-white/70 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(p.photo_date).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
          >
            <X className="w-6 h-6" />
          </button>
          <button
            className="absolute left-4 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! - 1 + photos.length) % photos.length); }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <img
            src={photos[lightbox].url}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! + 1) % photos.length); }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs flex items-center gap-3 bg-black/40 backdrop-blur px-4 py-2 rounded-full">
            <span>{lightbox + 1} / {photos.length}</span>
            {photos[lightbox].author_name && (
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {photos[lightbox].author_name}</span>
            )}
            {photos[lightbox].photo_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(photos[lightbox].photo_date!).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
};
