// Sync partner points from cartesolvivant.gogocarto.fr into public.carte_sol_vivant_points
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SOURCE_URL = 'https://cartesolvivant.gogocarto.fr/api/elements.json';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Fetching Carte Sol Vivant elements from', SOURCE_URL);
    const res = await fetch(SOURCE_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const body = await res.text();
      return new Response(
        JSON.stringify({ error: 'Upstream fetch failed', status: res.status, details: body }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const json = await res.json();
    const data: any[] = json?.data ?? [];
    console.log(`Received ${data.length} elements`);

    const now = new Date().toISOString();
    const rows = data
      .filter((e) => e?.geo?.latitude != null && e?.geo?.longitude != null)
      .map((e) => ({
        external_id: String(e.id),
        name: e.name ?? 'Sans nom',
        category: Array.isArray(e.categories) ? e.categories[0] ?? null : null,
        categories: Array.isArray(e.categories) ? e.categories : [],
        latitude: Number(e.geo.latitude),
        longitude: Number(e.geo.longitude),
        street_address: e?.address?.streetAddress ?? null,
        website: e.site_web ?? e.website ?? null,
        email: e.email ?? null,
        description: e.description_ferme ?? e.description ?? null,
        source_key: e.sourceKey ?? null,
        status: typeof e.status === 'number' ? e.status : null,
        raw: e,
        external_created_at: e.createdAt ?? null,
        external_updated_at: e.updatedAt ?? null,
        synced_at: now,
      }));

    // Upsert in chunks to stay well within request limits
    const CHUNK = 500;
    let upserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const { error } = await supabase
        .from('carte_sol_vivant_points')
        .upsert(slice, { onConflict: 'external_id' });
      if (error) {
        console.error('Upsert error', error);
        return new Response(
          JSON.stringify({ error: 'Upsert failed', details: error.message, upserted }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      upserted += slice.length;
    }

    // Log run
    await supabase.from('data_collection_logs').insert({
      source: 'carte_sol_vivant',
      status: 'success',
      records_processed: upserted,
      metadata: { total_received: data.length, upserted },
    }).then(() => {}, () => {});

    return new Response(
      JSON.stringify({ ok: true, received: data.length, upserted }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('sync-carte-sol-vivant failed', err);
    return new Response(
      JSON.stringify({ error: 'Unhandled failure', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
