// Validateur multi-niveaux pour les imports OPUS
// Phase 1 : Validation syntaxique, sémantique et post-import

import { OpusImportSchema, OPUS_JSON_SCHEMA, DOMAINES_ETUDE } from './opusImportSchema';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  completeness_score: number;
  quality_score: number;
}

export interface ValidationContext {
  exploration_id?: string;
  marche_id?: string;
  strict_mode?: boolean;
}

export class OpusImportValidator {

  /**
   * Validation complète multi-niveaux
   */
  static async validate(
    data: OpusImportSchema, 
    context: ValidationContext = {}
  ): Promise<ValidationResult> {
    console.log('[OPUS Validator] Starting multi-level validation...', {
      dimensions: Object.keys(data.dimensions).length,
      sources: data.sources.length,
      has_fables: !!data.fables?.length,
      strict_mode: context.strict_mode
    });

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validation syntaxique (JSON Schema)
    const syntaxResult = this.validateSyntax(data);
    errors.push(...syntaxResult.errors);
    warnings.push(...syntaxResult.warnings);

    // 2. Validation sémantique (cohérence des données)
    const semanticResult = this.validateSemantics(data);
    errors.push(...semanticResult.errors);
    warnings.push(...semanticResult.warnings);

    // 3. Validation contextuelle (exploration/marche)
    if (context.exploration_id || context.marche_id) {
      const contextResult = await this.validateContext(data, context);
      errors.push(...contextResult.errors);
      warnings.push(...contextResult.warnings);
    }

    // 4. Calcul des scores de qualité
    const completeness_score = this.calculateCompleteness(data);
    const quality_score = this.calculateQuality(data, errors.length, warnings.length);

    const isValid = errors.length === 0;
    const score = Math.min(quality_score, 100);

    console.log('[OPUS Validator] Validation complete:', {
      isValid,
      errors: errors.length,
      warnings: warnings.length,
      completeness_score,
      quality_score: score
    });

    return {
      isValid,
      errors,
      warnings,
      score,
      completeness_score,
      quality_score: score
    };
  }

  /**
   * Validation syntaxique avec JSON Schema
   */
  private static validateSyntax(data: OpusImportSchema): { errors: string[], warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation structure de base
    if (!data.dimensions || Object.keys(data.dimensions).length === 0) {
      errors.push('Aucune dimension fournie dans le champ "dimensions"');
    }

    if (!data.sources || !Array.isArray(data.sources) || data.sources.length === 0) {
      errors.push('Le champ "sources" est requis et doit contenir au moins une source');
    }

    // Validation des dimensions individuelles
    for (const [key, dimension] of Object.entries(data.dimensions)) {
      if (!dimension) {
        warnings.push(`Dimension "${key}" vide ou nulle`);
        continue;
      }

      if (typeof dimension !== 'object') {
        errors.push(`Dimension "${key}" doit être un objet`);
        continue;
      }

      if (!dimension.description || typeof dimension.description !== 'string' || dimension.description.length < 10) {
        errors.push(`Dimension "${key}" nécessite une description d'au moins 10 caractères`);
      }

      if (!dimension.donnees || typeof dimension.donnees !== 'object' || Object.keys(dimension.donnees).length === 0) {
        errors.push(`Dimension "${key}" nécessite des données dans le champ "donnees"`);
      }
    }

    // Validation des sources
    if (Array.isArray(data.sources)) {
      data.sources.forEach((source, index) => {
        if (!source.titre || typeof source.titre !== 'string' || source.titre.length < 5) {
          errors.push(`Source ${index + 1}: titre requis (minimum 5 caractères)`);
        }

        if (!source.type || typeof source.type !== 'string') {
          errors.push(`Source ${index + 1}: type requis`);
        }

        if (source.fiabilite === null || source.fiabilite === undefined) {
          errors.push(`Source ${index + 1}: fiabilité requise`);
        } else if (typeof source.fiabilite === 'number' && (source.fiabilite < 0 || source.fiabilite > 100)) {
          errors.push(`Source ${index + 1}: fiabilité doit être entre 0 et 100`);
        }

        if (source.url && typeof source.url === 'string') {
          try {
            new URL(source.url);
          } catch {
            warnings.push(`Source ${index + 1}: URL possiblement invalide`);
          }
        }
      });
    }

    // Validation des fables
    if (data.fables && Array.isArray(data.fables)) {
      data.fables.forEach((fable, index) => {
        if (!fable.titre || typeof fable.titre !== 'string' || fable.titre.length < 5) {
          errors.push(`Fable ${index + 1}: titre requis (minimum 5 caractères)`);
        }

        if (!fable.contenu_principal || typeof fable.contenu_principal !== 'string' || fable.contenu_principal.length < 50) {
          errors.push(`Fable ${index + 1}: contenu principal requis (minimum 50 caractères)`);
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * Validation sémantique (cohérence des données)
   */
  private static validateSemantics(data: OpusImportSchema): { errors: string[], warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérification de la cohérence entre dimensions et fables
    if (data.fables && data.fables.length > 0) {
      const dimensionKeys = Object.keys(data.dimensions);
      
      for (const fable of data.fables) {
        if (fable.dimension && !dimensionKeys.includes(fable.dimension)) {
          warnings.push(`Fable "${fable.titre}" référence une dimension inexistante: "${fable.dimension}"`);
        }
      }
    }

    // Vérification des sources dans les dimensions
    for (const [dimensionKey, dimension] of Object.entries(data.dimensions)) {
      if (dimension?.donnees?.sources && Array.isArray(dimension.donnees.sources)) {
        const dimensionSourceTitles = dimension.donnees.sources;
        const globalSourceTitles = data.sources.map(s => s.titre);
        
        const missingRefs = dimensionSourceTitles.filter(ref => 
          typeof ref === 'string' && !globalSourceTitles.includes(ref)
        );
        
        if (missingRefs.length > 0) {
          warnings.push(`Dimension "${dimensionKey}" référence des sources non trouvées: ${missingRefs.join(', ')}`);
        }
      }
    }

    // Vérification de la couverture des domaines d'étude
    const presentDomains = Object.keys(data.dimensions);
    const missingDomains = DOMAINES_ETUDE.filter(domain => !presentDomains.includes(domain));
    
    if (missingDomains.length > 4) {
      warnings.push(`Plusieurs domaines d'étude manquants: ${missingDomains.slice(0, 3).join(', ')}...`);
    } else if (missingDomains.length > 0) {
      warnings.push(`Domaines d'étude manquants: ${missingDomains.join(', ')}`);
    }

    return { errors, warnings };
  }

  /**
   * Validation contextuelle (exploration/marche spécifique)
   */
  private static async validateContext(
    data: OpusImportSchema, 
    context: ValidationContext
  ): Promise<{ errors: string[], warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifications contextuelles basiques
    if (context.exploration_id && typeof context.exploration_id !== 'string') {
      errors.push('exploration_id doit être une chaîne de caractères valide');
    }

    if (context.marche_id && typeof context.marche_id !== 'string') {
      errors.push('marche_id doit être une chaîne de caractères valide');
    }

    // Mode strict : vérifications supplémentaires
    if (context.strict_mode) {
      if (Object.keys(data.dimensions).length < DOMAINES_ETUDE.length / 2) {
        errors.push(`Mode strict: au moins ${Math.ceil(DOMAINES_ETUDE.length / 2)} dimensions requises`);
      }

      if (data.sources.length < 3) {
        errors.push('Mode strict: au moins 3 sources requises');
      }

      if (!data.fables || data.fables.length === 0) {
        errors.push('Mode strict: au moins une fable narrative requise');
      }
    }

    return { errors, warnings };
  }

  /**
   * Calcul du score de complétude (% des domaines couverts)
   */
  private static calculateCompleteness(data: OpusImportSchema): number {
    const presentDomains = Object.keys(data.dimensions);
    const totalDomains = DOMAINES_ETUDE.length;
    
    // Score basé sur la présence ET la richesse des données
    let weightedScore = 0;
    
    for (const domain of presentDomains) {
      if (DOMAINES_ETUDE.includes(domain as any)) {
        const dimension = data.dimensions[domain as keyof typeof data.dimensions];
        if (dimension?.donnees && typeof dimension.donnees === 'object') {
          const dataPoints = Object.keys(dimension.donnees).length;
          // Score pondéré : présence (50%) + richesse (50%)
          const dimensionScore = 50 + Math.min(50, dataPoints * 10);
          weightedScore += dimensionScore;
        }
      }
    }

    return Math.round(weightedScore / totalDomains);
  }

  /**
   * Calcul du score de qualité global
   */
  private static calculateQuality(
    data: OpusImportSchema, 
    errorsCount: number, 
    warningsCount: number
  ): number {
    let score = 100;

    // Pénalités pour erreurs et warnings
    score -= errorsCount * 15; // -15 points par erreur
    score -= warningsCount * 5; // -5 points par warning

    // Bonus pour complétude
    const dimensionCount = Object.keys(data.dimensions).length;
    score += Math.min(dimensionCount * 3, 20); // Bonus jusqu'à +20 points

    // Bonus pour sources de qualité
    if (data.sources) {
      const avgReliability = data.sources.reduce((sum, s) => sum + (Number(s.fiabilite) || 0), 0) / data.sources.length;
      score += Math.round(avgReliability / 10); // Bonus basé sur fiabilité moyenne
    }

    // Bonus pour fables narratives
    if (data.fables && data.fables.length > 0) {
      score += Math.min(data.fables.length * 2, 10); // Bonus jusqu'à +10 points
    }

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Validation post-import (vérification en base de données)
   */
  static async validatePostImport(
    exploration_id: string, 
    marche_id: string
  ): Promise<{ success: boolean, issues: string[] }> {
    const issues: string[] = [];

    // Cette méthode pourrait être étendue pour vérifier l'intégrité 
    // des données après import en base
    
    console.log('[OPUS Validator] Post-import validation for:', { exploration_id, marche_id });

    // Placeholder pour futures vérifications post-import
    return { success: true, issues };
  }
}