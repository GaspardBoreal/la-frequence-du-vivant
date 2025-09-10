import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Phase 1 améliorations : Import robuste et fiable
console.log('[OPUS Import AI] Phase 1 - Import Engine v2.0 loaded');

interface ImportData {
  exploration_id: string;
  marche_id: string;
  dimensions: {
    contexte_hydrologique?: any;
    especes_caracteristiques?: any;
    vocabulaire_local?: any;
    empreintes_humaines?: any;
    infrastructures_techniques?: any; // Will be mapped to empreintes_humaines
    projection_2035_2045?: any;
    leviers_agroecologiques?: any;
    nouvelles_activites?: any;
    agroecologie?: any; // Will be split into leviers + nouvelles_activites
    technodiversite?: any;
  };
  fables?: Array<{
    titre: string;
    contenu_principal: string;
    variations: any;
    dimensions_associees: string[];
    tags: any[];
    inspiration_sources: any;
  }>;
  sources: Array<{
    titre: string;
    type: string;
    url?: string;
    auteur?: string;
    date_publication?: string;
    fiabilite: number;
    references?: any;
  }>;
  metadata?: {
    // Métadonnées optionnelles - seront générées automatiquement
    [key: string]: any;
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

// Phase 1 - Normalisateur intelligent avancé
function normalizeDimensions(dimensions: any): any {
  const normalized = { ...dimensions };
  const corrections: string[] = [];
  
  console.log('[OPUS Import] Phase 1 - Advanced normalization starting...', {
    inputKeys: Object.keys(dimensions)
  });
  
  // 1. infrastructures_techniques → empreintes_humaines (robuste)
  if (normalized.infrastructures_techniques) {
    console.log('[OPUS Import] Mapping infrastructures_techniques → empreintes_humaines');
    normalized.empreintes_humaines = normalized.infrastructures_techniques;
    delete normalized.infrastructures_techniques;
    corrections.push('infrastructures_techniques → empreintes_humaines');
  }
  
  // 2. agroecologie → split intelligent avec fallbacks
  if (normalized.agroecologie) {
    console.log('[OPUS Import] Smart splitting agroecologie...');
    const agro = normalized.agroecologie;
    
    if (agro.donnees || typeof agro === 'object') {
      const donnees = agro.donnees || agro;
      
      // Leviers agroécologiques avec structure garantie
      normalized.leviers_agroecologiques = {
        description: agro.description || "Leviers agroécologiques disponibles sur le territoire",
        donnees: {
          pratiques_agricoles: donnees.pratiques_agricoles || donnees.pratiques || [],
          cultures: donnees.cultures || donnees.types_cultures || [],
          elevage: donnees.elevage || donnees.systemes_elevage || [],
          biodiversite_cultivee: donnees.biodiversite_cultivee || donnees.varietes_locales || [],
          leviers_agroecologiques: donnees.leviers_agroecologiques || donnees.leviers || [],
          sources: donnees.sources || []
        }
      };
      
      // Nouvelles activités avec extraction intelligente
      normalized.nouvelles_activites = {
        description: "Activités économiques à développer dans une perspective agroécologique",
        donnees: {
          activites_a_developper: donnees.activites_a_developper || donnees.nouvelles_activites || donnees.projets || [],
          partenariats_possibles: donnees.partenariats_possibles || donnees.partenaires || [],
          financement_potentiel: donnees.financement_potentiel || donnees.financements || [],
          sources: donnees.sources || []
        }
      };
      
      corrections.push('agroecologie → leviers_agroecologiques + nouvelles_activites');
    }
    
    delete normalized.agroecologie;
  }
  
  // 3. Détection et correction de noms alternatifs courants
  const alternativeNames: { [key: string]: string } = {
    'contexte': 'contexte_hydrologique',
    'especes': 'especes_caracteristiques',
    'vocabulaire': 'vocabulaire_local',
    'infrastructures': 'empreintes_humaines',
    'projection': 'projection_2035_2045',
    'leviers': 'leviers_agroecologiques',
    'activites': 'nouvelles_activites',
    'techno': 'technodiversite',
    'technodiversité': 'technodiversite'
  };
  
  for (const [alt, canonical] of Object.entries(alternativeNames)) {
    if (normalized[alt] && !normalized[canonical]) {
      normalized[canonical] = normalized[alt];
      delete normalized[alt];
      corrections.push(`${alt} → ${canonical}`);
    }
  }
  
  // 4. Validation et structure garantie pour chaque dimension
  for (const [key, value] of Object.entries(normalized)) {
    if (value && typeof value === 'object') {
      // Assurer structure {description, donnees}
      if (!value.description && !value.donnees) {
        // Données directement dans la racine
        normalized[key] = {
          description: `Données contextuelles pour ${key}`,
          donnees: value
        };
        corrections.push(`Structure normalisée pour ${key}`);
      } else if (value.description && !value.donnees) {
        // Description présente mais données manquantes
        const { description, ...rest } = value;
        normalized[key] = {
          description,
          donnees: rest
        };
        corrections.push(`Données extraites pour ${key}`);
      }
    }
  }
  
  console.log('[OPUS Import] Phase 1 normalization complete:', {
    corrections: corrections.length,
    outputKeys: Object.keys(normalized),
    correctionDetails: corrections
  });
  
  return normalized;
}

// Fonction de sanitisation des données
function sanitizeData(data: ImportData): ImportData {
  const sanitized = { ...data };
  
  // Sanitiser les sources
  if (sanitized.sources) {
    sanitized.sources = sanitized.sources.map(source => {
      const clean = { ...source };
      
      // Convertir URLs Markdown en URLs brutes
      if (clean.url && typeof clean.url === 'string') {
        const markdownMatch = clean.url.match(/\[.*?\]\((https?:\/\/[^)]+)\)/);
        if (markdownMatch) {
          clean.url = markdownMatch[1];
        }
      }
      
      // Normaliser fiabilite
      if (clean.fiabilite !== null && clean.fiabilite !== undefined) {
        if (typeof clean.fiabilite === 'string') {
          const fiabiliteMap: { [key: string]: number } = {
            'très haute': 90, 'haute': 80, 'moyenne': 60, 'faible': 40, 'très faible': 20
          };
          clean.fiabilite = fiabiliteMap[clean.fiabilite.toLowerCase()] || 70;
        }
        clean.fiabilite = Math.max(0, Math.min(100, Number(clean.fiabilite) || 70));
      }
      
      // Normaliser date_acces
      if (clean.date_acces && typeof clean.date_acces === 'string') {
        const isoMatch = clean.date_acces.match(/^\d{4}-\d{2}-\d{2}$/);
        if (!isoMatch) {
          const today = new Date();
          clean.date_acces = today.toISOString().split('T')[0];
        }
      }
      
      return clean;
    });
  }
  
  return sanitized;
}

// Phase 1 - Validation multi-niveaux robuste
async function validateImportData(data: ImportData): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100; // Commencer à 100 et décrémenter

  console.log('[OPUS Import] Phase 1 - Multi-level validation starting...', {
    hasData: !!data,
    dimensionsCount: data.dimensions ? Object.keys(data.dimensions).length : 0,
    sourcesCount: data.sources ? data.sources.length : 0
  });

  // 1. Sanitisation automatique avancée
  try {
    data = sanitizeData(data);
    console.log('[OPUS Import] Data sanitization complete');
  } catch (sanitizeError) {
    errors.push(`Erreur de sanitisation: ${sanitizeError.message}`);
    score -= 20;
  }

  // 2. Normalisation intelligente des dimensions
  try {
    data.dimensions = normalizeDimensions(data.dimensions);
    console.log('[OPUS Import] Dimension normalization complete');
  } catch (normalizeError) {
    errors.push(`Erreur de normalisation: ${normalizeError.message}`);
    score -= 25;
  }

  // 3. Validation obligatoire stricte
  if (!data.exploration_id || typeof data.exploration_id !== 'string') {
    errors.push("exploration_id manquant ou invalide");
    score -= 30;
  }
  if (!data.marche_id || typeof data.marche_id !== 'string') {
    errors.push("marche_id manquant ou invalide");
    score -= 30;
  }
  if (!data.dimensions || Object.keys(data.dimensions).length === 0) {
    errors.push("Aucune dimension fournie");
    score -= 40;
  }
  if (!data.sources || !Array.isArray(data.sources) || data.sources.length === 0) {
    errors.push("Au moins une source est requise");
    score -= 20;
  }

  // 4. Auto-génération intelligente des métadonnées
  if (!data.metadata) {
    console.log('[OPUS Import] Auto-génération des métadonnées complètes');
    data.metadata = {};
  }
  
  const currentDate = new Date().toISOString().split('T')[0];
  const currentDateTime = new Date().toISOString();
  
  // Métadonnées système avec horodatage précis
  data.metadata.sourcing_date = data.metadata.sourcing_date || currentDate;
  data.metadata.import_date = currentDateTime;
  data.metadata.ai_model = 'opus-import-ai-v2';
  data.metadata.validation_level = 'automatique-phase1';
  data.metadata.import_engine_version = '2.0';

  // 5. Auto-correction avancée des structures
  if (data.dimensions) {
    // Déplacement intelligent des fables mal placées
    Object.keys(data.dimensions).forEach(key => {
      const dimension = data.dimensions[key];
      if (dimension?.fables && Array.isArray(dimension.fables)) {
        console.log(`[OPUS Import] Auto-correction: fables trouvées dans dimension "${key}"`);
        data.fables = [...(data.fables || []), ...dimension.fables];
        delete dimension.fables;
        warnings.push(`Fables déplacées automatiquement de la dimension "${key}" vers le niveau racine`);
      }
    });

    // Validation de cohérence des dimensions
    const dimensionKeys = Object.keys(data.dimensions);
    const validDomains = ['contexte_hydrologique', 'especes_caracteristiques', 'vocabulaire_local', 
                         'empreintes_humaines', 'projection_2035_2045', 'leviers_agroecologiques', 
                         'nouvelles_activites', 'technodiversite'];
    
    const invalidDimensions = dimensionKeys.filter(key => !validDomains.includes(key));
    if (invalidDimensions.length > 0) {
      warnings.push(`Dimensions non standard détectées: ${invalidDimensions.join(', ')}`);
      score -= invalidDimensions.length * 5;
    }
  }

  // 6. Validation et auto-correction des sources
  if (Array.isArray(data.sources)) {
    data.sources.forEach((source, index) => {
      if (!source.titre || source.titre.length < 5) {
        errors.push(`Source ${index + 1}: titre requis (minimum 5 caractères)`);
        score -= 10;
      }
      
      // Auto-correction du type avec intelligence
      if (!source.type) {
        source.type = source.url ? "web" : "documentation";
        warnings.push(`Source ${index + 1}: type auto-détecté à "${source.type}"`);
      }
      
      // Normalisation avancée de la fiabilité
      if (source.fiabilite !== null && source.fiabilite !== undefined) {
        if (typeof source.fiabilite === 'string') {
          const fiabiliteMap: { [key: string]: number } = {
            'très haute': 95, 'haute': 85, 'élevée': 85, 'moyenne': 70, 
            'modérée': 60, 'faible': 45, 'très faible': 25, 'basse': 30
          };
          const normalized = fiabiliteMap[source.fiabilite.toLowerCase()];
          if (normalized) {
            source.fiabilite = normalized;
            warnings.push(`Source ${index + 1}: fiabilité convertie vers ${normalized}`);
          } else {
            source.fiabilite = 70; // Valeur par défaut
            warnings.push(`Source ${index + 1}: fiabilité non reconnue, définie à 70`);
          }
        }
        source.fiabilite = Math.max(0, Math.min(100, Number(source.fiabilite) || 70));
      } else {
        source.fiabilite = 70;
        warnings.push(`Source ${index + 1}: fiabilité manquante, définie à 70`);
      }

      // Auto-correction date d'accès
      if (!source.date_acces) {
        source.date_acces = currentDate;
        warnings.push(`Source ${index + 1}: date d'accès auto-générée`);
      }
    });
  }

  // 7. Calcul intelligent des scores de qualité
  const dimensionCount = data.dimensions ? Object.keys(data.dimensions).length : 0;
  
  // Bonus pour complétude des dimensions
  if (dimensionCount >= 6) score += 10;
  else if (dimensionCount >= 4) score += 5;
  else if (dimensionCount < 2) score -= 15;

  // Bonus pour fables narratives
  if (data.fables && data.fables.length > 0) {
    score += Math.min(data.fables.length * 3, 15);
  } else {
    warnings.push("Aucune fable narrative fournie - contenu littéraire manquant");
    score -= 10;
  }

  // Bonus pour qualité des sources
  if (data.sources && data.sources.length >= 3) {
    const avgReliability = data.sources.reduce((sum, s) => sum + (Number(s.fiabilite) || 0), 0) / data.sources.length;
    if (avgReliability >= 80) score += 5;
    else if (avgReliability < 50) score -= 10;
  }

  // 8. Calcul final des scores
  const completudeScore = await calculateCompletude(data.dimensions);
  const finalScore = Math.max(0, Math.min(score, 100));
  
  // Injection des scores dans les métadonnées
  data.metadata.quality_score = finalScore;
  data.metadata.completeness_score = completudeScore;
  data.metadata.dimension_count = dimensionCount;
  data.metadata.source_count = data.sources ? data.sources.length : 0;
  data.metadata.fable_count = data.fables ? data.fables.length : 0;
  
  console.log('[OPUS Import] Phase 1 validation complete:', {
    isValid: errors.length === 0,
    errors: errors.length,
    warnings: warnings.length,
    quality_score: finalScore,
    completeness_score: completudeScore,
    dimensions: dimensionCount
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: finalScore
  };
}

async function calculateCompletude(dimensions: any): Promise<number> {
  const totalDimensions = 8;
  const filledDimensions = Object.values(dimensions).filter(d => 
    d && typeof d === 'object' && Object.keys(d).length > 0
  ).length;
  
  return Math.round((filledDimensions / totalDimensions) * 100);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: importData, preview = false } = await req.json() as { 
      data: ImportData; 
      preview?: boolean; 
    };

    console.log(`[OPUS Import] Mode: ${preview ? 'Preview' : 'Import'}, Marche: ${importData.marche_id}`);

    // Validation des données
    const validation = await validateImportData(importData);
    
    // Log de l'import dans opus_import_runs pour historique
    const logImportRun = async (status: 'success' | 'error', errorMessage?: string, completudeScore?: number) => {
      try {
        await supabase.from('opus_import_runs').insert({
          mode: preview ? 'preview' : 'import',
          status,
          opus_id: importData.exploration_id,
          marche_id: importData.marche_id,
          completude_score: completudeScore,
          validation,
          request_payload: { data: importData, preview },
          source: 'opus-import-ai',
          error_message: errorMessage
        });
      } catch (logError) {
        console.warn('[OPUS Import] Failed to log import run:', logError);
      }
    };
    
    if (!validation.isValid) {
      await logImportRun('error', `Validation failed: ${validation.errors.join(', ')}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Mode preview - retourne seulement la validation
    if (preview) {
      console.log('[OPUS Import] Preview mode - using calculated metadata...');
      
      console.log('[OPUS Import] Preview response:', {
        validation_score: validation.score,
        completude_score: importData.metadata?.completeness_score,
        quality_score: importData.metadata?.quality_score,
        dimensions_count: Object.keys(importData.dimensions || {}).length,
        fables_count: importData.fables?.length || 0,
        sources_count: importData.sources?.length || 0
      });
      
      await logImportRun('success', undefined, importData.metadata?.completeness_score);
      
      return new Response(
        JSON.stringify({
          success: true,
          validation,
          preview: {
            dimensions_count: Object.keys(importData.dimensions || {}).length,
            fables_count: importData.fables?.length || 0,
            sources_count: importData.sources?.length || 0,
            completude_score: Math.round(importData.metadata?.completeness_score || 0),
            quality_score: importData.metadata?.quality_score || 0
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Import réel - transaction atomique
    const { error: transactionError } = await supabase.rpc('import_ai_data_transaction', {
      import_data: importData
    });

    if (transactionError) {
      console.error('[OPUS Import] Transaction Error:', transactionError);
      
      // Fallback: import manuel par étapes
      let contextCreated = false;
      let fablesCreated = 0;

      try {
        // 1. Créer/Mettre à jour le contexte hybride avec whitelist des colonnes
        const completude = await calculateCompletude(importData.dimensions);
        
        // Whitelist des colonnes connues dans marche_contextes_hybrids
        const allowedColumns = [
          'contexte_hydrologique', 'especes_caracteristiques', 'vocabulaire_local',
          'empreintes_humaines', 'leviers_agroecologiques', 'nouvelles_activites',
          'projection_2035_2045', 'technodiversite', 'ia_fonctionnalites'
        ];
        
        const cleanDimensions: any = {};
        Object.keys(importData.dimensions).forEach(key => {
          if (allowedColumns.includes(key)) {
            cleanDimensions[key] = importData.dimensions[key];
          } else {
            console.warn(`[OPUS Import] Dimension ignorée (non supportée): ${key}`);
          }
        });
        
        const { error: contextError } = await supabase
          .from('marche_contextes_hybrids')
          .upsert({
            marche_id: importData.marche_id,
            opus_id: importData.exploration_id,
            ...cleanDimensions,
            completude_score: completude,
            sources: importData.sources,
            last_validation: new Date().toISOString()
          }, {
            onConflict: 'marche_id,opus_id'
          });

        if (contextError) throw contextError;
        contextCreated = true;

        // 2. Créer les fables si présentes
        if (importData.fables && importData.fables.length > 0) {
          for (const fable of importData.fables) {
            const { error: fableError } = await supabase
              .from('fables_narratives')
              .insert({
                marche_id: importData.marche_id,
                opus_id: importData.exploration_id,
                titre: fable.titre,
                contenu_principal: fable.contenu_principal,
                variations: fable.variations,
                dimensions_associees: fable.dimensions_associees,
                tags: fable.tags,
                inspiration_sources: fable.inspiration_sources,
                statut: 'draft'
              });

            if (!fableError) fablesCreated++;
          }
        }

        console.log(`[OPUS Import] Success: Context=${contextCreated}, Fables=${fablesCreated}`);
        
        const finalCompletude = await calculateCompletude(importData.dimensions);
        await logImportRun('success', undefined, finalCompletude);

        return new Response(
          JSON.stringify({
            success: true,
            imported: {
              context: contextCreated,
              fables: fablesCreated,
              sources: importData.sources.length
            },
            validation,
            completude_score: finalCompletude
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      } catch (fallbackError) {
        console.error('[OPUS Import] Fallback Error:', fallbackError);
        await logImportRun('error', `Fallback error: ${fallbackError.message}`);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Erreur lors de l\'import',
            details: fallbackError.message,
            hint: fallbackError.message.includes('column') ? 
              'Certaines dimensions ne sont pas supportées. Utilisez: contexte_hydrologique, especes_caracteristiques, vocabulaire_local, empreintes_humaines, leviers_agroecologiques, nouvelles_activites, technodiversite' : 
              'Erreur technique lors de l\'import',
            partial_import: {
              context: contextCreated,
              fables: fablesCreated
            }
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Transaction réussie
    const finalCompletude = await calculateCompletude(importData.dimensions);
    await logImportRun('success', undefined, finalCompletude);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Import IA réalisé avec succès',
        validation,
        completude_score: finalCompletude
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[OPUS Import] Error:', error);
    
    // Log l'erreur globale si possible (si on a les données importData)
    try {
      const { data: importData } = await req.json() as { data: ImportData };
      await logImportRun('error', `Server error: ${error.message}`);
    } catch (logError) {
      console.warn('[OPUS Import] Could not log global error:', logError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erreur serveur',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});