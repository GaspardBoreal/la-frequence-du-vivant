
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
    coordonnees: [44.9039, -0.4167],
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
  },
  {
    id: "toulouse-garonne",
    ville: "Toulouse",
    region: "Occitanie",
    departement: "Haute-Garonne",
    theme: "Ville rose et ondes numériques",
    descriptifCourt: "Exploration des fréquences urbaines dans la ville rose, entre patrimoine et innovation.",
    poeme: `Toulouse vibre d'une énergie particulière. Les briques roses reflètent les ondes numériques, créant une symphonie urbaine unique.

Entre les laboratoires et les monuments historiques, une nouvelle forme de poésie émerge. Celle qui unit l'ancien et le futur dans un même souffle créatif.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/toulouse-example",
    coordonnees: [43.6047, 1.4442],
    latitude: 43.6047,
    longitude: 1.4442,
    temperature: 21,
    meteo: "Ensoleillé",
    lexique: "ville rose, innovation, patrimoine, fréquences",
    audioFile: "https://example.com/audio/toulouse.mp3",
    nomMarche: "Marche de la Ville Rose",
    adresse: "Toulouse, 31000 Haute-Garonne",
    tags: "urbain, innovation, patrimoine, technologie",
    tagsThematiques: ["urbain", "innovation", "patrimoine", "technologie"],
    sequencesSonores: ["https://example.com/audio/toulouse.mp3"],
    temoignages: [
      {
        contenu: "Une ville qui pulse au rythme de l'innovation",
        auteur: "Pierre Durand",
        date: "2024-03-10"
      }
    ],
    liensInternes: [
      {
        titre: "Autres marches en Occitanie",
        url: "/marches/occitanie"
      }
    ],
    liensExternes: [
      {
        titre: "Innovation à Toulouse",
        url: "https://example.com/innovation-toulouse"
      }
    ],
    socialData: {
      interactions: 63,
      comments: ["Toulouse magnifique", "Ville innovante"],
      shares: 28
    }
  },
  {
    id: "pau-pyrenees",
    ville: "Pau",
    region: "Nouvelle-Aquitaine",
    departement: "Pyrénées-Atlantiques",
    theme: "Échos des Pyrénées",
    descriptifCourt: "Résonances entre la ville de Pau et les massifs pyrénéens.",
    poeme: `Pau s'étend au pied des Pyrénées, dialogue constant entre l'urbain et le sauvage.

Les montagnes renvoient les échos de la ville, créant une acoustique naturelle unique. Chaque son trouve sa résonance dans les vallées.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/pau-example",
    coordonnees: [43.2951, -0.3708],
    latitude: 43.2951,
    longitude: -0.3708,
    temperature: 16,
    meteo: "Partiellement nuageux",
    lexique: "Pyrénées, montagne, échos, résonance",
    audioFile: "https://example.com/audio/pau.mp3",
    nomMarche: "Marche des Échos",
    adresse: "Pau, 64000 Pyrénées-Atlantiques",
    tags: "montagne, échos, nature, acoustique",
    tagsThematiques: ["montagne", "échos", "nature", "acoustique"],
    sequencesSonores: ["https://example.com/audio/pau.mp3"],
    temoignages: [
      {
        contenu: "L'acoustique naturelle des Pyrénées est fascinante",
        auteur: "Marie Lacroix",
        date: "2024-02-15"
      }
    ],
    liensInternes: [
      {
        titre: "Autres marches en Nouvelle-Aquitaine",
        url: "/marches/nouvelle-aquitaine"
      }
    ],
    liensExternes: [
      {
        titre: "Acoustique des Pyrénées",
        url: "https://example.com/acoustique-pyrenees"
      }
    ],
    socialData: {
      interactions: 45,
      comments: ["Magnifique vue", "J'adore les montagnes"],
      shares: 22
    }
  },
  {
    id: "bayonne-adour",
    ville: "Bayonne",
    region: "Nouvelle-Aquitaine",
    departement: "Pyrénées-Atlantiques",
    theme: "Confluence de l'Adour et de la Nive",
    descriptifCourt: "Exploration des confluences aquatiques et culturelles de Bayonne.",
    poeme: `Bayonne, carrefour des eaux et des cultures. L'Adour et la Nive se rencontrent, mêlant leurs flots et leurs histoires.

Cette confluence n'est pas que géographique. Elle est culturelle, linguistique, humaine. Ici, les traditions basques se mêlent aux influences gasconnes.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/bayonne-example",
    coordonnees: [43.4925, -1.4751],
    latitude: 43.4925,
    longitude: -1.4751,
    temperature: 18,
    meteo: "Brumeux",
    lexique: "confluence, Adour, Nive, cultures, basque",
    audioFile: "https://example.com/audio/bayonne.mp3",
    nomMarche: "Marche des Confluences",
    adresse: "Bayonne, 64100 Pyrénées-Atlantiques",
    tags: "confluence, culture, basque, rivières",
    tagsThematiques: ["confluence", "culture", "basque", "rivières"],
    sequencesSonores: ["https://example.com/audio/bayonne.mp3"],
    temoignages: [
      {
        contenu: "Un lieu où les cultures se rencontrent harmonieusement",
        auteur: "Xabi Etxeberria",
        date: "2024-01-25"
      }
    ],
    liensInternes: [
      {
        titre: "Marche des Échos - Pau",
        url: "/marche/pau-pyrenees"
      }
    ],
    liensExternes: [
      {
        titre: "Culture basque à Bayonne",
        url: "https://example.com/culture-basque-bayonne"
      }
    ],
    socialData: {
      interactions: 52,
      comments: ["Ville authentique", "Culture riche"],
      shares: 26
    }
  },
  {
    id: "mont-de-marsan-midouze",
    ville: "Mont-de-Marsan",
    region: "Nouvelle-Aquitaine",
    departement: "Landes",
    theme: "Rythmes de la Midouze",
    descriptifCourt: "Exploration des rythmes naturels le long de la Midouze.",
    poeme: `Mont-de-Marsan, bercée par les méandres de la Midouze. Cette rivière landaise dicte son rythme à la ville.

Les pins des Landes murmurent leurs secrets au vent, créant une mélodie qui se mêle au bruit de l'eau. Ici, le temps semble suspendu entre terre et eau.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/mont-de-marsan-example",
    coordonnees: [43.8927, -0.4988],
    latitude: 43.8927,
    longitude: -0.4988,
    temperature: 19,
    meteo: "Ensoleillé",
    lexique: "Midouze, Landes, pins, rythme, méandres",
    audioFile: "https://example.com/audio/mont-de-marsan.mp3",
    nomMarche: "Marche de la Midouze",
    adresse: "Mont-de-Marsan, 40000 Landes",
    tags: "rivière, Landes, pins, nature, rythme",
    tagsThematiques: ["rivière", "Landes", "pins", "nature", "rythme"],
    sequencesSonores: ["https://example.com/audio/mont-de-marsan.mp3"],
    temoignages: [
      {
        contenu: "La Midouze a un rythme apaisant unique",
        auteur: "Jean-Luc Dubois",
        date: "2024-02-20"
      }
    ],
    liensInternes: [
      {
        titre: "Autres marches en Nouvelle-Aquitaine",
        url: "/marches/nouvelle-aquitaine"
      }
    ],
    liensExternes: [
      {
        titre: "La Midouze et ses méandres",
        url: "https://example.com/midouze-meandres"
      }
    ],
    socialData: {
      interactions: 38,
      comments: ["Rivière magnifique", "J'adore les Landes"],
      shares: 19
    }
  },
  {
    id: "biarritz-ocean",
    ville: "Biarritz",
    region: "Nouvelle-Aquitaine",
    departement: "Pyrénées-Atlantiques",
    theme: "Symphonie océanique",
    descriptifCourt: "Immersion dans les rythmes de l'océan Atlantique à Biarritz.",
    poeme: `Biarritz face à l'océan. Les vagues composent une symphonie éternelle, chaque déferlante apportant sa note unique.

L'Atlantique dicte ses humeurs à la ville. Calme ou tempétueux, il reste le chef d'orchestre de cette symphonie naturelle qui ne s'arrête jamais.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/biarritz-example",
    coordonnees: [43.4832, -1.5586],
    latitude: 43.4832,
    longitude: -1.5586,
    temperature: 17,
    meteo: "Venteux",
    lexique: "océan, vagues, symphonie, Atlantique, déferlante",
    audioFile: "https://example.com/audio/biarritz.mp3",
    nomMarche: "Marche Océanique",
    adresse: "Biarritz, 64200 Pyrénées-Atlantiques",
    tags: "océan, vagues, symphonie, Atlantique",
    tagsThematiques: ["océan", "vagues", "symphonie", "Atlantique"],
    sequencesSonores: ["https://example.com/audio/biarritz.mp3"],
    temoignages: [
      {
        contenu: "L'océan à Biarritz est d'une beauté saisissante",
        auteur: "Isabelle Martín",
        date: "2024-03-01"
      }
    ],
    liensInternes: [
      {
        titre: "Marche des Confluences - Bayonne",
        url: "/marche/bayonne-adour"
      }
    ],
    liensExternes: [
      {
        titre: "Océan Atlantique à Biarritz",
        url: "https://example.com/ocean-biarritz"
      }
    ],
    socialData: {
      interactions: 67,
      comments: ["Océan magnifique", "J'adore les vagues"],
      shares: 33
    }
  },
  {
    id: "angouleme-charente",
    ville: "Angoulême",
    region: "Nouvelle-Aquitaine",
    departement: "Charente",
    theme: "Bulles et ramparts",
    descriptifCourt: "Exploration des résonances créatives entre la ville haute et la Charente.",
    poeme: `Angoulême, ville perchée sur ses remparts. La Charente coule en contrebas, témoin silencieux de l'effervescence créative qui anime la cité.

Entre BD et patrimoine, une alchimie particulière opère. Les bulles de savon des enfants se mêlent aux bulles des planches, créant une poésie urbaine unique.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/angouleme-example",
    coordonnees: [45.6484, 0.1562],
    latitude: 45.6484,
    longitude: 0.1562,
    temperature: 20,
    meteo: "Partiellement nuageux",
    lexique: "remparts, Charente, BD, créativité, bulles",
    audioFile: "https://example.com/audio/angouleme.mp3",
    nomMarche: "Marche des Bulles",
    adresse: "Angoulême, 16000 Charente",
    tags: "créativité, BD, patrimoine, remparts",
    tagsThematiques: ["créativité", "BD", "patrimoine", "remparts"],
    sequencesSonores: ["https://example.com/audio/angouleme.mp3"],
    temoignages: [
      {
        contenu: "Une ville qui inspire la créativité",
        auteur: "Marc Dubois",
        date: "2024-01-30"
      }
    ],
    liensInternes: [
      {
        titre: "Autres marches en Nouvelle-Aquitaine",
        url: "/marches/nouvelle-aquitaine"
      }
    ],
    liensExternes: [
      {
        titre: "Festival BD Angoulême",
        url: "https://example.com/festival-bd-angouleme"
      }
    ],
    socialData: {
      interactions: 49,
      comments: ["Ville créative", "J'adore la BD"],
      shares: 24
    }
  },
  {
    id: "poitiers-clain",
    ville: "Poitiers",
    region: "Nouvelle-Aquitaine",
    departement: "Vienne",
    theme: "Échos du Clain",
    descriptifCourt: "Résonances historiques et contemporaines le long du Clain.",
    poeme: `Poitiers, ville aux multiples strates temporelles. Le Clain serpente entre les collines, portant sur ses eaux les échos de l'histoire.

Des thermes romains aux laboratoires modernes, chaque époque a laissé sa trace. Le Clain continue sa course, témoin imperturbable de ces métamorphoses urbaines.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/poitiers-example",
    coordonnees: [46.5802, 0.3404],
    latitude: 46.5802,
    longitude: 0.3404,
    temperature: 18,
    meteo: "Nuageux",
    lexique: "Clain, histoire, strates, métamorphoses, échos",
    audioFile: "https://example.com/audio/poitiers.mp3",
    nomMarche: "Marche des Échos Historiques",
    adresse: "Poitiers, 86000 Vienne",
    tags: "histoire, patrimoine, rivière, temporalité",
    tagsThematiques: ["histoire", "patrimoine", "rivière", "temporalité"],
    sequencesSonores: ["https://example.com/audio/poitiers.mp3"],
    temoignages: [
      {
        contenu: "L'histoire de Poitiers résonne encore aujourd'hui",
        auteur: "Catherine Moreau",
        date: "2024-02-05"
      }
    ],
    liensInternes: [
      {
        titre: "Marche des Bulles - Angoulême",
        url: "/marche/angouleme-charente"
      }
    ],
    liensExternes: [
      {
        titre: "Histoire de Poitiers",
        url: "https://example.com/histoire-poitiers"
      }
    ],
    socialData: {
      interactions: 41,
      comments: ["Ville historique", "J'adore me promener au bord du Clain"],
      shares: 20
    }
  },
  {
    id: "la-rochelle-atlantique",
    ville: "La Rochelle",
    region: "Nouvelle-Aquitaine",
    departement: "Charente-Maritime",
    theme: "Port d'attache des possibles",
    descriptifCourt: "Exploration des liens entre tradition maritime et innovation urbaine.",
    poeme: `La Rochelle, port d'attache des rêves et des possibles. Ses tours médiévales gardent l'entrée du port, témoins silencieux des échanges séculaires.

Entre tradition maritime et modernité urbaine, la ville navigue avec élégance. L'Atlantique apporte chaque jour de nouvelles inspirations, de nouvelles possibilités.`,
    date: "2024",
    lien: "https://drive.google.com/drive/folders/la-rochelle-example",
    coordonnees: [46.1591, -1.1520],
    latitude: 46.1591,
    longitude: -1.1520,
    temperature: 16,
    meteo: "Brumeux",
    lexique: "port, tours, maritime, Atlantique, échanges",
    audioFile: "https://example.com/audio/la-rochelle.mp3",
    nomMarche: "Marche du Port",
    adresse: "La Rochelle, 17000 Charente-Maritime",
    tags: "port, maritime, tours, Atlantique, échanges",
    tagsThematiques: ["port", "maritime", "tours", "Atlantique", "échanges"],
    sequencesSonores: ["https://example.com/audio/la-rochelle.mp3"],
    temoignages: [
      {
        contenu: "Un port qui inspire le voyage et la découverte",
        auteur: "Paul Girard",
        date: "2024-02-12"
      }
    ],
    liensInternes: [
      {
        titre: "Autres marches en Nouvelle-Aquitaine",
        url: "/marches/nouvelle-aquitaine"
      }
    ],
    liensExternes: [
      {
        titre: "Port de La Rochelle",
        url: "https://example.com/port-la-rochelle"
      }
    ],
    socialData: {
      interactions: 58,
      comments: ["Port magnifique", "J'adore les tours"],
      shares: 29
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
