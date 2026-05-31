import { normalizeAlias } from '@/hooks/useMarcheurAliases';
import type { BiodiversityObservation } from '@/types/biodiversity';

/**
 * Identité canonique d'un contributeur science citoyenne.
 *
 * Hiérarchie de clés (de la + stable à la + fragile) :
 *  1. `inat:<observerId>`   — ID iNat numérique immuable (résiste aux renommages)
 *  2. `observerLogin`       — slug d'URL iNat (immuable tant que pas renommé)
 *  3. `normalizeAlias(observerName)` — nom affiché (fragile)
 *
 * Pour eBird / GBIF (pas de notion d'ID stable côté API ingestion),
 * on retombe sur observerLogin puis name.
 *
 * ⚠ Pour dédupliquer dans une LISTE d'attributions, utiliser plutôt
 * `buildCitizenIdentityResolver(...)` : il réconcilie les attributions
 * legacy (sans login/id) avec celles enrichies du même observateur.
 *
 * Voir mem://technical/community/identity-matching-logic.
 */
export const citizenIdentityKey = (a: Partial<BiodiversityObservation> | null | undefined): string => {
  if (!a) return '';
  const id = (a as any).observerId;
  const source = (a.source || '').toString().toLowerCase();
  if (id != null && id !== '' && (source === 'inaturalist' || !source)) {
    return `inat:${String(id)}`;
  }
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
 * Pass A.1 : ancre alias et login → `inat:<observerId>` pour toute attribution
 *            exposant un observerId (le + stable).
 * Pass A.2 : à défaut, ancre alias → observerLogin pour toute attribution
 *            exposant un login.
 * Pass B   : `resolve()` retourne la clé canonique réconciliée, dans l'ordre :
 *            observerId, login mappé, alias mappé, login brut, alias brut.
 *
 * Conséquence : dès qu'AU MOINS UNE attribution d'un observateur a un
 * `observerId`, toutes ses autres attributions du même pool — y compris
 * celles où il s'est renommé entre temps — tombent sous `inat:<id>`.
 */
export const buildCitizenIdentityResolver = (
  attributions: Iterable<Partial<BiodiversityObservation> | null | undefined>,
) => {
  const loginToCanonical = new Map<string, string>();
  const aliasToCanonical = new Map<string, string>();

  // Pass A.1 : ancrer sur observerId
  for (const a of attributions) {
    if (!a) continue;
    const id = (a as any).observerId;
    if (id == null || id === '') continue;
    const canonical = `inat:${String(id)}`;
    const login = (a.observerLogin || '').toString().toLowerCase().trim();
    if (login && !loginToCanonical.has(login)) loginToCanonical.set(login, canonical);
    const alias = normalizeAlias(a.observerName || '');
    if (alias && !aliasToCanonical.has(alias)) aliasToCanonical.set(alias, canonical);
  }

  // Pass A.2 : à défaut, ancrer sur observerLogin
  for (const a of attributions) {
    if (!a) continue;
    if ((a as any).observerId != null && (a as any).observerId !== '') continue;
    const login = (a.observerLogin || '').toString().toLowerCase().trim();
    if (!login) continue;
    if (!loginToCanonical.has(login)) loginToCanonical.set(login, login);
    const alias = normalizeAlias(a.observerName || '');
    if (alias && !aliasToCanonical.has(alias)) aliasToCanonical.set(alias, login);
  }

  return (a: Partial<BiodiversityObservation> | null | undefined): string => {
    if (!a) return '';
    const id = (a as any).observerId;
    if (id != null && id !== '') return `inat:${String(id)}`;
    const login = (a.observerLogin || '').toString().toLowerCase().trim();
    if (login) return loginToCanonical.get(login) || login;
    const alias = normalizeAlias(a.observerName || '');
    if (!alias) return '';
    return aliasToCanonical.get(alias) || alias;
  };
};
