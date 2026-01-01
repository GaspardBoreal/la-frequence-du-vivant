import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_WEBHOOK_URL = "https://gaspard-boreal.app.n8n.cloud/webhook/lovable-calendar-events";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Parse incoming request safely
    let start_date: string | undefined;
    let end_date: string | undefined;
    
    try {
      const body = await req.json();
      start_date = body.start_date;
      end_date = body.end_date;
    } catch {
      console.log('No JSON body or invalid JSON, using default dates');
    }
    
    // Default dates: now to +90 days
    const defaultStart = new Date().toISOString();
    const defaultEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    
    const finalStartDate = start_date || defaultStart;
    const finalEndDate = end_date || defaultEnd;
    
    console.log(`Fetching calendar events from ${finalStartDate} to ${finalEndDate}`);

    // 2. Call n8n webhook with POST and JSON body
    console.log(`Calling n8n webhook: ${N8N_WEBHOOK_URL}`);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: finalStartDate,
        end_date: finalEndDate,
      }),
    });

    const contentType = response.headers.get('content-type') || 'unknown';
    const contentLength = response.headers.get('content-length') || 'unknown';
    
    console.log(`n8n response: status=${response.status}, content-type=${contentType}, content-length=${contentLength}`);

    // 4. Read response as text first (safe parsing)
    const rawText = await response.text();
    console.log(`n8n raw response (first 500 chars): ${rawText.slice(0, 500)}`);

    // 5. Handle empty response (204 or empty body)
    if (response.status === 204 || !rawText.trim()) {
      console.log('n8n returned empty response');
      return new Response(JSON.stringify({ 
        events: [], 
        warning: "n8n a renvoyé une réponse vide. Vérifiez que le workflow est activé et que le nœud 'Respond to Webhook' est correctement configuré.",
        meta: { upstreamStatus: response.status, upstreamContentType: contentType }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Try to parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Failed to parse n8n response as JSON:', parseError);
      return new Response(JSON.stringify({ 
        events: [], 
        error: "Réponse n8n non-JSON",
        rawSnippet: rawText.slice(0, 500),
        meta: { upstreamStatus: response.status, upstreamContentType: contentType }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 7. Normalize events format
    // n8n can return: array of {json: {...}}, array of events, or single object
    let events: unknown[] = [];
    
    if (Array.isArray(parsed)) {
      // Check if items have .json property (n8n format)
      if (parsed.length > 0 && parsed[0] && typeof parsed[0] === 'object' && 'json' in parsed[0]) {
        events = parsed.map((item: { json: unknown }) => item.json);
      } else {
        events = parsed;
      }
    } else if (parsed && typeof parsed === 'object') {
      // Single object - wrap in array
      events = [parsed];
    }

    console.log(`Normalized ${events.length} events from n8n`);

    return new Response(JSON.stringify({ 
      events,
      meta: { upstreamStatus: response.status, upstreamContentType: contentType }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gaspard-calendar-sync:', error);
    return new Response(JSON.stringify({ 
      events: [],
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
