
export interface MarcheTechnoSensible {
  id: string;
  ville: string;
  region: string;
  departement: string;
  theme?: string;
  descriptifCourt?: string;
  poeme?: string;
  date?: string;
  lien?: string;
  photos?: string[];
  videos?: string[];
  coordonnees?: [number, number];
  latitude: number;
  longitude: number;
  temperature?: number;
  meteo?: string;
  lexique?: string;
  audioFile?: string;
  nomMarche?: string;
  adresse?: string;
  tags?: string;
  tagsThematiques?: string[];
  sequencesSonores?: string[];
  temoignages?: Array<{
    contenu: string;
    auteur: string;
    date: string;
  }>;
  liensInternes?: Array<{
    titre: string;
    url: string;
  }>;
  liensExternes?: Array<{
    titre: string;
    url: string;
  }>;
  socialData?: {
    interactions: number;
    comments: string[];
    shares: number;
  };
}

export const marchesTechnoSensibles: MarcheTechnoSensible[] = [
  {
    id: "saint-denis-de-pile",
    ville: "Saint-Denis-de-Pile",
    region: "Nouvelle-Aquitaine",
    departement: "Gironde",
    theme: "Entre deux modernités, le pont Saint Denis de Pile",
    descriptifCourt: "Une exploration poétique du pont suspendu entre deux rives, deux époques, deux visions de l'avenir.",
    poeme: `Pas un pont. Un sur-place. Un trait d'union détraqué, suspendu comme un mot à moitié pensé. Côté Saint-Denis : le bitume mâchouille ses souvenirs, les chiens s'arrêtent, reniflent, renoncent. Côté Bonzac : les gens, les vélos, les voitures contournent, les chevreuils longent la rive.

Le pont, lui, ne relie plus. Il réfléchit. Un long soupir métallique entre deux vertébrales illusions. On parle de reconstruction. On parle de sécurité. On parle beaucoup. Le pont, lui, ne parle plus. Il attend le faux geste, l'annonce en power-point, le devis en pdf, la réunion publique bien préparée pour ne pas laisser émerger d'autres visions !

Entre deux modernités, l'Isle râpe pour l'instant ses galets. Elle sait que le futur sera un reconditionné du passé. Pas de vision. Juste un copier-coller départemental.

Alors ce matin pour tenter une exploration des possibles, je pars tôt. Sans autre raison que d'aller revoir ce pont et ses deux rives, de les interroger tous les trois avant qu'on ne les sépare.

Il est là. Dévissé d'usage mais bien là. Suspendu, il sait qu'il va disparaître. Pas pour ouvrir un autre possible, mais pour mieux faire passer les voitures. Une haie d'orties me dit bonjour, la rambarde grésille. Sous mes pas, un amas cotonneux formé par les graines des peupliers, enveloppées dans leur duvet blanc caractéristique. C'est la mue végétale du pont qui commence. Le vivant prend ses décisions plus vite que nous !

Je le questionne :
« Qui t'écoute encore, mon ami métallique ? »

J'ouvre mon app. de marcheur techno sensible. Fréquences, spectrogramme, je reconnais la signature caractéristique des lieux à forte densité de variétés d'oiseaux et, et ... détecte une fréquence inattendue ! Qu'est-ce donc ? La mémoire de son histoire me revient.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/example",
    coordonnees: [44.9039, -0.4167], // Coordonnées corrigées pour Saint-Denis-de-Pile
    latitude: 44.9039,
    longitude: -0.4167,
    temperature: 18,
    meteo: "Nuageux",
    lexique: "pont, modernité, Isle, reconstruction, exploration",
    audioFile: "https://example.com/audio/saint-denis-de-pile.mp3",
    nomMarche: "Marche du Pont Saint-Denis",
    adresse: "Saint-Denis-de-Pile, 33910 Gironde",
    tags: "pont, modernité, exploration, techno-sensible",
    tagsThematiques: ["pont", "modernité", "exploration", "techno-sensible"],
    sequencesSonores: ["https://example.com/audio/saint-denis-de-pile.mp3"],
    temoignages: [
      {
        contenu: "Une exploration fascinante des liens entre technologie et poésie",
        auteur: "Marie Dubois",
        date: "2024-01-15"
      }
    ],
    liensInternes: [
      {
        titre: "Autres marches en Gironde",
        url: "/marches/gironde"
      }
    ],
    liensExternes: [
      {
        titre: "Histoire du pont Saint-Denis",
        url: "https://example.com/pont-saint-denis"
      }
    ],
    socialData: {
      interactions: 42,
      comments: ["Très poétique", "J'adore cette approche"],
      shares: 15
    }
  },
  {
    id: "bonzac",
    ville: "BONZAC",
    region: "Nouvelle-Aquitaine",
    departement: "Gironde",
    theme: "Échos de la rive droite",
    descriptifCourt: "Exploration des résonances entre la rive de Bonzac et son environnement naturel.",
    poeme: `Bonzac, rive droite. Ici, les chevreuils longent l'eau, les vélos contournent, les voitures hésitent. La nature reprend ses droits petit à petit, comme si elle savait que le futur lui appartiendrait.

L'Isle coule, indifférente aux projets humains. Elle a vu naître et mourir tant de ponts, tant de rêves de connexion. Aujourd'hui, elle sépare encore, mais demain ?

Sur cette rive, les fréquences sont différentes. Plus végétales, plus sauvages. Les oiseaux y chantent une mélodie que l'autre rive a oubliée.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/bonzac-example",
    coordonnees: [44.9089, -0.4089],
    latitude: 44.9089,
    longitude: -0.4089,
    temperature: 19,
    meteo: "Ensoleillé",
    lexique: "nature, rive, chevreuils, Isle, végétal",
    audioFile: "https://example.com/audio/bonzac.mp3",
    nomMarche: "Marche de la Rive Droite",
    adresse: "Bonzac, 33910 Gironde",
    tags: "nature, rive, exploration, biodiversité",
    tagsThematiques: ["nature", "rive", "exploration", "biodiversité"],
    sequencesSonores: ["https://example.com/audio/bonzac.mp3"],
    temoignages: [
      {
        contenu: "Un lieu magique où la nature reprend ses droits",
        auteur: "Jean Martin",
        date: "2024-02-10"
      }
    ],
    liensInternes: [
      {
        titre: "Marche du Pont Saint-Denis",
        url: "/marche/saint-denis-de-pile"
      }
    ],
    liensExternes: [
      {
        titre: "Biodiversité de l'Isle",
        url: "https://example.com/biodiversite-isle"
      }
    ],
    socialData: {
      interactions: 28,
      comments: ["Magnifique", "J'y vais souvent"],
      shares: 12
    }
  },
  {
    id: "bordeaux-garonne",
    ville: "Bordeaux",
    region: "Nouvelle-Aquitaine",
    departement: "Gironde",
    theme: "Symphonie urbaine des quais",
    descriptifCourt: "Une déambulation techno-sensible le long des quais de Bordeaux, entre patrimoine et modernité.",
    poeme: `Les quais de Bordeaux vibrent d'une énergie particulière. Entre les pierres séculaires et les tramways modernes, une symphonie urbaine se joue.

La Garonne coule, majestueuse, portant sur ses flots les rêves d'une ville qui se réinvente sans cesse. Chaque pas sur ces quais révèle une nouvelle fréquence, un nouveau rythme.

Ici, le passé et le futur se rencontrent dans une danse éternelle.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/bordeaux-example",
    coordonnees: [44.8378, -0.5792],
    latitude: 44.8378,
    longitude: -0.5792,
    temperature: 22,
    meteo: "Partiellement nuageux",
    lexique: "quais, Garonne, urbain, patrimoine, modernité",
    audioFile: "https://example.com/audio/bordeaux.mp3",
    nomMarche: "Marche des Quais",
    adresse: "Quais de Bordeaux, 33000 Bordeaux",
    tags: "urbain, patrimoine, modernité, fleuve",
    tagsThematiques: ["urbain", "patrimoine", "modernité", "fleuve"],
    sequencesSonores: ["https://example.com/audio/bordeaux.mp3"],
    temoignages: [
      {
        contenu: "Une expérience unique au cœur de la ville",
        auteur: "Sophie Leclerc",
        date: "2024-03-05"
      }
    ],
    liensInternes: [
      {
        titre: "Autres marches en Gironde",
        url: "/marches/gironde"
      }
    ],
    liensExternes: [
      {
        titre: "Histoire des quais de Bordeaux",
        url: "https://example.com/quais-bordeaux"
      }
    ],
    socialData: {
      interactions: 76,
      comments: ["Bordeaux magnifique", "J'adore ces quais"],
      shares: 34
    }
  },
  {
    id: "libourne-dordogne",
    ville: "Libourne",
    region: "Nouvelle-Aquitaine",
    departement: "Gironde",
    theme: "Confluence des eaux et des temps",
    descriptifCourt: "Exploration poétique de la confluence entre l'Isle et la Dordogne à Libourne.",
    poeme: `À Libourne, deux rivières se rencontrent. L'Isle et la Dordogne mêlent leurs eaux, leurs histoires, leurs secrets.

Cette confluence n'est pas qu'un accident géographique. C'est un lieu de rencontre, de transformation, de métamorphose. Les eaux se mélangent, et avec elles, les mémoires du territoire.

Ici, le temps lui-même semble confluent. Le passé viticole, le présent commercial, l'avenir incertain se rencontrent dans un même mouvement aquatique.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/libourne-example",
    coordonnees: [44.9167, -0.2500],
    latitude: 44.9167,
    longitude: -0.2500,
    temperature: 20,
    meteo: "Brumeux",
    lexique: "confluence, Isle, Dordogne, rencontre, transformation",
    audioFile: "https://example.com/audio/libourne.mp3",
    nomMarche: "Marche de la Confluence",
    adresse: "Libourne, 33500 Gironde",
    tags: "confluence, rivières, transformation, mémoire",
    tagsThematiques: ["confluence", "rivières", "transformation", "mémoire"],
    sequencesSonores: ["https://example.com/audio/libourne.mp3"],
    temoignages: [
      {
        contenu: "Un lieu chargé d'histoire et de poésie",
        auteur: "Michel Durand",
        date: "2024-01-20"
      }
    ],
    liensInternes: [
      {
        titre: "Marche du Pont Saint-Denis",
        url: "/marche/saint-denis-de-pile"
      }
    ],
    liensExternes: [
      {
        titre: "Confluence Isle-Dordogne",
        url: "https://example.com/confluence-isle-dordogne"
      }
    ],
    socialData: {
      interactions: 35,
      comments: ["Lieu magique", "Très inspirant"],
      shares: 18
    }
  },
  {
    id: "arcachon-bassin",
    ville: "Arcachon",
    region: "Nouvelle-Aquitaine",
    departement: "Gironde",
    theme: "Respiration du bassin",
    descriptifCourt: "Immersion techno-sensible dans les rythmes naturels du bassin d'Arcachon.",
    poeme: `Le bassin d'Arcachon respire. À marée haute, il inspire. À marée basse, il expire. Cette respiration millénaire rythme la vie de tout un territoire.

Les huîtres filtrent, les oiseaux migrent, les promeneurs contemplent. Chaque élément de cet écosystème unique contribue à une symphonie naturelle d'une richesse inouïe.

Ici, la technologie n'est pas intrusive. Elle révèle, elle amplifie, elle sensibilise. Elle nous reconnecte à ce rythme primordial que nous avons oublié.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/arcachon-example",
    coordonnees: [44.6584, -1.1686],
    latitude: 44.6584,
    longitude: -1.1686,
    temperature: 24,
    meteo: "Ensoleillé",
    lexique: "bassin, marée, respiration, écosystème, symphonie",
    audioFile: "https://example.com/audio/arcachon.mp3",
    nomMarche: "Marche de la Respiration",
    adresse: "Bassin d'Arcachon, 33120 Arcachon",
    tags: "bassin, marée, écosystème, nature",
    tagsThematiques: ["bassin", "marée", "écosystème", "nature"],
    sequencesSonores: ["https://example.com/audio/arcachon.mp3"],
    temoignages: [
      {
        contenu: "Une expérience sensorielle exceptionnelle",
        auteur: "Claire Moreau",
        date: "2024-02-28"
      }
    ],
    liensInternes: [
      {
        titre: "Autres marches en Gironde",
        url: "/marches/gironde"
      }
    ],
    liensExternes: [
      {
        titre: "Écosystème du bassin d'Arcachon",
        url: "https://example.com/ecosysteme-arcachon"
      }
    ],
    socialData: {
      interactions: 89,
      comments: ["Magnifique bassin", "Ressourçant"],
      shares: 45
    }
  }
];

export const getMarchesTechnoSensibles = (): MarcheTechnoSensible[] => {
  return marchesTechnoSensibles;
};

export const fetchMarchesTechnoSensibles = async (): Promise<MarcheTechnoSensible[]> => {
  // Simuler un appel API asynchrone
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(marchesTechnoSensibles);
    }, 100);
  });
};

export const getMarcheTechnoSensibleById = (id: string): MarcheTechnoSensible | undefined => {
  return marchesTechnoSensibles.find(marche => marche.id === id);
};
