import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ExternalLink, Camera, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export type CarouselSlideSource = 'inat' | 'marcheur' | 'gbif' | 'other';

export interface CarouselSlide {
  url: string;
  source: CarouselSlideSource;
  observerName?: string;
  date?: string;
  originalUrl?: string;
  marcheName?: string;
}

interface SpeciesPhotoCarouselProps {
  slides: CarouselSlide[];
  isLoading?: boolean;
  onPhotoClick?: (index: number) => void;
  emptyIcon?: React.ReactNode;
}

const SOURCE_META: Record<CarouselSlideSource, { label: string; tone: string; icon: React.ReactNode }> = {
  inat: {
    label: 'Référence · iNaturalist',
    tone: 'bg-sky-500/85 text-white border-sky-300/40',
    icon: <Sparkles className="w-3 h-3" />,
  },
  gbif: {
    label: 'Référence · GBIF',
    tone: 'bg-indigo-500/85 text-white border-indigo-300/40',
    icon: <Sparkles className="w-3 h-3" />,
  },
  marcheur: {
    label: 'Photo marcheur',
    tone: 'bg-emerald-500/85 text-white border-emerald-300/40',
    icon: <Camera className="w-3 h-3" />,
  },
  other: {
    label: 'Photo',
    tone: 'bg-slate-500/85 text-white border-slate-300/40',
    icon: <Camera className="w-3 h-3" />,
  },
};

const SpeciesPhotoCarousel: React.FC<SpeciesPhotoCarouselProps> = ({
  slides,
  isLoading,
  onPhotoClick,
  emptyIcon,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const hasMarcheurs = slides.some((s) => s.source === 'marcheur');
  const hasReference = slides.some((s) => s.source === 'inat' || s.source === 'gbif');
  const showHint = hasMarcheurs && hasReference;

  if (isLoading) {
    return (
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-white/40" />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white/40 space-y-2">
          {emptyIcon}
          <p className="text-sm">Photo non disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => {
            const meta = SOURCE_META[slide.source];
            return (
              <div key={`${slide.url}-${i}`} className="relative shrink-0 grow-0 basis-full h-full">
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={slide.url}
                  alt={slide.observerName || meta.label}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => onPhotoClick?.(i)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />

                {/* Badge top-left : source */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border backdrop-blur ${meta.tone}`}
                  >
                    {meta.icon}
                    {slide.source === 'marcheur' && slide.observerName
                      ? `Photo · ${slide.observerName}`
                      : meta.label}
                  </span>
                </div>

                {/* Pastille bas-gauche : crédit + date + lien source */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                  <div className="px-2.5 py-1.5 rounded-lg bg-black/55 backdrop-blur-md text-[11px] text-white/90 max-w-[80%]">
                    <div className="flex items-center gap-1.5">
                      <span className="opacity-90">
                        {slide.source === 'marcheur'
                          ? slide.marcheName || 'Marche'
                          : meta.label}
                      </span>
                    </div>
                    {slide.date && (
                      <div className="text-[10px] text-white/60 mt-0.5">
                        {(() => {
                          try {
                            return format(new Date(slide.date), 'd MMM yyyy', { locale: fr });
                          } catch {
                            return slide.date;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                  {slide.originalUrl && (
                    <a
                      href={slide.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-black/55 hover:bg-black/75 backdrop-blur text-[10px] text-white/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Source
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nav arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 flex items-center justify-center transition-colors"
            aria-label="Photo précédente"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 flex items-center justify-center transition-colors"
            aria-label="Photo suivante"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Indicateur position : segments par source */}
      {slides.length > 1 && (
        <div className="absolute top-3 right-3 flex gap-1">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === selected
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              } ${s.source === 'marcheur' ? 'ring-1 ring-emerald-400/40' : ''}`}
              aria-label={`Aller à la photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Hint comparaison */}
      {showHint && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/55 backdrop-blur text-[10px] text-white/70 pointer-events-none">
          Glissez pour comparer la référence aux photos des marcheurs
        </div>
      )}
    </div>
  );
};

export default SpeciesPhotoCarousel;
