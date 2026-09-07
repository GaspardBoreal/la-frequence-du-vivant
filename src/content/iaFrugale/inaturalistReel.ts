/**
 * Ancrage réel du simulateur CodeCarbon × Les Marches du Vivant.
 *
 * RÈGLE ABSOLUE : aucune valeur inventée. Tout ce qui est ici est soit publié
 * par iNaturalist ou par NVIDIA (avec lien + date de consultation), soit
 * explicitement marqué comme hypothèse du visiteur.
 *
 * Point capital, affiché dans l'interface : l'API publique d'iNaturalist ne
 * renvoie AUCUNE donnée d'énergie ni de CO2. Elle renvoie des volumes
 * (observations, espèces). C'est donc les volumes que l'on va chercher en
 * direct, et le matériel d'entraînement que l'on reprend des billets publiés.
 */

import type { Source } from './outilsMesure';

const LE = '7 septembre 2026';

export const SOURCE_INAT_TRAINING: Source = {
  label: "iNaturalist — « New Vision Model Training Started » (matériel et taille de l'entraînement)",
  url: 'https://www.inaturalist.org/blog/59122-new-vision-model-training-started',
  consulteLe: LE,
};

export const SOURCE_INAT_MODELE: Source = {
  label: 'iNaturalist — « New computer vision model with over 2,500 new taxa » (modèle v2.23)',
  url: 'https://www.inaturalist.org/blog/115962-new-computer-vision-model-with-over-2-500-new-taxa',
  consulteLe: LE,
};

export const SOURCE_INAT_API: Source = {
  label: 'iNaturalist — API Recommended Practices (aucune donnée énergétique exposée)',
  url: 'https://www.inaturalist.org/pages/api+recommended+practices',
  consulteLe: LE,
};

export const SOURCE_RTX8000: Source = {
  label: 'NVIDIA — fiche technique Quadro RTX 8000 : 295 W par carte (total board power)',
  url: 'https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/quadro-rtx-8000-us-nvidia-946977-r1-web.pdf',
  consulteLe: LE,
};

/* ------------------------------------------------------------------ */
/* Ce qu'iNaturalist publie                                            */
/* ------------------------------------------------------------------ */

export const INAT_PUBLIE = {
  /** Nombre de cartes graphiques du serveur d'entraînement de production. */
  nbGpu: 3,
  gpuModele: 'NVIDIA Quadro RTX 8000',
  /** Puissance carte, fiche technique NVIDIA : total board power. */
  gpuWatts: 295,
  /** Photos d'entraînement annoncées lors de ce billet. */
  photosEntrainement: 25_000_000,
  /** Taxons appris lors de ce billet. */
  taxonsCeBillet: 47_000,
  /** Durée annoncée : « a few months », puis quelques semaines de validation. */
  dureeMois: 3,
  /** Modèle courant décrit publiquement. */
  modeleVersion: 'v2.23',
  taxonsModeleCourant: 106_407,
  /** Cadence de réentraînement annoncée : tous les un à deux mois. */
  cadenceParAn: 8,
  /** Seuil d'entrée d'un taxon dans le modèle. */
  seuilPhotos: 100,
  seuilObservations: 60,
} as const;

/** Valeurs relevées à la main, utilisées si l'API ne répond pas. */
export const INAT_REPLI = {
  observationsMonde: 383_928_884,
  releveLe: LE,
  source: {
    label: 'iNaturalist — API v1, /observations?per_page=0 (total_results)',
    url: 'https://api.inaturalist.org/v1/observations?per_page=0',
    consulteLe: LE,
  } as Source,
};

/* ------------------------------------------------------------------ */
/* Préréglage du simulateur                                            */
/* ------------------------------------------------------------------ */

/**
 * Réglages « comme iNaturalist » à pousser dans les curseurs.
 * heures = 3 mois × 30 j × 24 h.
 * cpu / ram : iNaturalist décrit « un processeur bien plus rapide » et « 4× la
 * mémoire » sans donner de référence → valeurs plafond assumées comme
 * hypothèses, signalées dans l'interface.
 */
export const PREREGLAGE_INAT = {
  heures: INAT_PUBLIE.dureeMois * 30 * 24,
  gpu: INAT_PUBLIE.nbGpu * INAT_PUBLIE.gpuWatts,
  chargeGpu: 90,
  cpu: 280,
  ram: 512,
} as const;

/* ------------------------------------------------------------------ */
/* Inférence : ce que coûte une identification                         */
/* ------------------------------------------------------------------ */

/**
 * Aucune de ces valeurs n'est publiée par iNaturalist : elles sont réglées par
 * le visiteur et affichées comme hypothèses. Le calcul, lui, reste celui de
 * CodeCarbon : puissance × durée × intensité carbone.
 */
export const INFERENCE_DEFAUTS = {
  photosParMois: 5_000_000,
  msParPhoto: 120,
  puissanceServeurW: 400,
} as const;
