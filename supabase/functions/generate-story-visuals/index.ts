import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🎨 [GENERATE-VISUALS] Request received");
    
    const body = await req.json();
    
    console.log("🎨 [GENERATE-VISUALS] Request body:", { 
      hasPrompt: !!body.prompt, 
      promptLength: body.prompt?.length,
      stationName: body.stationName,
      eventType: body.eventType
    });

    if (!body.prompt) {
      console.error("❌ [GENERATE-VISUALS] Missing prompt");
      return new Response(
        JSON.stringify({ error: "Missing required field: prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate search terms from the prompt and event context
    const searchTerms = generateSearchTerms(body.prompt, body.eventType, body.stationName);
    
    console.log("🎨 [GENERATE-VISUALS] Generated search terms:", searchTerms);
    console.log("🎨 [GENERATE-VISUALS] Fetching from Unsplash...");

    // Fetch from Unsplash API
    const unsplashApiKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!unsplashApiKey) {
      console.error("❌ [GENERATE-VISUALS] Missing UNSPLASH_ACCESS_KEY");
      const fallbackUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop";
      return new Response(
        JSON.stringify({ output: [fallbackUrl] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const unsplashResponse = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchTerms)}&orientation=landscape&w=800&h=600`,
      {
        headers: {
          'Authorization': `Client-ID ${unsplashApiKey}`
        }
      }
    );
    
    if (!unsplashResponse.ok) {
      console.error("❌ [GENERATE-VISUALS] Unsplash API error:", unsplashResponse.status);
      // Fallback to a default placeholder image
      const fallbackUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop";
      console.log("🎨 [GENERATE-VISUALS] Using fallback image:", fallbackUrl);
      return new Response(
        JSON.stringify({ output: [fallbackUrl] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const imageData = await unsplashResponse.json();
    const imageUrl = imageData.urls?.regular || imageData.urls?.small;
    
    if (!imageUrl) {
      throw new Error("No image URL received from Unsplash");
    }
    
    console.log("✅ [GENERATE-VISUALS] Unsplash response received:", imageUrl);

    return new Response(
      JSON.stringify({ output: [imageUrl] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("💥 [GENERATE-VISUALS] Error:", error.message || error);
    return new Response(
      JSON.stringify({ error: error.message || "Unexpected error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Helper function to generate search terms for Unsplash
function generateSearchTerms(prompt: string, eventType?: string, stationName?: string): string {
  const weatherKeywords = {
    record: ["temperature extreme", "weather record", "climate"],
    spike: ["weather change", "temperature variation", "meteorology"],
    humidExtreme: ["humidity weather", "atmospheric conditions", "moisture"]
  };

  let baseTerms = "french landscape nature weather";
  
  if (eventType && weatherKeywords[eventType as keyof typeof weatherKeywords]) {
    baseTerms += " " + weatherKeywords[eventType as keyof typeof weatherKeywords].join(" ");
  }
  
  // Add regional context if station name suggests a specific region
  if (stationName) {
    if (stationName.toLowerCase().includes("côte") || stationName.toLowerCase().includes("mer")) {
      baseTerms += " coastal france";
    } else if (stationName.toLowerCase().includes("mont") || stationName.toLowerCase().includes("alpes")) {
      baseTerms += " mountain france";
    } else {
      baseTerms += " countryside france";
    }
  }
  
  return baseTerms;
}
