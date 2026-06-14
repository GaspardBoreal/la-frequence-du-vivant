// Formes juridiques courantes (libellés normalisés tels que renvoyés par
// l'API recherche-entreprises / INSEE). Couvre ~99 % des entreprises du CRM.
// Source : référentiel INSEE des catégories juridiques niveau III, agrégé.

export interface FormeJuridiqueOption {
  value: string; // libellé exact stocké en BDD (cohérent avec import API)
  label: string;
  group: string;
}

export const FORMES_JURIDIQUES: FormeJuridiqueOption[] = [
  // Entrepreneurs individuels
  { value: 'Entrepreneur individuel', label: 'Entrepreneur individuel (EI)', group: 'Entrepreneur individuel' },
  { value: 'Artisan-commerçant', label: 'Artisan-commerçant', group: 'Entrepreneur individuel' },
  { value: 'Commerçant', label: 'Commerçant', group: 'Entrepreneur individuel' },
  { value: 'Artisan', label: 'Artisan', group: 'Entrepreneur individuel' },
  { value: 'Profession libérale', label: 'Profession libérale', group: 'Entrepreneur individuel' },
  { value: 'Exploitant agricole', label: 'Exploitant agricole', group: 'Entrepreneur individuel' },

  // Sociétés commerciales
  { value: 'SAS, société par actions simplifiée', label: 'SAS — Société par actions simplifiée', group: 'Société commerciale' },
  { value: 'SASU, société par actions simplifiée unipersonnelle', label: 'SASU — SAS unipersonnelle', group: 'Société commerciale' },
  { value: 'SARL, société à responsabilité limitée', label: 'SARL — Société à responsabilité limitée', group: 'Société commerciale' },
  { value: 'EURL, entreprise unipersonnelle à responsabilité limitée', label: 'EURL — SARL unipersonnelle', group: 'Société commerciale' },
  { value: 'SA à conseil d\'administration', label: 'SA — Société anonyme (CA)', group: 'Société commerciale' },
  { value: 'SA à directoire', label: 'SA — Société anonyme (directoire)', group: 'Société commerciale' },
  { value: 'SNC, société en nom collectif', label: 'SNC — Société en nom collectif', group: 'Société commerciale' },
  { value: 'Société en commandite simple', label: 'SCS — Société en commandite simple', group: 'Société commerciale' },
  { value: 'Société en commandite par actions', label: 'SCA — Société en commandite par actions', group: 'Société commerciale' },
  { value: 'Société européenne', label: 'SE — Société européenne', group: 'Société commerciale' },

  // Sociétés civiles
  { value: 'SCI, société civile immobilière', label: 'SCI — Société civile immobilière', group: 'Société civile' },
  { value: 'Société civile', label: 'Société civile', group: 'Société civile' },
  { value: 'Société civile professionnelle', label: 'SCP — Société civile professionnelle', group: 'Société civile' },
  { value: 'Société civile de moyens', label: 'SCM — Société civile de moyens', group: 'Société civile' },

  // Agriculture
  { value: 'GAEC, groupement agricole d\'exploitation en commun', label: 'GAEC — Groupement agricole d\'exploitation en commun', group: 'Agriculture' },
  { value: 'EARL, exploitation agricole à responsabilité limitée', label: 'EARL — Exploitation agricole à responsabilité limitée', group: 'Agriculture' },
  { value: 'SCEA, société civile d\'exploitation agricole', label: 'SCEA — Société civile d\'exploitation agricole', group: 'Agriculture' },
  { value: 'Coopérative agricole', label: 'Coopérative agricole', group: 'Agriculture' },

  // ESS
  { value: 'SCOP, société coopérative ouvrière de production', label: 'SCOP — Société coopérative et participative', group: 'ESS' },
  { value: 'SCIC, société coopérative d\'intérêt collectif', label: 'SCIC — Société coopérative d\'intérêt collectif', group: 'ESS' },
  { value: 'Association déclarée', label: 'Association loi 1901 (déclarée)', group: 'ESS' },
  { value: 'Association reconnue d\'utilité publique', label: 'Association reconnue d\'utilité publique', group: 'ESS' },
  { value: 'Fondation', label: 'Fondation', group: 'ESS' },
  { value: 'Fondation d\'entreprise', label: 'Fondation d\'entreprise', group: 'ESS' },
  { value: 'Fonds de dotation', label: 'Fonds de dotation', group: 'ESS' },
  { value: 'Mutuelle', label: 'Mutuelle', group: 'ESS' },

  // Secteur public
  { value: 'Commune', label: 'Commune', group: 'Secteur public' },
  { value: 'Département', label: 'Département', group: 'Secteur public' },
  { value: 'Région', label: 'Région', group: 'Secteur public' },
  { value: 'Établissement public administratif', label: 'Établissement public administratif (EPA)', group: 'Secteur public' },
  { value: 'Établissement public industriel et commercial', label: 'Établissement public (EPIC)', group: 'Secteur public' },
  { value: 'Établissement public de coopération intercommunale', label: 'EPCI — Intercommunalité', group: 'Secteur public' },

  // Autres
  { value: 'GIE, groupement d\'intérêt économique', label: 'GIE — Groupement d\'intérêt économique', group: 'Autre' },
  { value: 'Syndicat professionnel', label: 'Syndicat professionnel', group: 'Autre' },
  { value: 'Indivision', label: 'Indivision', group: 'Autre' },
];

export const FORMES_JURIDIQUES_GROUPS = Array.from(
  new Set(FORMES_JURIDIQUES.map((f) => f.group)),
);
