// CRM Types for the Association Management System

export type CrmRole = 'admin' | 'member' | 'walker';

export type OpportunityStatus = 
  | 'a_contacter' 
  | 'relance_1' 
  | 'relance_2' 
  | 'relance_3' 
  | 'pas_interesse' 
  | 'gagne' 
  | 'perdu';

export type ExperienceType = 
  | 'team_building' 
  | 'formation' 
  | 'seminaire' 
  | 'decouverte' 
  | 'sur_mesure';

export type FormatType = 
  | 'demi_journee' 
  | 'journee' 
  | 'deux_jours' 
  | 'sur_mesure';

export type FinancementType = 
  | 'direct' 
  | 'opco' 
  | 'cpf' 
  | 'autre';

export type ContactSegment = 
  | 'general' 
  | 'entreprise' 
  | 'association' 
  | 'partenaire' 
  | 'presse';

export type EmailType = 
  | 'devis' 
  | 'relance' 
  | 'newsletter' 
  | 'confirmation';

export interface TeamMember {
  id: string;
  user_id: string | null;
  prenom: string;
  nom: string;
  fonction: string | null;
  telephone: string | null;
  email: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmOpportunity {
  id: string;
  // Contact info
  prenom: string;
  nom: string;
  entreprise: string | null;
  fonction: string | null;
  telephone: string | null;
  email: string;
  // Project details
  experience_souhaitee: string | null;
  format_souhaite: string | null;
  date_souhaitee: string | null;
  lieu_prefere: string | null;
  objectifs: string | null;
  financement_souhaite: string | null;
  budget_estime: number | null;
  nombre_participants: number | null;
  // Pipeline
  statut: OpportunityStatus;
  notes: string | null;
  // Metadata
  assigned_to: string | null;
  source: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  // Joined data
  assigned_member?: TeamMember;
}

export interface CrmContact {
  id: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  entreprise: string | null;
  fonction: string | null;
  telephone: string | null;
  segment: ContactSegment;
  is_subscribed: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmEmailLog {
  id: string;
  opportunity_id: string | null;
  contact_id: string | null;
  email_type: EmailType;
  recipient_email: string;
  subject: string;
  body_preview: string | null;
  sent_by: string | null;
  sent_at: string;
  status: 'sent' | 'failed' | 'opened';
  resend_id: string | null;
  error_message: string | null;
}

export interface CrmOpportunityHistory {
  id: string;
  opportunity_id: string;
  action_type: string;
  old_value: string | null;
  new_value: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: CrmRole;
  created_at: string;
}

// Kanban column configuration
export interface KanbanColumn {
  id: OpportunityStatus;
  title: string;
  color: string;
  icon?: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'a_contacter', title: 'À contacter', color: 'bg-blue-500' },
  { id: 'relance_1', title: 'Relance 1', color: 'bg-yellow-500' },
  { id: 'relance_2', title: 'Relance 2', color: 'bg-orange-500' },
  { id: 'relance_3', title: 'Relance 3', color: 'bg-red-500' },
  { id: 'pas_interesse', title: 'Pas intéressé', color: 'bg-gray-500' },
  { id: 'gagne', title: 'Gagné', color: 'bg-green-500' },
  { id: 'perdu', title: 'Perdu', color: 'bg-gray-400' },
];

export const EXPERIENCE_OPTIONS = [
  { value: 'team_building', label: 'Team Building' },
  { value: 'formation', label: 'Formation Qualiopi' },
  { value: 'seminaire', label: 'Séminaire' },
  { value: 'decouverte', label: 'Découverte' },
  { value: 'sur_mesure', label: 'Sur Mesure' },
];

export const FORMAT_OPTIONS = [
  { value: 'demi_journee', label: 'Demi-journée' },
  { value: 'journee', label: 'Journée complète' },
  { value: 'deux_jours', label: '2 jours' },
  { value: 'sur_mesure', label: 'Sur mesure' },
];

export const FINANCEMENT_OPTIONS = [
  { value: 'direct', label: 'Financement direct' },
  { value: 'opco', label: 'OPCO' },
  { value: 'cpf', label: 'CPF' },
  { value: 'autre', label: 'Autre' },
];

export const SOURCE_OPTIONS = [
  { value: 'formulaire_b2b', label: 'Formulaire B2B' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'recommandation', label: 'Recommandation' },
  { value: 'salon', label: 'Salon / Événement' },
  { value: 'site_web', label: 'Site Web' },
  { value: 'autre', label: 'Autre' },
];

export const SEGMENT_OPTIONS = [
  { value: 'general', label: 'Général' },
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'association', label: 'Association' },
  { value: 'partenaire', label: 'Partenaire' },
  { value: 'presse', label: 'Presse' },
];
