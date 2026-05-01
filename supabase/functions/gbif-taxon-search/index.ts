// GBIF taxon search proxy for autocomplete in manual species entry
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 20);

    if (!q || q.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GBIF species suggest: fast, returns scientific name + key
    const suggestUrl = `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(q)}&limit=${limit}`;
    const r = await fetch(suggestUrl);
    if (!r.ok) throw new Error(`GBIF error ${r.status}`);
    const arr = await r.json();

    // For each suggestion, fetch vernacular + image (best effort, parallel)
    const enriched = await Promise.all(
      (Array.isArray(arr) ? arr : []).slice(0, limit).map(async (s: any) => {
        const key = s.key || s.nubKey;
        let commonName: string | null = null;
        let imageUrl: string | null = null;
        if (key) {
          try {
            const [vR, mR] = await Promise.all([
              fetch(`https://api.gbif.org/v1/species/${key}/vernacularNames?limit=20`),
              fetch(`https://api.gbif.org/v1/occurrence/search?taxonKey=${key}&mediaType=StillImage&limit=1`),
            ]);
            if (vR.ok) {
              const v = await vR.json();
              const fr = (v.results || []).find((x: any) => x.language === 'fra');
              const any = (v.results || [])[0];
              commonName = fr?.vernacularName || any?.vernacularName || null;
            }
            if (mR.ok) {
              const m = await mR.json();
              imageUrl = m?.results?.[0]?.media?.[0]?.identifier || null;
            }
          } catch {}
        }
        return {
          key,
          scientificName: s.scientificName || s.canonicalName,
          canonicalName: s.canonicalName,
          rank: s.rank,
          kingdom: s.kingdom,
          family: s.family,
          commonName,
          imageUrl,
        };
      })
    );

    return new Response(JSON.stringify({ results: enriched }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('gbif-taxon-search error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
