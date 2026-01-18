import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scientificName } = await req.json();

    if (!scientificName) {
      return new Response(
        JSON.stringify({ error: 'scientificName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching Xeno-Canto recordings for: ${scientificName}`);

    // Try with quality A first
    let response = await fetch(
      `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(scientificName)}+q:A`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FrequenceVivant/1.0 (biodiversity research)',
        },
      }
    );

    let data;
    if (response.ok) {
      data = await response.json();
    }

    // Fallback without quality filter
    if (!data?.recordings?.length) {
      console.log('No quality A recordings, trying without filter...');
      response = await fetch(
        `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(scientificName)}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'FrequenceVivant/1.0 (biodiversity research)',
          },
        }
      );

      if (response.ok) {
        data = await response.json();
      }
    }

    if (!data?.recordings?.length) {
      console.log('No recordings found for', scientificName);
      return new Response(
        JSON.stringify({ recordings: [], numRecordings: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${data.numRecordings} recordings, returning top 3`);

    // Return top 3 recordings with formatted data
    const recordings = data.recordings.slice(0, 3).map((rec: any) => ({
      id: rec.id,
      url: `https://xeno-canto.org/${rec.id}`,
      file: rec.file,
      file_name: rec['file-name'],
      sono: {
        small: rec.sono?.small || '',
        med: rec.sono?.med || '',
        large: rec.sono?.large || '',
        full: rec.sono?.full || '',
      },
      rec: rec.rec,
      loc: rec.loc,
      length: rec.length,
      q: rec.q,
      type: rec.type,
      date: rec.date,
    }));

    return new Response(
      JSON.stringify({ recordings, numRecordings: parseInt(data.numRecordings) || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Xeno-Canto:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch recordings', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
