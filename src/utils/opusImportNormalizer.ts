// Normalisateur intelligent pour les imports OPUS
// Phase 1 : Pré-processing intelligent avec auto-détection et correction

import { OpusImportSchema, DIMENSION_MAPPINGS, generateDimensionTemplate } from './opusImportSchema';

export interface NormalizationResult {
  normalized: OpusImportSchema;
  corrections: string[];
  warnings: string[];
}

export class OpusImportNormalizer {
  
  /**
   * Normalisation complète des données d'import avec auto-correction
   */
  static normalize(rawData: any): NormalizationResult {
    const corrections: string[] = [];
    const warnings: string[] = [];
    
    console.log('[OPUS Normalizer] Starting normalization...', {
      hasData: !!rawData,
      keys: rawData ? Object.keys(rawData) : []
    });

    // 1. Structure de base
    const normalized: OpusImportSchema = {
      dimensions: {},
      fables: rawData.fables || [],
      sources: rawData.sources || [],
      metadata: rawData.metadata || {}
    };

    // 2. Validation et correction de la structure principale
    if (!rawData.dimensions && !rawData.donnees) {
      throw new Error('Structure invalide: aucune donnée de dimensions trouvée');
    }

    // 3. Normalisation des dimensions
    const dimensionsData = rawData.dimensions || rawData.donnees || {};
    const { normalizedDimensions, dimensionCorrections } = this.normalizeDimensions(dimensionsData);
    normalized.dimensions = normalizedDimensions;
    corrections.push(...dimensionCorrections);

    // 4. Auto-correction des fables mal placées
    if ((dimensionsData as any).fables && Array.isArray((dimensionsData as any).fables)) {
      normalized.fables = [...(normalized.fables || []), ...(dimensionsData as any).fables];
      corrections.push('Fables déplacées automatiquement des dimensions vers le niveau racine');
      delete (normalized.dimensions as any).fables;
    }

    // 5. Normalisation des sources
    const { normalizedSources, sourceCorrections } = this.normalizeSources(normalized.sources);
    normalized.sources = normalizedSources;
    corrections.push(...sourceCorrections);

    // 6. Auto-génération des métadonnées manquantes
    const { enrichedMetadata, metadataCorrections } = this.enrichMetadata(normalized.metadata);
    normalized.metadata = enrichedMetadata;
    corrections.push(...metadataCorrections);

    // 7. Validation finale et détection d'anomalies
    const validationWarnings = this.detectAnomalies(normalized);
    warnings.push(...validationWarnings);

    console.log('[OPUS Normalizer] Normalization complete:', {
      dimensions: Object.keys(normalized.dimensions).length,
      corrections: corrections.length,
      warnings: warnings.length
    });

    return { normalized, corrections, warnings };
  }

  /**
   * Normalisation intelligente des dimensions avec mapping automatique
   */
  private static normalizeDimensions(dimensions: any): { 
    normalizedDimensions: OpusImportSchema['dimensions']; 
    dimensionCorrections: string[];
  } {
    const normalized: OpusImportSchema['dimensions'] = {};
    const corrections: string[] = [];

    for (const [key, value] of Object.entries(dimensions)) {
      if (!value || typeof value !== 'object') continue;

      // Mapping automatique des noms de dimensions
      let normalizedKey = key;
      
      // 1. Mapping direct
      if (key in DIMENSION_MAPPINGS) {
        const mapped = DIMENSION_MAPPINGS[key as keyof typeof DIMENSION_MAPPINGS];
        if (typeof mapped === 'string') {
          normalizedKey = mapped;
          corrections.push(`Dimension "${key}" mappée automatiquement vers "${mapped}"`);
        } else if (Array.isArray(mapped)) {
          // Cas spécial pour agroecologie -> split en deux dimensions
          const agroData = value as any;
          if (agroData.donnees) {
            // Leviers agroécologiques
            normalized.leviers_agroecologiques = {
              description: agroData.description || "Leviers agroécologiques disponibles",
              donnees: {
                pratiques_agricoles: agroData.donnees.pratiques_agricoles || [],
                cultures: agroData.donnees.cultures || [],
                elevage: agroData.donnees.elevage || [],
                biodiversite_cultivee: agroData.donnees.biodiversite_cultivee || [],
                leviers_agroecologiques: agroData.donnees.leviers_agroecologiques || [],
                sources: agroData.donnees.sources || []
              }
            };
            
            // Nouvelles activités
            normalized.nouvelles_activites = {
              description: "Activités à développer identifiées",
              donnees: {
                activites_a_developper: agroData.donnees.activites_a_developper || [],
                sources: agroData.donnees.sources || []
              }
            };
            
            corrections.push(`Dimension "${key}" divisée automatiquement en "leviers_agroecologiques" et "nouvelles_activites"`);
            continue;
          }
        }
      }

      // 2. Détection fuzzy pour noms similaires
      if (!DIMENSION_MAPPINGS[key as keyof typeof DIMENSION_MAPPINGS]) {
        const fuzzyMatch = this.findFuzzyDimensionMatch(key);
        if (fuzzyMatch) {
          normalizedKey = fuzzyMatch;
          corrections.push(`Dimension "${key}" corrigée automatiquement vers "${fuzzyMatch}" (détection fuzzy)`);
        }
      }

      // 3. Normalisation de la structure de la dimension
      normalized[normalizedKey as keyof OpusImportSchema['dimensions']] = this.normalizeDimensionStructure(value, normalizedKey);
    }

    return { normalizedDimensions: normalized, dimensionCorrections: corrections };
  }

  /**
   * Détection fuzzy des noms de dimensions similaires
   */
  private static findFuzzyDimensionMatch(input: string): string | null {
    const candidates = [
      'contexte_hydrologique',
      'especes_caracteristiques',
      'vocabulaire_local', 
      'empreintes_humaines',
      'projection_2035_2045',
      'leviers_agroecologiques',
      'nouvelles_activites',
      'technodiversite'
    ];

    const inputLower = input.toLowerCase().replace(/[_\s-]/g, '');
    
    for (const candidate of candidates) {
      const candidateLower = candidate.toLowerCase().replace(/[_\s-]/g, '');
      
      // Correspondance partielle (contient)
      if (inputLower.includes(candidateLower.slice(0, 6)) || 
          candidateLower.includes(inputLower.slice(0, 6))) {
        return candidate;
      }
      
      // Similarité de Levenshtein simple
      const similarity = this.calculateSimilarity(inputLower, candidateLower);
      if (similarity > 0.7) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Calcul de similarité simple entre deux chaînes
   */
  private static calculateSimilarity(a: string, b: string): number {
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1;
    
    let matches = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] === b[i]) matches++;
    }
    
    return matches / maxLength;
  }

  /**
   * Normalisation de la structure d'une dimension individuelle
   */
  private static normalizeDimensionStructure(dimensionData: any, dimensionKey: string): any {
    // Si la dimension n'a pas la structure attendue, essayer de la réparer
    if (!dimensionData.description || !dimensionData.donnees) {
      
      // Cas 1: données directement dans la racine
      if (typeof dimensionData === 'object' && !dimensionData.description && !dimensionData.donnees) {
        return {
          description: `Données pour ${dimensionKey}`,
          donnees: dimensionData
        };
      }
      
      // Cas 2: structure partiellement correcte
      if (dimensionData.description && !dimensionData.donnees) {
        const { description, ...donneesRest } = dimensionData;
        return {
          description,
          donnees: donneesRest
        };
      }
      
      // Cas 3: utiliser le template par défaut
      const template = generateDimensionTemplate(dimensionKey);
      return {
        ...template,
        donnees: { ...template.donnees, ...dimensionData }
      };
    }

    return dimensionData;
  }

  /**
   * Normalisation des sources avec auto-correction
   */
  private static normalizeSources(sources: any[]): {
    normalizedSources: OpusImportSchema['sources'];
    sourceCorrections: string[];
  } {
    const normalized: OpusImportSchema['sources'] = [];
    const corrections: string[] = [];

    if (!Array.isArray(sources)) {
      corrections.push('Sources converties de objet vers tableau');
      sources = [sources].filter(Boolean);
    }

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      if (!source || typeof source !== 'object') continue;

      const normalizedSource: any = { ...source };

      // Auto-correction des URLs Markdown
      if (normalizedSource.url && typeof normalizedSource.url === 'string') {
        const markdownMatch = normalizedSource.url.match(/\[.*?\]\((https?:\/\/[^)]+)\)/);
        if (markdownMatch) {
          normalizedSource.url = markdownMatch[1];
          corrections.push(`Source ${i + 1}: URL Markdown convertie en URL brute`);
        }
      }

      // Auto-correction du type manquant
      if (!normalizedSource.type) {
        normalizedSource.type = normalizedSource.url ? 'web' : 'documentation';
        corrections.push(`Source ${i + 1}: type manquant, défini automatiquement à "${normalizedSource.type}"`);
      }

      // Normalisation de la fiabilité
      if (normalizedSource.fiabilite !== null && normalizedSource.fiabilite !== undefined) {
        if (typeof normalizedSource.fiabilite === 'string') {
          const fiabiliteMap: { [key: string]: number } = {
            'très haute': 95, 'haute': 85, 'moyenne': 70, 'faible': 50, 'très faible': 30
          };
          const mapped = fiabiliteMap[normalizedSource.fiabilite.toLowerCase()];
          if (mapped) {
            normalizedSource.fiabilite = mapped;
            corrections.push(`Source ${i + 1}: fiabilité convertie de "${source.fiabilite}" vers ${mapped}`);
          }
        }
        normalizedSource.fiabilite = Math.max(0, Math.min(100, Number(normalizedSource.fiabilite) || 70));
      } else {
        normalizedSource.fiabilite = 70;
        corrections.push(`Source ${i + 1}: fiabilité manquante, définie par défaut à 70`);
      }

      // Auto-correction de la date d'accès
      if (!normalizedSource.date_acces) {
        normalizedSource.date_acces = new Date().toISOString().split('T')[0];
        corrections.push(`Source ${i + 1}: date_acces manquante, définie à aujourd'hui`);
      }

      normalized.push(normalizedSource);
    }

    return { normalizedSources: normalized, sourceCorrections: corrections };
  }

  /**
   * Enrichissement automatique des métadonnées
   */
  private static enrichMetadata(metadata: any): {
    enrichedMetadata: OpusImportSchema['metadata'];
    metadataCorrections: string[];
  } {
    const enriched = { ...metadata };
    const corrections: string[] = [];

    const currentDate = new Date().toISOString().split('T')[0];
    const currentDateTime = new Date().toISOString();

    if (!enriched.sourcing_date) {
      enriched.sourcing_date = currentDate;
      corrections.push('Métadonnée sourcing_date auto-générée');
    }

    if (!enriched.import_date) {
      enriched.import_date = currentDateTime;
      corrections.push('Métadonnée import_date auto-générée');
    }

    if (!enriched.ai_model) {
      enriched.ai_model = 'system-managed';
      corrections.push('Métadonnée ai_model définie par défaut');
    }

    if (!enriched.validation_level) {
      enriched.validation_level = 'automatique';
      corrections.push('Métadonnée validation_level définie par défaut');
    }

    return { enrichedMetadata: enriched, metadataCorrections: corrections };
  }

  /**
   * Détection d'anomalies et warnings
   */
  private static detectAnomalies(data: OpusImportSchema): string[] {
    const warnings: string[] = [];

    // Vérifications de cohérence
    if (Object.keys(data.dimensions).length < 3) {
      warnings.push('Peu de dimensions renseignées (< 3), données possiblement incomplètes');
    }

    if (data.sources.length < 2) {
      warnings.push('Peu de sources référencées (< 2), fiabilité potentiellement limitée');
    }

    if (!data.fables || data.fables.length === 0) {
      warnings.push('Aucune fable narrative fournie, contenu littéraire manquant');
    }

    // Vérifications de qualité des sources
    const lowReliabilitySources = data.sources.filter(s => s.fiabilite < 50).length;
    if (lowReliabilitySources > 0) {
      warnings.push(`${lowReliabilitySources} source(s) avec fiabilité faible (< 50)`);
    }

    return warnings;
  }
}