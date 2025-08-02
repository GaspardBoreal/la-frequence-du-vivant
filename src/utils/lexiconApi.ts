
import { LexiconApiResponse } from '../types/lexicon';

export const fetchLexiconParcelData = async (latitude: number, longitude: number): Promise<LexiconApiResponse> => {
  try {
    console.log(`🌱 [LEXICON DEBUG] Appel via Edge Function pour lat: ${latitude}, lng: ${longitude}`);
    
    const edgeFunctionUrl = `https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/lexicon-proxy?latitude=${latitude}&longitude=${longitude}`;
    console.log(`🌱 [LEXICON DEBUG] URL Edge Function: ${edgeFunctionUrl}`);
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`🌱 [LEXICON DEBUG] Statut de la réponse: ${response.status}`);
    
    if (!response.ok) {
      console.error(`❌ [LEXICON ERROR] Erreur Edge Function: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`❌ [LEXICON ERROR] Corps de l'erreur:`, errorText);
      throw new Error(`Erreur Edge Function LEXICON: ${response.status} - ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ [LEXICON SUCCESS] Réponse Edge Function:`, result);
    
    // La réponse de l'edge function est déjà structurée
    return result;
  } catch (error) {
    console.error('❌ [LEXICON ERROR] Erreur complète:', error);
    console.error('❌ [LEXICON ERROR] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'appel Edge Function LEXICON',
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
