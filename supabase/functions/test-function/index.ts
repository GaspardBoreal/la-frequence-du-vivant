import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🧪 [TEST FUNCTION] Function called successfully!');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 [TEST FUNCTION] Request method:', req.method);
    console.log('🧪 [TEST FUNCTION] Request URL:', req.url);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test function works perfectly!',
        timestamp: new Date().toISOString(),
        method: req.method
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [TEST FUNCTION] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Test function error: ' + error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});