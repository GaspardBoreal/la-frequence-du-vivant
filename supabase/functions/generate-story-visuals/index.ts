import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

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
    
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      console.error("❌ [GENERATE-VISUALS] REPLICATE_API_KEY is not set");
      throw new Error("REPLICATE_API_KEY is not set");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });
    const body = await req.json();
    
    console.log("🎨 [GENERATE-VISUALS] Request body:", { 
      hasPrompt: !!body.prompt, 
      promptLength: body.prompt?.length,
      aspect_ratio: body.aspect_ratio 
    });

    if (!body.prompt) {
      console.error("❌ [GENERATE-VISUALS] Missing prompt");
      return new Response(
        JSON.stringify({ error: "Missing required field: prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aspect_ratio = body.aspect_ratio || "1:1";
    
    console.log("🎨 [GENERATE-VISUALS] Starting Replicate generation...");
    console.log("🎨 [GENERATE-VISUALS] Prompt:", body.prompt.substring(0, 200) + "...");

    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: body.prompt,
        go_fast: true,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio,
        output_format: "webp",
        output_quality: 80,
        num_inference_steps: 4,
      },
    });
    
    console.log("✅ [GENERATE-VISUALS] Replicate response:", output);

    return new Response(
      JSON.stringify({ output }),
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
