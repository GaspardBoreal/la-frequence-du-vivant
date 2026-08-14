import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

/**
 * Cas concret public — Jardin Monde DEVIAT.
 * Lecture seule, propriété en dur, aucune donnée personnelle exposée.
 * Sert la page publique /etude-de-sol : agrégats du diagnostic de sol
 * + URLs signées d'une sélection de photos de terrain (bucket privé).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROPRIETE_ID = '664670f9-f16d-44f0-bdef-032cb0691194';
const BUCKET = 'propriete-tests';
/** Nombre maximum de photos exposées par test (page vitrine, pas un export). */
const MAX_PER_TEST = 6;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: soil, error: soilErr } = await supabase
      .from('propriete_soil_diagnostics')
      .select('terrain_status, samples, structure, texture, boudin_shape, ph, life_signs, completed_at, updated_at')
      .eq('propriete_id', PROPRIETE_ID)
      .maybeSingle();
    if (soilErr) throw soilErr;

    const { data: medias, error: medErr } = await supabase
      .from('propriete_test_medias')
      .select('id, storage_path, test_id, block, sample_id, sample_label, sample_location, created_at')
      .eq('propriete_id', PROPRIETE_ID)
      .eq('media_type', 'photo')
      .order('created_at', { ascending: true });
    if (medErr) throw medErr;

    // Sélection : au plus MAX_PER_TEST clichés par test, dans l'ordre chronologique.
    const perTest = new Map<string, number>();
    const selected = (medias ?? []).filter((m: any) => {
      const n = perTest.get(m.test_id) ?? 0;
      if (n >= MAX_PER_TEST) return false;
      perTest.set(m.test_id, n + 1);
      return true;
    });

    const signedByPath = new Map<string, string>();
    if (selected.length > 0) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(selected.map((m: any) => m.storage_path), 3600);
      (signed ?? []).forEach((s: any) => {
        if (s?.path && s?.signedUrl) signedByPath.set(s.path, s.signedUrl);
      });
    }

    const photos = selected
      .map((m: any) => ({
        id: m.id,
        url: signedByPath.get(m.storage_path) ?? null,
        testId: m.test_id,
        block: m.block,
        sampleLabel: m.sample_label ?? m.sample_id ?? null,
        sampleLocation: m.sample_location ?? null,
      }))
      .filter((p: any) => !!p.url);

    // Comptage complet par test (indépendant de la sélection affichée).
    const countsByTest: Record<string, number> = {};
    (medias ?? []).forEach((m: any) => {
      countsByTest[m.test_id] = (countsByTest[m.test_id] ?? 0) + 1;
    });

    return new Response(
      JSON.stringify({
        soil: soil ?? null,
        photos,
        countsByTest,
        totalPhotos: (medias ?? []).length,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      },
    );
  } catch (e) {
    console.error('public-case-deviat error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
