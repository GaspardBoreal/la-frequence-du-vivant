import gaspardRaw from './gaspard-boreal.md?raw';
import laurentMarchesRaw from './laurent-tripied-marches.md?raw';
import laurentPiloterraRaw from './laurent-tripied-piloterra.md?raw';

import gaspardPortrait from '@/assets/entretiens/gaspard-boreal.png.asset.json';
import laurentPortrait from '@/assets/entretiens/laurent-tripied.jpg.asset.json';
import victorPortrait from '@/assets/entretiens/victor-boixeda.jpg.asset.json';

export const SITE_ORIGIN = 'https://la-frequence-du-vivant.com';
export const ENTRETIENS_URL = `${SITE_ORIGIN}/entretiens`;

export interface EntretienPerson {
  name: string;
  role: string;
  /** Profils et sites officiels — alimente le nœud Person / sameAs. */
  sameAs: string[];
  portraitUrl?: string;
  portraitAlt?: string;
  /** true quand l'image n'est pas un portrait photographique (œuvre, symbole). */
  portraitIsArtwork?: boolean;
}

export interface Entretien {
  slug: string;
  /** Titre H1, formulé en question. */
  title: string;
  /** <title> de la page, < 60 caractères si possible. */
  seoTitle: string;
  seoDescription: string;
  chapo: string;
  person: EntretienPerson;
  /** Interviewer qui a mené l'entretien (mention discrète, crédit éditorial). */
  interviewer?: EntretienPerson;
  publishedAt: string;
  updatedAt: string;
  /** Faits courts et citables, extraits du texte — bloc « À retenir ». */
  keyPoints: string[];
  /** Entités nommées dans l'entretien (SEO/GEO). */
  entities: string[];
  /** Liens internes contextuels. */
  internalLinks: { label: string; to: string }[];
  externalLinks?: { label: string; href: string }[];
  related: string[];
  /** Corps Markdown, questions incluses. */
  body: string;
  /** Sommaire des questions. */
  questions: { text: string; anchor: string }[];
  /** true quand l'entretien est publié en intégral ailleurs (canonical externe). */
  canonicalOverride?: string;
  status: 'published' | 'a-venir';
}

export const slugifyAnchor = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[*_`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70);

/** Sépare le chapô (avant la ligne `---`) du corps Q/R. */
const splitRaw = (raw: string) => {
  const lines = raw.split('\n');
  const sep = lines.findIndex((l) => l.trim() === '---');
  const head = (sep >= 0 ? lines.slice(0, sep) : lines).filter((l) => !l.startsWith('# '));
  const body = sep >= 0 ? lines.slice(sep + 1) : [];
  return { chapo: head.join('\n').trim(), body: body.join('\n').trim() };
};

const extractQuestions = (body: string) =>
  body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^\*\*.+\?\*\*$/.test(l))
    .map((l) => {
      const text = l.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\*/g, '');
      return { text, anchor: slugifyAnchor(text) };
    });

const build = (
  meta: Omit<Entretien, 'body' | 'chapo' | 'questions'>,
  raw: string,
): Entretien => {
  const { chapo, body } = splitRaw(raw);
  return { ...meta, chapo, body, questions: extractQuestions(body) };
};

const GASPARD: EntretienPerson = {
  name: 'Gaspard Boréal',
  role: "Auteur, créateur de La Fréquence du Vivant",
  sameAs: ['https://www.gaspardboreal.com'],
  portraitUrl: gaspardPortrait.url,
  portraitAlt: "Œuvre associée à Gaspard Boréal : deux coffrets de bois portant chacun une plume",
  portraitIsArtwork: true,
};

const LAURENT: EntretienPerson = {
  name: 'Laurent Tripied',
  role: "Président de La Fréquence du Vivant, dirigeant de bziiit et de PiloTerra",
  sameAs: ['https://piloterra.fr', 'https://bziiit.com'],
  portraitUrl: laurentPortrait.url,
  portraitAlt: 'Portrait de Laurent Tripied, président de La Fréquence du Vivant',
};

const LAURENCE: EntretienPerson = {
  name: 'Laurence Karki',
  role: "Vice-présidente et ambassadrice de La Fréquence du Vivant",
  sameAs: [],
};

const VICTOR: EntretienPerson = {
  name: 'Victor Boixeda',
  role: "Responsable des relations publiques de La Fréquence du Vivant",
  sameAs: [],
  portraitUrl: victorPortrait.url,
  portraitAlt: 'Portrait de Victor Boixeda, responsable des relations publiques',
};

const BZIIIT: EntretienPerson = {
  name: 'bziiit',
  role: "Entreprise d'intelligence artificielle responsable, soutien de La Fréquence du Vivant",
  sameAs: ['https://bziiit.com'],
};

export const entretiens: Entretien[] = [
  build(
    {
      slug: 'gaspard-boreal-naissance-la-frequence-du-vivant',
      title: 'Comment est née La Fréquence du Vivant ? Entretien avec Gaspard Boréal',
      seoTitle: 'Naissance de La Fréquence du Vivant — Gaspard Boréal',
      seoDescription:
        "Gaspard Boréal, auteur et créateur de La Fréquence du Vivant, raconte la remontée de la Dordogne, la géopoétique japonaise et le passage d'un travail d'auteur à une aventure collective.",
      person: GASPARD,
      interviewer: VICTOR,
      publishedAt: '2026-08-25',
      updatedAt: '2026-08-25',
      keyPoints: [
        "La Fréquence du Vivant est née d'une remontée à pied de la rivière Dordogne, du Bec d'Ambès au Mont-Dore, pendant deux semaines.",
        "Le nom vient de l'idée que tout le vivant émet une onde, d'un ver de terre à un arbre, y compris hors du champ de l'oreille humaine.",
        "Le projet s'appuie sur la géopoétique japonaise : le Ginkō « marche poétique » du XIIième siècle, le kigo, le mot de saison, et le haïku, tradition de marche et d'écriture remontant à Bashō.",
        "Il prolonge La Confession muette, recueil consacré à la créativité face aux limites planétaires.",
        "Gaspard Boréal est l'auteur et le créateur du projet ; la structuration associative et le dispositif des Marches du Vivant sont portés par Laurent Tripied et Laurence Karki.",
      ],
      entities: [
        'Fréquences de la rivière Dordogne',
        'La Confession muette',
        'La Comédie des Mondes Hybrides',
        'Dordogne',
        "Bec d'Ambès",
        'Mont-Dore',
        'géopoétique japonaise',
        'haïku',
        'kigo',
      ],
      internalLinks: [
        { label: 'Bioacoustique poétique', to: '/bioacoustique-poetique' },
        { label: 'Dordonia, constitution poétique d’un bassin-versant', to: '/dordonia' },
        { label: 'Galerie Fleuve, le livre vivant', to: '/galerie-fleuve' },
      ],
      externalLinks: [{ label: 'gaspardboreal.com', href: 'https://www.gaspardboreal.com' }],
      related: [
        'laurent-tripied-marches-du-vivant-frequence-jardin',
        'laurence-karki-animer-communaute-vivant',
      ],
      status: 'published',
    },
    gaspardRaw,
  ),

  build(
    {
      slug: 'laurent-tripied-marches-du-vivant-frequence-jardin',
      title: 'Pourquoi créer Les Marches du Vivant et Fréquence Jardin ? Entretien avec Laurent Tripied',
      seoTitle: 'Les Marches du Vivant et Fréquence Jardin — Laurent Tripied',
      seoDescription:
        "Laurent Tripied, président de La Fréquence du Vivant, détaille le protocole des Marches du Vivant, la gamification, les acteurs qui y font appel, et le dispositif Fréquence Jardin.",
      person: LAURENT,
      publishedAt: '2026-08-25',
      updatedAt: '2026-08-25',
      keyPoints: [
        "Une Marche du Vivant est un protocole d'au moins trois heures, préparé par des ambassadeurs formés à la biodiversité, à la bioacoustique et au sol.",
        "La bioacoustique permet d'identifier des espèces difficiles à observer : jusqu'à 26 espèces d'oiseaux relevées simultanément sur un même lieu.",
        "Les observations sont validées par la communauté et produisent de la donnée au format GBIF.",
        "Collectivités, domaines viticoles, coopératives agricoles et entreprises font appel aux Marches du Vivant.",
        "Fréquence Jardin applique aux jardins particuliers et aux entreprises la mesure de biodiversité, l'analyse de sol et l'intelligence artificielle frugale.",
      ],
      entities: [
        'Les Marches du Vivant',
        'Fréquence Jardin',
        'GBIF',
        'iNaturalist',
        'ambassadeurs',
        'sentinelles',
        'analyse de sol',
        'intelligence artificielle frugale',
      ],
      internalLinks: [
        { label: 'Les Marches du Vivant', to: '/marches-du-vivant' },
        { label: 'Marches du Vivant pour les entreprises', to: '/marches-du-vivant/entreprises' },
        { label: 'Fréquence Jardin — fiche application', to: '/roadmap/frequence-jardin' },
        { label: "L'étude de sol vivante", to: '/etude-de-sol' },
      ],
      related: [
        'piloterra-open-source-biodiversite',
        'gaspard-boreal-naissance-la-frequence-du-vivant',
      ],
      status: 'published',
    },
    laurentMarchesRaw,
  ),

  build(
    {
      slug: 'piloterra-open-source-biodiversite',
      title: 'Open source et biodiversité : pourquoi La Fréquence du Vivant publie ses travaux sur PiloTerra',
      seoTitle: 'Open source et biodiversité : La Fréquence du Vivant sur PiloTerra',
      seoDescription:
        "Laurent Tripied explique PiloTerra, plateforme d'IA frugale pour le monde agricole, et pourquoi la brique open source des Marches du Vivant y est diffusée.",
      person: LAURENT,
      publishedAt: '2026-08-25',
      updatedAt: '2026-08-25',
      keyPoints: [
        "PiloTerra est une plateforme d'intelligence artificielle frugale destinée au monde agricole au sens large, y compris assurance, banque, bureaux d'études et laboratoires.",
        "L'utilisateur soumet un défi, le transforme en cas d'usage, et la plateforme génère l'application en assemblant des briques open source.",
        "PiloTerra n'est pas un dépôt statique : la brique Les Marches du Vivant n'est embarquée que lorsque le problème posé concerne la biodiversité.",
        "Chercheurs, associations naturalistes, foncières immobilières et coopératives agricoles sont les premiers bénéficiaires.",
        "Les données produites sont validées par la communauté et publiées au format GBIF.",
      ],
      entities: ['PiloTerra', 'bziiit', 'GBIF', 'iNaturalist', 'Lexicone', 'Westfarm', 'open data'],
      internalLinks: [
        { label: "Agent IA « Les Marches du Vivant »", to: '/agent-ia' },
        { label: 'Les Marches du Vivant', to: '/marches-du-vivant' },
      ],
      externalLinks: [
        { label: 'Fiche PiloTerra de l’agent', href: 'https://piloterra.fr/agents/les-marches-du-vivant' },
        { label: 'piloterra.fr', href: 'https://piloterra.fr' },
      ],
      related: [
        'laurent-tripied-marches-du-vivant-frequence-jardin',
        'bziiit-intelligence-artificielle-responsable-biodiversite',
      ],
      status: 'published',
    },
    laurentPiloterraRaw,
  ),

  // Entretiens annoncés, textes en cours de relecture.
  {
    slug: 'laurence-karki-animer-communaute-vivant',
    title: 'Comment animer une communauté autour du vivant ? Entretien avec Laurence Karki',
    seoTitle: 'Animer une communauté autour du vivant — Laurence Karki',
    seoDescription:
      "Laurence Karki, vice-présidente de La Fréquence du Vivant, sur l'animation d'une communauté de marcheurs et le parcours vers le rôle d'ambassadrice.",
    chapo:
      "Vice-présidente et ambassadrice de La Fréquence du Vivant, Laurence Karki revient sur l'animation d'un collectif hétérogène, l'accueil des marcheurs sans connaissance naturaliste, et le chemin qui mène du statut de marcheur à celui d'ambassadeur.",
    person: LAURENCE,
    publishedAt: '2026-09-08',
    updatedAt: '2026-08-25',
    keyPoints: [],
    entities: ['ressources humaines', 'La Comédie des Mondes Hybrides', 'ambassadeur', 'sentinelle'],
    internalLinks: [{ label: 'Association La Fréquence du Vivant', to: '/marches-du-vivant/association' }],
    related: ['gaspard-boreal-naissance-la-frequence-du-vivant'],
    body: '',
    questions: [],
    status: 'a-venir',
  },
  {
    slug: 'victor-boixeda-huit-mois-marches-du-vivant',
    title: 'Huit mois avec Les Marches du Vivant : le retour d’expérience de Victor Boixeda',
    seoTitle: 'Huit mois avec Les Marches du Vivant — Victor Boixeda',
    seoDescription:
      "Victor Boixeda, étudiant en communication et responsable des relations publiques, raconte huit mois au sein d'un projet de science participative.",
    chapo:
      "Étudiant en communication et responsable des relations publiques de La Fréquence du Vivant, Victor Boixeda revient sur huit mois de terrain, de rencontres avec les domaines viticoles, les entreprises et les collectivités.",
    person: VICTOR,
    publishedAt: '2026-09-22',
    updatedAt: '2026-08-25',
    keyPoints: [],
    entities: ['ISEG', 'relations publiques', 'science participative'],
    internalLinks: [{ label: 'Les Marches du Vivant', to: '/marches-du-vivant' }],
    related: ['laurent-tripied-marches-du-vivant-frequence-jardin'],
    body: '',
    questions: [],
    status: 'a-venir',
  },
  {
    slug: 'bziiit-intelligence-artificielle-responsable-biodiversite',
    title: 'Intelligence artificielle responsable et biodiversité : pourquoi bziiit soutient La Fréquence du Vivant',
    seoTitle: 'IA responsable et biodiversité : bziiit et La Fréquence du Vivant',
    seoDescription:
      "Pourquoi une entreprise d'intelligence artificielle responsable soutient un projet de mesure de la biodiversité : nature du soutien, principes d'IA frugale, apprentissages croisés.",
    chapo:
      "bziiit, entreprise spécialisée dans l'intelligence artificielle responsable, explique la nature de son soutien à La Fréquence du Vivant et les principes d'intelligence artificielle frugale appliqués au projet.",
    person: BZIIIT,
    publishedAt: '2026-10-06',
    updatedAt: '2026-08-25',
    keyPoints: [],
    entities: ['bziiit', 'PiloTerra', 'intelligence artificielle frugale', 'numérique responsable'],
    internalLinks: [{ label: "Agent IA « Les Marches du Vivant »", to: '/agent-ia' }],
    related: ['piloterra-open-source-biodiversite'],
    body: '',
    questions: [],
    status: 'a-venir',
  },
];

export const publishedEntretiens = entretiens.filter((e) => e.status === 'published');

export const getEntretien = (slug?: string) => entretiens.find((e) => e.slug === slug);

export const entretienUrl = (slug: string) => `${ENTRETIENS_URL}/${slug}`;

/** Rend l'entretien en Markdown autonome (téléchargement, copie pour un modèle). */
export const entretienToMarkdown = (e: Entretien) =>
  [
    `# ${e.title}`,
    '',
    e.chapo,
    '',
    `Source : ${entretienUrl(e.slug)}`,
    `Interlocuteur : ${e.person.name} — ${e.person.role}`,
    `Éditeur : association La Fréquence du Vivant`,
    `Publié le ${e.publishedAt}`,
    '',
    e.keyPoints.length ? '## À retenir\n\n' + e.keyPoints.map((k) => `- ${k}`).join('\n') + '\n' : '',
    '---',
    '',
    e.body,
  ]
    .filter(Boolean)
    .join('\n');
