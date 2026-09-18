/**
 * Catalogue des briques de La Fréquence du Vivant proposées à Ver de Terre Production
 * dans le cadre du projet « Jardin nourricier ».
 *
 * Un seul catalogue, trois lectures (grilles). Basculer de grille ne change pas le prix :
 * chaque grille couvre l'intégralité du patrimoine, avec un angle de lecture différent.
 */

export type OptionState = 'production' | 'adaptation';

export interface ConfigOption {
  id: string;
  label: string;
  /** Ce que c'est, en une phrase. */
  pitch: string;
  /** Ce que VDTP obtient concrètement. */
  gain: string;
  /** Écran, page ou export déjà en service qui le prouve. */
  proof: string;
  /** Poids de valeur dans le catalogue. */
  weight: number;
  state: OptionState;
  /** Brique socle : la décocher décroche les briques qui en dépendent. */
  core?: boolean;
  requires?: string[];
}

export interface ConfigGrid {
  id: 'technique' | 'usage' | 'patrimoine';
  number: string;
  label: string;
  tagline: string;
  /** À qui cette lecture s'adresse dans la salle. */
  audience: string;
  optionIds: string[];
}

export const PRICE_FLOOR = 15000;
export const PRICE_MAX = 50000;

const CORE = ['opt-socle', 'opt-donnees'];

export const CONFIG_OPTIONS: ConfigOption[] = [
  // ——— Grille 1 · briques techniques
  {
    id: 'opt-socle',
    label: 'Socle applicatif & hébergement',
    pitch: "L'ossature de l'application : rendu, routage, thèmes clair/sombre, performances, déploiement continu.",
    gain: "Une application qui tourne dès la signature, sur vos serveurs et votre domaine.",
    proof: 'la-frequence-du-vivant.com, en production depuis un an',
    weight: 6,
    state: 'production',
    core: true,
  },
  {
    id: 'opt-donnees',
    label: 'Base de données & modèle de propriété',
    pitch: "Le modèle « propriété / jardin » : comptes, rôles, invitations, cloisonnement des données par jardin.",
    gain: 'Chaque jardinier ne voit que son jardin ; les règles de sécurité sont déjà écrites et éprouvées.',
    proof: '106 domaines documentés, règles de sécurité par ligne',
    weight: 5,
    state: 'production',
    core: true,
  },
  {
    id: 'opt-assistant',
    label: 'Assistant du Jardin & bases de connaissances',
    pitch: "L'assistant conversationnel branché sur le contexte réel du jardin, avec ses garde-fous et ses sources.",
    gain: "Un assistant qui répond sur le jardin de l'utilisateur, pas en généralités.",
    proof: 'Assistant du Jardin, console de contextes, connaissance validée par entretien',
    weight: 7,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-backoffice',
    label: 'Back-office interne',
    pitch: 'Console d\'administration : comptes, jardins, contenus, curation, tableaux de bord.',
    gain: 'Vos équipes pilotent le service sans passer par un développeur.',
    proof: 'Console Propriétés : table, carte, tableau de bord, analyse',
    weight: 4,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-crm',
    label: 'CRM interne',
    pitch: 'Pipeline, annuaire, missions, campagnes, opportunités — relié aux comptes de la plateforme.',
    gain: 'Le suivi commercial B2C et B2B dans le même outil que le produit.',
    proof: 'CRM en service : pipeline, campagnes, annuaire',
    weight: 3,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-marketing',
    label: 'Marketing automation & emails',
    pitch: "Envois transactionnels et campagnes : gabarits, historique, pièces jointes, suivi des envois.",
    gain: 'Les séquences de bienvenue, relances et carnets partent sans outil tiers supplémentaire.',
    proof: 'Envoi du Carnet de terrain, gabarits Fréquence Jardin',
    weight: 3,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-recherche',
    label: 'Moteur de recherche du site',
    pitch: 'Recherche globale par univers, tolérante aux fautes et aux accents, avec règles de classement administrables.',
    gain: 'Les visiteurs trouvent la bonne page ; vous ajustez les règles sans développement.',
    proof: 'Recherche ⌘K, administration des règles de classement',
    weight: 2,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-exports',
    label: 'Exports & documents imprimables',
    pitch: 'Export CSV, JSON, PDF, ZIP et mises en page A4 prêtes à imprimer.',
    gain: 'Chaque écran devient un livrable remis au jardinier ou au client.',
    proof: 'Pack Vivant (.zip), exports propriété, fiches A4',
    weight: 3,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-supervision',
    label: 'Supervision des services externes',
    pitch: "Console de suivi des interfaces externes, seuils d'alerte et relances automatiques.",
    gain: 'Une panne de service extérieur se voit et se traite avant que les utilisateurs la subissent.',
    proof: 'Console API/MCP : alertes 24 h / 72 h, journal des relances',
    weight: 2,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-mobile',
    label: 'Expérience mobile installable',
    pitch: "Interface pensée mobile d'abord, installable sur l'écran d'accueil, photos et GPS depuis le téléphone.",
    gain: 'Le jardinier utilise le service au jardin, les mains dans la terre.',
    proof: 'Parcours marcheur et atelier du jardin sur téléphone',
    weight: 4,
    state: 'adaptation',
    requires: CORE,
  },

  // ——— Grille 2 · parcours du jardinier
  {
    id: 'opt-portrait',
    label: 'Inscription & portrait du jardin',
    pitch: "Le parcours d'entrée : surface, envies, contraintes, temps disponible, objectif à six mois.",
    gain: 'Dès la première visite, le service sait à qui il parle et personnalise ses réponses.',
    proof: 'Parcours /jardin/demarrer, onglet Portrait · Intention',
    weight: 4,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-sol',
    label: 'Étude de sol guidée',
    pitch: 'Le protocole complet : carotte, test du boudin, structure, texture, pH, signes de vie, synthèse.',
    gain: "Le jardinier comprend son sol sans laboratoire — c'est la porte d'entrée la plus recherchée.",
    proof: 'Page /etude-de-sol et registre de sol des propriétés',
    weight: 5,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-palette',
    label: 'Palette végétale & plantes indicatrices',
    pitch: 'Les espèces adaptées au sol et au climat du lieu, et ce que les plantes présentes racontent déjà.',
    gain: 'Une liste de plantations justifiée par le terrain, pas par un catalogue.',
    proof: 'Palette végétale, bio-indicatrices, concordance sol-flore',
    weight: 4,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-atelier',
    label: 'Atelier du jardin (plan interactif)',
    pitch: 'Le plan du jardin : zones, ouvrages, espèces posées à la main, capteurs, avant/après.',
    gain: 'Le jardin devient une carte que le jardinier fait évoluer saison après saison.',
    proof: "Atelier du jardin en production sur des jardins réels",
    weight: 5,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-tour',
    label: 'Tour de jardin',
    pitch: 'La visite guidée : ce que je vois, entends, sens ; actions proposées, suivies et partagées.',
    gain: "Le rendez-vous régulier qui fait revenir l'abonné et nourrit son carnet.",
    proof: 'Tours de jardin, fiches actions, Carnet de terrain envoyé par email',
    weight: 4,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-clinique',
    label: 'Clinique du jardin',
    pitch: 'Le diagnostic des problèmes : foyers cartographiés, causes probables, gestes de réponse.',
    gain: "La question numéro un du jardinier — « qu'est-ce qui arrive à ma plante ? » — trouve une réponse cadrée.",
    proof: 'Clinique du jardin, carte des foyers',
    weight: 3,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-capteurs',
    label: 'Capteurs & sondes',
    pitch: "Chaîne complète : réception des mesures, unités normalisées, tendances, verdicts agronomiques.",
    gain: 'Une offre premium crédible, et une donnée objective qui fiabilise tous les conseils.',
    proof: 'Sondes en service, console IoT, fiches capteur',
    weight: 4,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-carnet',
    label: 'Carnet de terrain & partage',
    pitch: 'Le carnet du jardinier : photos, observations, envoi à ses proches, page publique optionnelle.',
    gain: "Chaque abonné devient prescripteur : le carnet partagé est votre meilleur canal d'acquisition.",
    proof: 'Carnet de terrain, envoi email, pages publiques',
    weight: 3,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-academie',
    label: 'Académie Jardin (parcours pédagogiques)',
    pitch: 'Modules, guides, quiz et progression, reliés au jardin réel de chaque apprenant.',
    gain: "La vitrine de Noël : un contenu à offrir, adossé à un outil qui vit toute l'année.",
    proof: 'Quiz interactifs, guides factuels, matériel pédagogique',
    weight: 4,
    state: 'adaptation',
    requires: CORE,
  },
  {
    id: 'opt-communaute',
    label: 'Communauté, parrainage & progression',
    pitch: 'Rôles, paliers, fréquences gagnées, kit de partage et liens de parrainage tracés.',
    gain: 'Un moteur de rétention et de recrutement déjà rodé sur plus de 100 marcheurs.',
    proof: 'Système de progression, affiliation, Kit Partage',
    weight: 3,
    state: 'production',
    requires: CORE,
  },

  // ——— Grille 3 · actifs de données et de connaissance
  {
    id: 'opt-referentiel',
    label: 'Référentiel des espèces & noms français',
    pitch: 'Résolution des noms scientifiques vers le nom français, déduplication, alias, cache.',
    gain: "Vos écrans parlent français partout, sans travail manuel — un actif rare et coûteux à refaire.",
    proof: 'Résolveur centralisé, composant de nom unique sur tout le site',
    weight: 4,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-observations',
    label: 'Base d\'observations & biodiversité',
    pitch: 'Observations collectées et rattachées aux lieux, fusion avec les sources citoyennes, historique.',
    gain: "Le jardin de chaque abonné est immédiatement peuplé d'espèces réelles, dès son inscription.",
    proof: 'Snapshots de biodiversité, observations marcheurs, attribution par lieu',
    weight: 4,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-corpus-sol',
    label: 'Corpus sol & plantes indicatrices',
    pitch: 'Les méthodes publiques, les fiches plantes, les tables de concordance sol-flore.',
    gain: 'Un contenu de référence prêt à publier, déjà indexé et structuré.',
    proof: 'Méthodes publiques, fiches plantes indicatrices, échelles de concordance',
    weight: 3,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-connaissance',
    label: 'Connaissance de jardin validée',
    pitch: "Entretiens transcrits, extraits validés par le propriétaire, verrouillés, versionnés, opposables.",
    gain: "L'assistant ne répond plus au hasard : il s'appuie sur des faits validés et tracés.",
    proof: 'Entretien fondateur, validation carte par carte, lignes rouges',
    weight: 3,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-mesures',
    label: 'Historique des mesures capteurs',
    pitch: 'Séries temporelles des sondes, en unités normalisées, avec profils climatiques.',
    gain: 'De la donnée agronomique continue, impossible à reconstituer après coup.',
    proof: 'Mesures IoT en base, tendances 30 jours',
    weight: 2,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-contenus',
    label: 'Bibliothèque de contenus & médias',
    pitch: 'Photos de terrain, entretiens filmés, podcasts, carnets, livres vivants.',
    gain: 'De quoi alimenter le marketing et la vente dès le premier mois, sans production nouvelle.',
    proof: 'Galeries, entretiens publiés, carnets de terrain',
    weight: 3,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-analyse',
    label: 'Briques d\'analyse & de scoring',
    pitch: 'Indices de vitalité, risques, diversité, fonctions écologiques, tableaux de bord.',
    gain: 'Les chiffres qui donnent envie de revenir, et qui justifient un abonnement payant.',
    proof: 'Tableau de bord propriété, indices, fonctions écologiques',
    weight: 3,
    state: 'production',
    requires: CORE,
  },
  {
    id: 'opt-seo',
    label: 'Actifs SEO / GEO & pages publiques',
    pitch: 'Catalogue de pages publiques, données structurées, plan de site, fichier de lecture pour les assistants.',
    gain: "Une visibilité déjà acquise, transférable, qui coûte des mois à reconstruire.",
    proof: 'Page pilier Fréquence Jardin, satellites, sitemap, llms.txt',
    weight: 2,
    state: 'production',
    requires: CORE,
  },
];

export const CONFIG_GRIDS: ConfigGrid[] = [
  {
    id: 'technique',
    number: '01',
    label: "L'Usine Tech",
    tagline: 'Par brique technique',
    audience: 'Pour qui regarde ce qui tourne : direction technique, développeurs.',
    optionIds: [
      'opt-socle',
      'opt-donnees',
      'opt-assistant',
      'opt-backoffice',
      'opt-crm',
      'opt-marketing',
      'opt-recherche',
      'opt-exports',
      'opt-supervision',
      'opt-mobile',
    ],
  },
  {
    id: 'usage',
    number: '02',
    label: 'Le parcours du jardinier',
    tagline: "Par valeur d'usage",
    audience: 'Pour qui vend et anime : produit, marketing, pédagogie.',
    optionIds: [
      'opt-portrait',
      'opt-sol',
      'opt-palette',
      'opt-atelier',
      'opt-tour',
      'opt-clinique',
      'opt-capteurs',
      'opt-carnet',
      'opt-academie',
      'opt-communaute',
    ],
  },
  {
    id: 'patrimoine',
    number: '03',
    label: 'Le patrimoine',
    tagline: 'Par actif de données et de connaissance',
    audience: 'Pour qui signe : direction, juriste — ce que VDTP achète réellement.',
    optionIds: [
      'opt-referentiel',
      'opt-observations',
      'opt-corpus-sol',
      'opt-connaissance',
      'opt-mesures',
      'opt-contenus',
      'opt-analyse',
      'opt-seo',
    ],
  },
];

export interface ConfigPreset {
  id: 'socle' | 'recommande' | 'integral';
  label: string;
  hint: string;
  optionIds: string[];
}

const ALL_IDS = CONFIG_OPTIONS.map((o) => o.id);

export const CONFIG_PRESETS: ConfigPreset[] = [
  {
    id: 'socle',
    label: 'Socle seul',
    hint: 'Le strict minimum technique',
    optionIds: ['opt-socle'],
  },
  {
    id: 'recommande',
    label: 'Recommandé',
    hint: "Le cœur jardin : l'offre que nous proposons",
    optionIds: ['opt-socle', 'opt-donnees', 'opt-assistant', 'opt-portrait', 'opt-sol', 'opt-seo'],
  },
  {
    id: 'integral',
    label: 'Intégral',
    hint: 'Tout le patrimoine, sans réserve',
    optionIds: ALL_IDS,
  },
];

export const OPTION_BY_ID = new Map(CONFIG_OPTIONS.map((o) => [o.id, o]));
export const TOTAL_WEIGHT = CONFIG_OPTIONS.reduce((s, o) => s + o.weight, 0);

/** Rappel du devis de prestation, distinct de la valorisation du socle. */
export const PRESTATION = {
  days: 36,
  amount: 36000,
  label: 'Prestation de développement « Usine Tech + Jardin nourricier »',
};
