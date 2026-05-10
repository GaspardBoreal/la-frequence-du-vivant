import React, { useEffect, useMemo, useState } from 'react';
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

const SOURCE_META: Record<CarouselSlideSource, { label: string; short: string; tone: string; ring: string; icon: React.ReactNode }> = {
  inat: {
    label: 'Référence · iNaturalist',
    short: 'Référence',
    tone: 'bg-sky-500/85 text-white border-sky-300/40',
    ring: 'ring-sky-400/70',
    icon: <Sparkles className="w-3 h-3" />,
  },
  gbif: {
    label: 'Référence · GBIF',
    short: 'Référence',
    tone: 'bg-indigo-500/85 text-white border-indigo-300/40',
    ring: 'ring-indigo-400/70',
    icon: <Sparkles className="w-3 h-3" />,
  },
  marcheur: {
    label: 'Photo marcheur',
    short: 'Marcheur',
    tone: 'bg-emerald-500/85 text-white border-emerald-300/40',
    ring: 'ring-emerald-400/70',
    icon: <Camera className="w-3 h-3" />,
  },
  other: {
    label: 'Photo',
    short: 'Photo',
    tone: 'bg-slate-500/85 text-white border-slate-300/40',
    ring: 'ring-slate-400/70',
    icon: <Camera className="w-3 h-3" />,
  },
};

const SpeciesPhotoCarousel: React.FC<SpeciesPhotoCarouselProps> = ({
  slides,
  isLoading,
  onPhotoClick,
  emptyIcon,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
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

  const { firstRefIdx, firstMarcheurIdx, hasBoth } = useMemo(() => {
    const refIdx = slides.findIndex((s) => s.source === 'inat' || s.source === 'gbif');
    const mIdx = slides.findIndex((s) => s.source === 'marcheur');
    return { firstRefIdx: refIdx, firstMarcheurIdx: mIdx, hasBoth: refIdx >= 0 && mIdx >= 0 };
  }, [slides]);

  if (isLoading) {
    return (
      <div className="relative aspect-[16/10] max-h-[42vh] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-white/40" />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative aspect-[16/10] max-h-[42vh] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white/40 space-y-2">
          {emptyIcon}
          <p className="text-sm">Photo non disponible</p>
        </div>
      </div>
    );
  }

  const current = slides[selected];
  const currentMeta = SOURCE_META[current.source];
  const isMultiple = slides.length > 1;

  return (
    <div className="bg-slate-900">
      {/* Hero zone */}
      <div className="relative aspect-[16/10] max-h-[42vh] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
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
                  <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                    <div className="px-2.5 py-1.5 rounded-lg bg-black/55 backdrop-blur-md text-[11px] text-white/90 max-w-[75%]">
                      <div className="opacity-90 truncate">
                        {slide.source === 'marcheur'
                          ? slide.marcheName || 'Marche'
                          : meta.label}
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

        {/* Nav arrows — toujours visibles si plusieurs slides */}
        {isMultiple && (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/65 hover:bg-black/85 ring-1 ring-white/20 shadow-lg flex items-center justify-center transition-all hover:scale-105"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/65 hover:bg-black/85 ring-1 ring-white/20 shadow-lg flex items-center justify-center transition-all hover:scale-105"
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Compteur 1/N */}
        {isMultiple && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur text-[11px] text-white/90 font-medium tabular-nums">
            {selected + 1} / {slides.length}
          </div>
        )}
      </div>

      {/* Toggle segmenté Référence ↔ Marcheurs (si les deux existent) */}
      {hasBoth && (
        <div className="px-3 pt-3 flex justify-center">
          <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => emblaApi?.scrollTo(firstRefIdx)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                current.source === 'inat' || current.source === 'gbif'
                  ? 'bg-sky-500/90 text-white shadow'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Référence
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollTo(firstMarcheurIdx)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                current.source === 'marcheur'
                  ? 'bg-emerald-500/90 text-white shadow'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              <Camera className="w-3 h-3" />
              Marcheurs ({slides.filter((s) => s.source === 'marcheur').length})
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail strip — visible dès qu'il y a ≥ 2 slides */}
      {isMultiple && (
        <div className="px-3 pt-3 pb-1 overflow-x-auto scrollbar-thin">
          <div className="flex gap-2">
            {slides.map((s, i) => {
              const meta = SOURCE_META[s.source];
              const active = i === selected;
              return (
                <button
                  key={`thumb-${s.url}-${i}`}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden ring-2 transition-all ${
                    active ? `${meta.ring} scale-105` : 'ring-white/10 opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Voir ${meta.label}`}
                >
                  <img
                    src={s.url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span
                    className={`absolute bottom-0 inset-x-0 text-[8px] font-semibold text-white text-center py-0.5 ${
                      s.source === 'marcheur' ? 'bg-emerald-600/85' : s.source === 'inat' ? 'bg-sky-600/85' : 'bg-slate-600/85'
                    }`}
                  >
                    {meta.short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeciesPhotoCarousel;
