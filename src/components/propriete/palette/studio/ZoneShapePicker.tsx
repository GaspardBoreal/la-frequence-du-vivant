import React from 'react';
import { Hexagon, MousePointer2, Pentagon, RectangleHorizontal, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ZoneDrawMode } from './DrawLayer';

interface Props {
  value: ZoneDrawMode;
  onChange: (mode: ZoneDrawMode) => void;
}

const OPTIONS: Array<{
  mode: ZoneDrawMode;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { mode: 'freehand', label: 'Libre', hint: 'Tracer au doigt', icon: MousePointer2 },
  { mode: 'polygon', label: 'Polygone', hint: 'Poser les sommets', icon: Pentagon },
  { mode: 'rectangle', label: 'Rectangle', hint: 'Orienter puis élargir', icon: RectangleHorizontal },
  { mode: 'orthogonal', label: 'Orthogonal', hint: 'Angles à 90°', icon: Route },
  { mode: 'hexagon', label: 'Hexagone', hint: 'Centre puis rayon', icon: Hexagon },
];

export const ZoneShapePicker: React.FC<Props> = ({ value, onChange }) => (
  <div
    className="grid grid-cols-5 gap-1 rounded-lg border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 p-1 shadow-lg backdrop-blur"
    aria-label="Forme de l'emplacement"
  >
    {OPTIONS.map(({ mode, label, hint, icon: Icon }) => (
      <Button
        key={mode}
        type="button"
        variant={value === mode ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange(mode)}
        title={`${label} — ${hint}`}
        aria-pressed={value === mode}
        className="h-auto min-w-0 flex-col gap-0.5 px-2 py-1.5 text-[9px]"
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{label}</span>
      </Button>
    ))}
  </div>
);

export default ZoneShapePicker;