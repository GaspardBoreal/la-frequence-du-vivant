import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ExternalLink, Camera, Sparkles, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSpeciesPhotoMode } from '@/contexts/SpeciesPhotoModeContext';

export type CarouselSlideSource = 'inat' | 'marcheur' | 'gbif' | 'citizen' | 'other';

export interface CarouselSlide {
  url: string;
  source: CarouselSlideSource;
  observerName?: string;
  date?: string;
  originalUrl?: string;
  marcheName?: string;
  /** Cette photo terrain est aussi celle utilisée comme référence iNat → afficher 2 badges. */
  alsoReference?: boolean;
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
  citizen: {
    label: 'Observation citoyenne',
    short: 'Citoyen',
    tone: 'bg-cyan-500/85 text-white border-cyan-300/40',
    ring: 'ring-cyan-400/70',
    icon: <Users className="w-3 h-3" />,
  },
  other: {
    label: 'Photo',
    short: 'Photo',
    tone: 'bg-slate-500/85 text-white border-slate-300/40',
    ring: 'ring-slate-400/70',
    icon: <Camera className="w-3 h-3" />,
  },
};

const isFieldSource = (s: CarouselSlideSource) => s === 'marcheur' || s === 'citizen';
const isRefSource = (s: CarouselSlideSource) => s === 'inat' || s === 'gbif';

const SpeciesPhotoCarousel: React.FC<SpeciesPhotoCarouselProps> = ({
  slides,
  isLoading,
  onPhotoClick,
  emptyIcon,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selected, setSelected] = useState(0);
  const [flash, setFlash] = useState(false);
  const { mode, setMode, hasFieldPhotos } = useSpeciesPhotoMode();
  const didInitRef = useRef(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const { firstRefIdx, firstFieldIdx, fieldCount, hasBoth, hasField } = useMemo(() => {
    const refIdx = slides.findIndex((s) => isRefSource(s.source));
    const fIdx = slides.findIndex((s) => isFieldSource(s.source) || s.alsoReference);
    const fc = slides.filter((s) => isFieldSource(s.source) || s.alsoReference).length;
    return {
      firstRefIdx: refIdx,
      firstFieldIdx: fIdx,
      fieldCount: fc,
      hasBoth: refIdx >= 0 && fIdx >= 0,
      hasField: fIdx >= 0,
    };
  }, [slides]);

  // Sync initial slide to global mode (Photos marcheurs ↔ iNaturalist)
  useEffect(() => {
    if (!emblaApi || slides.length === 0) return;
    if (didInitRef.current) return;
    didInitRef.current = true;
    const targetIdx =
      mode === 'marcheur' && firstFieldIdx >= 0
        ? firstFieldIdx
        : firstRefIdx >= 0
          ? firstRefIdx
          : 0;
    if (targetIdx !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(targetIdx, true);
    }
  }, [emblaApi, slides.length, mode, firstFieldIdx, firstRefIdx]);

  // Reagit aux changements de mode global après le 1er rendu (wahuhh flash)
  useEffect(() => {
    if (!emblaApi || !didInitRef.current || slides.length === 0) return;
    const targetIdx =
      mode === 'marcheur' && firstFieldIdx >= 0
        ? firstFieldIdx
        : firstRefIdx >= 0
          ? firstRefIdx
          : 0;
    if (targetIdx !== emblaApi.selectedScrollSnap()) {
      setFlash(true);
      emblaApi.scrollTo(targetIdx);
      const t = setTimeout(() => setFlash(false), 320);
      return () => clearTimeout(t);
    }
  }, [mode, emblaApi, firstFieldIdx, firstRefIdx, slides.length]);


  if (isLoading) {
    return (
      <div className="relative aspect-[4/3] md:aspect-[16/10] max-h-[55vh] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-white/40" />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative aspect-[4/3] md:aspect-[16/10] max-h-[55vh] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white/40 space-y-2">
          {emptyIcon}
          <p className="text-sm">Photo non disponible</p>
        </div>
      </div>
    );
  }

  const current = slides[selected];
  const isMultiple = slides.length > 1;
  const currentIsField = isFieldSource(current.source) || !!current.alsoReference;

  return (
    <div className="bg-slate-900">
      {/* Hero zone */}
      <div className="relative aspect-[4/3] md:aspect-[16/10] max-h-[55vh] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
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

                  {/* Badges top-left : source + (référence aussi) */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border backdrop-blur ${meta.tone}`}
                    >
                      {meta.icon}
                      {slide.source === 'marcheur' && slide.observerName
                        ? `Marcheur · ${slide.observerName}`
                        : slide.source === 'citizen' && slide.observerName
                          ? `Citoyen · ${slide.observerName}`
                          : meta.label}
                    </span>
                    {slide.alsoReference && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border backdrop-blur bg-sky-500/85 text-white border-sky-300/40">
                        <Sparkles className="w-3 h-3" />
                        Aussi référence iNaturalist
                      </span>
                    )}
                  </div>

                  {/* Pastille bas-gauche : crédit + date + lien source */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                    <div className="px-2.5 py-1.5 rounded-lg bg-black/55 backdrop-blur-md text-[11px] text-white/90 max-w-[75%]">
                      <div className="opacity-90 truncate">
                        {(slide.source === 'marcheur' || slide.source === 'citizen')
                          ? slide.marcheName || 'Sur le terrain'
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

        {/* Compteur 1/N — centré en haut pour éviter la collision avec la croix de fermeture */}
        {isMultiple && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 ring-1 ring-white/15 backdrop-blur-md text-[11px] text-white/90 font-medium tabular-nums shadow-sm pointer-events-none">
            {selected + 1} / {slides.length}
          </div>
        )}
      </div>

      {/* Toggle segmenté Référence ↔ Sur le terrain */}
      {hasBoth && (
        <div className="px-3 pt-3 flex justify-center">
          <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => emblaApi?.scrollTo(firstRefIdx)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                isRefSource(current.source) && !current.alsoReference
                  ? 'bg-sky-500/90 text-white shadow'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Référence taxon
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollTo(firstFieldIdx)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                currentIsField
                  ? 'bg-emerald-500/90 text-white shadow'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              <Camera className="w-3 h-3" />
              Sur le terrain ({fieldCount})
            </button>
          </div>
        </div>
      )}

      {/* Bandelette état vide : aucune photo terrain */}
      {!hasField && slides.length > 0 && (
        <div className="px-4 pt-3">
          <div className="text-[11px] text-white/55 text-center px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            Pas encore de photo prise sur le terrain pour cette espèce — sois le premier à la documenter lors de ta prochaine marche.
          </div>
        </div>
      )}

      {/* Thumbnail strip */}
      {isMultiple && (
        <div className="px-3 pt-3 pb-1 overflow-x-auto scrollbar-thin">
          <div className="flex gap-2">
            {slides.map((s, i) => {
              const meta = SOURCE_META[s.source];
              const active = i === selected;
              const isField = isFieldSource(s.source) || s.alsoReference;
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
                      s.source === 'marcheur'
                        ? 'bg-emerald-600/85'
                        : s.source === 'citizen'
                          ? 'bg-cyan-600/85'
                          : isField
                            ? 'bg-emerald-600/85'
                            : 'bg-sky-600/85'
                    }`}
                  >
                    {isField && s.source !== 'marcheur' && s.source !== 'citizen' ? 'Marcheur' : meta.short}
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
