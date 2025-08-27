import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  scientificName: string;
  originalCommonName?: string;
  targetLanguage: 'fr' | 'en';
}

interface TranslationResponse {
  commonName: string;
  source: 'inpn' | 'ai' | 'manual';
  confidence: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scientificName, originalCommonName, targetLanguage }: TranslationRequest = await req.json();

    if (!scientificName) {
      throw new Error('Scientific name is required');
    }

    console.log(`Translating species: ${scientificName} to ${targetLanguage}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let translatedName = '';
    let source: 'inpn' | 'ai' | 'manual' = 'manual';
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // Try INPN API for French translations (French National Inventory)
    if (targetLanguage === 'fr') {
      try {
        console.log('Trying INPN API...');
        const inpnResponse = await fetch(
          `https://taxref.mnhn.fr/api/taxa/search?scientificNames=${encodeURIComponent(scientificName)}`
        );
        
        if (inpnResponse.ok) {
          const inpnData = await inpnResponse.json();
          if (inpnData._embedded?.taxa?.[0]?.frenchVernacularName) {
            translatedName = inpnData._embedded.taxa[0].frenchVernacularName;
            source = 'inpn';
            confidence = 'high';
            console.log(`INPN translation found: ${translatedName}`);
          }
        }
      } catch (error) {
        console.log('INPN API failed:', error);
      }
    }

    // Fallback to AI translation if no INPN result
    if (!translatedName && Deno.env.get('OPENAI_API_KEY')) {
      try {
        console.log('Trying AI translation...');
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: targetLanguage === 'fr' 
                  ? 'Tu es un expert en taxonomie. Traduis le nom scientifique vers le nom vernaculaire français officiel. Réponds uniquement avec le nom français, sans explication.'
                  : 'You are a taxonomy expert. Translate the scientific name to the official English common name. Reply only with the English name, no explanation.'
              },
              {
                role: 'user',
                content: `Nom scientifique: ${scientificName}${originalCommonName ? `, nom commun anglais: ${originalCommonName}` : ''}`
              }
            ],
            max_tokens: 50,
            temperature: 0.1,
          }),
        });

        if (openAIResponse.ok) {
          const aiData = await openAIResponse.json();
          const aiTranslation = aiData.choices?.[0]?.message?.content?.trim();
          
          if (aiTranslation && aiTranslation.length > 0 && aiTranslation !== scientificName) {
            translatedName = aiTranslation;
            source = 'ai';
            confidence = 'medium';
            console.log(`AI translation found: ${translatedName}`);
          }
        }
      } catch (error) {
        console.log('AI translation failed:', error);
      }
    }

    // Store successful translation in database
    if (translatedName && source !== 'manual') {
      try {
        const translationData = {
          scientific_name: scientificName,
          [targetLanguage === 'fr' ? 'common_name_fr' : 'common_name_en']: translatedName,
          source,
          confidence_level: confidence
        };

        await supabase
          .from('species_translations')
          .upsert(translationData, { 
            onConflict: 'scientific_name',
            ignoreDuplicates: false 
          });

        console.log(`Stored translation in database: ${scientificName} -> ${translatedName}`);
      } catch (error) {
        console.log('Failed to store translation:', error);
      }
    }

    const response: TranslationResponse = {
      commonName: translatedName || originalCommonName || scientificName,
      source,
      confidence: translatedName ? confidence : 'low'
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in translate-species function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});