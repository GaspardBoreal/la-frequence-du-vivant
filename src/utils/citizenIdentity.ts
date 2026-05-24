import { normalizeAlias } from '@/hooks/useMarcheurAliases';
import type { BiodiversityObservation } from '@/types/biodiversity';

/**
 * Identité canonique d'un contributeur science citoyenne.
 *
 * Pour iNaturalist :
 *  - clé prioritaire = `observerLogin` (slug d'URL, immuable, ex: `les-marches-du-vivant`)
 *  - fallback = `normalizeAlias(observerName)` pour les snapshots historiques
 *    ingérés avant que `observerLogin` ne soit capturé.
 *
 * Pour eBird / GBIF (pas de notion de login stable côté API) :
 *  - on retombe sur `normalizeAlias(observerName)`.
 *
 * Voir mem://technical/community/identity-matching-logic.
 */
export const citizenIdentityKey = (a: Partial<BiodiversityObservation> | null | undefined): string => {
  if (!a) return '';
  const login = (a.observerLogin || '').toString().toLowerCase().trim();
  if (login) return login;
  return normalizeAlias(a.observerName || '');
};

/** Libellé d'affichage d'un contributeur (name si dispo, sinon login, sinon Anonyme). */
export const citizenDisplayName = (a: Partial<BiodiversityObservation> | null | undefined): string => {
  if (!a) return 'Anonyme';
  const name = (a.observerName || '').toString().trim();
  if (name) return name;
  const login = (a.observerLogin || '').toString().trim();
  return login || 'Anonyme';
};
