import React from 'react';
import { LandPlot, Leaf, Archive, MapPin, RadioTower } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProprietesKpiCounts, ProprietesKpiKey } from './types';

interface Props {
  counts: ProprietesKpiCounts;
  active: ProprietesKpiKey | null;
  onToggle: (k: ProprietesKpiKey) => void;
}

const CARD =
  'rounded-xl border p-3 sm:p-4 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const ProprietesKpiBar: React.FC<Props> = ({ counts, active, onToggle }) => {
  const items: {
    key: ProprietesKpiKey | 'total';
    label: string;
    hint: string;
    value: number;
    icon: React.ReactNode;
    clickable: boolean;
  }[] = [
    {
      key: 'total',
      label: 'Total',
      hint: 'toutes propriétés',
      value: counts.total,
      icon: <LandPlot className="h-4 w-4 text-primary" />,
      clickable: false,
    },
    {
      key: 'actives',
      label: 'Actives',
      hint: 'exploitées au quotidien',
      value: counts.actives,
      icon: <Leaf className="h-4 w-4 text-emerald-500" />,
      clickable: true,
    },
    {
      key: 'archivees',
      label: 'Archivées',
      hint: 'sorties du circuit',
      value: counts.archivees,
      icon: <Archive className="h-4 w-4 text-muted-foreground" />,
      clickable: true,
    },
    {
      key: 'geo',
      label: 'Géolocalisées',
      hint: 'coordonnées GPS connues',
      value: counts.geolocalisees,
      icon: <MapPin className="h-4 w-4 text-sky-500" />,
      clickable: true,
    },
    {
      key: 'sondes',
      label: 'Avec sondes',
      hint: 'au moins un capteur IoT',
      value: counts.avecSondes,
      icon: <RadioTower className="h-4 w-4 text-amber-500" />,
      clickable: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
      {items.map((it) => {
        const isActive = active === it.key;
        const inner = (
          <>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {it.icon}
              <span className="truncate">{it.label}</span>
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold tabular-nums">{it.value}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground truncate">{it.hint}</div>
          </>
        );
        if (!it.clickable) {
          return (
            <div key={it.key} className={cn(CARD, 'bg-card border-border cursor-default')}>
              {inner}
            </div>
          );
        }
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onToggle(it.key as ProprietesKpiKey)}
            aria-pressed={isActive}
            className={cn(
              CARD,
              isActive
                ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/30'
                : 'bg-card border-border hover:bg-muted/50',
            )}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
};

export default ProprietesKpiBar;
