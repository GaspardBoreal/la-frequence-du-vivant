
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

// Fonction améliorée pour nettoyer et convertir les coordonnées
const parseCoordinate = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Nettoyer la valeur : supprimer les espaces et remplacer virgules par points
  const cleaned = value.toString().trim().replace(/,/g, '.');
  
  // Vérifier si c'est un nombre valide après nettoyage
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    console.warn(`⚠️ Format de coordonnée invalide: "${value}" -> "${cleaned}"`);
    return 0;
  }
  
  const parsed = parseFloat(cleaned);
  
  console.log(`✅ Conversion coordonnée: "${value}" -> "${cleaned}" -> ${parsed}`);
  
  return isNaN(parsed) ? 0 : parsed;
};

// Fonction pour valider les coordonnées avec des critères plus stricts
const isValidCoordinate = (lat: number, lng: number): boolean => {
  // Vérifier que les coordonnées sont dans des plages valides pour la France et l'Europe
  const isLatValid = lat >= 41 && lat <= 51 && lat !== 0; // Latitude France métropolitaine élargie
  const isLngValid = lng >= -5 && lng <= 9 && lng !== 0; // Longitude France métropolitaine élargie
  
  console.log(`🔍 Validation coordonnées: lat=${lat} (${isLatValid ? '✅' : '❌'}), lng=${lng} (${isLngValid ? '✅' : '❌'})`);
  
  return isLatValid && isLngValid;
};

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
    sequencesSonores: [
      "https://example.com/audio/digital-sea.mp3"
    ],
    poeme: "Les vagues binaires caressent\nLes terrasses connectées,\nOù chaque pixel devient graine\nD'un futur méditerranéen.",
    tagsThematiques: ["méditerranée", "numérique", "connexion", "futur"]
  }
];

export const fetchMarchesTechnoSensibles = async (): Promise<MarcheTechnoSensible[]> => {
  try {
    console.log('🔄 Tentative de récupération des données Google Sheets...');
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/1_lcQPVHIg3JAJP_FWVstnWvzzjfssNPN_h7FodZCyJY/values/DATA_LIEUX?key=${GOOGLE_SHEETS_API_KEY}`
    );
    
    if (!response.ok) {
      console.warn('⚠️ Erreur d\'accès au Google Sheet (403), utilisation des données de test');
      return TEST_DATA;
    }
    
    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length < 2) {
      console.warn('⚠️ Aucune donnée trouvée dans le Google Sheet, utilisation des données de test');
      return TEST_DATA;
    }
    
    console.log('✅ Données récupérées avec succès depuis Google Sheets');
    console.log('📋 Headers:', rows[0]);
    
    // Traitement des données avec validation améliorée
    const processedData = rows.slice(1).map((row: string[], index: number) => {
      const rawLat = row[7]; // Colonne LATITUDE
      const rawLng = row[8]; // Colonne LONGITUDE
      const ville = row[2]; // Colonne VILLE
      
      console.log(`📍 Traitement ligne ${index + 2} - Ville: ${ville}`);
      console.log(`📊 Coordonnées brutes: lat="${rawLat}", lng="${rawLng}"`);
      
      const latitude = parseCoordinate(rawLat);
      const longitude = parseCoordinate(rawLng);
      
      console.log(`🎯 Coordonnées traitées: lat=${latitude}, lng=${longitude}`);
      
      const item = {
        latitude,
        longitude,
        ville: ville || '',
        theme: row[9] || '',
        lien: row[11] || '',
        region: row[6] || '',
        departement: row[5] || '',
        codePostal: row[3] || '',
        adresse: row[4] || '',
        tags: row[12] || ''
      };
      
      // Validation spécifique pour BONZAC
      if (ville === 'BONZAC') {
        console.log(`🔍 Validation spéciale pour BONZAC:`, item);
        console.log(`🏘️ Coordonnées BONZAC finales: lat=${latitude}, lng=${longitude}`);
        console.log(`📍 Position exacte BONZAC: [${latitude}, ${longitude}]`);
        if (!isValidCoordinate(latitude, longitude)) {
          console.error(`❌ Coordonnées invalides pour BONZAC: lat=${latitude}, lng=${longitude}`);
        } else {
          console.log(`✅ Coordonnées BONZAC validées avec succès!`);
        }
      }
      
      return item;
    }).filter((item, index) => {
      const isValid = isValidCoordinate(item.latitude, item.longitude) && item.ville;
      
      if (!isValid) {
        console.log(`❌ Ligne ${index + 2} rejetée: ville="${item.ville}", lat=${item.latitude}, lng=${item.longitude}`);
      } else {
        console.log(`✅ Ligne ${index + 2} acceptée: ville="${item.ville}", lat=${item.latitude}, lng=${item.longitude}`);
      }
      
      return isValid;
    });
    
    console.log(`📊 ${processedData.length} marches valides sur ${rows.length - 1} lignes traitées`);
    
    // Log spécifique pour BONZAC
    const bonzacEntries = processedData.filter(item => item.ville === 'BONZAC');
    console.log(`🏘️ Entrées BONZAC trouvées:`, bonzacEntries);
    console.log(`🏘️ Nombre d'entrées BONZAC validées: ${bonzacEntries.length}`);
    
    // Vérifier la validité des coordonnées BONZAC
    bonzacEntries.forEach((entry, index) => {
      console.log(`🏘️ BONZAC ${index + 1}:`, {
        coordonnees: [entry.latitude, entry.longitude],
        adresse: entry.adresse,
        theme: entry.theme,
        codePostal: entry.codePostal
      });
    });
    
    return processedData;
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données:', error);
    console.log('🔄 Utilisation des données de test');
    return TEST_DATA;
  }
};
