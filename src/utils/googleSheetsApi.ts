
const GOOGLE_SHEETS_API_KEY = 'AIzaSyBLIZXZWsOEvFeCAAHe1__khd0OVclv_4s';

export interface MarcheTechnoSensible {
  latitude: number;
  longitude: number;
  ville: string;
  theme: string;
  lien: string;
  region: string;
  departement: string;
  codePostal: string;
  adresse: string;
  tags: string;
  // Nouveaux champs pour l'univers poétique
  nomMarche?: string;
  descriptifCourt?: string;
  photos?: string[]; // URLs des photos (1-20)
  sequencesSonores?: string[]; // URLs des séquences sonores (1-3)
  videos?: string[]; // URLs des vidéos
  poeme?: string; // Le poème associé
  temoignages?: {
    auteur: string;
    contenu: string;
    date: string;
  }[];
  tagsThematiques?: string[]; // Tags spécifiques au contenu
  liensInternes?: {
    titre: string;
    url: string;
  }[];
  liensExternes?: {
    titre: string;
    url: string;
  }[];
}

// Données de test enrichies pour l'univers poétique
const TEST_DATA: MarcheTechnoSensible[] = [
  {
    latitude: 48.8566,
    longitude: 2.3522,
    ville: "Paris",
    theme: "Agriculture urbaine",
    lien: "https://example.com/paris",
    region: "Île-de-France",
    departement: "Paris",
    codePostal: "75001",
    adresse: "Place de la Concorde",
    tags: '',
    nomMarche: "Métamorphoses Urbaines",
    descriptifCourt: "Là où l'asphalte rencontre la terre, naissent les nouveaux jardins de l'âme numérique.",
    photos: [
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400"
    ],
    sequencesSonores: [
      "https://example.com/audio/urban-growth.mp3",
      "https://example.com/audio/digital-seeds.mp3"
    ],
    videos: ["https://example.com/video/urban-metamorphosis.mp4"],
    poeme: "Dans les veines de béton,\nGerment les rêves électroniques,\nOù la machine apprend à fleurir\nEt l'humain redécouvre ses racines.",
    temoignages: [
      {
        auteur: "Marie L.",
        contenu: "Ce poème m'a fait réaliser que la technologie peut être un terreau fertile pour l'imagination.",
        date: "2024-01-15"
      }
    ],
    tagsThematiques: ["technologie", "nature", "urbain", "métamorphose"],
    liensInternes: [
      { titre: "Jardins connectés", url: "/jardins-connectes" }
    ],
    liensExternes: [
      { titre: "Manifeste du jardinage numérique", url: "https://example.com/manifeste" }
    ]
  },
  {
    latitude: 45.764,
    longitude: 4.8357,
    ville: "Lyon",
    theme: "Permaculture",
    lien: "https://example.com/lyon",
    region: "Auvergne-Rhône-Alpes",
    departement: "Rhône",
    codePostal: "69000",
    adresse: "Place Bellecour",
    tags: '',
    nomMarche: "Symbioses Algorithmiques",
    descriptifCourt: "Quand l'intelligence artificielle dialogue avec la sagesse millénaire de la terre.",
    photos: [
      "https://images.unsplash.com/photo-1518743387925-4040fc4df0c8?w=400",
      "https://images.unsplash.com/photo-1587691592099-24045742c181?w=400"
    ],
    sequencesSonores: [
      "https://example.com/audio/earth-whispers.mp3"
    ],
    videos: ["https://example.com/video/ai-permaculture.mp4"],
    poeme: "Les algorithmes murmurent\nAux racines anciennes,\nTissant des réseaux invisibles\nOù l'émotion devient donnée.",
    temoignages: [
      {
        auteur: "Jean P.",
        contenu: "Une vision fascinante de la fusion entre tradition et innovation.",
        date: "2024-01-20"
      }
    ],
    tagsThematiques: ["ia", "permaculture", "symbiose", "tradition"],
    liensInternes: [
      { titre: "IA et agriculture", url: "/ia-agriculture" }
    ],
    liensExternes: [
      { titre: "Recherches en permaculture digitale", url: "https://example.com/recherches" }
    ]
  },
  {
    latitude: 43.6047,
    longitude: 1.4442,
    ville: "Toulouse",
    theme: "Agroécologie",
    lien: "https://example.com/toulouse",
    region: "Occitanie",
    departement: "Haute-Garonne",
    codePostal: "31000",
    adresse: "Place du Capitole",
    tags: '',
    nomMarche: "Écosystèmes Quantiques",
    descriptifCourt: "L'agroécologie rencontre la physique quantique dans une danse poétique de probabilités.",
    photos: [
      "https://images.unsplash.com/photo-1574923162061-6017b4b9598e?w=400"
    ],
    sequencesSonores: [
      "https://example.com/audio/quantum-soil.mp3"
    ],
    poeme: "Dans l'incertitude quantique,\nLes graines trouvent leur chemin,\nChaque particule porte en elle\nL'infini des possibles.",
    tagsThematiques: ["quantique", "agroécologie", "probabilités", "infini"]
  },
  {
    latitude: 44.8378,
    longitude: -0.5792,
    ville: "Bordeaux",
    theme: "Biodynamie",
    lien: "https://example.com/bordeaux",
    region: "Nouvelle-Aquitaine",
    departement: "Gironde",
    codePostal: "33000",
    adresse: "Place de la Bourse",
    tags: '',
    nomMarche: "Rythmes Cybernétiques",
    descriptifCourt: "La biodynamie s'enrichit des cycles numériques pour créer de nouveaux rituels terrestres.",
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"
    ],
    sequencesSonores: [
      "https://example.com/audio/digital-rhythms.mp3"
    ],
    poeme: "Les algorithmes battent\nAu rythme des saisons,\nCodant les mystères lunaires\nEn langages organiques.",
    tagsThematiques: ["biodynamie", "cybernétique", "rythmes", "mystères"]
  },
  {
    latitude: 43.2965,
    longitude: 5.3698,
    ville: "Marseille",
    theme: "Agriculture urbaine",
    lien: "https://example.com/marseille",
    region: "Provence-Alpes-Côte d'Azur",
    departement: "Bouches-du-Rhône",
    codePostal: "13001",
    adresse: "Vieux-Port",
    tags: '',
    nomMarche: "Méditerranée Numérique",
    descriptifCourt: "Entre mer et pixels, naissent les nouveaux jardins suspendus de Babylone connectée.",
    photos: [
      "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400"
    ],
    sequencesSonores: [
      "https://example.com/audio/digital-sea.mp3"
    ],
    poeme: "Les vagues binaires caressent\nLes terrasses connectées,\nOù chaque pixel devient graine\nD'un futur méditerranéen.",
    tagsThematiques: ["méditerranée", "numérique", "connexion", "futur"]
  }
];

export const fetchMarchesTechnoSensibles = async (): Promise<MarcheTechnoSensible[]> => {
  try {
    console.log('Tentative de récupération des données Google Sheets...');
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/1_lcQPVHIg3JAJP_FWVstnWvzzjfssNPN_h7FodZCyJY/values/DATA_LIEUX?key=${GOOGLE_SHEETS_API_KEY}`
    );
    
    if (!response.ok) {
      console.warn('Erreur d\'accès au Google Sheet (403), utilisation des données de test');
      return TEST_DATA;
    }
    
    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length < 2) {
      console.warn('Aucune donnée trouvée dans le Google Sheet, utilisation des données de test');
      return TEST_DATA;
    }
    
    console.log('Données récupérées avec succès depuis Google Sheets');
    console.log('Première ligne (headers):', rows[0]);
    console.log('Exemple de données:', rows[1]);
    
    // Nouvelle structure des colonnes selon les logs de la console :
    // 0: DATE, 1: NUMERO, 2: VILLE, 3: CODE POSTAL, 4: ADRESSE, 5: DEPARTEMENT, 6: REGION, 
    // 7: LATITUDE, 8: LONGITUDE, 9: THEME DE LA MARCHE, 10: DESCRIPTF DE LA MARCHE, 11: LIEN, 12: TAGS
    return rows.slice(1).map((row: string[]) => {
      const latitude = parseFloat(row[7]?.replace(',', '.') || '0');
      const longitude = parseFloat(row[8]?.replace(',', '.') || '0');
      
      return {
        latitude,
        longitude,
        ville: row[2] || '',
        theme: row[9] || '',
        lien: row[11] || '',
        region: row[6] || '',
        departement: row[5] || '',
        codePostal: row[3] || '',
        adresse: row[4] || '',
        tags: row[12] || ''
      };
    }).filter(item => !isNaN(item.latitude) && !isNaN(item.longitude) && item.ville);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    console.log('Utilisation des données de test');
    return TEST_DATA;
  }
};
