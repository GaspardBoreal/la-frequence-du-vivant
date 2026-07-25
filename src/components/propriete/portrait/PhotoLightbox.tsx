import React, { useEffect } from 'react';
import { X, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  photos: GalleryPhoto[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export const PhotoLightbox: React.FC<Props> = ({ photos, index, onClose, onIndexChange }) => {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % photos.length);
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, photos.length, onClose, onIndexChange]);

  if (index === null) return null;
  const p = photos[index];

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={(e) => { e.stopPropagation(); onClose(); }}>
        <X className="w-6 h-6" />
      </button>
      <button className="absolute left-4 text-white/70 hover:text-white p-2"
        onClick={(e) => { e.stopPropagation(); onIndexChange((index - 1 + photos.length) % photos.length); }}>
        <ChevronLeft className="w-8 h-8" />
      </button>
      <img src={p.url} alt="" className="max-h-[85vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
      <button className="absolute right-4 text-white/70 hover:text-white p-2"
        onClick={(e) => { e.stopPropagation(); onIndexChange((index + 1) % photos.length); }}>
        <ChevronRight className="w-8 h-8" />
      </button>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs flex items-center gap-3 bg-black/40 backdrop-blur px-4 py-2 rounded-full">
        <span>{index + 1} / {photos.length}</span>
        {p.author_name && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {p.author_name}</span>}
        {p.photo_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(p.photo_date).toLocaleDateString('fr-FR')}</span>}
      </div>
    </div>
  );
};
