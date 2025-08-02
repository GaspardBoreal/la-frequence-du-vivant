import { LexiconApiResponse } from '../types/lexicon';

export const fetchLexiconParcelData = async (latitude: number, longitude: number): Promise<LexiconApiResponse> => {
  try {
    console.log(`🌱 Appel API LEXICON pour lat: ${latitude}, lng: ${longitude}`);
    
    const response = await fetch(
      `https://lexicon.osfarm.org/tools/parcel-identifier.json?latitude=${latitude}&longitude=${longitude}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error(`❌ Erreur API LEXICON: ${response.status} ${response.statusText}`);
      throw new Error(`Erreur API LEXICON: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Données LEXICON reçues:`, data);
    
    return {
      success: true,
      data: data,
      coordinates: { latitude, longitude }
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel à l\'API LEXICON:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      coordinates: { latitude, longitude }
    };
  }
};

export const fetchParcelData = async (latitude: number, longitude: number) => {
  console.warn('⚠️ fetchParcelData est dépréciée, utilisez fetchLexiconParcelData');
  return fetchLexiconParcelData(latitude, longitude);
};

export const fetchNearbyParcels = async (
  latitude: number, 
  longitude: number, 
  radiusM: number, 
  stepM: number
) => {
  const response = await fetch(
    `https://comediedesmondeshybrides-data-api.hf.space/tools/get_nearby_parcel?latitude=${latitude}&longitude=${longitude}&radius_m=${radiusM}&step_m=${stepM}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch nearby parcels data');
  }
  
  return response.json();
};
