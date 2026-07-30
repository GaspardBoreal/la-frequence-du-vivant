import React from 'react';
import { Minus, Plus, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { MAX_SCALE, MIN_SCALE } from '@/hooks/useImageZoomPan';

interface Props {
  scale: number;
  onScale: (v: number) => void;
  onReset: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  loadingHiRes?: boolean;
}

/**
 * Barre « loupe de terrain » de la visionneuse : zoom, ajustement, plein cadre.
 * Registre visuel aligné sur InlineGpsBar (forêt profonde + filet doré).
 */
export const ZoomBar: React.FC<Props> = ({
  scale,
  onScale,
  onReset,
  expanded,
  onToggleExpand,
  loadingHiRes,
}) => (
  <div
    onClick={(e) => e.stopPropagation()}
    className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-2xl border border-[hsl(var(--ds-gold))]/70 bg-[hsl(var(--ds-forest-deep))]/95 px-3 py-2 text-[hsl(var(--ds-cream))] shadow-[0_18px_48px_-12px_rgba(0,0,0,0.75)] backdrop-blur"
  >
    <button
      type="button"
      aria-label="Réduire le zoom"
      onClick={() => onScale(scale / 1.4)}
      disabled={scale <= MIN_SCALE}
      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition"
    >
      <Minus className="w-3.5 h-3.5" />
    </button>

    <input
      type="range"
      aria-label="Niveau de zoom"
      min={MIN_SCALE}
      max={MAX_SCALE}
      step={0.1}
      value={scale}
      onChange={(e) => onScale(Number(e.target.value))}
      className="w-24 sm:w-32 accent-[hsl(var(--ds-gold))] cursor-pointer"
    />

    <button
      type="button"
      aria-label="Augmenter le zoom"
      onClick={() => onScale(scale * 1.4)}
      disabled={scale >= MAX_SCALE}
      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition"
    >
      <Plus className="w-3.5 h-3.5" />
    </button>

    <span className="tabular-nums text-[11px] font-semibold text-[hsl(var(--ds-gold))] w-9 text-center">
      {scale.toFixed(1)}×
    </span>

    <button
      type="button"
      onClick={onReset}
      disabled={scale <= MIN_SCALE}
      title="Ajuster à l'écran (0)"
      className="h-7 px-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-[11px] flex items-center gap-1 transition"
    >
      <RotateCcw className="w-3 h-3" /> Ajuster
    </button>

    <button
      type="button"
      onClick={onToggleExpand}
      title={expanded ? 'Afficher la légende' : 'Plein cadre'}
      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
    >
      {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
    </button>

    {loadingHiRes && (
      <span className="text-[10px] italic opacity-70 hidden sm:inline">haute définition…</span>
    )}
  </div>
);

export default ZoomBar;
