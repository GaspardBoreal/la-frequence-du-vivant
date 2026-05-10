import React from 'react';
import { Palette, Globe, Mountain, LandPlot } from 'lucide-react';
import type { MapStyle } from './mapStyles';

interface Props {
  mapStyle: MapStyle;
  onChange: (s: MapStyle) => void;
  /** Compact: smaller padding, icon-only on small screens. Default false. */
  compact?: boolean;
  /** Where to absolute-position the toggle inside its relative parent. 'inline' = no positioning. */
  position?: 'top-right' | 'top-left' | 'inline';
  className?: string;
}

const STYLES: { key: MapStyle; icon: React.ReactNode; label: string }[] = [
  { key: 'geopoetic', icon: <Palette className="w-4 h-4" />, label: 'Géo' },
  { key: 'satellite', icon: <Globe className="w-4 h-4" />, label: 'Sat' },
  { key: 'terrain', icon: <Mountain className="w-4 h-4" />, label: 'Relief' },
  { key: 'cadastre', icon: <LandPlot className="w-4 h-4" />, label: 'Cadastre' },
];

const POSITION_CLASSES: Record<NonNullable<Props['position']>, string> = {
  'top-right': 'absolute top-4 right-4 z-[1000]',
  'top-left': 'absolute top-4 left-4 z-[1000]',
  'inline': '',
};

const MapStyleToggle: React.FC<Props> = ({
  mapStyle,
  onChange,
  compact = false,
  position = 'top-right',
  className = '',
}) => {
  const wrapperPos = POSITION_CLASSES[position];
  const padding = compact ? 'px-2 py-1.5' : 'px-3 py-2';
  const gap = compact ? 'gap-1' : 'gap-1.5';

  return (
    <div className={`${wrapperPos} ${className}`}>
      <div className="flex bg-black/50 backdrop-blur-xl rounded-xl border border-white/15 p-1 gap-0.5 shadow-lg shadow-black/20">
        {STYLES.map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex items-center ${gap} ${padding} rounded-lg text-xs font-medium transition-all duration-200
              ${mapStyle === key
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                : 'text-white/60 hover:text-white/90 hover:bg-white/10 border border-transparent'
              }
            `}
            aria-label={label}
            title={label}
          >
            {icon}
            <span className={compact ? 'hidden md:inline' : 'hidden sm:inline'}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapStyleToggle;
