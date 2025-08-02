
import { LexiconApiResponse } from '../types/lexicon';

// Fonction pour transformer les données LEXICON vers notre format attendu
const transformLexiconData = (rawData: any) => {
  console.log(`🔄 [LEXICON TRANSFORM] Transformation des données:`, rawData);
  
  const extractValue = (field: any) => {
    if (typeof field === 'object' && field?.value !== undefined) {
      return field.value;
    }
    return field || null;
  };

  const transformed = {
    // Informations générales depuis information
    pays: extractValue(rawData.information?.country) || 'France',
    ville: extractValue(rawData.information?.city),
    city: extractValue(rawData.information?.city),
    commune: extractValue(rawData.information?.city),
    code_commune: extractValue(rawData.information?.['city-code']),
    commune_code: extractValue(rawData.information?.['city-code']),
    code_postal: extractValue(rawData.information?.['postal-code']),
    postal_code: extractValue(rawData.information?.['postal-code']),
    
    // Données cadastrales depuis cadastre
    identifiant_cadastral: extractValue(rawData.cadastre?.id),
    cadastral_id: extractValue(rawData.cadastre?.id),
    parcel_id: extractValue(rawData.cadastre?.id),
    prefixe: extractValue(rawData.cadastre?.prefix),
    prefix: extractValue(rawData.cadastre?.prefix),
    section: extractValue(rawData.cadastre?.section),
    numero: extractValue(rawData.cadastre?.number),
    number: extractValue(rawData.cadastre?.number),
    superficie_m2: extractValue(rawData.cadastre?.area),
    surface_ha: extractValue(rawData.cadastre?.area) ? extractValue(rawData.cadastre?.area) / 10000 : null,
    
    // Conserver les données brutes pour référence
    _raw: rawData
  };
  
  console.log(`✅ [LEXICON TRANSFORM] Données transformées:`, transformed);
  return transformed;
};

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
    
    // Transformer les données si elles existent
    if (result.success && result.data) {
      result.data = transformLexiconData(result.data);
      console.log(`🔄 [LEXICON SUCCESS] Données après transformation:`, result.data);
    }
    
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
