export type CampaignStatut = 'brouillon' | 'active' | 'pause' | 'cloturee';
export type CampaignObjectif = 'partenariat' | 'mecenat' | 'prestation' | 'autre';

export type CallStatus =
  | 'a_appeler'
  | 'a_rappeler'
  | 'joint'
  | 'interesse'
  | 'refus'
  | 'injoignable';

export type CampaignCanal = 'telephone' | 'email' | 'mixte';

export type EmailStatus =
  | 'non_contacte'
  | 'envoye'
  | 'ouvert'
  | 'repondu'
  | 'desabonne'
  | 'bounce';

export interface CampaignEmailTemplate {
  id: string;
  nom: string;
  objet: string;
  corps: string;
}

export interface CampaignScript {
  accroche?: string;
  preuve?: string;
  demande?: string;
  objections?: Array<{ objection: string; reponse: string }>;
  lien?: string;
  email_templates?: CampaignEmailTemplate[];
}


export interface CampaignCiblage {
  stage?: string;
  region?: string;
  departement?: string;
  ville?: string;
  code_naf?: string;
  search?: string;
  mots_cles?: string[];
}

export interface CrmCampaign {
  id: string;
  nom: string;
  objectif: CampaignObjectif | string;
  statut: CampaignStatut | string;
  canal: CampaignCanal | string;
  description: string | null;
  date_debut: string | null;
  date_fin: string | null;
  pilote_id: string | null;
  objectif_contacts: number | null;
  objectif_taux: number | null;
  script: CampaignScript;
  ciblage: CampaignCiblage;
  couleur: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignMemberCompany {
  id: string;
  nom_complet: string | null;
  denomination: string | null;
  ville: string | null;
  departement: string | null;
  site_web: string | null;
  code_naf: string | null;
  libelle_naf: string | null;
  lifecycle_stage: string | null;
  dirigeants: any;
  notes: string | null;
}

export interface CrmCampaignMember {
  id: string;
  campaign_id: string;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  call_status: CallStatus | string;
  email_status: EmailStatus | string;
  emails_sent: number;
  last_email_at: string | null;
  next_action_at: string | null;
  next_action_canal: 'telephone' | 'email' | null;
  priorite: number;
  attempts: number;
  last_call_at: string | null;
  next_call_at: string | null;
  refus_motif: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  company?: CampaignMemberCompany | null;
}


export interface CampaignStats {
  enroles: number;
  a_appeler: number;
  a_rappeler: number;
  joints: number;
  interesses: number;
  refus: number;
  injoignables: number;
  appels: number;
  opportunites: number;
  rappels_du_jour: number;
  opp_actives: number;
  /** Opportunités ayant dépassé la première relance et non perdues. */
  opp_qualifiees?: number;
  opp_gagnees: number;
  opp_perdues: number;
  ca_potentiel: number;
  motifs_refus: Array<{ motif: string; n: number }>;
}

export const CAMPAIGN_STATUT_OPTIONS: Array<{ value: CampaignStatut; label: string; hue: string }> = [
  { value: 'brouillon', label: 'Brouillon', hue: '220 10% 55%' },
  { value: 'active', label: 'Active', hue: '150 65% 45%' },
  { value: 'pause', label: 'En pause', hue: '38 92% 55%' },
  { value: 'cloturee', label: 'Clôturée', hue: '220 10% 40%' },
];

export const CAMPAIGN_OBJECTIF_OPTIONS: Array<{ value: CampaignObjectif; label: string }> = [
  { value: 'partenariat', label: 'Partenariat' },
  { value: 'mecenat', label: 'Mécénat' },
  { value: 'prestation', label: 'Prestation' },
  { value: 'autre', label: 'Autre' },
];

export const CALL_STATUS_META: Record<
  CallStatus,
  { label: string; hue: string; short: string }
> = {
  a_appeler: { label: 'À appeler', hue: '210 90% 56%', short: 'À appeler' },
  a_rappeler: { label: 'À rappeler', hue: '38 92% 55%', short: 'Rappel' },
  joint: { label: 'Joint', hue: '190 70% 45%', short: 'Joint' },
  interesse: { label: 'Intéressé', hue: '150 65% 45%', short: 'Intérêt' },
  refus: { label: 'Refus', hue: '0 75% 58%', short: 'Refus' },
  injoignable: { label: 'Injoignable', hue: '220 10% 50%', short: 'Injoignable' },
};

export const EMAIL_STATUS_META: Record<
  EmailStatus,
  { label: string; hue: string; short: string }
> = {
  non_contacte: { label: 'À écrire', hue: '210 90% 56%', short: 'À écrire' },
  envoye: { label: 'Envoyé', hue: '190 70% 45%', short: 'Envoyé' },
  ouvert: { label: 'Ouvert', hue: '38 92% 55%', short: 'Ouvert' },
  repondu: { label: 'A répondu', hue: '150 65% 45%', short: 'Réponse' },
  desabonne: { label: 'Désabonné', hue: '220 10% 50%', short: 'Stop' },
  bounce: { label: 'Adresse invalide', hue: '0 75% 58%', short: 'Bounce' },
};


export const REFUS_MOTIFS = [
  'Budget déjà engagé',
  'Pas le bon interlocuteur',
  'Hors territoire',
  'Pas de mécénat cette année',
  'Sujet hors priorités RSE',
  'Process interne (appel à projets)',
  'Pas de réponse après relances',
  'Autre',
];

export function detectionRate(stats: Pick<CampaignStats, 'interesses' | 'joints'>): number {
  if (!stats.joints) return 0;
  return (stats.interesses / stats.joints) * 100;
}
