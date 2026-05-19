// Backfill one-shot : enrichit `species_data` de `biodiversity_snapshots` avec
//   - `family` = nom de famille (au lieu de l'ID numérique iNat)
//   - `iconicTaxon` = Aves, Insecta, Plantae, etc.
//
// Stratégie frugalité :
//   1. Inventorier tous les taxon_ids distincts présents dans les snapshots
//      (champ `family` = entier, OU id direct du taxon via `id` de chaque
//      espèce — on tente les deux pour maximiser le cache).
//   2. Pour chaque ID non encore présent dans `inat_taxa_cache`, batcher
//      30 IDs par requête sur `https://api.inaturalist.org/v1/taxa?id=`.
//   3. Mettre à jour le cache puis réécrire chaque snapshot en mémoire et
//      le sauvegarder.
//
// Idempotent : un second run ne re-fetch que les nouveaux taxons.

import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INAT_BASE = 'https://api.inaturalist.org/v1';
const BATCH_SIZE = 30;
const PAUSE_MS = 1100; // iNat = 1 req/sec

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TaxonRow {
  taxon_id: number;
  name: string | null;
  rank: string | null;
  family_name: string | null;
  iconic_taxon: string | null;
}

async function fetchInatTaxa(ids: number[]): Promise<TaxonRow[]> {
  if (ids.length === 0) return [];
  const url = `${INAT_BASE}/taxa?id=${ids.join(',')}&per_page=${ids.length}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'la-frequence-du-vivant/backfill' } });
  if (!res.ok) {
    console.error(`iNat taxa fetch failed: ${res.status}`);
    return [];
  }
  const json = await res.json();
  const results: any[] = json.results || [];
  return results.map((t) => {
    // family : si rank='family' → name lui-même, sinon chercher dans ancestors
    let family_name: string | null = null;
    if (t.rank === 'family') {
      family_name = t.name;
    } else if (Array.isArray(t.ancestors)) {
      const fam = t.ancestors.find((a: any) => a.rank === 'family');
      family_name = fam?.name || null;
    }
    return {
      taxon_id: t.id,
      name: t.name || null,
      rank: t.rank || null,
      family_name,
      iconic_taxon: t.iconic_taxon_name || null,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ---------------------------------------------------------------------
    // 1. Charger tous les snapshots et inventorier les IDs taxon à résoudre
    // ---------------------------------------------------------------------
    const { data: snaps, error: snapsErr } = await supabase
      .from('biodiversity_snapshots')
      .select('id, species_data');
    if (snapsErr) throw snapsErr;

    const idsToResolve = new Set<number>();
    (snaps || []).forEach((s: any) => {
      const arr: any[] = Array.isArray(s.species_data) ? s.species_data : [];
      arr.forEach((sp) => {
        const fam = sp.family;
        if (typeof fam === 'string' && /^\d+$/.test(fam)) idsToResolve.add(parseInt(fam, 10));
        else if (typeof fam === 'number') idsToResolve.add(fam);
        // Pour les obs où on n'a pas du tout de family, on tente id direct si présent
        if (sp.taxonId && Number.isFinite(sp.taxonId)) idsToResolve.add(Number(sp.taxonId));
      });
    });

    console.log(`📚 Snapshots: ${snaps?.length || 0} — taxon IDs à vérifier: ${idsToResolve.size}`);

    // ---------------------------------------------------------------------
    // 2. Lire le cache existant, filtrer les IDs déjà résolus
    // ---------------------------------------------------------------------
    const allIds = Array.from(idsToResolve);
    const cacheMap = new Map<number, TaxonRow>();
    if (allIds.length > 0) {
      const { data: cached } = await supabase
        .from('inat_taxa_cache')
        .select('taxon_id, name, rank, family_name, iconic_taxon')
        .in('taxon_id', allIds);
      (cached || []).forEach((c: any) => cacheMap.set(c.taxon_id, c as TaxonRow));
    }
    const missing = allIds.filter((id) => !cacheMap.has(id));
    console.log(`💾 Cache hits: ${cacheMap.size} / ${allIds.length} — à fetcher: ${missing.length}`);

    // ---------------------------------------------------------------------
    // 3. Résoudre les manquants par batches via iNat
    // ---------------------------------------------------------------------
    let fetched = 0;
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);
      const rows = await fetchInatTaxa(batch);
      if (rows.length > 0) {
        const { error: upErr } = await supabase.from('inat_taxa_cache').upsert(rows, { onConflict: 'taxon_id' });
        if (upErr) console.error('Upsert cache failed:', upErr);
        rows.forEach((r) => cacheMap.set(r.taxon_id, r));
        fetched += rows.length;
      }
      if (i + BATCH_SIZE < missing.length) await sleep(PAUSE_MS);
    }
    console.log(`🌐 Fetché ${fetched} taxons iNat`);

    // ---------------------------------------------------------------------
    // 4. Réécrire chaque snapshot : remplacer family numérique par nom, ajouter iconicTaxon
    // ---------------------------------------------------------------------
    let updatedSnapshots = 0;
    let enrichedSpecies = 0;
    for (const snap of (snaps || [])) {
      const arr: any[] = Array.isArray(snap.species_data) ? snap.species_data : [];
      if (arr.length === 0) continue;
      let dirty = false;
      const next = arr.map((sp) => {
        const out = { ...sp };
        const fam = sp.family;
        const famId = typeof fam === 'string' && /^\d+$/.test(fam)
          ? parseInt(fam, 10)
          : (typeof fam === 'number' ? fam : null);

        if (famId !== null) {
          const cached = cacheMap.get(famId);
          if (cached) {
            // Le `family` iNat dans ancestry n'est PAS toujours du rang family
            // (peut être subfamily, order, subgenus…). On écrit family_name
            // quand il existe, sinon on conserve l'ID numérique mais on ajoute
            // au moins iconicTaxon — qui suffit à la classification trophique.
            if (cached.family_name && cached.family_name !== sp.family) {
              out.family = cached.family_name;
              dirty = true;
              enrichedSpecies++;
            }
            if (!out.iconicTaxon && cached.iconic_taxon) {
              out.iconicTaxon = cached.iconic_taxon;
              dirty = true;
            }
          }
        }
        // si on a un taxonId direct mais pas d'iconicTaxon, on enrichit aussi
        if (!out.iconicTaxon && sp.taxonId) {
          const cached = cacheMap.get(Number(sp.taxonId));
          if (cached?.iconic_taxon) {
            out.iconicTaxon = cached.iconic_taxon;
            dirty = true;
          }
        }
        return out;
      });

      if (dirty) {
        const { error: updErr } = await supabase
          .from('biodiversity_snapshots')
          .update({ species_data: next })
          .eq('id', snap.id);
        if (updErr) console.error(`Update snapshot ${snap.id}:`, updErr);
        else updatedSnapshots++;
      }
    }

    const summary = {
      snapshots_total: snaps?.length || 0,
      taxon_ids_seen: idsToResolve.size,
      cache_hits_before: cacheMap.size - fetched,
      taxa_fetched: fetched,
      snapshots_updated: updatedSnapshots,
      species_enriched: enrichedSpecies,
    };
    console.log('✅ Backfill terminé:', summary);

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Backfill error:', e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
