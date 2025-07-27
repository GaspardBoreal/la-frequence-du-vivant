
import { supabase } from '@/integrations/supabase/client';

// Fonction de diagnostic pour vérifier la configuration Supabase
export const runSupabaseDiagnostic = async (marcheId: string) => {
  console.log('🔍 [DIAGNOSTIC] Début du diagnostic Supabase');
  
  try {
    // Test 1: Vérifier la connexion Supabase (test simplifié)
    console.log('🔍 [DIAGNOSTIC] Test 1 - Connexion Supabase');
    
    // Test simple sans requête pour éviter les erreurs de connexion
    if (!supabase) {
      console.error('❌ [DIAGNOSTIC] Client Supabase non initialisé');
      return { success: false, error: 'Client Supabase non initialisé' };
    }
    
    console.log('✅ [DIAGNOSTIC] Client Supabase initialisé');

    // Test 2: Vérifier l'existence de la marche (optionnel)
    console.log('🔍 [DIAGNOSTIC] Test 2 - Vérification marche ID:', marcheId);
    
    try {
      const { data: marcheData, error: marcheError } = await supabase
        .from('marches')
        .select('id, ville, nom_marche')
        .eq('id', marcheId)
        .single();
      
      if (marcheError) {
        console.warn('⚠️ [DIAGNOSTIC] Marche non trouvée (non bloquant):', marcheError);
        return { success: false, error: 'Marche non trouvée', details: marcheError };
      }
      
      console.log('✅ [DIAGNOSTIC] Marche trouvée:', marcheData);
    } catch (marcheTestError) {
      console.warn('⚠️ [DIAGNOSTIC] Erreur test marche (non bloquant):', marcheTestError);
      return { success: false, error: 'Erreur test marche', details: marcheTestError };
    }

    // Test 3: Vérifier les permissions RLS sur marche_audio (optionnel)
    console.log('🔍 [DIAGNOSTIC] Test 3 - Permissions RLS marche_audio');
    
    try {
      const { data: permissionTest, error: permissionError } = await supabase
        .from('marche_audio')
        .select('id')
        .eq('marche_id', marcheId)
        .limit(1);
      
      if (permissionError) {
        console.warn('⚠️ [DIAGNOSTIC] Permissions RLS (non bloquant):', permissionError);
        return { success: false, error: 'Permissions RLS échouées', details: permissionError };
      }
      
      console.log('✅ [DIAGNOSTIC] Permissions RLS OK');
    } catch (permissionTestError) {
      console.warn('⚠️ [DIAGNOSTIC] Erreur test permissions (non bloquant):', permissionTestError);
      return { success: false, error: 'Erreur test permissions', details: permissionTestError };
    }

    // Test 4: Vérifier l'accès au Storage (optionnel)
    console.log('🔍 [DIAGNOSTIC] Test 4 - Accès Storage marche-audio');
    
    try {
      const { data: storageList, error: storageError } = await supabase.storage
        .from('marche-audio')
        .list('', { limit: 1 });
      
      if (storageError) {
        console.warn('⚠️ [DIAGNOSTIC] Storage (non bloquant):', storageError);
        return { success: false, error: 'Accès Storage échoué', details: storageError };
      }
      
      console.log('✅ [DIAGNOSTIC] Storage accessible');
    } catch (storageTestError) {
      console.warn('⚠️ [DIAGNOSTIC] Erreur test storage (non bloquant):', storageTestError);
      return { success: false, error: 'Erreur test storage', details: storageTestError };
    }

    console.log('🎉 [DIAGNOSTIC] Tous les tests réussis !');
    return { success: true, message: 'Configuration Supabase OK' };
    
  } catch (error) {
    console.warn('💥 [DIAGNOSTIC] Erreur critique (non bloquante):', error);
    return { success: false, error: 'Erreur critique', details: error };
  }
};

// Fonction pour valider les données avant envoi
export const validatePhotoData = (photoData: any, marcheId: string) => {
  console.log('🔍 [VALIDATION] Validation des données photo');
  
  const errors: string[] = [];
  
  if (!marcheId) {
    errors.push('marcheId manquant');
  }
  
  if (!photoData.file) {
    errors.push('fichier manquant');
  } else {
    console.log('✅ [VALIDATION] Fichier:', {
      name: photoData.file.name,
      size: photoData.file.size,
      type: photoData.file.type
    });
  }
  
  if (photoData.metadata) {
    try {
      JSON.stringify(photoData.metadata);
      console.log('✅ [VALIDATION] Métadonnées JSON valides');
    } catch (error) {
      errors.push('métadonnées JSON invalides');
      console.error('❌ [VALIDATION] Métadonnées corrompues:', error);
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ [VALIDATION] Erreurs détectées:', errors);
    return { valid: false, errors };
  }
  
  console.log('✅ [VALIDATION] Données valides');
  return { valid: true, errors: [] };
};
