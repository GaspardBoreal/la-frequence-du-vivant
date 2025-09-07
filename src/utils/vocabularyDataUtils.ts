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
 * Compte le nombre de termes de vocabulaire local (uniquement les termes, pas les sources)
 */
export const getVocabularyTermsCount = (vocabularyData: any): number => {
  if (!vocabularyData) return 0;
  
  if (Array.isArray(vocabularyData)) {
    return vocabularyData.length;
  }
  
  if (typeof vocabularyData === 'object') {
    // Si c'est un objet avec une propriété 'termes', compter uniquement les termes
    if (vocabularyData.termes && Array.isArray(vocabularyData.termes)) {
      return vocabularyData.termes.length;
    }
    
    // Sinon, compter toutes les clés sauf 'source_ids'
    return Object.keys(vocabularyData).filter(key => key !== 'source_ids').length;
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
    
    // Trier par ordre alphabétique
    result.termes.sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));
    return result;
  }
  
  // Si c'est un objet, traiter les différentes sections
  if (typeof vocabularyData === 'object') {
    Object.entries(vocabularyData).forEach(([key, value]) => {
      if (key === 'source_ids' && Array.isArray(value)) {
        // Traiter les sources
        result.sources = value.map((source: any, index) => ({
          titre: source.nom || source.name || source.source || `Source ${index + 1}`,
          description_courte: source.description || source.url || source.lien || '',
          type: 'source',
          details: source.details || source.annee || source.type || '',
          category: 'source_ids',
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
      } else if (Array.isArray(value) && key !== 'source_ids') {
        // Autres tableaux traités comme des termes
        result.termes.push(...value.map((item: any, index) => ({
          titre: item?.nom || item?.terme || item?.titre || item?.name || key,
          description_courte: item?.description || item?.definition || item?.explication || '',
          type: item?.type || item?.categorie || 'terme',
          details: item?.details || item?.usage || item?.application || '',
          category: 'termes',
          metadata: item
        })));
      } else if (typeof value === 'object' && value !== null && key !== 'source_ids') {
        // Objets traités comme des termes individuels
        const objValue = value as any;
        result.termes.push({
          titre: objValue?.nom || objValue?.terme || objValue?.titre || key,
          description_courte: objValue?.description || objValue?.definition || objValue?.explication || '',
          type: objValue?.type || objValue?.categorie || 'terme',
          details: objValue?.details || objValue?.usage || objValue?.application || '',
          category: 'termes',
          metadata: objValue
        });
      } else if (typeof value === 'string' && key !== 'source_ids') {
        // Chaînes traitées comme des termes simples
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
    
    // Trier les termes par ordre alphabétique
    result.termes.sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));
  }
  
  return result;
};