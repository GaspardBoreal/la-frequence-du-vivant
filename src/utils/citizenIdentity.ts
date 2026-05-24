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
 * ⚠ Pour dédupliquer dans une LISTE d'attributions, utiliser plutôt
 * `buildCitizenIdentityResolver(...)` ci-dessous : il réconcilie les
 * legacy (sans login) avec les rows enrichies (avec login) du même observateur.
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

/**
 * Construit un resolver d'identité en 2 passes pour un POOL d'attributions.
 *
 * Pass A : index `normalizeAlias(name) → observerLogin` à partir de toute
 *          attribution qui possède LES DEUX champs.
 * Pass B : `resolve(attr)` retourne le login canonique si :
 *          - l'attribution a déjà un `observerLogin`, OU
 *          - son `normalizeAlias(name)` matche une entrée connue dans l'index.
 *          Sinon retombe sur `normalizeAlias(name)`.
 *
 * Conséquence : dès qu'AU MOINS UNE attribution d'un observateur a été
 * enrichie (par ingestion ou backfill), TOUTES ses autres attributions
 * legacy sont automatiquement réconciliées sous la même identité.
 *
 * Garantit la robustesse du filtre observateurs même si le backfill est
 * incomplet ou si certaines obs iNat sont supprimées/privées.
 */
export const buildCitizenIdentityResolver = (
  attributions: Iterable<Partial<BiodiversityObservation> | null | undefined>,
) => {
  const aliasToLogin = new Map<string, string>();
  for (const a of attributions) {
    if (!a) continue;
    const login = (a.observerLogin || '').toString().toLowerCase().trim();
    if (!login) continue;
    const alias = normalizeAlias(a.observerName || '');
    if (!alias) continue;
    // Premier login gagne (déterministe pour un pool donné)
    if (!aliasToLogin.has(alias)) aliasToLogin.set(alias, login);
  }
  return (a: Partial<BiodiversityObservation> | null | undefined): string => {
    if (!a) return '';
    const login = (a.observerLogin || '').toString().toLowerCase().trim();
    if (login) return login;
    const alias = normalizeAlias(a.observerName || '');
    if (!alias) return '';
    return aliasToLogin.get(alias) || alias;
  };
};
