import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

// Fonction de normalisation des dimensions
function normalizeDimensions(dimensions: any): any {
  const normalized = { ...dimensions };
  
  // 1. infrastructures_techniques → empreintes_humaines
  if (normalized.infrastructures_techniques) {
    console.log('[OPUS Import] Mapping infrastructures_techniques → empreintes_humaines');
    normalized.empreintes_humaines = normalized.infrastructures_techniques;
    delete normalized.infrastructures_techniques;
  }
  
  // 2. agroecologie → split entre leviers_agroecologiques et nouvelles_activites
  if (normalized.agroecologie) {
    console.log('[OPUS Import] Splitting agroecologie into leviers_agroecologiques + nouvelles_activites');
    const agro = normalized.agroecologie;
    
    // Extraire les leviers agroécologiques
    if (agro.donnees) {
      const leviers = {
        description: agro.description || "Leviers agroécologiques disponibles",
        donnees: {
          pratiques_agricoles: agro.donnees.pratiques_agricoles || [],
          cultures: agro.donnees.cultures || [],
          elevage: agro.donnees.elevage || [],
          biodiversite_cultivee: agro.donnees.biodiversite_cultivee || [],
          leviers_agroecologiques: agro.donnees.leviers_agroecologiques || [],
          sources: agro.donnees.sources || []
        }
      };
      
      // Extraire les nouvelles activités
      const nouvelles = {
        description: "Activités à développer identifiées",
        donnees: {
          activites_a_developper: agro.donnees.activites_a_developper || [],
          sources: agro.donnees.sources || []
        }
      };
      
      normalized.leviers_agroecologiques = leviers;
      normalized.nouvelles_activites = nouvelles;
    }
    
    delete normalized.agroecologie;
  }
  
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

async function validateImportData(data: ImportData): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Sanitisation automatique des données
  data = sanitizeData(data);

  // Normalisation des dimensions
  data.dimensions = normalizeDimensions(data.dimensions);

  // Validation obligatoire
  if (!data.exploration_id) errors.push("exploration_id manquant");
  if (!data.marche_id) errors.push("marche_id manquant");
  if (!data.dimensions) errors.push("dimensions manquantes");
  if (!data.sources || data.sources.length === 0) errors.push("sources manquantes");
  
  // Auto-génération des métadonnées si manquantes
  if (!data.metadata) {
    console.log('[OPUS Import] Auto-génération des métadonnées');
    data.metadata = {};
  }
  
  // Injection automatique des métadonnées système
  const currentDate = new Date().toISOString().split('T')[0];
  data.metadata.sourcing_date = currentDate;
  data.metadata.import_date = new Date().toISOString();
  data.metadata.ai_model = 'system-managed';
  data.metadata.validation_level = 'automatique';

  // Auto-correction: déplacer fables hors de dimensions si nécessaire
  if (data.dimensions?.fables && Array.isArray(data.dimensions.fables)) {
    console.log('[OPUS Import] Auto-correction: déplacement des fables hors de dimensions');
    data.fables = data.dimensions.fables;
    delete data.dimensions.fables;
    warnings.push("Fables déplacées automatiquement du niveau dimensions vers le niveau racine");
  }

  // Calcul automatique du score de qualité basé sur le contenu
  const dimensionCount = Object.keys(data.dimensions || {}).length;
  score += Math.min(dimensionCount * 10, 80); // Max 80 points pour les dimensions

  if (data.fables && data.fables.length > 0) score += 10;
  if (data.sources.length >= 3) score += 10;

  // Injection automatique des scores calculés
  data.metadata.quality_score = Math.min(score, 100);
  const completudeScore = await calculateCompletude(data.dimensions);
  data.metadata.completeness_score = completudeScore;
  
  console.log('[OPUS Import] Métadonnées auto-générées:', {
    sourcing_date: data.metadata.sourcing_date,
    quality_score: data.metadata.quality_score,
    completeness_score: data.metadata.completeness_score
  });

  // Auto-correction et validation des sources
  data.sources?.forEach((source, index) => {
    if (!source.titre) errors.push(`Source ${index + 1}: titre manquant`);
    
    // Auto-correction du type manquant
    if (!source.type) {
      source.type = "web";
      warnings.push(`Source ${index + 1}: type manquant, défini automatiquement à "web"`);
    }
    
    // Auto-correction de la fiabilité
    if (typeof source.fiabilite === 'string') {
      // Conversion des valeurs textuelles en nombres
      const fiabiliteMap: { [key: string]: number } = {
        'très haute': 90, 'haute': 80, 'moyenne': 60, 'faible': 40, 'très faible': 20
      };
      const newFiabilite = fiabiliteMap[source.fiabilite.toLowerCase()] || 70;
      source.fiabilite = newFiabilite;
      warnings.push(`Source ${index + 1}: fiabilité convertie de "${source.fiabilite}" vers ${newFiabilite}`);
    }
    
    if (source.fiabilite < 0 || source.fiabilite > 100) {
      source.fiabilite = Math.max(0, Math.min(100, source.fiabilite || 70));
      warnings.push(`Source ${index + 1}: fiabilité corrigée à ${source.fiabilite}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.min(score, 100)
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
          'projection_2035_2045', 'technodiversite'
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