
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
    coordonnees: [44.9167, -0.4167],
    latitude: 44.9167,
    longitude: -0.4167,
    temperature: 18,
    meteo: "Nuageux",
    lexique: "pont, modernité, Isle, reconstruction, exploration",
    audioFile: "https://example.com/audio/saint-denis-de-pile.mp3",
    nomMarche: "Marche du Pont Saint-Denis",
    adresse: "Saint-Denis-de-Pile, Gironde",
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
  // ... autres marches peuvent être ajoutées ici
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
