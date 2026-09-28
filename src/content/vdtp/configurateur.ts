/**
 * Catalogue ENRICHI — évolutif.
 * = catalogue figé du 18 septembre 2026 + briques livrées depuis (champ `addedOn`).
 * Ajouter une brique : une entrée dans NEW_OPTIONS, toujours EN FIN de liste
 * (l'ordre sert à encoder les liens de sélection déjà partagés).
 */
import {
  CATALOG_2026_09_18,
  CONFIG_OPTIONS as OPTIONS_2026_09_18,
  CONFIG_GRIDS as GRIDS_2026_09_18,
  CONFIG_PRESETS as PRESETS_2026_09_18,
  type ConfigGrid,
  type ConfigOption,
  type ConfigPreset,
  type VdtpCatalog,
} from './configurateur-2026-09-18';

export * from './configurateur-2026-09-18';

export const OFFICIAL_DATE = '2026-09-18';

const CORE = ['opt-socle', 'opt-donnees'];

export const NEW_OPTIONS: ConfigOption[] = [
  {
    id: 'opt-plan-ia',
    label: "Plan d'action généré par l'Assistant",
    pitch: "Un simulateur qui produit, en un appel, un plan d'action daté : sites sentinelles, calendrier sur fenêtres biologiques réelles, protocoles nationaux.",
    gain: 'Un outil de prospection qui transforme un formulaire en proposition crédible, avec export PDF et archivage de chaque simulation.',
    proof: 'Page partenaire Chambre d’agriculture Pays de la Loire, Admin → CRM → Assistant',
    weight: 6,
    state: 'production',
    requires: CORE,
    addedOn: '2026-09-20',
  },
  {
    id: 'opt-cortege',
    label: 'Le Cortège vivant',
    pitch: "Les espèces d'un chantier en orbites autour du tracé choisi, rayon d'écoute réglable depuis le bord, curseur avant / après travaux.",
    gain: "Une preuve visuelle immédiate de l'effet d'un aménagement sur le vivant, à montrer au client final.",
    proof: 'Chantier → onglet « Cortège vivant » sur chaque propriété',
    weight: 5,
    state: 'production',
    requires: CORE,
    addedOn: '2026-09-26',
  },
  {
    id: 'opt-journal',
    label: 'Journal des briques & espace partenaire',
    pitch: 'Frise datée des livraisons, synthèse mensuelle et configurateurs historisés, dans un espace partenaire protégé.',
    gain: 'Une traçabilité de la valeur livrée, mois après mois, lisible par la direction.',
    proof: '/partenaires/vdtp/journal',
    weight: 2,
    state: 'production',
    requires: CORE,
    addedOn: '2026-09-28',
  },
];

const ALL_OPTIONS = [...OPTIONS_2026_09_18, ...NEW_OPTIONS];

const GRIDS: ConfigGrid[] = [
  ...GRIDS_2026_09_18,
  {
    id: 'nouveautes',
    number: '04',
    label: 'Nouveautés',
    tagline: 'Livrées depuis le 18 septembre 2026',
    audience: 'Ce qui s’est ajouté au patrimoine depuis la présentation officielle.',
    optionIds: NEW_OPTIONS.map((o) => o.id),
  },
];

const PRESETS: ConfigPreset[] = PRESETS_2026_09_18.map((p) =>
  p.id === 'integral' ? { ...p, optionIds: ALL_OPTIONS.map((o) => o.id) } : p,
);

export const CATALOG_ENRICHI: VdtpCatalog = {
  options: ALL_OPTIONS,
  grids: GRIDS,
  presets: PRESETS,
  byId: new Map(ALL_OPTIONS.map((o) => [o.id, o])),
  totalWeight: ALL_OPTIONS.reduce((s, o) => s + o.weight, 0),
  refWeight: CATALOG_2026_09_18.refWeight,
};

export const OFFICIAL_IDS = new Set(OPTIONS_2026_09_18.map((o) => o.id));
