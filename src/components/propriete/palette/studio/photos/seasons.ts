/**
 * Saisons & millésimes du carnet photo des ouvrages.
 * La date de référence est la prise de vue (EXIF) quand elle existe,
 * sinon la date d'ajout au carnet.
 */
import type { ObjetPhoto } from '@/hooks/propriete/useObjetPhotos';

export type SeasonKey = 'printemps' | 'ete' | 'automne' | 'hiver';

export const SEASONS: { key: SeasonKey; label: string; glyph: string }[] = [
  { key: 'printemps', label: 'Printemps', glyph: '🌱' },
  { key: 'ete', label: 'Été', glyph: '☀️' },
  { key: 'automne', label: 'Automne', glyph: '🍂' },
  { key: 'hiver', label: 'Hiver', glyph: '❄️' },
];

export const photoDate = (p: ObjetPhoto): Date =>
  new Date(p.taken_at || p.uploaded_at || p.created_at);

export const seasonOf = (p: ObjetPhoto): SeasonKey => {
  const m = photoDate(p).getMonth() + 1;
  if (m >= 3 && m <= 5) return 'printemps';
  if (m >= 6 && m <= 8) return 'ete';
  if (m >= 9 && m <= 11) return 'automne';
  return 'hiver';
};

export const yearOf = (p: ObjetPhoto): number => photoDate(p).getFullYear();

export const formatPhotoDate = (p: ObjetPhoto): string => {
  const d = photoDate(p);
  const label = d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return p.taken_at ? `Prise le ${label}` : `Ajoutée le ${label}`;
};
