import React from 'react';
import { useMap } from 'react-leaflet';
import { Plus, Minus } from 'lucide-react';
import type { MapStyle } from '../mapStyles';

interface ZoomControlsProps {
  mapStyle?: MapStyle;
  /** Position on the map (default bottom-right above the bottom panel) */
  className?: string;
}

/**
 * Custom +/- zoom controls styled to match the dark glassmorphism aesthetic,
 * with a cadastre-aware variant. Replaces Leaflet's default control.
 */
export const ZoomControls: React.FC<ZoomControlsProps> = ({
  mapStyle,
  className = 'absolute bottom-20 right-4 z-[1000] flex flex-col gap-1.5',
}) => {
  const map = useMap();
  const isCadastre = mapStyle === 'cadastre';
  const btnClass = isCadastre
    ? 'w-10 h-10 rounded-xl bg-emerald-900/85 backdrop-blur-md border border-emerald-700/60 text-white flex items-center justify-center hover:bg-emerald-800/90 hover:border-emerald-500/70 transition-all duration-200 active:scale-95 shadow-lg shadow-black/30'
    : 'w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-200 active:scale-95';

  return (
    <div className={className}>
      <button onClick={() => map.zoomIn()} className={btnClass} aria-label="Zoomer">
        <Plus className="w-4 h-4" />
      </button>
      <button onClick={() => map.zoomOut()} className={btnClass} aria-label="Dézoomer">
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ZoomControls;
