import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, Globe, User, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import MediaAttributionSheet from '@/components/community/insights/curation/MediaAttributionSheet';
import type { ReattributeSource } from '@/hooks/useReattributeMedia';

export interface LightboxItem {
  url: string;
  type: 'photo' | 'video';
  titre?: string | null;
  isPublic: boolean;
  isOwner: boolean;
  createdAt?: string;
  /** Underlying row id (marcheur_medias / marcheur_audio / exploration_convivialite_photos). */
  id?: string;
  /** Source table — required to enable reattribution on this item. */
  source?: ReattributeSource;
  /** Currently attributed marcheur (overrides uploader). */
  attributedMarcheurId?: string | null;
  /** Original uploader's display name. */
  uploaderName?: string | null;
}

interface MediaLightboxProps {
  items: LightboxItem[];
  startIndex: number;
  onClose: () => void;
  /** Curator/admin/sentinelle — enables the attribution editor. */
  canReattribute?: boolean;
  /** All marcheurs of the parent exploration (for the bottom-sheet picker). */
  marcheurs?: ExplorationMarcheur[];
  /** Used by the reattribute mutation for cache invalidation. */
  explorationId?: string;
}

const MediaLightbox: React.FC<MediaLightboxProps> = ({
  items,
  startIndex,
  onClose,
  canReattribute = false,
  marcheurs = [],
  explorationId,
}) => {
  const [index, setIndex] = useState(startIndex);
  const [attributionOpen, setAttributionOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const goNext = useCallback(() => setIndex(i => Math.min(i + 1, items.length - 1)), [items.length]);
  const goPrev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const item = items[index];

  const attributedName = useMemo(() => {
    if (!item?.attributedMarcheurId) return null;
    const m = marcheurs.find(x => x.id === item.attributedMarcheurId);
    return m?.fullName ?? null;
  }, [item, marcheurs]);

  if (!item) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 50 && dy < 100) {
      if (dx > 0) goNext();
      else goPrev();
    }
  };

  const canEditCredit = !!(canReattribute && item.id && item.source);
  const displayName = attributedName || item.uploaderName || null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-white/70 text-sm font-medium">
            {index + 1} / {items.length}
          </span>
        </div>

        {/* Media */}
        <div className="flex-1 relative flex items-center justify-center min-h-0 px-2">
          {index > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {index < items.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex items-center justify-center"
            >
              {item.type === 'photo' ? (
                <img
                  src={item.url}
                  alt={item.titre || ''}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  draggable={false}
                />
              ) : (
                <video
                  src={item.url}
                  controls
                  className="max-w-full max-h-full rounded-lg"
                  playsInline
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="shrink-0 px-4 py-3 space-y-2">
          {item.titre && (
            <p className="text-white text-sm font-medium truncate">{item.titre}</p>
          )}

          {/* Author / credit chip — interactive when curator */}
          {(displayName || canEditCredit) && (
            <button
              type="button"
              disabled={!canEditCredit}
              onClick={() => canEditCredit && setAttributionOpen(true)}
              className={`flex items-center gap-2 -mx-1 px-2 py-1 rounded-lg transition text-left ${
                canEditCredit
                  ? 'hover:bg-white/10 cursor-pointer'
                  : 'cursor-default'
              }`}
              aria-label={canEditCredit ? 'Réattribuer la photo' : undefined}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-wider text-white/40 leading-none">
                  {item.attributedMarcheurId ? 'Crédité·e à' : 'Marcheur·euse'}
                  {item.attributedMarcheurId && item.uploaderName && item.uploaderName !== displayName && (
                    <span className="normal-case tracking-normal text-white/30 ml-1">
                      · upload {item.uploaderName}
                    </span>
                  )}
                </div>
                <div className="text-white text-xs font-medium truncate flex items-center gap-1.5 mt-0.5">
                  {displayName || 'Anonyme'}
                  {canEditCredit && <Pencil className="w-3 h-3 text-white/40 shrink-0" />}
                </div>
              </div>
            </button>
          )}

          <div className="flex items-center gap-2 text-white/50 text-xs">
            {item.isPublic ? (
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>
            ) : (
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Privé</span>
            )}
            {item.createdAt && (
              <>
                <span>·</span>
                <span>{format(new Date(item.createdAt), 'd MMM yyyy', { locale: fr })}</span>
              </>
            )}
          </div>
        </div>

        {canEditCredit && item.id && item.source && (
          <MediaAttributionSheet
            open={attributionOpen}
            onOpenChange={setAttributionOpen}
            source={item.source}
            mediaId={item.id}
            explorationId={explorationId}
            marcheurs={marcheurs}
            currentAttributedId={item.attributedMarcheurId ?? null}
            uploaderName={item.uploaderName ?? null}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaLightbox;
