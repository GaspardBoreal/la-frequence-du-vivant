// resolve-species-thumb : résout les vignettes espèces via iNaturalist puis GBIF
// et persiste le résultat dans public.species_thumb_cache.
//
// Input :  { scientific_names: string[] }   // max 50, dédupliqués côté serveur
// Output : { resolved: Row[], total: number, hits: number, misses: number }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolvedRow {
  scientific_name: string;
  photo_url: string | null;
  photo_attribution: string | null;
  iconic_taxon: string | null;
  kingdom: string | null;
  common_name_fr: string | null;
  common_name_en: string | null;
  source: 'inaturalist' | 'gbif' | 'manual' | 'none';
}

const UA = 'la-frequence-du-vivant/1.0 (https://la-frequence-du-vivant.com)';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

// iNat iconic_taxon → kingdom haut niveau
function iconicToKingdom(iconic?: string | null): string | null {
  if (!iconic) return null;
  const i = iconic.toLowerCase();
  if (['plantae'].includes(i)) return 'Plantae';
  if (['fungi', 'protozoa'].includes(i)) return i === 'fungi' ? 'Fungi' : 'Protozoa';
  if ([
    'animalia', 'aves', 'mammalia', 'insecta', 'arachnida',
    'reptilia', 'amphibia', 'actinopterygii', 'mollusca'
  ].includes(i)) return 'Animalia';
  return null;
}

async function resolveOneINat(name: string): Promise<Partial<ResolvedRow> | null> {
  try {
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(name)}&per_page=10&locale=fr`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!res.ok) {
      console.warn(`[resolve-species-thumb] iNat ${res.status} for "${name}"`);
      return null;
    }
    const data = await res.json();
    const results: any[] = data?.results || [];
    if (results.length === 0) return null;

    // 1. exact (case-insensitive) match sur name scientifique
    const exact = results.find(t => (t.name || '').toLowerCase() === name.toLowerCase());
    // 2. sinon premier résultat avec default_photo
    const withPhoto = results.find(t => t.default_photo?.medium_url);
    const taxon = exact?.default_photo ? exact : (withPhoto || exact || results[0]);

    const photo = taxon?.default_photo?.medium_url || null;
    if (!photo) return null;

    const iconic = taxon?.iconic_taxon_name || null;
    const attribution = taxon?.default_photo?.attribution
      ? `${taxon.default_photo.attribution} / iNaturalist`
      : '© iNaturalist';

    return {
      photo_url: photo,
      photo_attribution: attribution,
      iconic_taxon: iconic,
      kingdom: iconicToKingdom(iconic),
      common_name_fr: taxon?.preferred_common_name || null,
      common_name_en: taxon?.english_common_name || null,
      source: 'inaturalist',
    };
  } catch (err) {
    console.warn(`[resolve-species-thumb] iNat err for "${name}":`, (err as Error).message);
    return null;
  }
}

async function resolveOneGBIF(name: string): Promise<Partial<ResolvedRow> | null> {
  try {
    const matchUrl = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}&strict=false`;
    const matchRes = await fetch(matchUrl, { headers: { 'User-Agent': UA } });
    if (!matchRes.ok) return null;
    const match = await matchRes.json();
    const key = match?.usageKey;
    if (!key) return null;

    const kingdom: string | null = match?.kingdom || null;

    const mediaUrl = `https://api.gbif.org/v1/species/${key}/media?limit=5`;
    const mediaRes = await fetch(mediaUrl, { headers: { 'User-Agent': UA } });
    if (!mediaRes.ok) return null;
    const media = await mediaRes.json();
    const photo = (media?.results || []).find((m: any) => m?.identifier && /^https?:/.test(m.identifier));
    if (!photo) return null;

    return {
      photo_url: photo.identifier,
      photo_attribution: photo.rightsHolder
        ? `${photo.rightsHolder} / GBIF`
        : (photo.publisher ? `${photo.publisher} / GBIF` : '© GBIF'),
      kingdom,
      iconic_taxon: match?.class || match?.phylum || null,
      common_name_fr: null,
      common_name_en: null,
      source: 'gbif',
    };
  } catch (err) {
    console.warn(`[resolve-species-thumb] GBIF err for "${name}":`, (err as Error).message);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const raw: string[] = Array.isArray(body?.scientific_names) ? body.scientific_names : [];

    const names = Array.from(new Set(
      raw.map(n => typeof n === 'string' ? normalize(n) : '').filter(n => n.length >= 2)
    )).slice(0, 50);

    if (names.length === 0) {
      return new Response(JSON.stringify({ resolved: [], total: 0, hits: 0, misses: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Lis les existants déjà résolus récemment (skip si on a une photo OU si miss < 7 jours)
    const { data: existing } = await supabase
      .from('species_thumb_cache')
      .select('*')
      .in('scientific_name', names);

    const existingMap = new Map<string, any>((existing || []).map(r => [r.scientific_name, r]));
    const SEVEN_DAYS = 7 * 24 * 3600 * 1000;
    const now = Date.now();

    const toResolve = names.filter(n => {
      const e = existingMap.get(n);
      if (!e) return true;
      if (e.photo_url && e.source !== 'none') return false; // déjà bon
      if (e.miss_count >= 5) return false; // trop d'échecs, on lâche
      if (e.resolved_at && (now - new Date(e.resolved_at).getTime()) < SEVEN_DAYS) return false;
      return true;
    });

    console.log(`[resolve-species-thumb] requested=${names.length} toResolve=${toResolve.length}`);

    const resolved: ResolvedRow[] = [];
    let hits = 0;
    let misses = 0;

    // Politesse iNat : ~5 req/s
    for (const name of toResolve) {
      let res = await resolveOneINat(name);
      if (!res?.photo_url) {
        res = await resolveOneGBIF(name);
      }
      const prev = existingMap.get(name);
      const row: ResolvedRow = {
        scientific_name: name,
        photo_url: res?.photo_url || null,
        photo_attribution: res?.photo_attribution || null,
        iconic_taxon: res?.iconic_taxon || prev?.iconic_taxon || null,
        kingdom: res?.kingdom || prev?.kingdom || null,
        common_name_fr: res?.common_name_fr || prev?.common_name_fr || null,
        common_name_en: res?.common_name_en || prev?.common_name_en || null,
        source: (res?.source as any) || 'none',
      };

      if (row.photo_url) hits++; else misses++;

      const upsertRow: any = {
        scientific_name: name,
        photo_url: row.photo_url,
        photo_attribution: row.photo_attribution,
        iconic_taxon: row.iconic_taxon,
        kingdom: row.kingdom,
        common_name_fr: row.common_name_fr,
        common_name_en: row.common_name_en,
        source: row.source,
        resolved_at: new Date().toISOString(),
        miss_count: row.photo_url ? 0 : ((prev?.miss_count || 0) + 1),
      };

      const { error: upsertErr } = await supabase
        .from('species_thumb_cache')
        .upsert(upsertRow, { onConflict: 'scientific_name' });
      if (upsertErr) console.warn(`[resolve-species-thumb] upsert err for ${name}:`, upsertErr.message);

      resolved.push(row);
      await sleep(220);
    }

    // Ajoute aussi les existants déjà bons à la réponse
    for (const n of names) {
      if (toResolve.includes(n)) continue;
      const e = existingMap.get(n);
      if (e) {
        resolved.push({
          scientific_name: e.scientific_name,
          photo_url: e.photo_url,
          photo_attribution: e.photo_attribution,
          iconic_taxon: e.iconic_taxon,
          kingdom: e.kingdom,
          common_name_fr: e.common_name_fr,
          common_name_en: e.common_name_en,
          source: e.source,
        });
        if (e.photo_url) hits++; else misses++;
      }
    }

    return new Response(JSON.stringify({
      resolved, total: names.length, hits, misses,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[resolve-species-thumb] fatal:', (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
