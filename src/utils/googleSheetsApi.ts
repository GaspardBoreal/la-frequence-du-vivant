
const GOOGLE_SHEETS_API_KEY = 'AIzaSyBLIZXZWsOEvFeCAAHe1__khd0OVclv_4s';

export interface MarcheTechnoSensible {
  latitude: number;
  longitude: number;
  ville: string;
  theme: string;
  lien: string;
}

// Données de test en attendant de résoudre le problème d'accès
const TEST_DATA: MarcheTechnoSensible[] = [
  {
    latitude: 48.8566,
    longitude: 2.3522,
    ville: "Paris",
    theme: "Agriculture urbaine",
    lien: "https://example.com/paris"
  },
  {
    latitude: 45.764,
    longitude: 4.8357,
    ville: "Lyon",
    theme: "Permaculture",
    lien: "https://example.com/lyon"
  },
  {
    latitude: 43.6047,
    longitude: 1.4442,
    ville: "Toulouse",
    theme: "Agroécologie",
    lien: "https://example.com/toulouse"
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
      // Retourner les données de test en cas d'erreur 403
      return TEST_DATA;
    }
    
    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length < 2) {
      console.warn('Aucune donnée trouvée dans le Google Sheet, utilisation des données de test');
      return TEST_DATA;
    }
    
    console.log('Données récupérées avec succès depuis Google Sheets');
    
    // Skip header row and map data
    return rows.slice(1).map((row: string[]) => ({
      latitude: parseFloat(row[0]),
      longitude: parseFloat(row[1]),
      ville: row[2] || '',
      theme: row[3] || '',
      lien: row[4] || ''
    })).filter(item => !isNaN(item.latitude) && !isNaN(item.longitude));
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    console.log('Utilisation des données de test');
    return TEST_DATA;
  }
};
