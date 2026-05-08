/**
 * Unified attribution routing for marcheur media (photos, audio, textes, conv).
 *
 * Single source of truth: a media row resolves to either an auth user OR a crew row.
 * - Photos/audio/conv: attribution lives in `attributed_marcheur_id` only.
 * - Textes: attribution lives in BOTH `attributed_marcheur_id` (crew, primary) and
 *   `attributed_user_id` (auth user, optional). The crew row wins when both are set.
 *
 * Crew rows linked to an auth user are merged into the user bucket so a single person
 * is never counted twice.
 */

export interface RoutingMaps {
  /** crewId -> linked auth user_id (when the crew row is "claimed" by a user) */
  crewUserByCrewId: Map<string, string | null>;
  /** auth user_id -> crewId (used to merge a community user into their editorial card) */
  crewIdByUserId: Map<string, string>;
}

export interface Routed {
  userId: string | null;
  crewId: string | null;
}

/** Photos / audio / convivialité — attribution by crew row only. */
export function routeMedia(
  uploaderId: string | null,
  attributedCrewId: string | null,
  maps: RoutingMaps,
): Routed {
  if (attributedCrewId) {
    const linkedUser = maps.crewUserByCrewId.get(attributedCrewId);
    if (linkedUser) return { userId: linkedUser, crewId: null };
    return { userId: null, crewId: attributedCrewId };
  }
  if (uploaderId) {
    // If the uploader has an editorial card, route via the crew (linked user is the same).
    return { userId: uploaderId, crewId: null };
  }
  return { userId: null, crewId: null };
}

/** Textes — attribution can be on a crew row, a user, or fall back to the typist. */
export function routeTexte(
  uploaderId: string | null,
  attributedCrewId: string | null,
  attributedUserId: string | null,
  maps: RoutingMaps,
): Routed {
  if (attributedCrewId) {
    const linkedUser = maps.crewUserByCrewId.get(attributedCrewId);
    if (linkedUser) return { userId: linkedUser, crewId: null };
    return { userId: null, crewId: attributedCrewId };
  }
  if (attributedUserId) {
    return { userId: attributedUserId, crewId: null };
  }
  if (uploaderId) {
    return { userId: uploaderId, crewId: null };
  }
  return { userId: null, crewId: null };
}

/** Tells whether a routed media belongs to the marcheur identified by (userId, crewId). */
export function belongsToMarcheur(
  routed: Routed,
  marcheur: { userId?: string | null; crewId?: string | null },
): boolean {
  if (routed.userId && marcheur.userId && routed.userId === marcheur.userId) return true;
  if (routed.crewId && marcheur.crewId && routed.crewId === marcheur.crewId) return true;
  // Cross-match: a crew bucket also belongs to its linked user (and vice versa) when known.
  return false;
}
