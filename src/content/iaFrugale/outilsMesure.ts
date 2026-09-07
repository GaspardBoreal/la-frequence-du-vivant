/**
 * Moteurs de calcul des simulateurs « IA frugale ».
 *
 * RÈGLE ABSOLUE DE CE FICHIER : aucune constante inventée.
 * Chaque valeur numérique porte sa source et sa date de consultation, et est
 * affichée telle quelle dans l'interface. Les formules reproduisent celles
 * publiées par les outils eux-mêmes.
 */

export interface Source {
  label: string;
  url: string;
  consulteLe: string;
}

export interface Constante {
  label: string;
  valeur: string;
  source: Source;
}

const LE = '6 septembre 2026';

/* ------------------------------------------------------------------ */
/* Intensité carbone de l'électricité (gCO2eq/kWh)                     */
/* ------------------------------------------------------------------ */

export const SOURCE_CI: Source = {
  label:
    'CodeCarbon — global_energy_mix.json (données Our World in Data, année 2023)',
  url: 'https://github.com/mlco2/codecarbon/blob/master/codecarbon/data/private_infra/global_energy_mix.json',
  consulteLe: LE,
};

export interface Pays {
  code: string;
  nom: string;
  ci: number; // gCO2eq / kWh
}

/** Valeurs lues dans le fichier de données de CodeCarbon (année 2023). */
export const PAYS: Pays[] = [
  { code: 'SWE', nom: 'Suède', ci: 40.695 },
  { code: 'FRA', nom: 'France', ci: 56.039 },
  { code: 'USA', nom: 'États-Unis', ci: 369.473 },
  { code: 'DEU', nom: 'Allemagne', ci: 380.95 },
  { code: 'CHN', nom: 'Chine', ci: 582.317 },
  { code: 'POL', nom: 'Pologne', ci: 661.926 },
  { code: 'WLD', nom: 'Moyenne mondiale', ci: 475 },
];

export const SOURCE_CI_MONDE: Source = {
  label:
    'CodeCarbon — valeur mondiale de repli : 475 gCO2eq/kWh (AIE, Global Energy & CO2 Status Report 2019)',
  url: 'https://github.com/mlco2/codecarbon/blob/master/docs/explanation/methodology.md',
  consulteLe: LE,
};

export const ciDuPays = (code: string): number =>
  PAYS.find((p) => p.code === code)?.ci ?? 475;

export const nomDuPays = (code: string): string =>
  PAYS.find((p) => p.code === code)?.nom ?? 'Moyenne mondiale';

/* ------------------------------------------------------------------ */
/* 1. CodeCarbon                                                       */
/* ------------------------------------------------------------------ */

export const SOURCE_CODECARBON: Source = {
  label: 'CodeCarbon — Methodology (docs officielles)',
  url: 'https://github.com/mlco2/codecarbon/blob/master/docs/explanation/methodology.md',
  consulteLe: LE,
};

export const CONSTANTES_CODECARBON: Constante[] = [
  {
    label: 'Émissions = intensité carbone × énergie consommée (C × E)',
    valeur: 'formule de base de CodeCarbon',
    source: SOURCE_CODECARBON,
  },
  {
    label: 'Composants suivis',
    valeur: 'processeur (CPU), carte graphique (GPU) et mémoire vive (RAM)',
    source: SOURCE_CODECARBON,
  },
  {
    label: 'Mémoire vive, CodeCarbon v3',
    valeur: '5 W par barrette de mémoire (x86), minimum 2 barrettes soit 10 W',
    source: SOURCE_CODECARBON,
  },
  {
    label: 'Intensité carbone par pays',
    valeur: 'Our World in Data, année 2023, embarquée dans CodeCarbon',
    source: SOURCE_CI,
  },
];

/** Heuristique de barrettes de CodeCarbon v3 : 5 W par barrette, minimum 2. */
export const puissanceRam = (ramGo: number): number => {
  const barrettes = Math.max(2, Math.ceil(ramGo / 128));
  return 5 * barrettes;
};

export interface EntreeCodeCarbon {
  heures: number;
  puissanceCpu: number; // W (TDP du processeur)
  chargeCpu: number; // 0..1
  puissanceGpu: number; // W (0 si pas de GPU)
  chargeGpu: number; // 0..1
  ramGo: number;
  ci: number; // gCO2eq/kWh
}

export interface SortieEnergie {
  puissanceW: number;
  kwh: number;
  gco2: number;
}

export const calculCodeCarbon = (e: EntreeCodeCarbon): SortieEnergie => {
  const puissanceW =
    e.puissanceCpu * e.chargeCpu +
    e.puissanceGpu * e.chargeGpu +
    puissanceRam(e.ramGo);
  const kwh = (puissanceW * e.heures) / 1000;
  return { puissanceW, kwh, gco2: kwh * e.ci };
};

/* ------------------------------------------------------------------ */
/* 2. EcoLogits                                                        */
/* ------------------------------------------------------------------ */

export const SOURCE_ECOLOGITS: Source = {
  label: 'EcoLogits — Environmental Impacts of LLM Inference (méthodologie)',
  url: 'https://ecologits.ai/latest/methodology/llm_inference/',
  consulteLe: LE,
};

/** Coefficients publiés par EcoLogits (régression sur le ML.ENERGY Leaderboard). */
export const ECOLOGITS = {
  /** Énergie par jeton produit : f_E(P,B) = alpha·e^(beta·B)·P + gamma  (Wh) */
  alpha: 1.17e-6,
  beta: -1.12e-2,
  gamma: 4.05e-5,
  /** Latence par jeton : f_L(P,B) = aL·P + bL·B + cL  (s) */
  aL: 6.78e-4,
  bL: 3.12e-4,
  cL: 1.94e-2,
  /** Taille de lot fixée par la méthode */
  batch: 64,
  /** Serveur de référence p5.48xlarge */
  puissanceServeurSansGpuW: 1200,
  gpuInstalles: 8,
  memoireGpuGo: 80,
  quantificationBits: 16,
  /** Fabrication (Boavizta / ADEME) */
  gwpServeurSansGpuKg: 5700,
  gwpGpuKg: 273,
  /** Durée de vie du matériel : 3 ans */
  dureeVieSecondes: 3 * 365 * 24 * 3600,
} as const;

export const CONSTANTES_ECOLOGITS: Constante[] = [
  {
    label: "Énergie par jeton produit (Wh)",
    valeur:
      'f_E(P, B) = 1,17·10⁻⁶ · e^(−1,12·10⁻² · B) · P + 4,05·10⁻⁵, avec B = 64',
    source: SOURCE_ECOLOGITS,
  },
  {
    label: 'Latence par jeton produit (s)',
    valeur: 'f_L(P, B) = 6,78·10⁻⁴ · P + 3,12·10⁻⁴ · B + 1,94·10⁻²',
    source: SOURCE_ECOLOGITS,
  },
  {
    label: 'Nombre de cartes graphiques nécessaires',
    valeur:
      'mémoire du modèle = 1,2 × (paramètres × 16 bits / 8), arrondi en puissance de 2 sur des cartes H100 de 80 Go',
    source: SOURCE_ECOLOGITS,
  },
  {
    label: 'Serveur de référence',
    valeur:
      'p5.48xlarge — 1,2 kW hors cartes graphiques, 8 cartes installées, durée de vie 3 ans',
    source: SOURCE_ECOLOGITS,
  },
  {
    label: 'Fabrication (impact incorporé)',
    valeur:
      '5 700 kgCO2eq pour le serveur sans cartes, 273 kgCO2eq par carte H100 80 Go',
    source: SOURCE_ECOLOGITS,
  },
];

export interface EntreeEcoLogits {
  parametresMilliards: number; // P_total (= P_active pour un modèle dense)
  jetonsSortie: number;
  pue: number;
  ci: number; // gCO2eq/kWh
}

export interface SortieEcoLogits {
  nbGpu: number;
  latenceS: number;
  energieWh: number;
  gco2Usage: number;
  gco2Fabrication: number;
  gco2Total: number;
}

export const calculEcoLogits = (e: EntreeEcoLogits): SortieEcoLogits => {
  const P = e.parametresMilliards;
  const B = ECOLOGITS.batch;

  // Nombre de cartes graphiques : mémoire du modèle / 80 Go, arrondi en base 2
  const memoireModeleGo =
    1.2 * ((P * 1e9 * ECOLOGITS.quantificationBits) / 8) / 1e9;
  const cartesBrutes = Math.ceil(memoireModeleGo / ECOLOGITS.memoireGpuGo);
  const nbGpu = Math.max(1, 2 ** Math.ceil(Math.log2(cartesBrutes)));

  // Énergie d'une carte pour la requête
  const whParJeton = ECOLOGITS.alpha * Math.exp(ECOLOGITS.beta * B) * P + ECOLOGITS.gamma;
  const energieGpuWh = e.jetonsSortie * whParJeton * nbGpu;

  // Latence de génération
  const sParJeton = ECOLOGITS.aL * P + ECOLOGITS.bL * B + ECOLOGITS.cL;
  const latenceS = e.jetonsSortie * sParJeton;

  // Énergie du serveur hors cartes, ramenée à une requête du lot
  const energieServeurWh =
    (latenceS / 3600) *
    ECOLOGITS.puissanceServeurSansGpuW *
    (nbGpu / ECOLOGITS.gpuInstalles) *
    (1 / B);

  const energieWh = e.pue * (energieServeurWh + energieGpuWh);
  const gco2Usage = (energieWh / 1000) * e.ci;

  // Fabrication amortie sur la durée de vie
  const gwpServeurKg =
    (nbGpu / ECOLOGITS.gpuInstalles) * ECOLOGITS.gwpServeurSansGpuKg +
    nbGpu * ECOLOGITS.gwpGpuKg;
  const gco2Fabrication =
    (latenceS / (B * ECOLOGITS.dureeVieSecondes)) * gwpServeurKg * 1000;

  return {
    nbGpu,
    latenceS,
    energieWh,
    gco2Usage,
    gco2Fabrication,
    gco2Total: gco2Usage + gco2Fabrication,
  };
};

/* ------------------------------------------------------------------ */
/* 3. Green Algorithms                                                 */
/* ------------------------------------------------------------------ */

export const SOURCE_GREEN_ALGORITHMS: Source = {
  label: 'Green Algorithms — calculateur en ligne et article de méthode',
  url: 'https://calculator.green-algorithms.org/',
  consulteLe: LE,
};

export const SOURCE_GA_PAPIER: Source = {
  label:
    'Lannelongue, Grealey, Inouye — « Green Algorithms: Quantifying the Carbon Footprint of Computation », Advanced Science, 2021',
  url: 'https://doi.org/10.1002/advs.202100707',
  consulteLe: LE,
};

export const GREEN_ALGORITHMS = {
  /** Puissance de la mémoire, mesurée expérimentalement dans l'article */
  wattsParGoMemoire: 0.3725,
  /** PUE moyen mondial des centres de données (2019) retenu par défaut */
  pueDefaut: 1.67,
  /** Intensité carbone moyenne mondiale retenue par l'article */
  ciMondiale: 475,
} as const;

export const CONSTANTES_GREEN_ALGORITHMS: Constante[] = [
  {
    label: 'Formule',
    valeur:
      'empreinte carbone = énergie × intensité carbone, avec énergie = durée × (puissance des cœurs × usage + puissance mémoire) × PUE × facteur multiplicatif',
    source: SOURCE_GREEN_ALGORITHMS,
  },
  {
    label: 'Puissance de la mémoire',
    valeur:
      '0,3725 W par Go de mémoire mobilisée (valeur mesurée expérimentalement)',
    source: SOURCE_GA_PAPIER,
  },
  {
    label: 'PUE par défaut',
    valeur: '1,67 — moyenne mondiale des centres de données estimée en 2019',
    source: SOURCE_GA_PAPIER,
  },
  {
    label: 'Puissance des cœurs',
    valeur:
      'TDP par cœur : 10 à 15 W pour un processeur, environ 200 W pour une carte graphique (guide du calculateur) ; 10,8 W par cœur mesurés pour un Core i5 dans l\'article',
    source: SOURCE_GREEN_ALGORITHMS,
  },
  {
    label: 'Facteur multiplicatif (PSF)',
    valeur:
      "nombre de fois où le calcul est réellement relancé (réglages, essais, erreurs)",
    source: SOURCE_GA_PAPIER,
  },
];

export interface EntreeGreenAlgorithms {
  heures: number;
  nbCoeurs: number;
  tdpParCoeur: number; // W
  usageCpu: number; // 0..1
  nbGpu: number;
  tdpGpu: number; // W
  usageGpu: number; // 0..1
  memoireGo: number;
  pue: number;
  psf: number;
  ci: number; // gCO2eq/kWh
}

export const calculGreenAlgorithms = (
  e: EntreeGreenAlgorithms
): SortieEnergie => {
  const puissanceW =
    e.nbCoeurs * e.tdpParCoeur * e.usageCpu +
    e.nbGpu * e.tdpGpu * e.usageGpu +
    e.memoireGo * GREEN_ALGORITHMS.wattsParGoMemoire;
  const kwh = ((puissanceW * e.heures) / 1000) * e.pue * e.psf;
  return { puissanceW, kwh, gco2: kwh * e.ci };
};

/* ------------------------------------------------------------------ */
/* 4. Compar:IA                                                        */
/* ------------------------------------------------------------------ */

export const SOURCE_COMPARIA: Source = {
  label: 'compar:IA — comparateur d\'IA conversationnelles de l\'État français',
  url: 'https://comparia.beta.gouv.fr/',
  consulteLe: LE,
};

export const SOURCE_COMPARIA_ECOLOGITS: Source = {
  label:
    'compar:IA (dépôt betagouv/ComparIA) — les impacts affichés sont calculés avec EcoLogits, PUE 1,15',
  url: 'https://github.com/betagouv/ComparIA/pull/253',
  consulteLe: LE,
};

export const CONSTANTES_COMPARIA: Constante[] = [
  {
    label: 'Moteur de calcul',
    valeur:
      'compar:IA affiche les impacts calculés par EcoLogits, avec un PUE de 1,15 (moyenne des grands fournisseurs)',
    source: SOURCE_COMPARIA_ECOLOGITS,
  },
  {
    label: 'Unité affichée par compar:IA',
    valeur:
      'consommation moyenne en milliwattheures pour 1 000 jetons, par modèle',
    source: SOURCE_COMPARIA,
  },
  {
    label: 'Ce que compar:IA n\'est pas',
    valeur:
      "un classement de performance : le classement reflète les préférences des utilisateurs (modèle statistique Bradley-Terry), pas la véracité des réponses",
    source: SOURCE_COMPARIA,
  },
];

/** PUE retenu par compar:IA dans son intégration d'EcoLogits. */
export const PUE_COMPARIA = 1.15;

/* ------------------------------------------------------------------ */
/* Mise en forme                                                       */
/* ------------------------------------------------------------------ */

export const fmt = (valeur: number, decimales = 2): string => {
  if (!Number.isFinite(valeur)) return '—';
  const abs = Math.abs(valeur);
  const d = abs >= 100 ? 0 : abs >= 10 ? 1 : decimales;
  return valeur.toLocaleString('fr-FR', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
};
