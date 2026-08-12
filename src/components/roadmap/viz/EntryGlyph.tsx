import React from 'react';
import { VIZ } from '@/lib/roadmap/vizPalette';

interface Props {
  domain?: string | null;
  seed?: string;
  className?: string;
}

type Glyph = 'sol' | 'feuille' | 'onde' | 'reseau' | 'oeil' | 'goutte';

const pick = (domain: string, seed: string): Glyph => {
  const d = domain.toLowerCase();
  if (/sol|terre|prélè|analyse/.test(d)) return 'sol';
  if (/flore|espèce|biodiv|palette|vég/.test(d)) return 'feuille';
  if (/capteur|iot|sonde|télé/.test(d)) return 'onde';
  if (/crm|campagne|partenaire|réseau|partage/.test(d)) return 'reseau';
  if (/eau|pluie|météo|climat/.test(d)) return 'goutte';
  if (d) return 'oeil';
  const list: Glyph[] = ['sol', 'feuille', 'onde', 'reseau', 'oeil', 'goutte'];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 17 + seed.charCodeAt(i)) % list.length;
  return list[h];
};

/** Petit croquis d'identité : aucune carte ne reste nue. */
const EntryGlyph: React.FC<Props> = ({ domain, seed = '', className = '' }) => {
  const g = pick(domain ?? '', seed);
  const s = { fill: 'none', stroke: VIZ.accent, strokeWidth: 1.4, strokeLinecap: 'round' as const };

  return (
    <svg viewBox="0 0 64 64" className={className} role="presentation" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="hsl(var(--primary) / 0.07)" stroke={VIZ.accentSoft} strokeWidth="1" />
      {g === 'sol' && (
        <g {...s}>
          <path d="M12 30h40M14 40h36M18 50h28" opacity="0.7" />
          <path d="M32 12v16M32 28c-5-2-8-6-8-10M32 28c5-2 8-6 8-10" />
        </g>
      )}
      {g === 'feuille' && (
        <g {...s}>
          <path d="M20 44c0-14 10-24 24-26 2 14-8 26-24 26Z" />
          <path d="M44 18 24 42" />
        </g>
      )}
      {g === 'onde' && (
        <g {...s}>
          <path d="M32 44V26" />
          <circle cx="32" cy="46" r="3" fill={VIZ.accent} stroke="none" />
          <path d="M22 24a14 14 0 0 1 20 0M26 30a8 8 0 0 1 12 0" />
        </g>
      )}
      {g === 'reseau' && (
        <g {...s}>
          <circle cx="32" cy="20" r="4" />
          <circle cx="20" cy="42" r="4" />
          <circle cx="44" cy="42" r="4" />
          <path d="M32 24 21 38M32 24l11 14M24 42h16" />
        </g>
      )}
      {g === 'goutte' && (
        <g {...s}>
          <path d="M32 16c8 10 12 15 12 21a12 12 0 1 1-24 0c0-6 4-11 12-21Z" />
        </g>
      )}
      {g === 'oeil' && (
        <g {...s}>
          <path d="M12 32c8-10 32-10 40 0-8 10-32 10-40 0Z" />
          <circle cx="32" cy="32" r="5" />
        </g>
      )}
    </svg>
  );
};

export default EntryGlyph;
