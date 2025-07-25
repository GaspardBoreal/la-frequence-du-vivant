
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
}

// Données de test en attendant de résoudre le problème d'accès
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
    adresse: "Place de la Concorde"
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
    adresse: "Place Bellecour"
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
    adresse: "Place du Capitole"
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
    adresse: "Place de la Bourse"
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
    adresse: "Vieux-Port"
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
    
    // D'après la structure du Google Sheet DATA_LIEUX:
    // Colonnes: DATE, VILLE, CODE POSTAL, ADRESSE, DEPARTEMENT, REGION, LATITUDE, LONGITUDE, THEME DE LA MARCHE, LIEN
    return rows.slice(1).map((row: string[]) => {
      const latitude = parseFloat(row[6]?.replace(',', '.') || '0');
      const longitude = parseFloat(row[7]?.replace(',', '.') || '0');
      
      return {
        latitude,
        longitude,
        ville: row[1] || '',
        theme: row[8] || '',
        lien: row[9] || '',
        region: row[5] || '',
        departement: row[4] || '',
        codePostal: row[2] || '',
        adresse: row[3] || ''
      };
    }).filter(item => !isNaN(item.latitude) && !isNaN(item.longitude) && item.ville);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    console.log('Utilisation des données de test');
    return TEST_DATA;
  }
};
