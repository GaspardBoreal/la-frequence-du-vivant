/**
 * Shared category definitions for exploration curations (sense "oeil").
 * Used by CuratedSpeciesCard (badge overlay) and CategoryControl (editable popover).
 */

export interface CurationCategory {
  value: string;
  label: string;
  /** Tailwind classes (text + bg + border) — works in both light & dark themes */
  color: string;
}

export const CATEGORIES: CurationCategory[] = [
  { value: 'emblematique', label: 'Emblématique', color: 'text-amber-700 bg-amber-500/10 border-amber-500/30' },
  { value: 'parapluie',    label: 'Parapluie',    color: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'eee',          label: 'EEE',          color: 'text-rose-700 bg-rose-500/10 border-rose-500/30' },
  { value: 'auxiliaire',   label: 'Auxiliaire',   color: 'text-sky-700 bg-sky-500/10 border-sky-500/30' },
  { value: 'protegee',     label: 'Protégée',     color: 'text-violet-700 bg-violet-500/10 border-violet-500/30' },
];

export const getCatStyle = (value?: string | null): string =>
  CATEGORIES.find(c => c.value === value)?.color ??
  'text-muted-foreground bg-muted/40 border-border';

export const getCatLabel = (value?: string | null): string =>
  CATEGORIES.find(c => c.value === value)?.label ?? value ?? '';
