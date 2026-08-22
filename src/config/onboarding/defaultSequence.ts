
import { isBalconPersona, isEntreprise, type Persona } from './personas';
import type { Answers, OnboardingQuestion, OnboardingSequence } from './schema';

/** Priorités alimentaires : elles déclenchent récolte et envies. */
const PRIORITES_ALIMENTAIRES = ['legumes_famille', 'autonomie', 'fruits_peu_temps', 'production_familiale'];

const veutManger = (a: Answers, persona: Persona) =>
  !isEntreprise(persona) && PRIORITES_ALIMENTAIRES.includes(String(a.priorite ?? ''));

const hoursLabel = (v: number) => {
  if (v <= 0.5) return 'Une petite demi-heure, à peine un passage';
  if (v <= 2) return `Environ ${v} h, le temps d’un samedi matin`;
  if (v <= 5) return `${v} h par semaine, le jardin avance vraiment`;
  if (v <= 10) return `${v} h par semaine, un vrai rendez-vous`;
  return `${v} h et plus : le jardin devient une pratique`;
};

const monthLabel = (v: number) => {
  if (v <= 2) return 'Un point de suivi rapide chaque mois';
  if (v <= 6) return `${v} h par mois, le projet est accompagné`;
  if (v <= 16) return `${v} h par mois, une vraie régie du site`;
  return `${v} h par mois : un poste dédié se dessine`;
};

const surfaceLabel = (v: number) => {
  if (v < 3) return 'Un rebord, quelques pots';
  if (v < 10) return 'Un balcon confortable';
  if (v < 30) return 'Une vraie terrasse';
  return 'Une grande terrasse, presque un jardin';
};

const peopleLabel = (v: number) => {
  if (v <= 2) return 'Deux assiettes, on vise la qualité';
  if (v <= 6) return `${v} personnes, une tablée de famille`;
  if (v <= 25) return `${v} personnes, une petite cantine`;
  if (v <= 100) return `${v} personnes, un vrai service`;
  return `${v} personnes et plus : une production organisée`;
};

const FREIN_EAU = { value: 'eau', label: 'L’eau est rare ou chère' };
const FREIN_SOL = { value: 'sol_pauvre', label: 'Le sol semble pauvre ou tassé' };
const FREIN_MALADIES = { value: 'animaux', label: 'Maladies, ravageurs, animaux' };
const FREIN_VOISINAGE = { value: 'voisinage', label: 'Voisinage, règlement, copropriété' };
const FREIN_CONNAISSANCE = { value: 'connaissances', label: 'Manque de connaissances' };
const FREIN_RIEN = { value: 'aucune', label: 'Rien de particulier' };

export const DEFAULT_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'profil',
    title: 'Qui êtes-vous ?',
    subtitle: 'Pour parler juste dès le début.',
    kind: 'single',
    chapter: 'Vous',
    accent: '--primary',
    options: [
      { value: 'particulier', label: 'Un particulier', hint: 'Chez moi, pour ma famille' },
      { value: 'entreprise', label: 'Une entreprise', hint: 'Un site, des équipes, des visiteurs' },
      { value: 'collectivite', label: 'Une collectivité', hint: 'Un espace ouvert au public' },
    ],
  },
  {
    id: 'lieu',
    title: 'Où jardinez-vous ?',
    subtitle: 'Le point de départ, tout simplement.',
    kind: 'single',
    chapter: 'Votre lieu',
    accent: '--ds-forest-soft',
    options: [
      { value: 'balcon', label: 'Un balcon, une terrasse', hint: 'Quelques mètres carrés, des pots' },
      { value: 'terrain_nu', label: 'Un terrain nu', hint: 'Tout reste à imaginer' },
      { value: 'jardin_existant', label: 'Un jardin déjà en place', hint: 'Il existe, je veux le faire évoluer' },
    ],
    variants: {
      ENTREPRISE_TERRAIN: {
        title: 'Où se trouve votre projet ?',
        subtitle: 'Le point de départ du site.',
      },
      COLLECTIVITE: { title: 'Où se trouve votre projet ?' },
    },
  },
  {
    id: 'surfaces',
    title: 'Quelle surface avez-vous ?',
    subtitle: 'Une estimation suffit — vous pourrez l’ajuster plus tard.',
    kind: 'surface',
    chapter: 'Votre lieu',
    accent: '--ds-eco-texture',
    when: (_a, persona) => !isBalconPersona(persona),
    surface: { totalId: 'surface_totale', freeId: 'surface_disponible', max: 50000, default: 500, freeDefault: 150 },
  },
  {
    id: 'surface_balcon',
    title: 'Quelle place avez-vous ?',
    subtitle: 'Même trois pots suffisent pour commencer.',
    kind: 'slider',
    chapter: 'Votre lieu',
    accent: '--ds-eco-texture',
    when: (_a, persona) => isBalconPersona(persona),
    slider: { min: 1, max: 60, step: 1, default: 6, unit: 'm²', describe: surfaceLabel },
  },
  {
    id: 'style',
    title: 'Quel jardin vous fait rêver ?',
    subtitle: 'Choisissez l’image qui vous parle.',
    kind: 'gallery',
    chapter: 'Vos envies',
    accent: '--ds-verdict-oui',
    options: [
      { value: 'nourricier', label: 'Jardin nourricier', hint: 'Légumes, herbes, récoltes' },
      { value: 'verger_prairie', label: 'Verger et prairie', hint: 'Arbres fruitiers, herbes hautes' },
      { value: 'ville_bacs', label: 'Jardin de ville en bacs', hint: 'Pots, jardinières, verticalité' },
      { value: 'beaute', label: 'Jardin de beauté fleuri', hint: 'Floraisons, couleurs, parfums' },
      { value: 'mixte', label: 'Jardin mixte', hint: 'Nourricier, verger et prairie réunis' },
      { value: 'aquatique', label: 'Jardin d’eau', hint: 'Mare, berges, libellules' },
      { value: 'structure', label: 'Jardin net et structuré', hint: 'Allées nettes, formes tenues' },
    ],
    variants: {
      ENTREPRISE_TERRAIN: { title: 'Quel site vous fait rêver ?', subtitle: 'L’image qui parle à vos équipes.' },
      COLLECTIVITE: { title: 'Quel espace vous fait rêver ?', subtitle: 'L’image qui parle à vos habitants.' },
    },
  },
  {
    id: 'priorite',
    title: 'Quelle est votre priorité ?',
    subtitle: 'Une seule — c’est elle qui guidera tout le reste.',
    kind: 'single',
    chapter: 'Vos envies',
    accent: '--ds-verdict-oui',
    options: [
      { value: 'fruits_peu_temps', label: 'Des fruits, sans y passer mes journées', hint: 'Verger simple, peu d’entretien' },
      { value: 'legumes_famille', label: 'Quelques légumes pour ma famille', hint: 'Le plaisir de récolter' },
      { value: 'autonomie', label: 'Être le plus autonome possible', hint: 'Légumes et fruits toute l’année' },
      { value: 'beau_jardin', label: 'Avoir un beau jardin', hint: 'La beauté d’abord' },
    ],
    variants: {
      URBAIN_BALCON: {
        options: [
          { value: 'fruits_peu_temps', label: 'Avoir quelques arbustes fruitiers', hint: 'Petits fruits en pots' },
          { value: 'legumes_famille', label: 'Avoir quelques légumes et aromatiques', hint: 'De quoi cuisiner frais' },
          { value: 'beau_jardin', label: 'Avoir de belles plantes', hint: 'La beauté avant tout' },
          { value: 'climatiser', label: 'Climatiser mon balcon', hint: 'Les plantes rafraîchissent l’atmosphère' },
        ],
      },
      PARTICULIER_GRAND: {
        options: [
          { value: 'biodiversite', label: 'Enrichir la biodiversité', hint: 'Faire revenir le vivant' },
          { value: 'agroecologie', label: 'Déployer un projet agroécologique', hint: 'Un système complet, pensé long terme' },
          { value: 'legumes_famille', label: 'Une production familiale, fruits et légumes', hint: 'Nourrir la maisonnée' },
          { value: 'terroir', label: 'Conserver une production de terroir', hint: 'Variétés et usages locaux' },
        ],
      },
      ENTREPRISE_TERRAIN: {
        title: 'Quelle est la priorité du site ?',
        options: [
          { value: 'biodiversite', label: 'Enrichir la biodiversité', hint: 'Un site vivant, mesurable' },
          { value: 'agroecologie', label: 'Déployer un projet agroécologique', hint: 'Un système complet, pensé long terme' },
          { value: 'legumes_famille', label: 'Une production pour nos équipes', hint: 'Fruits et légumes sur site' },
          { value: 'terroir', label: 'Conserver une production de terroir', hint: 'Variétés et usages locaux' },
        ],
      },
    },
  },
  {
    id: 'amenagements',
    title: 'Confirmez les espaces que vous souhaitez',
    subtitle: 'Plusieurs réponses possibles.',
    kind: 'tiles',
    chapter: 'Vos envies',
    accent: '--ds-eco-eau',
    options: [
      { value: 'mare', label: 'Une mare', icon: 'mare' },
      { value: 'carre_legumes', label: 'Un carré de légumes', icon: 'carre' },
      { value: 'serre', label: 'Une serre', icon: 'serre' },
      { value: 'verger', label: 'Un verger', icon: 'arbre' },
      { value: 'beaute', label: 'Un bel espace fleuri', icon: 'fleur' },
      { value: 'repas', label: 'Un coin repas à l’ombre', icon: 'repas' },
      { value: 'ruches', label: 'Des ruches, des abris', icon: 'ruche' },
    ],
    variants: {
      URBAIN_BALCON: {
        options: [
          { value: 'jardiniere_legumes', label: 'Jardinière de légumes', icon: 'carre' },
          { value: 'jardiniere_fruits', label: 'Jardinière de petits fruits', icon: 'fruit' },
          { value: 'arbustes_pots', label: 'Arbustes en pots', icon: 'arbre' },
          { value: 'aromatiques_pots', label: 'Aromatiques', icon: 'herbe' },
          { value: 'grimpantes_nourricieres', label: 'Grimpantes nourricières', icon: 'fruit' },
          { value: 'grimpantes_ornementales', label: 'Grimpantes ornementales', icon: 'fleur' },
        ],
      },
    },
  },
  {
    id: 'recolte_periode',
    title: 'Quand voulez-vous récolter ?',
    subtitle: 'Le calendrier change complètement le jardin.',
    kind: 'single',
    chapter: 'Vos envies',
    accent: '--ds-verdict-oui',
    when: veutManger,
    options: [
      { value: 'toute_annee', label: 'Toute l’année', hint: 'Y compris l’hiver, avec des légumes rustiques' },
      { value: 'ete', label: 'Surtout l’été', hint: 'Tomates, courgettes, salades de saison' },
      { value: 'hors_ete', label: 'Hors de l’été', hint: 'Je suis souvent absent l’été' },
    ],
  },
  {
    id: 'envies',
    title: 'Qu’avez-vous envie de manger ?',
    subtitle: 'Plusieurs réponses — on partira de vos goûts.',
    kind: 'tiles',
    chapter: 'Vos envies',
    accent: '--ds-eco-nutri',
    when: veutManger,
    options: [
      { value: 'tomates', label: 'Tomates, poivrons, aubergines', icon: 'tomate' },
      { value: 'salades', label: 'Salades, feuilles', icon: 'salade' },
      { value: 'racines', label: 'Carottes, pommes de terre', icon: 'racine' },
      { value: 'petits_fruits', label: 'Fraises, petits fruits', icon: 'fruit' },
      { value: 'fruitiers', label: 'Fruits d’arbres', icon: 'arbre' },
      { value: 'aromatiques', label: 'Aromatiques', icon: 'herbe' },
      { value: 'fleurs', label: 'Fleurs comestibles', icon: 'fleur' },
    ],
  },
  {
    id: 'nb_personnes',
    title: 'Combien de personnes souhaitez-vous nourrir ?',
    subtitle: 'C’est ce chiffre qui dimensionne les surfaces.',
    kind: 'slider',
    chapter: 'Vos envies',
    accent: '--ds-eco-nutri',
    personas: ['PARTICULIER_GRAND', 'ENTREPRISE_TERRAIN', 'COLLECTIVITE'],
    slider: { min: 1, max: 200, step: 1, default: 4, unit: 'personnes', describe: peopleLabel },
  },
  {
    id: 'temps',
    title: 'Combien de temps par semaine ?',
    subtitle: 'Soyez honnête, le jardin s’y adaptera.',
    kind: 'slider',
    chapter: 'Vos moyens',
    accent: '--ds-eco-ph',
    personas: ['URBAIN_BALCON', 'PARTICULIER_PETIT', 'PARTICULIER_GRAND'],
    slider: { min: 0.5, max: 15, step: 0.5, default: 2, unit: 'h / semaine', describe: hoursLabel },
  },
  {
    id: 'temps_mois',
    title: 'Combien de temps par mois pour suivre le projet ?',
    subtitle: 'Le temps réellement disponible, pas le temps rêvé.',
    kind: 'slider',
    chapter: 'Vos moyens',
    accent: '--ds-eco-ph',
    personas: ['ENTREPRISE_URBAINE', 'ENTREPRISE_TERRAIN', 'COLLECTIVITE'],
    slider: { min: 1, max: 40, step: 1, default: 8, unit: 'h / mois', describe: monthLabel },
  },
  {
    id: 'experience',
    title: 'Où en êtes-vous ?',
    subtitle: 'Aucun niveau n’est un mauvais niveau.',
    kind: 'single',
    chapter: 'Vos moyens',
    accent: '--ds-eco-ph',
    options: [
      { value: 'debutant', label: 'Je débute complètement' },
      { value: 'tatonne', label: 'Je tâtonne, j’ai déjà essayé' },
      { value: 'a_laise', label: 'Je suis à l’aise' },
      { value: 'chevronne', label: 'Je jardine depuis longtemps' },
    ],
    variants: {
      PARTICULIER_GRAND: {
        options: [
          { value: 'debutant', label: 'Je débute complètement' },
          { value: 'tatonne', label: 'Je tâtonne, j’ai déjà essayé' },
          { value: 'a_laise', label: 'Je suis à l’aise, ou le personnel en charge l’est' },
          { value: 'chevronne', label: 'J’ai déjà un beau jardin depuis plusieurs années' },
        ],
      },
      ENTREPRISE_TERRAIN: {
        title: 'Où en êtes-vous ?',
        subtitle: 'L’expérience de vos équipes, telle qu’elle est.',
        options: [
          { value: 'debutant', label: 'Nous débutons complètement' },
          { value: 'tatonne', label: 'Nous tâtonnons, nous avons déjà essayé' },
          { value: 'a_laise', label: 'Nous avons un personnel à l’aise' },
          { value: 'chevronne', label: 'Nous avons déjà un beau jardin depuis plusieurs années' },
        ],
      },
    },
  },
  {
    id: 'irrigation',
    title: 'Pouvez-vous arroser ?',
    subtitle: 'L’eau décide de beaucoup de choses.',
    kind: 'single',
    chapter: 'Votre lieu',
    accent: '--ds-eco-eau',
    options: [
      { value: 'reseau', label: 'Oui, j’ai l’eau du réseau' },
      { value: 'pompe', label: 'Oui, un accès illimité par une pompe' },
      { value: 'puits', label: 'Mare, puits ou récupération, en quantité limitée' },
      { value: 'aucune', label: 'Non, rien à proximité' },
      { value: 'inconnu', label: 'Je ne sais pas' },
    ],
    variants: {
      URBAIN_BALCON: {
        options: [
          { value: 'reseau', label: 'J’ai déjà un robinet sur le balcon ou à proximité' },
          { value: 'puits', label: 'J’ai la possibilité de récupérer l’eau du toit' },
          { value: 'arrosoir', label: 'Non, je le ferai à l’arrosoir' },
        ],
      },
    },
  },
  {
    id: 'exposition',
    title: 'Combien de soleil ?',
    subtitle: 'Regardez votre espace en milieu de journée.',
    kind: 'single',
    chapter: 'Votre lieu',
    accent: '--ds-eco-nutri',
    options: [
      { value: 'plein_soleil', label: 'Plein soleil', hint: 'Plus de 6 h de lumière directe' },
      { value: 'mi_ombre', label: 'Mi-ombre', hint: 'Soleil une partie de la journée' },
      { value: 'ombre', label: 'Assez ou très ombragé', hint: 'Peu de soleil direct' },
      { value: 'inconnu', label: 'Je ne sais pas encore', hint: 'On l’observera ensemble' },
    ],
  },
  {
    id: 'contraintes',
    title: 'Qu’est-ce qui vous freine ?',
    subtitle: 'Plusieurs réponses possibles.',
    kind: 'multi',
    chapter: 'Vos moyens',
    accent: '--ds-earth',
    options: [
      FREIN_EAU,
      FREIN_SOL,
      FREIN_MALADIES,
      FREIN_VOISINAGE,
      { value: 'pente', label: 'Pente, vent, accès ou exposition difficile' },
      FREIN_CONNAISSANCE,
      FREIN_RIEN,
    ],
    variants: {
      URBAIN_BALCON: {
        options: [
          FREIN_EAU,
          FREIN_MALADIES,
          FREIN_VOISINAGE,
          { value: 'pente', label: 'Vent, exposition difficile' },
          FREIN_CONNAISSANCE,
          FREIN_RIEN,
        ],
      },
    },
  },
  {
    id: 'budget',
    title: 'Que souhaitez-vous investir ?',
    subtitle: 'Pour ne vous proposer que des gestes réalistes.',
    kind: 'single',
    chapter: 'Vos moyens',
    accent: '--ds-earth',
    options: [
      { value: '50', label: 'Environ 50 €', hint: 'Des graines, du paillage, mes mains' },
      { value: '500', label: 'Environ 500 €', hint: 'Quelques plants, des outils, un récupérateur' },
      { value: '2500', label: 'Environ 2 500 €', hint: 'Un aménagement structurant' },
    ],
    variants: {
      URBAIN_BALCON: {
        options: [
          { value: '50', label: 'Environ 50 €', hint: 'Des graines, du terreau, mes mains' },
          { value: '500', label: 'Environ 500 €', hint: 'Bacs, plants, arrosage malin' },
          { value: '5000', label: 'Environ 5 000 €', hint: 'Un balcon entièrement aménagé' },
          { value: 'illimite', label: 'Sans limite, tant que cela me ressemble' },
        ],
      },
      PARTICULIER_GRAND: {
        options: [
          { value: '50', label: 'Environ 50 €', hint: 'Des graines, du paillage, mes mains' },
          { value: '500', label: 'Environ 500 €', hint: 'Quelques plants, des outils, un récupérateur' },
          { value: '5000', label: 'Environ 5 000 €', hint: 'Serre, mare, arbres, aménagements' },
          { value: 'illimite', label: 'Sans limite, tant que cela me ressemble' },
        ],
      },
      ENTREPRISE_TERRAIN: {
        title: 'Quel budget pouvez-vous engager ?',
        options: [
          { value: '2000', label: 'Environ 2 000 €', hint: 'Une première amorce sur site' },
          { value: '5000', label: 'Environ 5 000 €', hint: 'Un espace pilote complet' },
          { value: '10000', label: 'Environ 10 000 €', hint: 'Plusieurs espaces, avec suivi' },
          { value: '20000plus', label: 'Plus de 20 000 €', hint: 'Un projet de site à part entière' },
        ],
      },
    },
  },
];

export const DEFAULT_SEQUENCE: OnboardingSequence = {
  version: 3,
  label: 'Séquence par défaut — personae 2026',
  questions: DEFAULT_QUESTIONS,
};
