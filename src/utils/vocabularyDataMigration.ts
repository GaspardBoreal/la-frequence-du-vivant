/**
 * Utilitaire pour migrer et corriger les données de vocabulaire existantes
 */

export interface VocabularyMigrationResult {
  success: boolean;
  corrected: number;
  errors: string[];
}

/**
 * Migre et corrige les données de vocabulaire mal catégorisées
 */
export const migrateVocabularyData = (rawData: any): {
  corrected: any;
  changes: string[];
} => {
  const changes: string[] = [];
  const corrected = JSON.parse(JSON.stringify(rawData)); // Deep clone

  if (!corrected.donnees) {
    return { corrected, changes };
  }

  const data = corrected.donnees;

  // Restructurer les données selon les nouvelles catégories
  const newStructure = {
    termes_locaux: [] as any[],
    phenomenes: [] as any[],
    pratiques: [] as any[]
  };

  // Traiter chaque section
  Object.entries(data).forEach(([key, items]) => {
    if (!Array.isArray(items)) return;

    const keyLower = key.toLowerCase();
    let targetCategory: 'termes_locaux' | 'phenomenes' | 'pratiques' = 'termes_locaux';

    // Catégorisation basée sur la clé de section
    if (keyLower.includes('phenomen') || keyLower.includes('phénom') || 
        keyLower.includes('naturel') || keyLower.includes('climat') || keyLower.includes('meteo')) {
      targetCategory = 'phenomenes';
      changes.push(`Migré ${items.length} éléments de "${key}" vers "phenomenes"`);
    } else if (keyLower.includes('pratique') || keyLower.includes('activit') || 
               keyLower.includes('usage') || keyLower.includes('tradition')) {
      targetCategory = 'pratiques';
      changes.push(`Migré ${items.length} éléments de "${key}" vers "pratiques"`);
    } else if (keyLower.includes('terme') || keyLower.includes('hydrologique') || keyLower.includes('vocabulaire')) {
      targetCategory = 'termes_locaux';
      if (key !== 'termes_locaux') {
        changes.push(`Migré ${items.length} éléments de "${key}" vers "termes_locaux"`);
      }
    }

    // Normaliser chaque item
    items.forEach((item: any) => {
      const normalizedItem = {
        nom: item.nom || item.terme || item.titre || item.expression || '',
        description: item.description || item.definition || item.phenomene || item.details || '',
        type: targetCategory === 'phenomenes' ? 'phenomene' : 
              targetCategory === 'pratiques' ? 'pratique' : 'terme',
        source_ids: item.source_ids || [],
        metadata: {
          ...item,
          originalSection: key,
          migrated: true,
          migrationDate: new Date().toISOString()
        }
      };

      newStructure[targetCategory].push(normalizedItem);
    });
  });

  // Remplacer la structure
  corrected.donnees = newStructure;

  // Ajouter métadonnées de migration
  corrected.migration = {
    date: new Date().toISOString(),
    changes: changes,
    version: '1.0'
  };

  return { corrected, changes };
};

/**
 * Fonction pour corriger spécifiquement les données de la marche "Un moment sauvage à la sortie de Bergerac"
 */
export const correctBergeracMarcheData = async (supabaseClient: any, opusId: string): Promise<VocabularyMigrationResult> => {
  try {
    // Récupérer les données actuelles
    const { data: currentData, error: fetchError } = await supabaseClient
      .from('marche_contextes_hybrids')
      .select('id, vocabulaire_local')
      .eq('opus_id', opusId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !currentData) {
      return {
        success: false,
        corrected: 0,
        errors: [`Erreur lors du fetch: ${fetchError?.message}`]
      };
    }

    // Migrer les données
    const { corrected, changes } = migrateVocabularyData(currentData.vocabulaire_local);

    // Mettre à jour en base
    const { error: updateError } = await supabaseClient
      .from('marche_contextes_hybrids')
      .update({
        vocabulaire_local: corrected,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentData.id);

    if (updateError) {
      return {
        success: false,
        corrected: 0,
        errors: [`Erreur lors de la mise à jour: ${updateError.message}`]
      };
    }

    return {
      success: true,
      corrected: changes.length,
      errors: []
    };

  } catch (error: any) {
    return {
      success: false,
      corrected: 0,
      errors: [error.message]
    };
  }
};