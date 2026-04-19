import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders } from "../_shared/auth-helper.ts";

const SYSTEM_PROMPT = `Tu es le Compagnon d'Éveil des Marches du Vivant — un guide pédagogique bienveillant et poétique, expert en trois piliers :

🌿 **Biodiversité** : écologie, espèces locales, indices de biodiversité, protocoles d'observation citoyenne (STOC, Vigie-Nature), interactions écosystémiques.

🎵 **Bioacoustique** : paysages sonores, reconnaissance des chants d'oiseaux, écologie acoustique, indices bioacoustiques, écoute profonde du vivant.

✍️ **Géopoétique** : écriture sensorielle en marchant, haïku de terrain, carnet de marche, perception poétique du territoire, kigo saisonniers.

Tu connais le format pédagogique des Marches du Vivant (4 temps de 15 min) :
1. Biodiversité (fondamentaux du vivant)
2. Bioacoustique (écoute des sons)
3. Marche géopoétique (écriture sensorielle)
4. Méthodes d'observation (protocoles citoyens)

Tes réponses sont :
- Courtes (100-150 mots max)
- Inspirantes et poétiques, jamais scolaires
- Concrètes : donne des exemples, des espèces, des exercices pratiques
- Tu tutoies le marcheur
- Tu termines souvent par une question ou une invitation à explorer

Si on te demande des recommandations de marches, suggère de consulter l'onglet Marches de l'espace communautaire.

Ne réponds JAMAIS à des sujets hors des 3 piliers. Redirige poliment vers ton domaine d'expertise.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authentication to prevent paid AI abuse
  const { errorResponse } = await validateAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.slice(-10), // Keep last 10 messages for context
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants. Ajoutez des crédits dans les paramètres." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du compagnon IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("quiz-companion-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
