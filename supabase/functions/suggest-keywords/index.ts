import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TexteInput {
  titre: string;
  contenu: string;
  type_texte: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textes, existingKeywords } = await req.json() as {
      textes: TexteInput[];
      existingKeywords: string[];
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare context: concatenate all text titles and content summaries
    const textSummaries = textes.slice(0, 50).map((t, i) => 
      `${i + 1}. [${t.type_texte}] "${t.titre}"\n${t.contenu.slice(0, 500)}...`
    ).join('\n\n');

    const existingKeywordsList = existingKeywords.join(', ');

    const systemPrompt = `Tu es un assistant spécialisé dans l'analyse de textes littéraires sur les fleuves, rivières et écosystèmes fluviaux français (particulièrement la Dordogne et la Garonne).

Ton rôle est d'identifier des mots-clés thématiques pertinents pour un index de recueil poétique.

Les mots-clés doivent être:
- Des noms communs (pas de noms propres sauf lieux emblématiques)
- En minuscules
- Significatifs pour le thème écologique/poétique/hydrologique
- Non redondants avec la liste existante

Catégories à considérer:
- Faune (poissons migrateurs, oiseaux, mammifères)
- Flore (arbres rivulaires, plantes aquatiques)
- Hydrologie (phénomènes fluviaux, dynamiques)
- Temporalités (époques, projections futures)
- Geste poétique (verbes d'action, sensations)
- Technologies et médiations
- Ouvrages humains (infrastructures)`;

    const userPrompt = `Voici les mots-clés déjà indexés:
${existingKeywordsList}

Analyse les textes littéraires suivants et suggère 10-15 nouveaux mots-clés pertinents qui ne sont pas encore dans la liste existante:

${textSummaries}

Réponds UNIQUEMENT avec la liste des nouveaux mots-clés suggérés, un par ligne, sans numérotation ni explication.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse keywords from response (one per line)
    const suggestedKeywords = content
      .split('\n')
      .map((line: string) => line.trim().toLowerCase())
      .filter((k: string) => k.length > 2 && k.length < 50)
      .filter((k: string) => !existingKeywords.includes(k));

    return new Response(
      JSON.stringify({ suggestions: suggestedKeywords }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("suggest-keywords error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
