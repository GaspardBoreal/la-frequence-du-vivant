import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar, Eye } from 'lucide-react';

export interface CortegePhotoItem {
  url: string;
  nom: string;
  latin?: string | null;
  famille?: string | null;
  lastSeen?: string | null;
  observations?: number;
}

interface Props {
  items: CortegePhotoItem[];
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Visionneuse plein écran du « Cortège illustré » :
 * zoom (molette / boutons / double-clic), déplacement au glisser,
 * navigation clavier ← → et Échap, légende complète.
 */
export const CortegePhotoLightbox: React.FC<Props> = ({ items, index, onIndexChange, onClose }) => {
  const open = index !== null && index >= 0 && index < items.length;
  const item = open ? items[index as number] : null;

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{ x: number; y: number } | null>(null);

  const reset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    reset();
  }, [index, reset]);

  const go = useCallback(
    (delta: number) => {
      if (!items.length || index === null) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [items.length, index, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === '+') setZoom((z) => Math.min(MAX_ZOOM, z + 0.5));
      if (e.key === '-') setZoom((z) => Math.max(MIN_ZOOM, z - 0.5));
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, go, onClose]);

  if (!open || !item) return null;

  const dateStr = item.lastSeen
    ? new Date(item.lastSeen).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      role="dialog"
      aria-modal="true"
      aria-label={item.nom}
      onClick={onClose}
      className="fixed inset-0 z-[4000] bg-black/92 flex flex-col items-center justify-center p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la visionneuse"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/25 transition"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Zoom controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/12 backdrop-blur px-2 py-1.5 text-white"
      >
        <button
          type="button"
          aria-label="Dézoomer"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.5))}
          className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          aria-label="Zoomer"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.5))}
          className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Photo précédente"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-3 md:left-6 w-11 h-11 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/25 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            aria-label="Photo suivante"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-3 md:right-6 w-11 h-11 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/25 transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div
        className="overflow-hidden max-h-[72vh] max-w-[92vw] rounded-xl"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - e.deltaY * 0.002)));
        }}
        onDoubleClick={() => (zoom > 1 ? reset() : setZoom(2))}
        onPointerDown={(e) => {
          if (zoom <= 1) return;
          dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragRef.current) return;
          setOffset({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        style={{ cursor: zoom > 1 ? 'grab' : 'zoom-in' }}
      >
        <img
          src={item.url}
          alt={item.nom}
          draggable={false}
          className="max-h-[72vh] max-w-[92vw] object-contain select-none shadow-2xl transition-transform duration-100"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
        />
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 w-full max-w-2xl rounded-2xl border border-white/15 bg-neutral-900/95 shadow-2xl px-5 py-4 text-neutral-50"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-serif text-xl leading-tight text-neutral-50">{item.nom}</div>
            {item.latin && (
              <div className="text-sm italic text-neutral-300">{item.latin}</div>
            )}
          </div>
          {items.length > 1 && (
            <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tabular-nums text-neutral-100">
              {(index as number) + 1} / {items.length}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {typeof item.observations === 'number' && item.observations > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-neutral-100">
              <Eye className="w-3.5 h-3.5" /> Vu {item.observations}×
            </span>
          )}
          {dateStr && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-neutral-100">
              <Calendar className="w-3.5 h-3.5" /> Dernière observation · {dateStr}
            </span>
          )}
        </div>

        <div className="mt-3 border-t border-white/10 pt-2 text-[11px] text-neutral-400">
          Molette ou double-clic pour zoomer · ← → pour naviguer · Échap pour fermer
        </div>
      </div>

    </motion.div>,
    document.body,
  );
};

export default CortegePhotoLightbox;
