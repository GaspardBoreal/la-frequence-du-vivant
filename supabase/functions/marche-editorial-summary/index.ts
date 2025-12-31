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

    if (!textes || textes.length === 0) {
      return new Response(
        JSON.stringify({ summary: "Aucun texte disponible pour cette marche." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ summary: "Résumé non disponible." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare texts content for the prompt
    const textesContent = textes.map((t: { type_texte: string; titre: string; contenu: string }) => 
      `[${t.type_texte}] ${t.titre}: ${t.contenu.substring(0, 500)}...`
    ).join('\n\n');

    const systemPrompt = `Tu es un éditorialiste littéraire spécialisé dans les récits de voyage et la littérature de nature. 
Tu dois rédiger un résumé éditorial caractérisant la tonalité et les thèmes des textes fournis.

Règles :
- Maximum 2-3 phrases
- Style concis, évocateur et littéraire
- Caractérise l'atmosphère, les thèmes dominants et le registre littéraire
- Ne cite pas directement les textes
- Évite les formules génériques`;

    const userPrompt = `Voici les textes littéraires de la marche "${marcheName}" :

${textesContent}

Rédige un résumé éditorial de 2-3 phrases caractérisant la tonalité et les thèmes de ces textes.`;

    console.log(`Generating editorial summary for: ${marcheName}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ summary: "Résumé temporairement indisponible (limite atteinte)." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ summary: "Résumé non disponible." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || "Résumé non disponible.";

    console.log(`Summary generated for ${marcheName}: ${summary.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in marche-editorial-summary:', error);
    return new Response(
      JSON.stringify({ summary: "Erreur lors de la génération du résumé." }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
