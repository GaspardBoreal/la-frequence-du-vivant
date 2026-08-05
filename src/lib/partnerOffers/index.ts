import type { PartnerOffer } from './types';
import { vienneNatureOffer } from './vienneNatureOffer';

export type {
  PartnerOffer,
  OfferMarket,
  OfferTool,
  OfferService,
  OfferDevelopment,
  OfferCollaborationMode,
  OfferQuestion,
} from './types';

/** Même mur de mot de passe que les audits partenaires. */
export { PARTNER_AUDIT_PASSWORD as PARTNER_OFFER_PASSWORD } from '@/lib/partnerAudits';

export const PARTNER_OFFERS: PartnerOffer[] = [vienneNatureOffer];

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function getPartnerOfferBySlug(slug: string | undefined): PartnerOffer | null {
  if (!slug) return null;
  return PARTNER_OFFERS.find((o) => o.slug === slug) ?? null;
}

export function resolvePartnerOffer(candidates: (string | null | undefined)[]): PartnerOffer | null {
  const haystack = candidates.filter(Boolean).map((c) => normalize(String(c)));
  if (haystack.length === 0) return null;
  return (
    PARTNER_OFFERS.find((offer) =>
      offer.matchers.some((m) => haystack.some((h) => h.includes(normalize(m)))),
    ) ?? null
  );
}
