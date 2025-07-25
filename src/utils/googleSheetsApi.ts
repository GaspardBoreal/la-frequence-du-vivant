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

// Configuration Google Sheets API - CORRIGÉ avec l'ID complet
const SHEET_ID = '1_lcQPVHIg3JAJP_FWVstnWvzzjfssNPN_h7FodZCyJY';
const API_KEY = 'AIzaSyBLIZXZWsOEvFeCAAHe1__khd0OVclv_4s';
const SHEET_NAME = 'DATA_LIEUX';

// URL de base pour l'API Google Sheets
const SHEETS_BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

// Fonction pour récupérer les données depuis Google Sheets
const fetchGoogleSheetData = async (): Promise<any[][]> => {
  try {
    const response = await fetch(
      `${SHEETS_BASE_URL}/${SHEET_NAME}?key=${API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des données Google Sheets:', error);
    throw error;
  }
};

// Fonction pour convertir les données du sheet en format MarcheTechnoSensible
const convertSheetDataToMarches = (rawData: any[][]): MarcheTechnoSensible[] => {
  if (!rawData || rawData.length === 0) return [];

  // La première ligne contient les en-têtes
  const headers = rawData[0];
  const dataRows = rawData.slice(1);

  console.log('📊 Headers détectés:', headers);
  console.log('📊 Nombre de lignes de données:', dataRows.length);

  return dataRows.map((row, index) => {
    const marche: Partial<MarcheTechnoSensible> = {};

    // Mapper chaque colonne selon son header exact du Google Sheet
    headers.forEach((header: string, colIndex: number) => {
      const cellValue = row[colIndex] || '';
      
      switch (header) {
        case 'DATE':
          marche.date = cellValue;
          break;
        case 'NUMERO':
          marche.id = `marche-${cellValue}`;
          break;
        case 'VILLE':
          marche.ville = cellValue;
          break;
        case 'ADRESSE':
          marche.adresse = cellValue;
          break;
        case 'DEPARTEMENT':
          marche.departement = cellValue;
          break;
        case 'REGION':
          marche.region = cellValue;
          break;
        case 'LATITUDE':
          marche.latitude = parseFloat(cellValue.replace(',', '.')) || 0;
          break;
        case 'LONGITUDE':
          marche.longitude = parseFloat(cellValue.replace(',', '.')) || 0;
          break;
        case 'THEME DE LA MARCHE':
          marche.theme = cellValue;
          marche.nomMarche = cellValue; // Utiliser le thème comme nom de marche
          break;
        case 'DESCRIPTF DE LA MARCHE':
          marche.descriptifCourt = cellValue;
          marche.poeme = cellValue; // Utiliser aussi comme poème
          break;
        case 'LIEN':
          marche.lien = cellValue;
          break;
        case 'TAGS':
          marche.tags = cellValue;
          marche.tagsThematiques = cellValue ? cellValue.split(',').map((tag: string) => tag.trim()) : [];
          break;
      }
    });

    // Définir les coordonnées
    if (marche.latitude && marche.longitude) {
      marche.coordonnees = [marche.latitude, marche.longitude];
    }

    // Générer un ID si manquant
    if (!marche.id) {
      marche.id = `marche-${index + 1}`;
    }

    console.log(`✅ Marche ${index + 1} convertie:`, {
      id: marche.id,
      ville: marche.ville,
      theme: marche.theme,
      nomMarche: marche.nomMarche,
      latitude: marche.latitude,
      longitude: marche.longitude
    });

    return marche as MarcheTechnoSensible;
  });
};

// Fonction principale pour récupérer les marches
export const fetchMarchesTechnoSensibles = async (): Promise<MarcheTechnoSensible[]> => {
  try {
    console.log('🔄 Récupération des données depuis Google Sheets...');
    console.log('📋 Configuration:', {
      sheetId: SHEET_ID,
      sheetName: SHEET_NAME,
      apiKey: API_KEY.substring(0, 20) + '...'
    });
    
    const rawData = await fetchGoogleSheetData();
    const marches = convertSheetDataToMarches(rawData);
    
    console.log(`✅ ${marches.length} marches récupérées depuis Google Sheets`);
    return marches;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des marches:', error);
    
    // Retourner des données vides plutôt que de planter
    return [];
  }
};

// Fonction synchrone pour récupérer les marches (utilise un cache)
export const getMarchesTechnoSensibles = (): MarcheTechnoSensible[] => {
  console.warn('⚠️ getMarchesTechnoSensibles est synchrone - utilisez fetchMarchesTechnoSensibles pour les vraies données');
  return [];
};

// Fonction pour récupérer une marche par ID
export const getMarcheTechnoSensibleById = async (id: string): Promise<MarcheTechnoSensible | undefined> => {
  try {
    const marches = await fetchMarchesTechnoSensibles();
    return marches.find(marche => marche.id === id);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la marche par ID:', error);
    return undefined;
  }
};
