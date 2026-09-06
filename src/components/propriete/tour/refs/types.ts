/** Une ressource du lieu citée dans une action de Tour de Jardin. */
export type TourRefKind = 'species' | 'sample' | 'zone' | 'objet' | 'capteur';

export interface TourRef {
  kind: TourRefKind;
  /** Identifiant interne quand il est connu (zone, objet, capteur, prélèvement). */
  id?: string;
  /** Nom latin pour une espèce. */
  latin?: string;
  /** Texte exact rendu cliquable dans la phrase. */
  label: string;
}

/** Normalisation NFD, minuscules, espaces compactés — pour comparer des libellés. */
export const normRef = (s: string): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
