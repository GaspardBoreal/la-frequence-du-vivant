import React, { useState } from 'react';
import { Bird, Leaf, Sprout, Bug, PawPrint, Flower2 } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { photoUrl } from './gameUtils';

interface Props {
  species: BiodiversitySpecies;
  photoBy: Map<string, string>;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

function kingdomIcon(s: BiodiversitySpecies) {
  const k = (s.kingdom || '').toLowerCase();
  const fam = (s.family || '').toLowerCase();
  if (k === 'fungi') return { Icon: Sprout, color: 'text-amber-700', bg: 'bg-amber-100' };
  if (k === 'plantae') return { Icon: Flower2, color: 'text-emerald-700', bg: 'bg-emerald-100' };
  if (fam.includes('aves') || fam.includes('idae') && (s.source === 'ebird')) {
    return { Icon: Bird, color: 'text-sky-700', bg: 'bg-sky-100' };
  }
  if (fam.includes('insecta')) return { Icon: Bug, color: 'text-orange-700', bg: 'bg-orange-100' };
  if (k === 'animalia') return { Icon: PawPrint, color: 'text-rose-700', bg: 'bg-rose-100' };
  return { Icon: Leaf, color: 'text-stone-600', bg: 'bg-stone-100' };
}

/**
 * Image robuste pour les jeux : tente la photo terrain / iNat, fallback
 * sur un picto par règne en cas d'absence ou d'erreur de chargement.
 */
const GameCardImage: React.FC<Props> = ({ species, photoBy, className = '', alt = '', style }) => {
  const url = photoUrl(species, photoBy);
  const [failed, setFailed] = useState(false);
  const showFallback = !url || failed;

  if (showFallback) {
    const { Icon, color, bg } = kingdomIcon(species);
    return (
      <div className={`w-full h-full flex items-center justify-center ${bg} ${className}`} style={style}>
        <Icon className={`w-1/2 h-1/2 ${color} opacity-80`} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
};

export default GameCardImage;
