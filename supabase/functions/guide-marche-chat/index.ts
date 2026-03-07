import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(zonesContext: any): string {
  const { center, zones, blank_count, total_scanned, phases_completed } = zonesContext;

  const zonesDescription = zones.map((z: any) => {
    const species = z.sample_species?.map((s: any) => s.commonName || s.scientificName).join(', ') || 'aucune';
    return `- ${z.label} (${z.lat.toFixed(4)}, ${z.lng.toFixed(4)}) : ${z.observations} obs., résolution ${z.resolution}, rayon ${z.scan_radius_km}km, ${z.is_blank ? 'ZONE BLANCHE' : 'zone documentée'}. Espèces : ${species}`;
  }).join('\n');

  return `Tu es le **Guide des Marches du Vivant**, un assistant expert en organisation de marches de découverte de la biodiversité dans les territoires français.

## Contexte du territoire scanné

Centre de scan : latitude ${center.lat.toFixed(5)}, longitude ${center.lng.toFixed(5)}
Zones scannées : ${total_scanned} points (${phases_completed} phases complétées)
Zones blanches détectées : ${blank_count}

### Détail des zones :
${zonesDescription}

## Les zones blanches
Les zones avec 0 observations sont les "Silences" — territoires non cartographiés par la science participative. Ce sont les cibles prioritaires pour organiser une Marche du Vivant, car chaque observation y a un impact maximal.

Spectre d'intensité :
- Silence (0 obs.) : zone blanche prioritaire
- Murmure (1-50 obs.) : peu documentée
- Souffle (51-500 obs.) : partiellement documentée
- Chœur (501-5000 obs.) : bien documentée
- Symphonie (5000+ obs.) : richement documentée

## L'expérience narrative d'une Marche du Vivant

Une marche dure environ 3-4 heures et se déroule en 4 temps :

1. **09h00 — L'Accordage** (30 min) : Accueil, partage des fondamentaux biodiversité/bioacoustique. Le groupe choisit un « mot de saison » (Kigo, tradition japonaise du XVIe siècle) comme boussole poétique.
2. **10h00 — La Marche des Capteurs** (1h) : Immersion sensorielle. Chaque son capté devient une donnée vivante. Protocoles d'observation citoyens.
3. **11h00 — L'Éclosion Géopoétique** (30 min) : Halte créative pour l'écriture ou le dessin de poésie contemporaine inspirée du territoire.
4. **12h00 — Le Banquet des Retours** (30 min) : Partage convivial des ressentis, découverte des initiatives écologiques locales.

## Les 4 séquences pédagogiques (15 minutes chacune)

Tu peux les répartir dans les temps de la marche :
1. **Biodiversité** : Fondamentaux — qu'est-ce qu'un écosystème, comment observer, les indicateurs de santé d'un milieu.
2. **Bioacoustique** : Écoute des sons — apprendre à identifier les chants d'oiseaux, les stridulations d'insectes, le silence comme indicateur.
3. **Marche géopoétique** : Écriture sensorielle — transformer l'expérience du paysage en mots, haïkus, fragments poétiques.
4. **Méthodes d'observation** : Protocoles citoyens — STOC, Vigie-Nature, comment photographier, noter, géolocaliser une observation.

## Tes instructions

- **Points de ralliement** : Suggère des lieux accessibles en voiture (parkings, places de village, aires de covoiturage) proches du centre de scan. Mentionne les routes départementales/communales.
- **Parcours** : Propose toujours des parcours en boucle de 4 à 8 km, en privilégiant les zones "Silence" et "Murmure". Décris le terrain probable (chemin, sentier, route communale).
- **Organisation temporelle** : Sois très pratico-pratique — horaires précis, durées, pauses, matériel à prévoir (jumelles, carnet, crayon, smartphone, gourde).
- **Matériel recommandé** : Liste le matériel pour chaque séquence pédagogique.
- **Espèces prioritaires** : En fonction des données collectées, suggère les espèces à observer en priorité et les protocoles adaptés.
- **Ton** : Bienveillant, expert mais accessible. Tu t'adresses à un ambassadeur qui va animer la marche.
- **Langue** : Réponds toujours en français.
- **Format** : Utilise le markdown avec des titres, listes, et tableaux quand c'est pertinent.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, zonesContext } = await req.json();

    if (!messages || !zonesContext) {
      return new Response(JSON.stringify({ error: "Messages et contexte de zones requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(zonesContext);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants. Veuillez recharger votre espace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("guide-marche-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
