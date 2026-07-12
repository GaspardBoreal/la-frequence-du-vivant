import React from 'react';
import { Map, Calendar, Image, Sparkles, List } from 'lucide-react';
import { CarteMdVView } from '@/hooks/useCarteMdV';

interface Props {
  value: CarteMdVView;
  onChange: (v: CarteMdVView) => void;
}

const OPTIONS: { value: CarteMdVView; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'map', label: 'Carte', icon: Map },
  { value: 'timeline', label: 'Timeline', icon: Calendar },
  { value: 'wall', label: 'Mur du Vivant', icon: Image },
  { value: 'constellation', label: 'Constellation', icon: Sparkles },
  { value: 'list', label: 'Liste', icon: List },
];

const ViewSwitcher: React.FC<Props> = ({ value, onChange }) => (
  <div className="container mx-auto px-4 pt-4">
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
      {OPTIONS.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
              active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export default ViewSwitcher;
