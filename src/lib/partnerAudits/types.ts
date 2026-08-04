export interface PartnerAudit {
  /** Slug utilisé dans l'URL publique /partenaires/:slug */
  slug: string;
  partnerName: string;
  partnerSite?: string;
  subtitle: string;
  dateLabel: string;
  sources: string;
  /** Chaînes (normalisées) permettant de rattacher l'audit à une opportunité */
  matchers: string[];
  /** Corps de l'audit en Markdown (GFM) */
  content: string;
}
