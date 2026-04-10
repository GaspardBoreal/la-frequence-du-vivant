import React from 'react';
import { MapPin } from 'lucide-react';

export const RADIUS_OPTIONS = [
  { value: 0.05, label: '50m' },
  { value: 0.15, label: '150m' },
  { value: 0.25, label: '250m' },
  { value: 0.5, label: '500m' },
  { value: 1, label: '1km' },
  { value: 2.5, label: '2.5km' },
  { value: 5, label: '5km' },
];

const getColor = (r: number) => {
  if (r < 0.5) return { bg: 'bg-sky-500/20', border: 'border-sky-400/40', text: 'text-sky-300', ring: 'ring-sky-400/30' };
  if (r === 0.5) return { bg: 'bg-emerald-500/20', border: 'border-emerald-400/40', text: 'text-emerald-300', ring: 'ring-emerald-400/30' };
  return { bg: 'bg-amber-500/20', border: 'border-amber-400/40', text: 'text-amber-300', ring: 'ring-amber-400/30' };
};

export const calculateCoverageArea = (radiusKm: number): string => {
  return (Math.PI * radiusKm * radiusKm).toFixed(radiusKm < 0.5 ? 3 : 2);
};

interface RadiusSelectorProps {
  value: number;
  onChange: (r: number) => void;
  loading?: boolean;
  readOnly?: boolean;
}

const RadiusSelector: React.FC<RadiusSelectorProps> = ({ value, onChange, loading, readOnly }) => {
  const area = calculateCoverageArea(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <MapPin className="w-3 h-3 text-emerald-400/70" />
        <span>{readOnly ? 'Rayon utilisé lors de la collecte' : "Rayon d'observation"}</span>
        {loading && <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin ml-1" />}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {RADIUS_OPTIONS.map(opt => {
          const active = opt.value === value;
          const colors = getColor(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => !readOnly && onChange(opt.value)}
              disabled={readOnly && !active}
              className={`
                relative flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium
                border transition-all duration-200
                ${active
                  ? `${colors.bg} ${colors.border} ${colors.text} ring-1 ${colors.ring} shadow-sm`
                  : readOnly
                    ? 'bg-background/20 border-border/20 text-muted-foreground/40 cursor-default'
                    : 'bg-background/40 border-border/30 text-muted-foreground hover:bg-muted/40 hover:border-border/50'
                }
              `}
            >
              {opt.label}
              {opt.value === 0.5 && !active && !readOnly && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/60">
        Zone couverte : {area} km²
      </p>
    </div>
  );
};

export default RadiusSelector;
