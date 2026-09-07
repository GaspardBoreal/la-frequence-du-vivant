/**
 * Les huit exercices de la page « Outils de mesure de l'IA frugale ».
 * Deux par outil, ancrés dans nos deux cas réels : Les Marches du Vivant
 * et Propriété – Fréquence Jardin.
 *
 * Les volumes propres à nos cas (nombre de photos, de fiches, d'échanges)
 * sont des hypothèses réglées par le visiteur : ils sont affichés comme tels.
 * Les constantes physiques, elles, viennent toutes des outils officiels.
 */

import {
  Source,
  PAYS,
  ciDuPays,
  nomDuPays,
  calculCodeCarbon,
  calculEcoLogits,
  calculGreenAlgorithms,
  puissanceRam,
  GREEN_ALGORITHMS,
  PUE_COMPARIA,
  SOURCE_CI,
  SOURCE_CODECARBON,
  SOURCE_ECOLOGITS,
  SOURCE_GREEN_ALGORITHMS,
  SOURCE_GA_PAPIER,
  SOURCE_COMPARIA,
  SOURCE_COMPARIA_ECOLOGITS,
  fmt,
} from './outilsMesure';

export type OutilKey = 'codecarbon' | 'ecologits' | 'greenalgorithms' | 'comparia';
export type CasKey = 'mdv' | 'jardin';

export type Controle =
  | {
      type: 'slider';
      cle: string;
      label: string;
      min: number;
      max: number;
      pas: number;
      unite: string;
      defaut: number;
      aide?: string;
      hypothese?: boolean;
    }
  | {
      type: 'select';
      cle: string;
      label: string;
      options: { value: string; label: string }[];
      defaut: string;
      aide?: string;
      hypothese?: boolean;
    };

export interface Resultat {
  label: string;
  valeur: string;
  unite?: string;
  principal?: boolean;
  aide?: string;
}

export type Valeurs = Record<string, number | string>;

export interface Simulateur {
  id: string;
  outil: OutilKey;
  cas: CasKey;
  titre: string;
  accroche: string;
  controles: Controle[];
  calcul: (v: Valeurs) => Resultat[];
  formule: string[];
  rigueur: string[];
  hypotheses: string[];
  sources: Source[];
}

const optionsPays = PAYS.map((p) => ({ value: p.code, label: p.nom }));
const n = (v: Valeurs, k: string) => Number(v[k]);
const s = (v: Valeurs, k: string) => String(v[k]);

/* ================================================================== */
/* 1 — CodeCarbon × Les Marches du Vivant                              */
/* ================================================================== */

const codecarbonMdv: Simulateur = {
  id: 'codecarbon-mdv',
  outil: 'codecarbon',
  cas: 'mdv',
  titre: "Entraîner le modèle qui reconnaît les espèces",
  accroche:
    "Les Marches du Vivant identifient des espèces à partir des photos et des sons rapportés par les marcheurs. Faites varier la durée d'entraînement, le matériel et le pays du centre de données : CodeCarbon mesurerait exactement cette combinaison sur une vraie machine.",
  controles: [
    {
      type: 'slider',
      cle: 'heures',
      label: "Durée d'entraînement",
      min: 1,
      max: 200,
      pas: 1,
      unite: 'h',
      defaut: 24,
      hypothese: true,
    },
    {
      type: 'slider',
      cle: 'gpu',
      label: 'Puissance de la carte graphique',
      min: 0,
      max: 700,
      pas: 25,
      unite: 'W',
      defaut: 300,
      aide: 'Puissance de conception thermique de la carte utilisée.',
    },
    {
      type: 'slider',
      cle: 'chargeGpu',
      label: 'Taux de sollicitation de la carte',
      min: 10,
      max: 100,
      pas: 5,
      unite: '%',
      defaut: 90,
    },
    {
      type: 'slider',
      cle: 'cpu',
      label: 'Puissance du processeur',
      min: 15,
      max: 280,
      pas: 5,
      unite: 'W',
      defaut: 105,
    },
    {
      type: 'slider',
      cle: 'ram',
      label: 'Mémoire vive de la machine',
      min: 8,
      max: 512,
      pas: 8,
      unite: 'Go',
      defaut: 64,
    },
    { type: 'select', cle: 'pays', label: 'Pays du centre de données', options: optionsPays, defaut: 'FRA' },
  ],
  calcul: (v) => {
    const ci = ciDuPays(s(v, 'pays'));
    const base = {
      heures: n(v, 'heures'),
      puissanceCpu: n(v, 'cpu'),
      chargeCpu: 0.5,
      puissanceGpu: n(v, 'gpu'),
      chargeGpu: n(v, 'chargeGpu') / 100,
      ramGo: n(v, 'ram'),
    };
    const r = calculCodeCarbon({ ...base, ci });
    const pologne = calculCodeCarbon({ ...base, ci: ciDuPays('POL') });
    const suede = calculCodeCarbon({ ...base, ci: ciDuPays('SWE') });
    return [
      { label: 'Puissance appelée', valeur: fmt(r.puissanceW), unite: 'W' },
      {
        label: 'Dont mémoire vive',
        valeur: fmt(puissanceRam(n(v, 'ram'))),
        unite: 'W',
        aide: 'Heuristique CodeCarbon v3 : 5 W par barrette, minimum 2 barrettes.',
      },
      { label: 'Énergie consommée', valeur: fmt(r.kwh), unite: 'kWh', principal: true },
      {
        label: `Émissions — ${nomDuPays(s(v, 'pays'))}`,
        valeur: fmt(r.gco2 / 1000),
        unite: 'kgCO2eq',
        principal: true,
      },
      { label: 'La même chose en Pologne', valeur: fmt(pologne.gco2 / 1000), unite: 'kgCO2eq' },
      { label: 'La même chose en Suède', valeur: fmt(suede.gco2 / 1000), unite: 'kgCO2eq' },
      {
        label: 'Écart Suède → Pologne',
        valeur: `× ${fmt(pologne.gco2 / suede.gco2, 1)}`,
        aide: "Même calcul, même durée : seule l'électricité change.",
      },
    ];
  },
  formule: [
    'Puissance (W) = puissance CPU × charge + puissance GPU × charge + puissance mémoire',
    'Puissance mémoire (W) = 5 × nombre de barrettes (minimum 2)',
    'Énergie (kWh) = Puissance (W) × durée (h) ÷ 1 000',
    'Émissions (gCO2eq) = Énergie (kWh) × intensité carbone (gCO2eq/kWh)',
  ],
  rigueur: [
    "CodeCarbon ne devine pas : sur une machine réelle il lit les compteurs matériels (RAPL pour Intel, NVML pour NVIDIA) toutes les quelques secondes. Ce simulateur reproduit son modèle de repli, celui qu'il applique quand les compteurs ne sont pas accessibles.",
    "L'intensité carbone utilisée est exactement celle embarquée dans CodeCarbon : les valeurs 2023 d'Our World in Data, pays par pays.",
    "Le facteur d'efficacité du centre de données (PUE) n'est pas appliqué ici : CodeCarbon mesure la consommation de la machine, pas celle du bâtiment.",
  ],
  hypotheses: [
    "La durée d'entraînement et le matériel sont des hypothèses que vous réglez : elles ne décrivent pas une exécution réelle des Marches du Vivant.",
    'Le processeur est supposé sollicité à 50 % pendant que la carte graphique travaille.',
  ],
  sources: [SOURCE_CODECARBON, SOURCE_CI],
};

/* ================================================================== */
/* 2 — CodeCarbon × Fréquence Jardin                                   */
/* ================================================================== */

const codecarbonJardin: Simulateur = {
  id: 'codecarbon-jardin',
  outil: 'codecarbon',
  cas: 'jardin',
  titre: 'Le serveur qui écoute les sondes du jardin, toute l\'année',
  accroche:
    "Fréquence Jardin collecte en continu les mesures des sondes de sol. Ce n'est pas un gros calcul : c'est un petit calcul qui ne s'arrête jamais. Regardez ce que devient une poignée de watts multipliée par 8 760 heures.",
  controles: [
    {
      type: 'slider',
      cle: 'jours',
      label: 'Durée de fonctionnement',
      min: 1,
      max: 365,
      pas: 1,
      unite: 'jours',
      defaut: 365,
      hypothese: true,
    },
    { type: 'slider', cle: 'cpu', label: 'Puissance du processeur', min: 15, max: 280, pas: 5, unite: 'W', defaut: 65 },
    {
      type: 'slider',
      cle: 'chargeCpu',
      label: 'Taux de sollicitation moyen',
      min: 1,
      max: 100,
      pas: 1,
      unite: '%',
      defaut: 8,
      aide: "Un serveur de collecte passe l'essentiel de son temps à attendre.",
    },
    { type: 'slider', cle: 'ram', label: 'Mémoire vive', min: 8, max: 256, pas: 8, unite: 'Go', defaut: 16 },
    { type: 'select', cle: 'pays', label: 'Pays du centre de données', options: optionsPays, defaut: 'FRA' },
  ],
  calcul: (v) => {
    const heures = n(v, 'jours') * 24;
    const ci = ciDuPays(s(v, 'pays'));
    const commun = {
      heures,
      puissanceCpu: n(v, 'cpu'),
      chargeCpu: n(v, 'chargeCpu') / 100,
      puissanceGpu: 0,
      chargeGpu: 0,
      ramGo: n(v, 'ram'),
    };
    const r = calculCodeCarbon({ ...commun, ci });
    const partRam = (puissanceRam(n(v, 'ram')) / r.puissanceW) * 100;
    const moitieCharge = calculCodeCarbon({ ...commun, chargeCpu: commun.chargeCpu / 2, ci });
    return [
      { label: 'Puissance appelée', valeur: fmt(r.puissanceW), unite: 'W' },
      { label: 'Heures cumulées', valeur: fmt(heures, 0), unite: 'h' },
      { label: 'Énergie consommée', valeur: fmt(r.kwh), unite: 'kWh', principal: true },
      {
        label: `Émissions — ${nomDuPays(s(v, 'pays'))}`,
        valeur: fmt(r.gco2 / 1000),
        unite: 'kgCO2eq',
        principal: true,
      },
      {
        label: 'Part de la mémoire vive',
        valeur: fmt(partRam, 0),
        unite: '%',
        aide: "Sur une machine peu sollicitée, la mémoire pèse souvent plus que le calcul lui-même.",
      },
      {
        label: 'Si on divisait la sollicitation par deux',
        valeur: fmt(moitieCharge.gco2 / 1000),
        unite: 'kgCO2eq',
        aide: "Le gain n'est jamais de 50 % : la mémoire consomme quoi qu'il arrive.",
      },
    ];
  },
  formule: [
    'Puissance (W) = puissance CPU × charge + puissance mémoire',
    'Puissance mémoire (W) = 5 × nombre de barrettes (minimum 2)',
    'Énergie (kWh) = Puissance (W) × jours × 24 ÷ 1 000',
    'Émissions (gCO2eq) = Énergie (kWh) × intensité carbone',
  ],
  rigueur: [
    "La leçon de cet exercice tient dans la formule : la durée est un facteur multiplicatif direct. Un service qui tourne en continu est un choix d'architecture, pas un détail d'exploitation.",
    "La part de la mémoire est calculée avec l'heuristique de CodeCarbon v3 : 5 W par barrette, deux barrettes au minimum. Elle ne dépend pas de la sollicitation.",
  ],
  hypotheses: [
    "La configuration du serveur et son taux de sollicitation sont des hypothèses que vous réglez.",
    "Le stockage et le réseau ne sont pas comptés : CodeCarbon ne les mesure pas.",
  ],
  sources: [SOURCE_CODECARBON, SOURCE_CI],
};

/* ================================================================== */
/* 3 — EcoLogits × Les Marches du Vivant                               */
/* ================================================================== */

const ecologitsMdv: Simulateur = {
  id: 'ecologits-mdv',
  outil: 'ecologits',
  cas: 'mdv',
  titre: 'Rédiger les fiches espèces avec un modèle de langage',
  accroche:
    "Après chaque marche, une IA rédige les fiches des espèces rencontrées. Le levier le plus puissant n'est ni le pays ni l'heure : c'est la taille du modèle, parce qu'elle décide du nombre de cartes graphiques à allumer.",
  controles: [
    {
      type: 'slider',
      cle: 'fiches',
      label: 'Fiches espèces à rédiger',
      min: 1,
      max: 500,
      pas: 1,
      unite: 'fiches',
      defaut: 60,
      hypothese: true,
    },
    {
      type: 'slider',
      cle: 'jetons',
      label: 'Longueur de chaque fiche',
      min: 50,
      max: 2000,
      pas: 50,
      unite: 'jetons',
      defaut: 400,
      aide: "Environ 400 jetons pour une fiche d'une demi-page.",
      hypothese: true,
    },
    {
      type: 'slider',
      cle: 'params',
      label: 'Taille du modèle',
      min: 3,
      max: 400,
      pas: 1,
      unite: 'milliards de paramètres',
      defaut: 70,
    },
    { type: 'select', cle: 'pays', label: 'Pays du centre de données', options: optionsPays, defaut: 'FRA' },
  ],
  calcul: (v) => {
    const ci = ciDuPays(s(v, 'pays'));
    const jetons = n(v, 'jetons');
    const fiches = n(v, 'fiches');
    const grand = calculEcoLogits({ parametresMilliards: n(v, 'params'), jetonsSortie: jetons, pue: 1.2, ci });
    const petit = calculEcoLogits({ parametresMilliards: 8, jetonsSortie: jetons, pue: 1.2, ci });
    return [
      { label: 'Cartes graphiques mobilisées', valeur: `${grand.nbGpu}`, aide: 'Arrondi en puissance de 2 sur des cartes H100 de 80 Go.' },
      { label: 'Durée de génération, une fiche', valeur: fmt(grand.latenceS, 1), unite: 's' },
      { label: 'Énergie, une fiche', valeur: fmt(grand.energieWh * 1000, 1), unite: 'mWh' },
      {
        label: `Émissions pour ${fmt(fiches, 0)} fiches`,
        valeur: fmt((grand.gco2Total * fiches) / 1000, 2),
        unite: 'gCO2eq',
        principal: true,
      },
      {
        label: 'Dont fabrication du matériel',
        valeur: fmt((grand.gco2Fabrication / grand.gco2Total) * 100, 0),
        unite: '%',
        aide: 'EcoLogits amortit la fabrication du serveur et des cartes sur trois ans.',
      },
      {
        label: 'Avec un modèle de 8 milliards',
        valeur: fmt((petit.gco2Total * fiches) / 1000, 2),
        unite: 'gCO2eq',
        principal: true,
      },
      {
        label: 'Rapport entre les deux modèles',
        valeur: `× ${fmt(grand.gco2Total / petit.gco2Total, 1)}`,
        aide: "Le rapport n'est pas linéaire : il saute à chaque carte graphique supplémentaire.",
      },
    ];
  },
  formule: [
    'énergie par jeton (Wh) = 1,17·10⁻⁶ × e^(−1,12·10⁻² × 64) × P + 4,05·10⁻⁵',
    'latence par jeton (s) = 6,78·10⁻⁴ × P + 3,12·10⁻⁴ × 64 + 1,94·10⁻²',
    'nombre de cartes = arrondi en puissance de 2 de [1,2 × P × 16 bits ÷ 8] ÷ 80 Go',
    'énergie requête (Wh) = PUE × (énergie serveur hors cartes + énergie des cartes)',
    'fabrication (gCO2eq) = latence ÷ (64 × 3 ans) × [cartes ÷ 8 × 5 700 kg + cartes × 273 kg]',
  ],
  rigueur: [
    "Les coefficients de la formule d'énergie ne sont pas des ordres de grandeur : ce sont ceux d'une régression publiée par EcoLogits sur les mesures du ML.ENERGY Leaderboard (vLLM sur cartes NVIDIA H100).",
    "La taille de lot est fixée à 64 requêtes traitées simultanément, comme dans la méthode publiée : c'est ce qui permet de partager le coût du serveur entre les requêtes.",
    "La fabrication vient de BoaviztAPI pour le serveur (instance p5.48xlarge, 5 700 kgCO2eq hors cartes) et d'une analyse de cycle de vie ADEME pour la carte H100 (273 kgCO2eq).",
    "Le saut d'une carte à deux, puis à quatre, explique les marches d'escalier que vous voyez apparaître en déplaçant le curseur de taille.",
  ],
  hypotheses: [
    'Le nombre de fiches et leur longueur sont des hypothèses que vous réglez.',
    "Le modèle est supposé dense : tous ses paramètres sont actifs. Pour un modèle à experts, seuls les paramètres actifs comptent pour l'énergie.",
    'PUE fixé à 1,2 dans cet exercice.',
  ],
  sources: [SOURCE_ECOLOGITS, SOURCE_CI],
};

/* ================================================================== */
/* 4 — EcoLogits × Fréquence Jardin                                    */
/* ================================================================== */

const ecologitsJardin: Simulateur = {
  id: 'ecologits-jardin',
  outil: 'ecologits',
  cas: 'jardin',
  titre: "L'IA de Jardin, question après question, pendant un an",
  accroche:
    "Une réponse de l'IA de Jardin coûte presque rien. Multipliez-la par le nombre de jardins, de questions et de jours : c'est là que le choix du modèle et la longueur des réponses deviennent une décision de conception.",
  controles: [
    { type: 'slider', cle: 'jardins', label: 'Jardins équipés', min: 1, max: 500, pas: 1, unite: 'jardins', defaut: 40, hypothese: true },
    {
      type: 'slider',
      cle: 'questions',
      label: 'Questions par jardin et par semaine',
      min: 1,
      max: 50,
      pas: 1,
      unite: 'questions',
      defaut: 6,
      hypothese: true,
    },
    { type: 'slider', cle: 'jetons', label: 'Longueur de réponse', min: 50, max: 1500, pas: 25, unite: 'jetons', defaut: 300, hypothese: true },
    { type: 'slider', cle: 'params', label: 'Taille du modèle', min: 3, max: 400, pas: 1, unite: 'milliards de paramètres', defaut: 24 },
    { type: 'slider', cle: 'pue', label: 'Efficacité du centre de données (PUE)', min: 1.05, max: 2, pas: 0.05, unite: '', defaut: 1.15 },
    { type: 'select', cle: 'pays', label: 'Pays du centre de données', options: optionsPays, defaut: 'FRA' },
  ],
  calcul: (v) => {
    const ci = ciDuPays(s(v, 'pays'));
    const requetes = n(v, 'jardins') * n(v, 'questions') * 52;
    const r = calculEcoLogits({
      parametresMilliards: n(v, 'params'),
      jetonsSortie: n(v, 'jetons'),
      pue: n(v, 'pue'),
      ci,
    });
    const court = calculEcoLogits({
      parametresMilliards: n(v, 'params'),
      jetonsSortie: Math.max(50, n(v, 'jetons') / 2),
      pue: n(v, 'pue'),
      ci,
    });
    return [
      { label: 'Requêtes dans l\'année', valeur: fmt(requetes, 0) },
      { label: 'Cartes graphiques mobilisées', valeur: `${r.nbGpu}` },
      { label: 'Énergie, une réponse', valeur: fmt(r.energieWh * 1000, 2), unite: 'mWh' },
      { label: 'Énergie sur l\'année', valeur: fmt((r.energieWh * requetes) / 1000, 2), unite: 'kWh', principal: true },
      {
        label: 'Émissions sur l\'année',
        valeur: fmt((r.gco2Total * requetes) / 1000, 2),
        unite: 'kgCO2eq',
        principal: true,
      },
      {
        label: 'Avec des réponses deux fois plus courtes',
        valeur: fmt((court.gco2Total * requetes) / 1000, 2),
        unite: 'kgCO2eq',
        aide: "La longueur de la réponse agit directement : l'énergie est comptée par jeton produit.",
      },
    ];
  },
  formule: [
    'énergie par jeton (Wh) = 1,17·10⁻⁶ × e^(−1,12·10⁻² × 64) × P + 4,05·10⁻⁵',
    'énergie requête (Wh) = PUE × (énergie serveur hors cartes + énergie des cartes)',
    'requêtes par an = jardins × questions par semaine × 52',
    'émissions = (usage + fabrication amortie) × nombre de requêtes',
  ],
  rigueur: [
    "L'énergie est proportionnelle au nombre de jetons produits : c'est une conséquence directe de la formule d'EcoLogits, pas une approximation de notre part.",
    "Le PUE par défaut proposé ici, 1,15, est celui retenu par compar:IA pour les grands fournisseurs de cloud.",
    "La fabrication du matériel est incluse : elle est amortie sur trois ans et sur les 64 requêtes traitées simultanément.",
  ],
  hypotheses: [
    'Nombre de jardins, fréquence des questions et longueur des réponses sont des hypothèses que vous réglez.',
    "Les jetons de la question posée ne sont pas comptés : EcoLogits modélise l'énergie de la génération.",
  ],
  sources: [SOURCE_ECOLOGITS, SOURCE_COMPARIA_ECOLOGITS, SOURCE_CI],
};

/* ================================================================== */
/* 5 — Green Algorithms × Les Marches du Vivant                        */
/* ================================================================== */

const greenMdv: Simulateur = {
  id: 'greenalgorithms-mdv',
  outil: 'greenalgorithms',
  cas: 'mdv',
  titre: 'Recalculer toutes les cartes de biodiversité sur un cluster',
  accroche:
    "Croiser les observations, les traces GPS et les zones blanches demande un gros calcul. Green Algorithms ajoute deux facteurs que les autres outils oublient : l'efficacité du bâtiment (PUE) et le nombre de fois où l'on relance vraiment le calcul (PSF).",
  controles: [
    { type: 'slider', cle: 'heures', label: 'Durée du calcul', min: 0.25, max: 48, pas: 0.25, unite: 'h', defaut: 6, hypothese: true },
    { type: 'slider', cle: 'coeurs', label: 'Cœurs de processeur réservés', min: 1, max: 256, pas: 1, unite: 'cœurs', defaut: 32 },
    {
      type: 'slider',
      cle: 'tdp',
      label: 'Puissance par cœur',
      min: 5,
      max: 20,
      pas: 0.1,
      unite: 'W',
      defaut: 12,
      aide: 'Le guide du calculateur indique 10 à 15 W par cœur pour un processeur récent.',
    },
    { type: 'slider', cle: 'usage', label: 'Taux d\'utilisation des cœurs', min: 10, max: 100, pas: 5, unite: '%', defaut: 100 },
    {
      type: 'slider',
      cle: 'memoire',
      label: 'Mémoire réservée',
      min: 4,
      max: 512,
      pas: 4,
      unite: 'Go',
      defaut: 128,
      aide: 'Green Algorithms compte la mémoire réservée, pas la mémoire réellement utilisée.',
    },
    { type: 'slider', cle: 'pue', label: 'PUE du centre de données', min: 1, max: 2.5, pas: 0.01, unite: '', defaut: 1.67 },
    {
      type: 'slider',
      cle: 'psf',
      label: 'Nombre de relances réelles (PSF)',
      min: 1,
      max: 100,
      pas: 1,
      unite: '×',
      defaut: 12,
      hypothese: true,
    },
    { type: 'select', cle: 'pays', label: 'Pays du centre de données', options: optionsPays, defaut: 'FRA' },
  ],
  calcul: (v) => {
    const ci = ciDuPays(s(v, 'pays'));
    const commun = {
      heures: n(v, 'heures'),
      nbCoeurs: n(v, 'coeurs'),
      tdpParCoeur: n(v, 'tdp'),
      usageCpu: n(v, 'usage') / 100,
      nbGpu: 0,
      tdpGpu: 0,
      usageGpu: 0,
      memoireGo: n(v, 'memoire'),
      pue: n(v, 'pue'),
      ci,
    };
    const r = calculGreenAlgorithms({ ...commun, psf: n(v, 'psf') });
    const uneFois = calculGreenAlgorithms({ ...commun, psf: 1 });
    const partMemoire =
      ((n(v, 'memoire') * GREEN_ALGORITHMS.wattsParGoMemoire) / r.puissanceW) * 100;
    return [
      { label: 'Puissance appelée', valeur: fmt(r.puissanceW), unite: 'W' },
      {
        label: 'Part de la mémoire réservée',
        valeur: fmt(partMemoire, 0),
        unite: '%',
        aide: '0,3725 W par Go, que la mémoire serve ou non.',
      },
      { label: 'Un seul passage', valeur: fmt(uneFois.gco2 / 1000, 2), unite: 'kgCO2eq' },
      { label: 'Énergie totale', valeur: fmt(r.kwh), unite: 'kWh', principal: true },
      { label: 'Empreinte réelle du projet', valeur: fmt(r.gco2 / 1000, 2), unite: 'kgCO2eq', principal: true },
      {
        label: 'Effet du PUE seul',
        valeur: `× ${fmt(n(v, 'pue'), 2)}`,
        aide: "Refroidissement et pertes du bâtiment : ce facteur multiplie tout le reste.",
      },
    ];
  },
  formule: [
    'énergie (kWh) = durée × (cœurs × puissance par cœur × usage + mémoire × 0,3725) ÷ 1 000 × PUE × PSF',
    'empreinte (gCO2eq) = énergie (kWh) × intensité carbone (gCO2eq/kWh)',
  ],
  rigueur: [
    "La valeur de 0,3725 W par Go n'est pas une estimation : elle a été mesurée expérimentalement et publiée dans l'article de méthode de Green Algorithms (Advanced Science, 2021).",
    "Le PUE par défaut de 1,67 est la moyenne mondiale des centres de données estimée en 2019, retenue par les auteurs.",
    "Le PSF est le cœur de la méthode : les auteurs rappellent qu'un calcul scientifique est rarement lancé une seule fois. Ne compter qu'un passage, c'est sous-estimer d'un facteur qui vaut souvent dix ou cent.",
    "Green Algorithms compte la mémoire réservée, car la puissance appelée dépend du nombre de barrettes maintenues actives, pas du volume de données traité.",
  ],
  hypotheses: [
    'Durée, matériel réservé et nombre de relances sont des hypothèses que vous réglez.',
    'Cet exercice ne mobilise pas de carte graphique : le calcul cartographique est un calcul processeur.',
  ],
  sources: [SOURCE_GREEN_ALGORITHMS, SOURCE_GA_PAPIER, SOURCE_CI],
};

/* ================================================================== */
/* 6 — Green Algorithms × Fréquence Jardin                             */
/* ================================================================== */

const greenJardin: Simulateur = {
  id: 'greenalgorithms-jardin',
  outil: 'greenalgorithms',
  cas: 'jardin',
  titre: 'Le coût caché des essais : analyser un sol, encore et encore',
  accroche:
    "Une analyse de sol dure quelques minutes. Mais entre les réglages, les erreurs de paramètres et les comparaisons entre secteurs, on la relance beaucoup. Poussez le curseur des relances et regardez le petit calcul devenir un vrai calcul.",
  controles: [
    { type: 'slider', cle: 'minutes', label: 'Durée d\'une analyse', min: 1, max: 120, pas: 1, unite: 'min', defaut: 8, hypothese: true },
    { type: 'slider', cle: 'coeurs', label: 'Cœurs utilisés', min: 1, max: 64, pas: 1, unite: 'cœurs', defaut: 8 },
    { type: 'slider', cle: 'tdp', label: 'Puissance par cœur', min: 5, max: 20, pas: 0.1, unite: 'W', defaut: 10.8, aide: 'Valeur mesurée pour un Core i5 dans l\'article de méthode.' },
    { type: 'slider', cle: 'memoire', label: 'Mémoire réservée', min: 2, max: 128, pas: 2, unite: 'Go', defaut: 16 },
    { type: 'slider', cle: 'psf', label: 'Relances (PSF)', min: 1, max: 300, pas: 1, unite: '×', defaut: 40, hypothese: true },
    { type: 'slider', cle: 'pue', label: 'PUE', min: 1, max: 2.5, pas: 0.01, unite: '', defaut: 1.67 },
    { type: 'select', cle: 'pays', label: 'Pays du centre de données', options: optionsPays, defaut: 'FRA' },
  ],
  calcul: (v) => {
    const ci = ciDuPays(s(v, 'pays'));
    const heures = n(v, 'minutes') / 60;
    const commun = {
      heures,
      nbCoeurs: n(v, 'coeurs'),
      tdpParCoeur: n(v, 'tdp'),
      usageCpu: 1,
      nbGpu: 0,
      tdpGpu: 0,
      usageGpu: 0,
      memoireGo: n(v, 'memoire'),
      pue: n(v, 'pue'),
      ci,
    };
    const r = calculGreenAlgorithms({ ...commun, psf: n(v, 'psf') });
    const uneFois = calculGreenAlgorithms({ ...commun, psf: 1 });
    const sansPue = calculGreenAlgorithms({ ...commun, psf: n(v, 'psf'), pue: 1 });
    return [
      { label: 'Une analyse', valeur: fmt(uneFois.gco2, 2), unite: 'gCO2eq' },
      { label: 'Temps machine cumulé', valeur: fmt(heures * n(v, 'psf'), 1), unite: 'h' },
      { label: 'Énergie totale', valeur: fmt(r.kwh, 3), unite: 'kWh', principal: true },
      { label: 'Empreinte totale', valeur: fmt(r.gco2, 1), unite: 'gCO2eq', principal: true },
      {
        label: 'Part due au bâtiment (PUE)',
        valeur: fmt(r.gco2 - sansPue.gco2, 1),
        unite: 'gCO2eq',
        aide: "Ce que consomment le refroidissement et les pertes électriques, en plus des machines.",
      },
      {
        label: 'Si on divisait les relances par deux',
        valeur: fmt(r.gco2 / 2, 1),
        unite: 'gCO2eq',
        aide: 'Le PSF est un facteur strictement proportionnel : le diviser par deux divise tout par deux.',
      },
    ];
  },
  formule: [
    'énergie (kWh) = durée × (cœurs × puissance par cœur × usage + mémoire × 0,3725) ÷ 1 000 × PUE × PSF',
    'empreinte (gCO2eq) = énergie (kWh) × intensité carbone',
  ],
  rigueur: [
    "La puissance de 10,8 W par cœur est la valeur mesurée pour un processeur Core i5 dans l'article de Green Algorithms ; elle n'a pas été choisie au hasard.",
    "Le facteur PSF apparaît en multiplication directe dans la formule : c'est pourquoi diviser les relances par deux divise exactement l'empreinte par deux.",
    "Le PUE, lui, multiplie l'ensemble : machines et bâtiment ne se compensent jamais.",
  ],
  hypotheses: [
    "Durée d'une analyse et nombre de relances sont des hypothèses que vous réglez.",
    'Les cœurs sont supposés utilisés à 100 % pendant le calcul.',
  ],
  sources: [SOURCE_GREEN_ALGORITHMS, SOURCE_GA_PAPIER, SOURCE_CI],
};

/* ================================================================== */
/* 7 — Compar:IA × Les Marches du Vivant                               */
/* ================================================================== */

const compariaMdv: Simulateur = {
  id: 'comparia-mdv',
  outil: 'comparia',
  cas: 'mdv',
  titre: 'Le duel : deux modèles pour la même fiche espèce',
  accroche:
    "C'est le geste de compar:IA : poser la même question à deux modèles anonymes et regarder ce qu'ils coûtent. Réglez les deux tailles, lisez la consommation pour 1 000 jetons — l'unité affichée par compar:IA — et demandez-vous si l'écart de qualité justifie l'écart d'énergie.",
  controles: [
    { type: 'slider', cle: 'a', label: 'Modèle A — taille', min: 3, max: 400, pas: 1, unite: 'milliards de paramètres', defaut: 8 },
    { type: 'slider', cle: 'b', label: 'Modèle B — taille', min: 3, max: 400, pas: 1, unite: 'milliards de paramètres', defaut: 200 },
    { type: 'slider', cle: 'jetons', label: 'Longueur de la réponse', min: 100, max: 2000, pas: 50, unite: 'jetons', defaut: 500, hypothese: true },
    { type: 'select', cle: 'pays', label: 'Pays du centre de données', options: optionsPays, defaut: 'FRA' },
  ],
  calcul: (v) => {
    const ci = ciDuPays(s(v, 'pays'));
    const mille = (p: number) =>
      calculEcoLogits({ parametresMilliards: p, jetonsSortie: 1000, pue: PUE_COMPARIA, ci });
    const reponse = (p: number) =>
      calculEcoLogits({ parametresMilliards: p, jetonsSortie: n(v, 'jetons'), pue: PUE_COMPARIA, ci });
    const a = mille(n(v, 'a'));
    const b = mille(n(v, 'b'));
    const ra = reponse(n(v, 'a'));
    const rb = reponse(n(v, 'b'));
    return [
      { label: 'Modèle A — 1 000 jetons', valeur: fmt(a.energieWh * 1000, 1), unite: 'mWh', principal: true },
      { label: 'Modèle B — 1 000 jetons', valeur: fmt(b.energieWh * 1000, 1), unite: 'mWh', principal: true },
      { label: 'Écart', valeur: `× ${fmt(b.energieWh / a.energieWh, 1)}` },
      { label: 'Cartes graphiques — A puis B', valeur: `${a.nbGpu} → ${b.nbGpu}` },
      { label: 'Émissions de la réponse — A', valeur: fmt(ra.gco2Total, 3), unite: 'gCO2eq' },
      { label: 'Émissions de la réponse — B', valeur: fmt(rb.gco2Total, 3), unite: 'gCO2eq' },
      {
        label: 'Différence pour une réponse',
        valeur: fmt(rb.gco2Total - ra.gco2Total, 3),
        unite: 'gCO2eq',
        aide: 'À multiplier par le nombre de fois où le service est appelé.',
      },
    ];
  },
  formule: [
    'compar:IA affiche : consommation moyenne en mWh pour 1 000 jetons',
    'moteur de calcul : EcoLogits, avec PUE = 1,15',
    'énergie par jeton (Wh) = 1,17·10⁻⁶ × e^(−1,12·10⁻² × 64) × P + 4,05·10⁻⁵',
  ],
  rigueur: [
    "compar:IA n'invente pas sa propre méthode : le service affiche les impacts calculés par EcoLogits, avec un PUE de 1,15. Ce simulateur applique exactement la même chaîne.",
    "L'unité retenue ici, le milliwattheure pour 1 000 jetons, est celle du classement public de compar:IA — elle permet de comparer des modèles de tailles très différentes.",
    "Attention au contresens : le classement de compar:IA mesure les préférences des utilisateurs, pas la justesse des réponses. Un modèle préféré n'est pas un modèle exact.",
  ],
  hypotheses: [
    'La longueur de la réponse est une hypothèse que vous réglez.',
    "Les deux modèles sont supposés denses et servis sur le même type de serveur.",
  ],
  sources: [SOURCE_COMPARIA, SOURCE_COMPARIA_ECOLOGITS, SOURCE_ECOLOGITS],
};

/* ================================================================== */
/* 8 — Compar:IA × Fréquence Jardin                                    */
/* ================================================================== */

const compariaJardin: Simulateur = {
  id: 'comparia-jardin',
  outil: 'comparia',
  cas: 'jardin',
  titre: 'Choisir le bon modèle pour chaque usage du jardin',
  accroche:
    "Tous les usages n'ont pas besoin du même modèle. Répartissez les échanges de Fréquence Jardin entre un petit modèle pour les réponses courantes et un grand modèle pour les demandes complexes : le curseur de répartition est, littéralement, la décision de sobriété.",
  controles: [
    { type: 'slider', cle: 'echanges', label: 'Échanges par mois', min: 100, max: 20000, pas: 100, unite: 'échanges', defaut: 3000, hypothese: true },
    { type: 'slider', cle: 'partGrand', label: 'Part confiée au grand modèle', min: 0, max: 100, pas: 1, unite: '%', defaut: 100 },
    { type: 'slider', cle: 'petit', label: 'Petit modèle — taille', min: 3, max: 70, pas: 1, unite: 'milliards de paramètres', defaut: 8 },
    { type: 'slider', cle: 'grand', label: 'Grand modèle — taille', min: 30, max: 400, pas: 1, unite: 'milliards de paramètres', defaut: 200 },
    { type: 'slider', cle: 'jetons', label: 'Longueur moyenne des réponses', min: 50, max: 1500, pas: 25, unite: 'jetons', defaut: 300, hypothese: true },
    { type: 'select', cle: 'pays', label: 'Pays du centre de données', options: optionsPays, defaut: 'FRA' },
  ],
  calcul: (v) => {
    const ci = ciDuPays(s(v, 'pays'));
    const jetons = n(v, 'jetons');
    const parAn = n(v, 'echanges') * 12;
    const part = n(v, 'partGrand') / 100;
    const g = calculEcoLogits({ parametresMilliards: n(v, 'grand'), jetonsSortie: jetons, pue: PUE_COMPARIA, ci });
    const p = calculEcoLogits({ parametresMilliards: n(v, 'petit'), jetonsSortie: jetons, pue: PUE_COMPARIA, ci });
    const mix = parAn * (part * g.gco2Total + (1 - part) * p.gco2Total);
    const toutGrand = parAn * g.gco2Total;
    const energie = parAn * (part * g.energieWh + (1 - part) * p.energieWh);
    return [
      { label: 'Échanges dans l\'année', valeur: fmt(parAn, 0) },
      { label: 'Énergie annuelle', valeur: fmt(energie / 1000, 2), unite: 'kWh', principal: true },
      { label: 'Émissions annuelles', valeur: fmt(mix / 1000, 2), unite: 'kgCO2eq', principal: true },
      { label: 'Si tout passait par le grand modèle', valeur: fmt(toutGrand / 1000, 2), unite: 'kgCO2eq' },
      {
        label: 'Économie de votre répartition',
        valeur: fmt((toutGrand - mix) / 1000, 2),
        unite: 'kgCO2eq',
        aide: "L'écart entre ce que vous avez réglé et le réflexe « toujours le plus gros modèle ».",
      },
      {
        label: 'Réduction',
        valeur: fmt(((toutGrand - mix) / toutGrand) * 100, 0),
        unite: '%',
      },
    ];
  },
  formule: [
    'émissions annuelles = échanges × 12 × [part × impact grand modèle + (1 − part) × impact petit modèle]',
    'impact d\'une réponse = usage + fabrication amortie, calculés par EcoLogits avec PUE = 1,15',
  ],
  rigueur: [
    "Ce mélange n'est pas une astuce de calcul : compar:IA existe précisément pour montrer qu'à qualité de réponse comparable, plusieurs modèles très différents peuvent convenir.",
    "Les impacts unitaires proviennent de la chaîne EcoLogits utilisée par compar:IA, PUE 1,15 inclus, fabrication du matériel comprise.",
    "La réduction affichée est arithmétique : elle est exactement proportionnelle à la part d'échanges déplacée vers le petit modèle.",
  ],
  hypotheses: [
    'Volume mensuel, répartition et longueur des réponses sont des hypothèses que vous réglez.',
    "Ce simulateur ne juge pas la qualité des réponses : c'est à vous de vérifier, usage par usage, que le petit modèle suffit.",
  ],
  sources: [SOURCE_COMPARIA, SOURCE_COMPARIA_ECOLOGITS, SOURCE_ECOLOGITS],
};

/* ================================================================== */

export interface Outil {
  cle: OutilKey;
  nom: string;
  url: string;
  quoi: string;
  quand: string;
  nature: string;
  simulateurs: Simulateur[];
  constantesTitre: string;
}

export const CAS_LABEL: Record<CasKey, string> = {
  mdv: 'Les Marches du Vivant',
  jardin: 'Propriété — Fréquence Jardin',
};

export const OUTILS: Outil[] = [
  {
    cle: 'codecarbon',
    nom: 'CodeCarbon',
    url: 'https://codecarbon.io/',
    quoi: "Mesure en direct l'électricité consommée par un programme qui tourne, et la convertit en émissions selon le pays.",
    quand: "Quand le code est à vous et que vous pouvez l'instrumenter : entraînement, traitement par lots, service en production.",
    nature: 'Mesure',
    constantesTitre: 'Ce que CodeCarbon utilise réellement',
    simulateurs: [codecarbonMdv, codecarbonJardin],
  },
  {
    cle: 'ecologits',
    nom: 'EcoLogits',
    url: 'https://ecologits.ai/latest/',
    quoi: "Estime l'impact d'une requête à un modèle de langage, usage et fabrication du matériel compris, sans accès au serveur.",
    quand: "Quand vous appelez une IA générative par une interface de programmation et que vous ne mesurez rien vous-même.",
    nature: 'Estimation par modèle',
    constantesTitre: 'Ce qu\'EcoLogits publie',
    simulateurs: [ecologitsMdv, ecologitsJardin],
  },
  {
    cle: 'greenalgorithms',
    nom: 'Green Algorithms',
    url: 'https://www.green-algorithms.org/',
    quoi: "Estime après coup l'empreinte d'un calcul à partir de sa durée et du matériel réservé, en intégrant le bâtiment et les relances.",
    quand: 'Quand le calcul est déjà passé, sur un cluster ou un centre de calcul, et que vous connaissez les ressources réservées.',
    nature: 'Estimation a posteriori',
    constantesTitre: 'Ce que Green Algorithms utilise réellement',
    simulateurs: [greenMdv, greenJardin],
  },
  {
    cle: 'comparia',
    nom: 'compar:IA',
    url: 'https://comparia.beta.gouv.fr/',
    quoi: "Fait dialoguer deux modèles anonymes sur la même question et affiche, pour chacun, la consommation estimée.",
    quand: 'Au moment du choix : avant de figer un modèle dans un service, pour vérifier ce que coûte vraiment la puissance en plus.',
    nature: 'Comparaison publique',
    constantesTitre: 'Ce que compar:IA affiche et comment',
    simulateurs: [compariaMdv, compariaJardin],
  },
];

export const TOUS_SIMULATEURS = OUTILS.flatMap((o) => o.simulateurs);
