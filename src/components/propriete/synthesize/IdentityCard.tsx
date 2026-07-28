import React from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  Leaf,
  Wind,
  Waves,
  Droplets,
  Sprout,
  Mountain,
  MapPin,
  Layers,
  Flower2,
  ScanEye,
  Gauge,
} from 'lucide-react';
import type { IdentityLine } from './synthesisModel';

type Deco = { Icon: React.ComponentType<{ className?: string }>; ink: string; tint: string };

const FOREST = 'hsl(var(--ds-forest-deep))';
const GOLD = 'hsl(var(--ds-gold))';

/** Choisit le picto et la couleur en fonction de la donnée saisie. */
const decorate = (l: IdentityLine): Deco => {
  const v = l.value.toLowerCase();
  switch (l.key) {
    case 'exposure':
      if (v.includes('ensoleill')) return { Icon: Sun, ink: '#B8860B', tint: 'rgba(212,175,55,0.16)' };
      if (v.includes('mi-ombre')) return { Icon: CloudSun, ink: '#8A7A3D', tint: 'rgba(212,175,55,0.10)' };
      return { Icon: Cloud, ink: '#4B5D63', tint: 'rgba(75,93,99,0.12)' };
    case 'wind':
      if (v.includes('abrit')) return { Icon: Leaf, ink: '#2F5D3A', tint: 'rgba(47,93,58,0.12)' };
      if (v.includes('expos')) return { Icon: Waves, ink: '#5B6BA8', tint: 'rgba(91,107,168,0.14)' };
      return { Icon: Wind, ink: '#3F7C8C', tint: 'rgba(63,124,140,0.13)' };
    case 'humidity':
      if (v.includes('sec')) return { Icon: Sun, ink: '#C0762A', tint: 'rgba(192,118,42,0.13)' };
      if (v.includes('humide')) return { Icon: Droplets, ink: '#2E6FA8', tint: 'rgba(46,111,168,0.14)' };
      return { Icon: Sprout, ink: '#2F5D3A', tint: 'rgba(47,93,58,0.12)' };
    case 'relief':
      return { Icon: Mountain, ink: '#6B5B3E', tint: 'rgba(107,91,62,0.12)' };
    case 'context':
      return { Icon: MapPin, ink: FOREST, tint: 'rgba(47,93,58,0.10)' };
    case 'soil':
      return { Icon: Layers, ink: '#7A5A34', tint: 'rgba(122,90,52,0.13)' };
    case 'flora':
      return { Icon: Flower2, ink: '#3F7A4B', tint: 'rgba(63,122,75,0.13)' };
    case 'icg': {
      const n = Number(l.value.match(/(\d+)\s*\/\s*100/)?.[1] ?? NaN);
      if (!Number.isNaN(n) && n >= 75)
        return { Icon: Gauge, ink: '#2F7A4B', tint: 'rgba(47,122,75,0.14)' };
      if (!Number.isNaN(n) && n >= 50)
        return { Icon: Gauge, ink: '#B8860B', tint: 'rgba(212,175,55,0.14)' };
      return { Icon: Gauge, ink: '#B0562A', tint: 'rgba(176,86,42,0.13)' };
    }
    case 'species':
      return { Icon: ScanEye, ink: GOLD, tint: 'rgba(176,141,87,0.14)' };
    default:
      return { Icon: Leaf, ink: FOREST, tint: 'rgba(47,93,58,0.10)' };
  }
};

/** Carte d'identité écologique — la fiche signalétique du site, tous étages confondus. */
export const IdentityCard: React.FC<{
  lines: IdentityLine[];
  compact?: boolean;
}> = ({ lines, compact = false }) => {
  if (lines.length === 0) {
    return (
      <p className="text-xs italic text-[hsl(var(--ds-forest-deep))]/45">
        — Complétez les étapes précédentes pour révéler la carte d’identité du site —
      </p>
    );
  }

  return (
    <dl
      className={
        compact
          ? 'grid grid-cols-2 gap-x-6 gap-y-2.5'
          : 'grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3'
      }
    >
      {lines.map((l) => {
        const { Icon, ink, tint } = decorate(l);
        return (
          <div
            key={l.key}
            className="flex items-start justify-between gap-3 border-b border-dotted border-[hsl(var(--ds-line))] pb-1.5 print-avoid-break"
          >
            <dt className="flex items-center gap-2 shrink-0">
              <span
                className="print-exact inline-flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: compact ? 18 : 22,
                  height: compact ? 18 : 22,
                  background: tint,
                  color: ink,
                  border: `1px solid ${ink}33`,
                }}
                aria-hidden
              >
                <Icon className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
              </span>
              <span
                className="print-exact text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: ink }}
              >
                {l.label}
              </span>
            </dt>
            <dd className="text-right">
              <span className="font-serif italic text-base text-[hsl(var(--ds-forest-deep))] leading-tight">
                {l.value}
              </span>
              <span className="block text-[9px] uppercase tracking-widest text-[hsl(var(--ds-forest-deep))]/40">
                {l.origin}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
};
