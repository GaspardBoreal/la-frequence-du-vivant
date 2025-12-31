import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textes, marcheName } = await req.json();

    console.log(`[marche-editorial-summary] Request for: ${marcheName}, textes count: ${textes?.length || 0}`);

    if (!textes || textes.length === 0) {
      console.log(`[marche-editorial-summary] No texts for ${marcheName}`);
      return new Response(
        JSON.stringify({ summary: "Aucun texte disponible pour cette marche." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('[marche-editorial-summary] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ summary: "Résumé non disponible (clé API manquante)." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare texts content for the prompt - include more content for better analysis
    const textesContent = textes.map((t: { type_texte: string; titre: string; contenu: string }) => 
      `[${t.type_texte}] ${t.titre}:\n${t.contenu.substring(0, 800)}`
    ).join('\n\n---\n\n');

    const systemPrompt = `Tu es un éditorialiste littéraire expert, spécialisé dans les récits de voyage et la littérature de nature.
Ta mission : rédiger un résumé éditorial PRÉCIS de MAXIMUM 330 caractères (espaces compris).

RÈGLES STRICTES :
- Maximum 330 caractères absolument
- 2-3 phrases concises, évocatrices et littéraires
- Caractérise l'atmosphère dominante, les thèmes clés et le registre littéraire
- Ne cite jamais directement les textes
- Évite les formules génériques type "ce récit propose..."
- Sois précis sur la tonalité : poétique, contemplative, narrative, sensible, documentaire, lyrique, etc.`;

    const userPrompt = `Analyse ces textes littéraires de la marche "${marcheName}" et rédige un résumé éditorial de MAXIMUM 330 caractères :

${textesContent}

RAPPEL : Maximum 330 caractères pour ton résumé.`;

    console.log(`[marche-editorial-summary] Calling OpenAI for: ${marcheName}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[marche-editorial-summary] OpenAI error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ summary: "Résumé temporairement indisponible (limite API)." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ summary: "Résumé non disponible (erreur API)." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let summary = data.choices?.[0]?.message?.content?.trim() || "Résumé non disponible.";
    
    // Ensure max 330 characters
    if (summary.length > 330) {
      summary = summary.substring(0, 327) + "...";
    }

    console.log(`[marche-editorial-summary] Success for ${marcheName}: "${summary.substring(0, 60)}..." (${summary.length} chars)`);

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[marche-editorial-summary] Error:', error);
    return new Response(
      JSON.stringify({ summary: "Erreur lors de la génération du résumé." }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
