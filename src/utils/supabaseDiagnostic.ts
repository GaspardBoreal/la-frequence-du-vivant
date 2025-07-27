
import { supabase } from '@/integrations/supabase/client';

// Fonction de diagnostic pour vérifier la configuration Supabase
export const runSupabaseDiagnostic = async (marcheId: string) => {
  console.log('🔍 [DIAGNOSTIC] Début du diagnostic Supabase');
  
  try {
    // Test 1: Vérifier la connexion Supabase
    console.log('🔍 [DIAGNOSTIC] Test 1 - Connexion Supabase');
    const { data: healthCheck, error: healthError } = await supabase
      .from('marches')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ [DIAGNOSTIC] Connexion Supabase ÉCHEC:', healthError);
      return { success: false, error: 'Connexion Supabase échouée', details: healthError };
    }
    console.log('✅ [DIAGNOSTIC] Connexion Supabase OK');

    // Test 2: Vérifier l'existence de la marche
    console.log('🔍 [DIAGNOSTIC] Test 2 - Vérification marche ID:', marcheId);
    const { data: marcheData, error: marcheError } = await supabase
      .from('marches')
      .select('id, ville, nom_marche')
      .eq('id', marcheId)
      .single();
    
    if (marcheError) {
      console.error('❌ [DIAGNOSTIC] Marche non trouvée:', marcheError);
      return { success: false, error: 'Marche non trouvée', details: marcheError };
    }
    console.log('✅ [DIAGNOSTIC] Marche trouvée:', marcheData);

    // Test 3: Vérifier les permissions RLS sur marche_photos
    console.log('🔍 [DIAGNOSTIC] Test 3 - Permissions RLS marche_photos');
    const { data: permissionTest, error: permissionError } = await supabase
      .from('marche_photos')
      .select('id')
      .eq('marche_id', marcheId)
      .limit(1);
    
    if (permissionError) {
      console.error('❌ [DIAGNOSTIC] Permissions RLS ÉCHEC:', permissionError);
      return { success: false, error: 'Permissions RLS échouées', details: permissionError };
    }
    console.log('✅ [DIAGNOSTIC] Permissions RLS OK');

    // Test 4: Vérifier l'accès au Storage
    console.log('🔍 [DIAGNOSTIC] Test 4 - Accès Storage marche-photos');
    const { data: storageList, error: storageError } = await supabase.storage
      .from('marche-photos')
      .list('', { limit: 1 });
    
    if (storageError) {
      console.error('❌ [DIAGNOSTIC] Storage ÉCHEC:', storageError);
      return { success: false, error: 'Accès Storage échoué', details: storageError };
    }
    console.log('✅ [DIAGNOSTIC] Storage accessible');

    console.log('🎉 [DIAGNOSTIC] Tous les tests réussis !');
    return { success: true, message: 'Configuration Supabase OK' };
    
  } catch (error) {
    console.error('💥 [DIAGNOSTIC] Erreur critique:', error);
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
