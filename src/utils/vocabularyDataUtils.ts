export interface VocabularyData {
  termes?: any[];
  source_ids?: any[];
}

export interface ProcessedVocabularyTerm {
  titre: string;
  description_courte: string;
  type: string;
  details: string;
  category: string;
  metadata: any;
}

/**
 * Termes à exclure du vocabulaire local (termes non-locaux, génériques, etc.)
 */
const EXCLUDED_VOCABULARY_TERMS = [
  'etymologie',
  'etymologia',
  'etymology',
  'definition',
  'general',
  'generique',
  'commun',
  'standard',
  // Banned terms (no valid source)
  'estey'
];

/**
 * Vérifie si un terme doit être inclus dans le vocabulaire local
 */
const isLocalVocabularyTerm = (key: string, value: any): boolean => {
  // Exclure les termes de la liste d'exclusion
  if (EXCLUDED_VOCABULARY_TERMS.includes(key.toLowerCase())) {
    return false;
  }
  
  // Exclure toutes les variantes de sources
  if (key === 'source_ids' || key === 'sources' || key === 'sources_data') {
    return false;
  }
  
  return true;
};

/**
 * Compte le nombre total d'éléments de vocabulaire (termes locaux + phénomènes + pratiques)
 */
export const getVocabularyTermsCount = (vocabularyData: any): number => {
  if (!vocabularyData) return 0;
  
  // Gestion du format avec wrapper {description, donnees}
  const dataToProcess = vocabularyData.donnees || vocabularyData;
  
  if (Array.isArray(dataToProcess)) {
    return dataToProcess.length;
  }
  
  if (typeof dataToProcess === 'object') {
    let totalCount = 0;
    
    // Nouveau format avec catégories séparées
    if (dataToProcess.termes_locaux || dataToProcess.phenomenes || dataToProcess.pratiques) {
      // Compter les termes locaux
      if (Array.isArray(dataToProcess.termes_locaux)) {
        dataToProcess.termes_locaux.forEach((item: any) => {
          if (item.metadata?.termes && Array.isArray(item.metadata.termes)) {
            totalCount += item.metadata.termes.length;
          } else {
            totalCount += 1;
          }
        });
      }
      
      // Compter les phénomènes
      if (Array.isArray(dataToProcess.phenomenes)) {
        dataToProcess.phenomenes.forEach((item: any) => {
          if (item.metadata?.phenomenes && Array.isArray(item.metadata.phenomenes)) {
            totalCount += item.metadata.phenomenes.length;
          } else {
            totalCount += 1;
          }
        });
      }
      
      // Compter les pratiques
      if (Array.isArray(dataToProcess.pratiques)) {
        dataToProcess.pratiques.forEach((item: any) => {
          if (item.metadata?.pratiques && Array.isArray(item.metadata.pratiques)) {
            totalCount += item.metadata.pratiques.length;
          } else {
            totalCount += 1;
          }
        });
      }
      
      return totalCount;
    }
    
    // Ancien format - Si c'est un objet avec une propriété 'termes', compter uniquement les termes
    if (dataToProcess.termes && Array.isArray(dataToProcess.termes)) {
      return dataToProcess.termes.length;
    }
    
    // Sinon, compter toutes les clés valides (exclure source_ids et termes non-locaux)
    return Object.keys(dataToProcess).filter(key => isLocalVocabularyTerm(key, dataToProcess[key])).length;
  }
  
  return 0;
};

/**
 * Traite les données de vocabulaire pour l'affichage dans VignetteGrid
 */
export const processVocabularyData = (vocabularyData: any): {
  termes: ProcessedVocabularyTerm[];
  sources: ProcessedVocabularyTerm[];
} => {
  const result = {
    termes: [] as ProcessedVocabularyTerm[],
    sources: [] as ProcessedVocabularyTerm[]
  };
  
  if (!vocabularyData) return result;
  
  // Si c'est un tableau, traiter comme des termes
  if (Array.isArray(vocabularyData)) {
    result.termes = vocabularyData.map((item, index) => ({
      titre: item.nom || item.terme || item.titre || item.name || `Terme ${index + 1}`,
      description_courte: item.description || item.definition || item.explication || '',
      type: item.type || item.categorie || 'terme',
      details: item.details || item.usage || item.application || '',
      category: 'termes',
      metadata: item
    }));

    // Exclure les termes bannis comme "Estey"
    result.termes = result.termes.filter(t => !EXCLUDED_VOCABULARY_TERMS.includes((t.titre || '').toLowerCase()));
    
    // Trier par ordre alphabétique
    result.termes.sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));
    return result;
  }
  
  // Si c'est un objet, traiter les différentes sections
  if (typeof vocabularyData === 'object') {
    Object.entries(vocabularyData).forEach(([key, value]) => {
      // Handle multiple source key variants
      if ((key === 'source_ids' || key === 'sources' || key === 'sources_data') && Array.isArray(value)) {
        // Traiter les sources
        result.sources = value.map((source: any, index) => ({
          titre: source.nom || source.name || source.source || source.titre || `Source ${index + 1}`,
          description_courte: source.description || source.url || source.lien || source.link || '',
          type: 'source',
          details: source.details || source.annee || source.year || source.type || '',
          category: key,
          metadata: source
        }));
      } else if (key === 'termes' && Array.isArray(value)) {
        // Traiter les termes
        result.termes = value.map((item: any, index) => ({
          titre: item.nom || item.terme || item.titre || item.name || `Terme ${index + 1}`,
          description_courte: item.description || item.definition || item.explication || '',
          type: item.type || item.categorie || 'terme',
          details: item.details || item.usage || item.application || '',
          category: 'termes',
          metadata: item
        }));
      } else if (Array.isArray(value) && isLocalVocabularyTerm(key, value)) {
        // Autres tableaux traités comme des termes (uniquement les valides)
        result.termes.push(...value.map((item: any, index) => ({
          titre: item?.nom || item?.terme || item?.titre || item?.name || key,
          description_courte: item?.description || item?.definition || item?.explication || '',
          type: item?.type || item?.categorie || 'terme',
          details: item?.details || item?.usage || item?.application || '',
          category: 'termes',
          metadata: item
        })));
      } else if (typeof value === 'object' && value !== null && isLocalVocabularyTerm(key, value)) {
        // Objets traités comme des termes individuels (uniquement les valides)
        const objValue = value as any;
        result.termes.push({
          titre: objValue?.nom || objValue?.terme || objValue?.titre || key,
          description_courte: objValue?.description || objValue?.definition || objValue?.explication || '',
          type: objValue?.type || objValue?.categorie || 'terme',
          details: objValue?.details || objValue?.usage || objValue?.application || '',
          category: 'termes',
          metadata: objValue
        });
      } else if (typeof value === 'string' && isLocalVocabularyTerm(key, value)) {
        // Chaînes traitées comme des termes simples (uniquement les valides)
        result.termes.push({
          titre: key,
          description_courte: value,
          type: 'terme',
          details: '',
          category: 'termes',
          metadata: { [key]: value }
        });
      }
    });
    
    // Exclure les termes bannis comme "Estey"
    result.termes = result.termes.filter(t => !EXCLUDED_VOCABULARY_TERMS.includes((t.titre || '').toLowerCase()));
    
    // Trier les termes par ordre alphabétique
    result.termes.sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));
  }
  
  return result;
};