import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Columns2, NotebookPen, ZoomIn } from 'lucide-react';
import type { ConsultationMedia } from '@/hooks/propriete/useGardenClinique';

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : '—';

const MIN_Z = 1;
const MAX_Z = 6;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const JournalViewer: React.FC<{
  medias: ConsultationMedia[];
  index: number | null;
  onNavigate: (i: number) => void;
  onClose: () => void;
  onPinNote?: (m: ConsultationMedia) => void;
}> = ({ medias, index, onNavigate, onClose, onPinNote }) => {
  const open = index !== null && index >= 0 && index < medias.length;
  const media = open ? medias[index as number] : null;

  const [compareWith, setCompareWith] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);

  const go = React.useCallback(
    (delta: number) => {
      if (index === null || medias.length === 0) return;
      onNavigate((index + delta + medias.length) % medias.length);
    },
    [index, medias.length, onNavigate],
  );

  React.useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [index, compareWith]);

  React.useEffect(() => {
    if (!open) setCompareWith(null);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, onClose]);

  // Zoom molette / pinch trackpad (listener non passif)
  const zoomRef = React.useRef({ zoom, offset });
  zoomRef.current = { zoom, offset };
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el || !open) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const { zoom: z, offset: o } = zoomRef.current;
      const next = clamp(z * Math.exp(-dy * 0.0018), MIN_Z, MAX_Z);
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const k = next / z;
      setZoom(next);
      setOffset(next === 1 ? { x: 0, y: 0 } : { x: px - (px - o.x) * k, y: py - (py - o.y) * k });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open]);

  if (!open || !media) return null;
  const other = compareWith !== null ? medias[compareWith] : null;

  const renderMedia = (m: ConsultationMedia, zoomable: boolean) => {
    if (m.media_type === 'video') {
      return <video src={m.url} controls autoPlay className="max-h-[68vh] w-auto rounded-xl bg-black" />;
    }
    if (m.media_type === 'audio') {
      return <audio src={m.url} controls className="w-[min(90vw,32rem)]" />;
    }
    return (
      <img
        src={m.url}
        alt={m.caption ?? 'Photo du journal de rétablissement'}
        draggable={false}
        className="max-h-[68vh] max-w-full select-none rounded-xl object-contain"
        style={
          zoomable
            ? {
                transformOrigin: '0 0',
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                cursor: zoom > 1 ? 'grab' : 'zoom-in',
              }
            : undefined
        }
      />
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        key="journal-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[220] flex flex-col bg-black/92 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Barre haute */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 text-[hsl(var(--ds-cream))]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-gold))]">
            Journal de rétablissement · {(index as number) + 1} / {medias.length}
          </div>
          <div className="flex items-center gap-2">
            {medias.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setCompareWith((c) =>
                    c === null ? ((index as number) + medias.length - 1) % medias.length : null,
                  )
                }
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  other
                    ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/20 text-[hsl(var(--ds-cream))]'
                    : 'border-white/25 text-white/80 hover:bg-white/10'
                }`}
              >
                <Columns2 className="h-3.5 w-3.5" /> Comparer
              </button>
            )}
            {onPinNote && (
              <button
                type="button"
                onClick={() => onPinNote(media)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/10"
              >
                <NotebookPen className="h-3.5 w-3.5" /> Repère de prescription
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scène */}
        <div
          ref={stageRef}
          className="relative flex flex-1 items-center justify-center overflow-hidden px-3"
          style={{ touchAction: 'none' }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => {
            const t = e.touches[0];
            touchStart.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchEnd={(e) => {
            const s = touchStart.current;
            if (!s) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - s.x;
            if (Math.abs(dx) > 60 && Math.abs(t.clientY - s.y) < 80) go(dx < 0 ? 1 : -1);
            touchStart.current = null;
          }}
        >
          {medias.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Précédent"
                className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 md:left-8"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Suivant"
                className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 md:right-8"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <motion.div
            key={media.id + (other?.id ?? '')}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`flex w-full max-w-6xl items-center justify-center gap-4 ${other ? 'flex-col md:flex-row' : ''}`}
          >
            {other && (
              <figure className="flex min-w-0 flex-1 flex-col items-center">
                {renderMedia(other, false)}
                <figcaption className="mt-2 text-center text-[11px] text-white/70">
                  {fmt(other.taken_at ?? other.created_at)}
                  {other.severity_at_capture ? ` · étendue ${other.severity_at_capture}/5` : ''}
                </figcaption>
              </figure>
            )}
            <figure className="flex min-w-0 flex-1 flex-col items-center">
              {renderMedia(media, !other)}
              {other && (
                <figcaption className="mt-2 text-center text-[11px] text-white/70">
                  {fmt(media.taken_at ?? media.created_at)}
                  {media.severity_at_capture ? ` · étendue ${media.severity_at_capture}/5` : ''}
                </figcaption>
              )}
            </figure>
          </motion.div>
        </div>

        {/* Pied : légende + vignettes */}
        <div className="px-4 pb-4 pt-2 text-white" onClick={(e) => e.stopPropagation()}>
          {!other && (
            <div className="text-center text-xs text-white/80">
              <span className="font-medium text-white">{fmt(media.taken_at ?? media.created_at)}</span>
              {media.severity_at_capture ? ` · étendue ${media.severity_at_capture}/5` : ''}
              {media.caption ? ` · ${media.caption}` : ''}
              {media.media_type === 'photo' && (
                <span className="ml-2 inline-flex items-center gap-1 text-white/50">
                  <ZoomIn className="h-3 w-3" /> molette pour zoomer
                </span>
              )}
            </div>
          )}
          {medias.length > 1 && (
            <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
              {medias.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => (other ? setCompareWith(i) : onNavigate(i))}
                  aria-label={`Média ${i + 1}`}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition ${
                    i === index
                      ? 'border-[hsl(var(--ds-gold))] opacity-100'
                      : i === compareWith
                        ? 'border-white opacity-90'
                        : 'border-white/20 opacity-55 hover:opacity-90'
                  }`}
                >
                  {m.media_type === 'photo' ? (
                    <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-white/10 text-[9px] uppercase">
                      {m.media_type === 'video' ? 'vidéo' : 'audio'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JournalViewer;
