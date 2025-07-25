const GOOGLE_SHEETS_API_KEY = 'AIzaSyBLIZXZWsOEvFeCAAHe1__khd0OVclv_4s';

export interface MarcheTechnoSensible {
  latitude: number;
  longitude: number;
  ville: string;
  theme: string;
  lien: string;
}

export const fetchMarchesTechnoSensibles = async (spreadsheetId: string): Promise<MarcheTechnoSensible[]> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1?key=${GOOGLE_SHEETS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch data from Google Sheets');
    }
    
    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length < 2) {
      return [];
    }
    
    // Skip header row and map data
    return rows.slice(1).map((row: string[]) => ({
      latitude: parseFloat(row[0]),
      longitude: parseFloat(row[1]),
      ville: row[2] || '',
      theme: row[3] || '',
      lien: row[4] || ''
    })).filter(item => !isNaN(item.latitude) && !isNaN(item.longitude));
    
  } catch (error) {
    console.error('Error fetching marches techno sensibles:', error);
    throw error;
  }
};