import React from 'react';
import { cn } from '@/lib/utils';
import { EyeOff, Route, MapPin } from 'lucide-react';

export type MarchesDisplayMode = 'off' | 'traces' | 'full';

interface Props {
  value: MarchesDisplayMode;
  onChange: (m: MarchesDisplayMode) => void;
}

const OPTIONS: Array<{ k: MarchesDisplayMode; label: string; Icon: React.ComponentType<any>; title: string }> = [
  { k: 'off', label: 'Off', Icon: EyeOff, title: 'Masquer les marches' },
  { k: 'traces', label: 'Tracés', Icon: Route, title: 'Centroïdes des marches' },
  { k: 'full', label: '+ Labels', Icon: MapPin, title: 'Centroïdes + nom des marches' },
];

const InatFullscreenMarchesToggle: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div
      role="radiogroup"
      aria-label="Affichage des marches"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
    >
      <span className="text-[10px] text-muted-foreground px-2 hidden sm:inline">Marches</span>
      {OPTIONS.map((o) => {
        const active = value === o.k;
        return (
          <button
            key={o.k}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.k)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50',
            )}
          >
            <o.Icon className="w-3 h-3" />
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export const useMarchesDisplayMode = (storageKey = 'inat-fs-marches-mode') => {
  const [mode, setMode] = React.useState<MarchesDisplayMode>(() => {
    if (typeof window === 'undefined') return 'traces';
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'off' || stored === 'traces' || stored === 'full') return stored;
    return 'traces';
  });
  React.useEffect(() => {
    try { window.localStorage.setItem(storageKey, mode); } catch {}
  }, [mode, storageKey]);
  return [mode, setMode] as const;
};

export default InatFullscreenMarchesToggle;
