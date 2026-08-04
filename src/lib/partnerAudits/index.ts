import type { PartnerAudit } from './types';
import { vienneNatureAudit } from './vienneNature';

export type { PartnerAudit };

/** Mot de passe d'accès aux pages publiques /partenaires/:slug */
export const PARTNER_AUDIT_PASSWORD = 'WINWIN20262037';

export const PARTNER_AUDITS: PartnerAudit[] = [vienneNatureAudit];

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function getPartnerAuditBySlug(slug: string | undefined): PartnerAudit | null {
  if (!slug) return null;
  return PARTNER_AUDITS.find((a) => a.slug === slug) ?? null;
}

/**
 * Rattache un audit à une opportunité à partir de textes libres
 * (titre, entreprise, dénominations des sociétés liées).
 */
export function resolvePartnerAudit(candidates: (string | null | undefined)[]): PartnerAudit | null {
  const haystack = candidates.filter(Boolean).map((c) => normalize(String(c)));
  if (haystack.length === 0) return null;
  return (
    PARTNER_AUDITS.find((audit) =>
      audit.matchers.some((m) => {
        const nm = normalize(m);
        return haystack.some((h) => h.includes(nm));
      }),
    ) ?? null
  );
}
