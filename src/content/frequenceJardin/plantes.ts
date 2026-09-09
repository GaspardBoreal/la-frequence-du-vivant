/**
 * Pages « une plante spontanée, un message ».
 *
 * Les quatre indices affichés ne sont jamais réécrits ici : ils sont lus dans
 * `PLANT_INDICATORS` (src/lib/plantIndicatorKb.ts), la base utilisée par
 * l'application. Ce fichier ne porte que la mise en mots.
 */

import { PLANT_INDICATORS, type PlantIndicator } from '@/lib/plantIndicatorKb';
import type { FjQuestion } from '@/content/frequenceJardin/guides';

export interface FjPlantPage {
  /** Identifiant dans PLANT_INDICATORS. */
  kbId: string;
  slug: string;
  metaTitle: string;
  description: string;
  h1: string;
  answer: string;
  intro: string;
  /** Ce qu'il est raisonnable de faire ensuite — jamais une promesse de rendement. */
  suites: string[];
  questions: FjQuestion[];
}

export const FJ_PLANTS: FjPlantPage[] = [
  {
    kbId: 'ortie',
    slug: 'ortie-que-dit-elle-du-sol',
    metaTitle: 'Ortie dans le jardin : que dit-elle du sol ?',
    description:
      "Une ortie installée signale un sol très riche en azote, plutôt frais et légèrement basique. Lecture de ses quatre indices et ce qu'il est raisonnable d'en conclure.",
    h1: 'L’ortie : que dit-elle du sol de mon jardin ?',
    answer:
      "Une population d'orties dioïques (Urtica dioica) installée signale un sol très riche en azote, à tendance fraîche, plutôt argileux et légèrement basique. C'est l'indicatrice de fertilité azotée la plus nette de la table de lecture : son indice de nutrition est au maximum de l'échelle.",
    intro:
      "L'ortie ne s'installe pas au hasard : elle suit les apports organiques, les anciens tas de fumier, les abords de bâtiments d'élevage, les zones de dépôt. Là où elle prospère en peuplement dense, le sol a reçu beaucoup d'azote — souvent plus qu'un potager n'en demande.",
    suites: [
      "Vérifier l'histoire du lieu : ancien tas de compost, de fumier, de tonte, ou zone de dépôt.",
      "Ne pas ajouter d'azote sur cette zone tant que la lecture n'a pas été confirmée par les tests de sol.",
      "Croiser avec le test de la bêche : une richesse azotée sur sol tassé ne se comporte pas comme sur sol poreux.",
    ],
    questions: [
      {
        q: 'Faut-il arracher les orties ?',
        a: "Ce n'est pas une nécessité agronomique : l'ortie ne dégrade pas le sol, elle en révèle l'état, et elle abrite de nombreux insectes. La question est celle de l'usage que vous voulez faire de la zone.",
      },
      {
        q: 'Quelques pieds d’ortie suffisent-ils à conclure ?',
        a: "Non. Il faut une population installée sur une zone identifiable. Quelques pieds isolés peuvent venir d'une graine transportée.",
      },
    ],
  },
  {
    kbId: 'rumex',
    slug: 'rumex-que-dit-il-du-sol',
    metaTitle: 'Rumex dans le jardin : que dit-il du sol ?',
    description:
      "Le rumex à feuilles obtuses signale un sol riche, argileux et tassé, à tendance humide. Ses quatre indices et la lecture qui en découle.",
    h1: 'Le rumex : que dit-il du sol de mon jardin ?',
    answer:
      "Le rumex à feuilles obtuses (Rumex obtusifolius) signale un sol très riche en azote, nettement argileux et à tendance fraîche. Sa racine pivotante puissante lui permet de s'installer là où d'autres espèces butent sur un horizon compact.",
    intro:
      "Le rumex est l'indicatrice classique des sols riches et lourds, souvent tassés par le passage ou le pâturage. Sa présence pose presque toujours la question de la structure du sol autant que celle de sa richesse.",
    suites: [
      "Faire un test de la bêche à côté du pied pour vérifier la présence d'une semelle de tassement.",
      "Regarder l'eau après une pluie : une zone à rumex qui garde l'eau confirme le diagnostic de compaction.",
      "Éviter de travailler ces zones en sol détrempé, ce qui aggrave le tassement.",
    ],
    questions: [
      {
        q: 'Rumex et oseille sont-ils la même plante ?',
        a: "Non, mais ils sont du même genre. Le rumex à feuilles obtuses indique des sols riches et lourds ; la petite oseille (Rumex acetosella) indique au contraire des sols pauvres, légers et acides. Les confondre inverse complètement la lecture.",
      },
      {
        q: 'Le rumex est-il un signe de mauvais sol ?',
        a: "Non : il signale un sol riche. Ce qu'il interroge, c'est la structure — richesse et compaction vont souvent de pair sur ces terrains.",
      },
    ],
  },
  {
    kbId: 'oseille',
    slug: 'petite-oseille-sol-acide',
    metaTitle: 'Petite oseille : le signe d’un sol acide et pauvre',
    description:
      "La petite oseille (Rumex acetosella) indique un sol nettement acide, léger et pauvre. Lecture de ses indices et conséquences pour le choix des plantes.",
    h1: 'La petite oseille : le signe d’un sol acide',
    answer:
      "La petite oseille (Rumex acetosella) indique un sol nettement acide, sableux ou léger, et pauvre en éléments nutritifs. Son indice de pH est au minimum de l'échelle de lecture, au même niveau que la digitale pourpre, la fougère aigle et la bruyère.",
    intro:
      "Là où elle domine, inutile d'espérer un massif de plantes calcicoles. Cette acidité n'est pas un défaut : c'est le terrain de prédilection de toute une palette — bruyères, myrtilles, rhododendrons, châtaigniers.",
    suites: [
      "Confirmer par une mesure de pH à la bandelette, avec de l'eau déminéralisée.",
      "Faire le test du vinaigre : l'absence d'effervescence confirme un sol décarbonaté.",
      "Chercher les autres acidiphiles alentour — digitale, fougère aigle, bruyère, genêt — pour valider la convergence.",
    ],
    questions: [
      {
        q: 'Faut-il chauler pour corriger l’acidité ?',
        a: "Chauler infléchit le pH temporairement et localement, jamais durablement sur un jardin entier. Choisir des plantes adaptées à l'acidité mesurée est plus économe et plus stable.",
      },
    ],
  },
  {
    kbId: 'joncs',
    slug: 'joncs-sol-humide-engorge',
    metaTitle: 'Joncs dans le jardin : un sol humide ou engorgé',
    description:
      "Les joncs signalent un sol très humide, argileux et souvent engorgé une partie de l'année. Lecture des indices et vérifications à faire avant de planter.",
    h1: 'Les joncs : un sol humide, voire engorgé',
    answer:
      "Les joncs (Juncus spp.) signalent un sol très humide, à l'indice d'eau maximal de la table de lecture, et de texture argileuse. Leur présence indique une zone qui reste saturée en eau au moins une partie de l'année.",
    intro:
      "Une touffe de joncs au milieu d'une pelouse n'est pas une anomalie à traiter : c'est une carte de l'eau du terrain, dessinée par la végétation elle-même. Elle indique où planter des espèces de milieu frais — et où ne pas installer un massif méditerranéen.",
    suites: [
      "Observer la zone 24 à 48 heures après une forte pluie pour confirmer la stagnation.",
      "Faire un test de la bêche : engorgement de surface par tassement, ou nappe proche, ne se traitent pas de la même façon.",
      "Envisager d'accompagner l'humidité (plantes de sol frais) plutôt que de la combattre par un drainage systématique.",
    ],
    questions: [
      {
        q: 'Les joncs indiquent-ils toujours une nappe d’eau ?',
        a: "Pas nécessairement. Ils indiquent une saturation en eau, qui peut venir d'une nappe proche comme d'une semelle de tassement qui empêche l'infiltration. Le test de la bêche permet de distinguer les deux.",
      },
    ],
  },
  {
    kbId: 'plantain-lanceole',
    slug: 'plantain-lanceole-sol-tasse',
    metaTitle: 'Plantain lancéolé : ce qu’il révèle du sol',
    description:
      "Le plantain lancéolé occupe les sols équilibrés à tendance sèche, en particulier les zones piétinées. Lecture de ses quatre indices.",
    h1: 'Le plantain lancéolé : ce qu’il révèle du sol',
    answer:
      "Le plantain lancéolé (Plantago lanceolata) est une espèce peu exigeante : ses indices de texture, de nutrition et de pH sont neutres, seul son indice d'eau penche vers le sec. Il apporte donc peu d'information sur la richesse du sol, mais beaucoup sur son usage : il colonise les zones piétinées et compactées de surface.",
    intro:
      "C'est un bon exemple de plante à lire avec prudence : la neutralité de ses indices signifie qu'elle est indifférente à ces facteurs. Une indicatrice n'informe que là où elle est exigeante.",
    suites: [
      "Chercher les espèces plus exigeantes alentour : ce sont elles qui porteront l'information de sol.",
      "Regarder le passage : chemin de tonte, raccourci, aire de jeu — un plantain dominant cartographie souvent les usages.",
    ],
    questions: [
      {
        q: 'Pourquoi certaines plantes n’apprennent-elles presque rien ?',
        a: "Parce qu'elles sont indifférentes au facteur mesuré : leur indice vaut 0. Dans la table de lecture, ce sont les indices proches de -3 ou +3 qui portent l'information forte.",
      },
    ],
  },
];

export const FJ_PLANT_MAP: Record<string, FjPlantPage> = FJ_PLANTS.reduce((acc, p) => {
  acc[p.slug] = p;
  return acc;
}, {} as Record<string, FjPlantPage>);

export function getIndicator(kbId: string): PlantIndicator | undefined {
  return PLANT_INDICATORS.find((p) => p.id === kbId);
}

const SCALES: Record<'eau' | 'texture' | 'nutri' | 'ph', Record<number, string>> = {
  eau: {
    [-3]: 'très sec',
    [-2]: 'sec',
    [-1]: 'plutôt sec',
    0: 'indifférent',
    1: 'frais',
    2: 'humide',
    3: 'très humide',
  },
  texture: {
    [-3]: 'sable',
    [-2]: 'sableux à limoneux',
    [-1]: 'léger',
    0: 'indifférent',
    1: 'tendance argileuse',
    2: 'argileux',
    3: 'argile lourde',
  },
  nutri: {
    [-3]: 'très pauvre',
    [-2]: 'pauvre',
    [-1]: 'peu riche',
    0: 'indifférent',
    1: 'moyennement riche',
    2: 'riche',
    3: 'très riche (azote)',
  },
  ph: {
    [-3]: 'très acide',
    [-2]: 'acide',
    [-1]: 'légèrement acide',
    0: 'indifférent',
    1: 'légèrement basique',
    2: 'calcaire',
    3: 'très calcaire',
  },
};

export const AXES: { key: 'eau' | 'texture' | 'nutri' | 'ph'; label: string }[] = [
  { key: 'eau', label: 'Eau' },
  { key: 'texture', label: 'Texture' },
  { key: 'nutri', label: 'Nutrition' },
  { key: 'ph', label: 'pH' },
];

export function axisLabel(axis: 'eau' | 'texture' | 'nutri' | 'ph', value: number): string {
  return SCALES[axis][value] ?? 'indifférent';
}
