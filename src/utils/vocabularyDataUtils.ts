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
  'standard'
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
 * Compte le nombre de termes de vocabulaire local (uniquement les termes valides, pas les sources)
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
    
    // Sinon, compter toutes les clés valides (exclure source_ids et termes non-locaux)
    return Object.keys(vocabularyData).filter(key => isLocalVocabularyTerm(key, vocabularyData[key])).length;
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
    
    // Trier les termes par ordre alphabétique
    result.termes.sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));
  }
  
  return result;
};