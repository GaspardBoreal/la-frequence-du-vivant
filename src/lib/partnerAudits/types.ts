export interface PartnerAuditKpi {
  label: string;
  /** Valeur affichée côté partenaire */
  themText: string;
  /** Valeur affichée côté Fréquence du Vivant */
  usText: string;
  /** Remplissage 0-100 des barres comparatives */
  themPct: number;
  usPct: number;
  /** Phrase courte de lecture de l'écart */
  note?: string;
}

export interface PartnerAuditLever {
  title: string;
  forThem: string;
  forUs: string;
}

export interface PartnerAuditSynthesis {
  /** Phrase-verdict d'ouverture */
  verdict: string;
  kpis: PartnerAuditKpi[];
  /** Ce que le partenaire apporte */
  themBrings: string[];
  /** Ce que nous apportons */
  usBring: string[];
  /** Zone commune */
  shared: string[];
  /** Lecture GEO (lisibilité par les IA génératives) */
  geo: { themLine: string; usLine: string; points: string[] };
  levers: PartnerAuditLever[];
  closing: string;
}

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
  /** Lecture synthétique (page-affiche de négociation). Optionnel. */
  synthesis?: PartnerAuditSynthesis;
}
