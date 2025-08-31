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
    projection_2035_2045?: any;
    leviers_agroecologiques?: any;
    nouvelles_activites?: any;
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
    references: any;
  }>;
  metadata: {
    ai_model: string;
    sourcing_date: string;
    validation_level: string;
    quality_score: number;
    completeness_score: number;
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

function validateImportData(data: ImportData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Validation obligatoire
  if (!data.exploration_id) errors.push("exploration_id manquant");
  if (!data.marche_id) errors.push("marche_id manquant");
  if (!data.dimensions) errors.push("dimensions manquantes");
  if (!data.sources || data.sources.length === 0) errors.push("sources manquantes");
  if (!data.metadata) errors.push("metadata manquantes");

  // Calcul du score de qualité
  const dimensionCount = Object.keys(data.dimensions || {}).length;
  score += Math.min(dimensionCount * 10, 80); // Max 80 points pour les dimensions

  if (data.fables && data.fables.length > 0) score += 10;
  if (data.sources.length >= 3) score += 10;

  // Validation des sources
  data.sources?.forEach((source, index) => {
    if (!source.titre) errors.push(`Source ${index + 1}: titre manquant`);
    if (!source.type) errors.push(`Source ${index + 1}: type manquant`);
    if (source.fiabilite < 0 || source.fiabilite > 100) {
      warnings.push(`Source ${index + 1}: fiabilité invalide (${source.fiabilite})`);
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
    const validation = validateImportData(importData);
    
    if (!validation.isValid) {
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
      const completude = await calculateCompletude(importData.dimensions);
      
      return new Response(
        JSON.stringify({
          success: true,
          validation,
          preview: {
            dimensions_count: Object.keys(importData.dimensions).length,
            fables_count: importData.fables?.length || 0,
            sources_count: importData.sources.length,
            completude_score: completude,
            quality_score: importData.metadata.quality_score
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
        // 1. Créer/Mettre à jour le contexte hybride
        const completude = await calculateCompletude(importData.dimensions);
        
        const { error: contextError } = await supabase
          .from('marche_contextes_hybrids')
          .upsert({
            marche_id: importData.marche_id,
            opus_id: importData.exploration_id,
            ...importData.dimensions,
            completude_score: completude,
            sources: importData.sources,
            last_validation: new Date().toISOString()
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

        return new Response(
          JSON.stringify({
            success: true,
            imported: {
              context: contextCreated,
              fables: fablesCreated,
              sources: importData.sources.length
            },
            validation,
            completude_score: await calculateCompletude(importData.dimensions)
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      } catch (fallbackError) {
        console.error('[OPUS Import] Fallback Error:', fallbackError);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Erreur lors de l\'import',
            details: fallbackError.message,
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
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Import IA réalisé avec succès',
        validation,
        completude_score: await calculateCompletude(importData.dimensions)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[OPUS Import] Error:', error);
    
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