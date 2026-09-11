/**
 * Parcours proposé — Les Secrets de Sauniers (Ars-en-Ré, 12 septembre 2026).
 *
 * ATTENTION : les coordonnées ci-dessous sont des REPÈRES APPROXIMATIFS posés
 * à partir du bourg d'Ars-en-Ré et de l'orientation générale des marais au
 * nord-est du village. Elles sont destinées à être corrigées à la main sur la
 * carte (marqueurs déplaçables) avant toute génération. Ne pas les considérer
 * comme un relevé de terrain.
 */

export const SAUNIERS_EVENT_ID = '1c201e08-af92-4583-9b7d-b916f19778a6';
/** Expérience (exploration) rattachée à l'événement Les Secrets de Sauniers. */
export const SAUNIERS_EXPLORATION_ID = 'c9c70428-82cc-498f-81f7-6eb7f816e6b7';
export const SAUNIERS_EVENT_LABEL = 'Les Secrets de Sauniers — 12 septembre 2026';
export const SAUNIERS_DATE = '2026-09-12';
export const SAUNIERS_VILLE = 'Ars-en-Ré';
export const SAUNIERS_CENTRE: [number, number] = [46.2069, -1.5122];

export type Segment = 'amont' | 'aval';

export interface PointPropose {
  id: string;
  segment: Segment;
  nom: string;
  sous: string;
  texte: string;
  lat: number;
  lng: number;
}

export const SEGMENT_LABEL: Record<Segment, string> = {
  amont: 'Amont — le village',
  aval: 'Aval — le marais',
};

export const SEGMENT_MARCHE_NOM: Record<Segment, string> = {
  amont: 'Les Secrets de Sauniers — Amont, le village',
  aval: 'Les Secrets de Sauniers — Aval, le marais',
};

export const PARCOURS_PROPOSE: PointPropose[] = [
  {
    id: 'amont-1',
    segment: 'amont',
    nom: "Le Port d'Ars-en-Ré",
    sous: "L'enrôlement",
    texte:
      'Sur les quais, chacun reçoit sa besace de transmission et prête le serment du saunier face aux bateaux traditionnels.',
    lat: 46.2072,
    lng: -1.5119,
  },
  {
    id: 'amont-2',
    segment: 'amont',
    nom: "L'ancienne gare",
    sous: "Le réseau de l'or blanc",
    texte:
      "Le sel voyageait par le tortillard. Le jeu de cordes révèle l'équilibre logistique fragile de l'île.",
    lat: 46.2062,
    lng: -1.5136,
  },
  {
    id: 'amont-3',
    segment: 'amont',
    nom: "L'église et son clocher",
    sous: 'L’amer et les éléments',
    texte:
      "Le clocher noir et blanc sert d'amer aux marins. Boussole en main, on apprend à lire le vent — allié ou ennemi du saunier.",
    lat: 46.2044,
    lng: -1.5143,
  },
  {
    id: 'amont-4',
    segment: 'amont',
    nom: "L'ancien moulin à marée",
    sous: "La force de l'océan",
    texte:
      "Sur les traces du moulin disparu, le palais s'exerce : reconnaître les niveaux de salinité, comprendre le parcours de l'eau.",
    lat: 46.2055,
    lng: -1.5088,
  },
  {
    id: 'amont-5',
    segment: 'amont',
    nom: "L'ancienne raffinerie",
    sous: 'Le défi de la pureté',
    texte:
      "Loupe de bois sur un cristal brut. Pourquoi un sel entièrement naturel a survécu à l'ère industrielle.",
    lat: 46.2066,
    lng: -1.5098,
  },
  {
    id: 'amont-6',
    segment: 'amont',
    nom: 'La salorge',
    sous: 'Le poids du savoir-faire',
    texte:
      "Face au hangar historique, on manipule une réplique du simoussi et l'on mesure la noblesse du geste.",
    lat: 46.2078,
    lng: -1.5093,
  },
  {
    id: 'amont-7',
    segment: 'amont',
    nom: 'La coopérative',
    sous: 'Le passage au collectif',
    texte:
      "La carte du périple se reconstitue. Une pincée de fleur de sel scelle le passage d'apprenti à ambassadeur.",
    lat: 46.2083,
    lng: -1.5088,
  },
  {
    id: 'amont-8',
    segment: 'amont',
    nom: 'Le seuil des marais salants',
    sous: "Le fondement de l'écosystème",
    texte:
      "L'argile brute entre les doigts. Son imperméabilité est la fondation invisible de tout le système salicole.",
    lat: 46.2091,
    lng: -1.5061,
  },
  {
    id: 'aval-1',
    segment: 'aval',
    nom: 'La vasière',
    sous: "L'Eau — l'entrée du circuit",
    texte:
      "Premier bassin du circuit : l'eau de mer y dépose ses limons avant d'entamer sa lente concentration.",
    lat: 46.2112,
    lng: -1.5032,
  },
  {
    id: 'aval-2',
    segment: 'aval',
    nom: 'Le circuit d’eau',
    sous: "L'Eau — la lecture des niveaux",
    texte:
      'On suit le parcours de la vasière vers les aires saunantes : pentes infimes, vannes, gestion du vent.',
    lat: 46.2128,
    lng: -1.5008,
  },
  {
    id: 'aval-3',
    segment: 'aval',
    nom: 'Le bousseau',
    sous: "L'Argile — le test de plasticité",
    texte:
      "Malaxage de l'argile, prélèvement photographié et documenté : la matière qui rend le marais étanche.",
    lat: 46.2141,
    lng: -1.4979,
  },
  {
    id: 'aval-4',
    segment: 'aval',
    nom: 'L’aire saunante',
    sous: 'Le Sel et le Vivant',
    texte:
      "Dégustation comparée, relevé du gradient de salinité, observation guidée des halophytes et de l'avifaune.",
    lat: 46.2155,
    lng: -1.4952,
  },
];
