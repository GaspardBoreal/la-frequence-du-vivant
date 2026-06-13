export type CrmCompanyStage = 'suspect' | 'prospect' | 'client' | 'inactif';
export type CrmDevisStatut = 'aucun' | 'en_cours' | 'en_negociation' | 'signe' | 'perdu';
export type CrmCompanyActivityType = 'appel' | 'mail' | 'rdv' | 'note' | 'stage_change' | 'import' | 'autre';

export interface CompanySearchResult {
  siren: string;
  siret_siege: string | null;
  nom_complet: string;
  denomination: string;
  sigle: string | null;
  code_naf: string | null;
  libelle_naf: string | null;
  forme_juridique: string | null;
  categorie_entreprise: string | null;
  tranche_effectif: string | null;
  etat_administratif: string | null;
  date_cessation?: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  departement: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  dirigeants: Array<{ nom?: string; prenoms?: string; qualite?: string }>;
  finances: Array<{ year: string; ca: number | null; resultat_net: number | null }>;
  nombre_etablissements: number | null;
  complements: Record<string, any>;
  raw: any;
}

export interface CompanyEtablissement {
  siret: string;
  est_siege: boolean;
  adresse: string | null;
  code_postal: string | null;
  commune: string | null;
  departement: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  activite_principale: string | null;
  libelle_activite_principale: string | null;
  etat_administratif: string | null;
  date_creation: string | null;
  date_fermeture: string | null;
  tranche_effectif_salarie: string | null;
}

export interface CompanyFullDetails extends Omit<CompanySearchResult, 'adresse' | 'ville' | 'code_postal' | 'departement' | 'region' | 'latitude' | 'longitude'> {
  date_creation: string | null;
  date_mise_a_jour: string | null;
  annee_tranche_effectif: string | null;
  tva_intracommunautaire: string | null;
  capital_social: string | null;
  economie_sociale_solidaire: boolean;
  siege: CompanyEtablissement;
  etablissements: CompanyEtablissement[];
  nombre_etablissements_ouverts: number | null;
  liens_externes: {
    annuaire_entreprises: string;
    pappers: string;
    societe_com: string;
    insee: string;
  };
}

export interface CompanySearchFilters {
  q?: string;
  page?: number;
  per_page?: number;
  code_postal?: string;
  commune?: string;
  departement?: string;
  region?: string;
  activite_principale?: string;
  categorie_juridique?: string;
  tranche_effectif_salarie?: string;
  categorie_entreprise?: string;
  etat_administratif?: string;
  nom_personne?: string;
  prenoms_personne?: string;
  ca_min?: number;
  ca_max?: number;
  resultat_net_min?: number;
  resultat_net_max?: number;
  est_ess?: boolean;
  est_rge?: boolean;
  est_bio?: boolean;
  est_qualiopi?: boolean;
  est_finess?: boolean;
  est_uai?: boolean;
  est_entrepreneur_spectacle?: boolean;
  est_collectivite_territoriale?: boolean;
  est_societe_mission?: boolean;
  lat?: number;
  long?: number;
  radius?: number;
}

export interface CrmCompany {
  id: string;
  siren: string;
  siret_siege: string | null;
  denomination: string | null;
  nom_complet: string | null;
  lifecycle_stage: CrmCompanyStage;
  assigned_to: string | null;
  tags: string[];
  notes: string | null;
  source: string | null;
  last_contacted_at: string | null;
  next_action_at: string | null;
  next_action_label: string | null;
  code_naf: string | null;
  libelle_naf: string | null;
  forme_juridique: string | null;
  tranche_effectif: string | null;
  categorie_entreprise: string | null;
  etat_administratif: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  departement: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  dirigeants: any;
  qualites_labels: any;
  finances: any;
  raw_payload: any;
  api_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmCompanyActivity {
  id: string;
  company_id: string;
  member_id: string | null;
  performed_by: string | null;
  type: CrmCompanyActivityType;
  summary: string | null;
  outcome: string | null;
  next_action_at: string | null;
  metadata: any;
  created_at: string;
}

export const STAGE_LABELS: Record<CrmCompanyStage, string> = {
  suspect: 'Suspect',
  prospect: 'Prospect',
  client: 'Client',
  inactif: 'Inactif',
};

export const STAGE_COLORS: Record<CrmCompanyStage, string> = {
  suspect: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  prospect: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  client: 'bg-green-500/15 text-green-600 border-green-500/30',
  inactif: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
};

export const STAGE_MARKER_COLOR: Record<CrmCompanyStage, string> = {
  suspect: '#3b82f6',
  prospect: '#f97316',
  client: '#22c55e',
  inactif: '#9ca3af',
};

export const DEVIS_LABELS: Record<CrmDevisStatut, string> = {
  aucun: 'Aucun',
  en_cours: 'En cours',
  en_negociation: 'En négociation',
  signe: 'Signé',
  perdu: 'Perdu',
};
