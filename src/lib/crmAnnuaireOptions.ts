// Quelques codes NAF/APE fréquents pour les filtres rapides.
// Liste non exhaustive ; le champ texte libre reste autorisé.
export const NAF_QUICK_PICKS: Array<{ code: string; label: string }> = [
  { code: '01.11Z', label: 'Cultures céréales et légumineuses' },
  { code: '01.50Z', label: 'Culture et élevage associés' },
  { code: '10.71C', label: 'Boulangerie-pâtisserie' },
  { code: '47.11D', label: 'Supermarchés' },
  { code: '55.10Z', label: 'Hôtels et hébergement similaire' },
  { code: '56.10A', label: 'Restauration traditionnelle' },
  { code: '70.22Z', label: 'Conseil pour les affaires' },
  { code: '85.59A', label: 'Formation continue d\'adultes' },
  { code: '88.99B', label: 'Action sociale sans hébergement' },
  { code: '94.99Z', label: 'Autres organisations associatives' },
];

export const TRANCHE_EFFECTIF_OPTIONS = [
  { value: 'NN', label: 'Unités non employeuses' },
  { value: '00', label: '0 salarié' },
  { value: '01', label: '1 ou 2 salariés' },
  { value: '02', label: '3 à 5 salariés' },
  { value: '03', label: '6 à 9 salariés' },
  { value: '11', label: '10 à 19 salariés' },
  { value: '12', label: '20 à 49 salariés' },
  { value: '21', label: '50 à 99 salariés' },
  { value: '22', label: '100 à 199 salariés' },
  { value: '31', label: '200 à 249 salariés' },
  { value: '32', label: '250 à 499 salariés' },
  { value: '41', label: '500 à 999 salariés' },
  { value: '42', label: '1 000 à 1 999 salariés' },
  { value: '51', label: '2 000 à 4 999 salariés' },
  { value: '52', label: '5 000 à 9 999 salariés' },
  { value: '53', label: '10 000 salariés et plus' },
];

export const CATEGORIE_ENTREPRISE_OPTIONS = [
  { value: 'PME', label: 'PME' },
  { value: 'ETI', label: 'ETI' },
  { value: 'GE', label: 'Grande entreprise' },
];

export const ETAT_ADMIN_OPTIONS = [
  { value: 'A', label: 'Active' },
  { value: 'C', label: 'Cessée' },
];

export const LABEL_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'est_ess', label: 'ESS' },
  { key: 'est_rge', label: 'RGE' },
  { key: 'est_bio', label: 'Bio' },
  { key: 'est_qualiopi', label: 'Qualiopi' },
  { key: 'est_finess', label: 'FINESS' },
  { key: 'est_uai', label: 'UAI (éducation)' },
  { key: 'est_entrepreneur_spectacle', label: 'Spectacle' },
  { key: 'est_collectivite_territoriale', label: 'Collectivité' },
  { key: 'est_societe_mission', label: 'Société à mission' },
];
