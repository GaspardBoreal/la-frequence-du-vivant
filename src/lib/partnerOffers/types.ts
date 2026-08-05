/** Modèle de données du dossier « catalogue Outils & Services » destiné à un partenaire. */

export interface OfferMarket {
  /** Date ou période du marché */
  period: string;
  /** Intitulé court */
  title: string;
  /** Résumé du cahier des charges */
  brief: string;
  scope: string;
  client: string;
  deliverables: string;
  /** Blocs de notre technologie qui s'y branchent */
  blocks: string[];
}

export interface OfferTool {
  title: string;
  /** Ce que fait l'outil */
  what: string;
  /** Marchés-types du partenaire où il sert */
  useFor: string;
  /** Écran ou export existant qui le prouve */
  proof: string;
}

export interface OfferService {
  title: string;
  detail: string;
  useFor: string;
}

export interface OfferDevelopment {
  title: string;
  /** Marché du fichier qui justifie ce chantier */
  trigger: string;
  /** Durée de développement (≤ 3 mois) */
  duration: string;
  /** Livrable produit */
  output: string;
}

export interface OfferCollaborationMode {
  mode: string;
  summary: string;
  roles: string;
  data: string;
  commitments: string[];
}

export interface OfferQuestion {
  theme: string;
  question: string;
  why: string;
}

export interface PartnerOffer {
  slug: string;
  partnerName: string;
  partnerSite?: string;
  subtitle: string;
  dateLabel: string;
  intro: string;
  sources: string;
  matchers: string[];
  markets: OfferMarket[];
  tools: OfferTool[];
  services: OfferService[];
  developments: OfferDevelopment[];
  collaboration: OfferCollaborationMode[];
  questions: OfferQuestion[];
  closing: string;
}
