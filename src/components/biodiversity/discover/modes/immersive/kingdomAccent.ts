import type { BiodiversitySpecies } from '@/types/biodiversity';

export interface KingdomAccent {
  key: string;
  label: string;
  hex: string;
  glow: string;
}

export function getKingdomAccent(s: BiodiversitySpecies): KingdomAccent {
  const iconic = (s.iconicTaxon || '').toLowerCase();
  const kingdom = s.kingdom;
  if (kingdom === 'Plantae') return { key: 'flore', label: 'flore', hex: '#10b981', glow: 'rgba(16,185,129,0.55)' };
  if (kingdom === 'Fungi') return { key: 'champignon', label: 'champignon', hex: '#c084fc', glow: 'rgba(192,132,252,0.55)' };
  if (iconic.includes('aves')) return { key: 'oiseau', label: 'oiseau', hex: '#22d3ee', glow: 'rgba(34,211,238,0.55)' };
  if (iconic.includes('insecta') || iconic.includes('arachnida'))
    return { key: 'insecte', label: 'insecte', hex: '#f59e0b', glow: 'rgba(245,158,11,0.55)' };
  if (iconic.includes('mammalia')) return { key: 'mammifere', label: 'mammifère', hex: '#fb923c', glow: 'rgba(251,146,60,0.55)' };
  if (iconic.includes('reptilia') || iconic.includes('amphibia'))
    return { key: 'reptile', label: 'reptile/amphibien', hex: '#a3e635', glow: 'rgba(163,230,53,0.55)' };
  if (iconic.includes('mollusca')) return { key: 'mollusque', label: 'mollusque', hex: '#60a5fa', glow: 'rgba(96,165,250,0.55)' };
  if (kingdom === 'Animalia') return { key: 'animal', label: 'animal', hex: '#f472b6', glow: 'rgba(244,114,182,0.55)' };
  return { key: 'autre', label: 'vivant', hex: '#e5e7eb', glow: 'rgba(229,231,235,0.35)' };
}

export interface Chapter {
  id: string;
  label: string;
  tagline: string;
}

export function getChapter(s: BiodiversitySpecies): Chapter {
  const a = getKingdomAccent(s).key;
  if (a === 'flore') return { id: 'racines', label: 'Les Racines', tagline: 'ce qui prend et qui tient' };
  if (a === 'oiseau') return { id: 'ailes', label: 'Les Ailés', tagline: 'ce qui traverse' };
  if (a === 'insecte') return { id: 'minuscules', label: 'Les Minuscules', tagline: 'ce qui tisse le monde' };
  if (a === 'champignon') return { id: 'discrets', label: 'Les Discrets', tagline: 'ce qui décompose et relie' };
  if (a === 'mammifere') return { id: 'sauvages', label: 'Les Sauvages', tagline: 'ce qui rôde à la lisière' };
  if (a === 'reptile') return { id: 'lents', label: 'Les Lents', tagline: 'ce qui se glisse' };
  if (a === 'mollusque') return { id: 'humides', label: 'Les Humides', tagline: 'ce qui rampe et respire' };
  return { id: 'autres', label: 'Les Autres', tagline: 'ce qui persiste' };
}

/** Extract a rough GPS point from species attributions (first valid). */
export function speciesGps(s: BiodiversitySpecies): { lat: number; lon: number } | null {
  for (const a of s.attributions || []) {
    if (typeof a.exactLatitude === 'number' && typeof a.exactLongitude === 'number') {
      return { lat: a.exactLatitude, lon: a.exactLongitude };
    }
  }
  return null;
}
