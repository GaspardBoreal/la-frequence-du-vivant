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

// Déduction de catégorie à partir de la clé
const inferCategoryFromKey = (key: string): 'termes' | 'phenomenes' | 'pratiques' => {
  const k = key.toLowerCase();
  if (k.includes('phenomen') || k.includes('phénom') || k.includes('meteo') || k.includes('météo') || 
      k.includes('climat') || k.includes('naturel') || k.includes('saisonn')) {
    return 'phenomenes';
  }
  if (k.includes('pratique') || k.includes('activit') || k.includes('usage') || k.includes('agro') || 
      k.includes('tradition') || k.includes('technique') || k.includes('pêche') || k.includes('navigation')) {
    return 'pratiques';
  }
  if (k.includes('terme') || k.includes('hydrologique') || k.includes('vocabulaire') || k.includes('local')) {
    return 'termes';
  }
  return 'termes';
};

// Normalisation du titre d'un item de vocabulaire
const normalizeTitleFromItem = (item: any, fallback: string): string => {
  if (typeof item === 'string') return item;
  return item?.nom || item?.terme || item?.titre || item?.name || fallback;
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
      // Ignorer les clés techniques et variantes de sources
      if (['source_ids', 'sources', 'sources_data', 'description', 'donnees', 'metadata'].includes(key)) {
        // Gestion spéciale des sources si tableau
        if ((key === 'source_ids' || key === 'sources' || key === 'sources_data') && Array.isArray(value)) {
          result.sources = value.map((source: any, index) => ({
            titre: source.nom || source.name || source.source || source.titre || `Source ${index + 1}`,
            description_courte: source.description || source.url || source.lien || source.link || '',
            type: 'source',
            details: source.details || source.annee || source.year || source.type || '',
            category: key,
            metadata: source
          }));
        }
        return;
      }

      const inferred = inferCategoryFromKey(key);

      if (key === 'termes' && Array.isArray(value)) {
        // Section explicite des termes
        result.termes = value.map((item: any, index) => ({
          titre: normalizeTitleFromItem(item, `Terme ${index + 1}`),
          description_courte: (typeof item === 'object') ? (item.description || item.definition || item.explication || '') : '',
          type: (typeof item === 'object') ? (item.type || item.categorie || 'terme') : 'terme',
          details: (typeof item === 'object') ? (item.details || item.usage || item.application || '') : '',
          category: 'termes',
          metadata: item
        }));
      } else if (Array.isArray(value) && isLocalVocabularyTerm(key, value)) {
        // Autres tableaux: distinguer string vs objet, et déduire la catégorie à partir de la clé
        value.forEach((item: any, index: number) => {
          const titre = normalizeTitleFromItem(item, key);
          const description_courte = typeof item === 'object' ? (item.description || item.definition || item.explication || '') : '';
          const details = typeof item === 'object' ? (item.details || item.usage || item.application || '') : '';
          const type = typeof item === 'object' ? (item.type || item.categorie || (inferred === 'phenomenes' ? 'phenomene' : inferred === 'pratiques' ? 'pratique' : 'terme'))
                                               : (inferred === 'phenomenes' ? 'phenomene' : inferred === 'pratiques' ? 'pratique' : 'terme');
          const category = inferred === 'termes' ? key : inferred;

          result.termes.push({
            titre,
            description_courte,
            type,
            details,
            category,
            metadata: typeof item === 'object' ? { ...item, originalKey: key } : { originalKey: key, raw: item }
          });
        });
      } else if (typeof value === 'object' && value !== null && isLocalVocabularyTerm(key, value)) {
        // Objets: déduire la catégorie à partir de la clé
        const objValue = value as any;
        const titre = normalizeTitleFromItem(objValue, key);
        const type = objValue?.type || objValue?.categorie || (inferred === 'phenomenes' ? 'phenomene' : inferred === 'pratiques' ? 'pratique' : 'terme');
        result.termes.push({
          titre,
          description_courte: objValue?.description || objValue?.definition || objValue?.explication || '',
          type,
          details: objValue?.details || objValue?.usage || objValue?.application || '',
          category: inferred === 'termes' ? key : inferred,
          metadata: { ...objValue, originalKey: key }
        });
      } else if (typeof value === 'string' && isLocalVocabularyTerm(key, value)) {
        // Chaînes: titre = clé, description = valeur, catégorie déduite
        result.termes.push({
          titre: key,
          description_courte: value,
          type: inferred === 'phenomenes' ? 'phenomene' : inferred === 'pratiques' ? 'pratique' : 'terme',
          details: '',
          category: inferred === 'termes' ? 'termes' : inferred,
          metadata: { [key]: value, originalKey: key }
        });
      }
    });
    
    // Exclure les termes bannis comme "Estey"
    result.termes = result.termes.filter(t => t.titre && !EXCLUDED_VOCABULARY_TERMS.includes((t.titre || '').toLowerCase()));
    
    // Trier les termes par ordre alphabétique
    result.termes.sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));
  }
  
  return result;
};