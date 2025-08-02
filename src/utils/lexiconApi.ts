
import { LexiconApiResponse } from '../types/lexicon';

export const fetchLexiconParcelData = async (latitude: number, longitude: number): Promise<LexiconApiResponse> => {
  try {
    console.log(`🌱 [LEXICON DEBUG] Appel API pour lat: ${latitude}, lng: ${longitude}`);
    console.log(`🌱 [LEXICON DEBUG] URL complète: https://lexicon.osfarm.org/tools/parcel-identifier.json?latitude=${latitude}&longitude=${longitude}`);
    
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
    
    console.log(`🌱 [LEXICON DEBUG] Statut de la réponse: ${response.status}`);
    console.log(`🌱 [LEXICON DEBUG] Headers de la réponse:`, response.headers);
    
    if (!response.ok) {
      console.error(`❌ [LEXICON ERROR] Erreur API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`❌ [LEXICON ERROR] Corps de l'erreur:`, errorText);
      throw new Error(`Erreur API LEXICON: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ [LEXICON SUCCESS] Données reçues:`, data);
    console.log(`✅ [LEXICON SUCCESS] Type des données:`, typeof data);
    console.log(`✅ [LEXICON SUCCESS] Clés disponibles:`, Object.keys(data || {}));
    
    return {
      success: true,
      data: data,
      coordinates: { latitude, longitude }
    };
  } catch (error) {
    console.error('❌ [LEXICON ERROR] Erreur complète:', error);
    console.error('❌ [LEXICON ERROR] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue lors de la récupération des données LEXICON',
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
