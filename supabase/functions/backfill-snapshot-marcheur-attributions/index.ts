// Backfill : à chaque snapshot biodiv, matérialise les attributions iNat
// dont l'observerName correspond à un marcheur éditorial (exploration_marcheurs)
// dans marcheur_observations. Idempotent via index unique (marcheur, marche, inat_id).
//
// Stratégie de matching (priorité décroissante) :
//   1. Alias explicite : community_profile_science_accounts.username == observerName
//      (via exploration_marcheurs.user_id → community_profiles.id)
//   2. Fallback NFD + lower + trim sur "prenom nom" / "nom prenom" / "prenomnom"
//
// Trigger : appelé en fire-and-forget par snapshots_backfill_marcheurs (DB trigger)
// Manuel : POST {snapshot_id?, marche_id?, exploration_id?, mode?: 'full'}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const normalize = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

interface Marcheur {
  id: string;
  prenom: string;
  nom: string;
  user_id: string | null;
  aliases: Set<string>;
}

async function loadMarcheursForMarche(admin: any, marcheId: string): Promise<Marcheur[]> {
  // 1. Trouver les explorations qui contiennent cette marche
  const { data: em } = await admin
    .from('exploration_marches')
    .select('exploration_id')
    .eq('marche_id', marcheId);
  const explorationIds = Array.from(new Set((em || []).map((x: any) => x.exploration_id)));
  if (explorationIds.length === 0) return [];

  // 2. Marcheurs éditoriaux de ces explorations
  const { data: crew } = await admin
    .from('exploration_marcheurs')
    .select('id, prenom, nom, user_id')
    .in('exploration_id', explorationIds);

  const marcheurs: Marcheur[] = (crew || []).map((c: any) => {
    const aliases = new Set<string>();
    const full = `${c.prenom || ''} ${c.nom || ''}`.trim();
    const rev = `${c.nom || ''} ${c.prenom || ''}`.trim();
    const concat = `${c.prenom || ''}${c.nom || ''}`.trim();
    if (full) aliases.add(normalize(full));
    if (rev) aliases.add(normalize(rev));
    if (concat) aliases.add(normalize(concat));
    return { id: c.id, prenom: c.prenom, nom: c.nom, user_id: c.user_id, aliases };
  });

  // 3. Aliases explicites via science accounts
  const userIds = marcheurs.map((m) => m.user_id).filter(Boolean) as string[];
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('community_profiles')
      .select('id, user_id')
      .in('user_id', userIds);
    const profileByUser = new Map((profiles || []).map((p: any) => [p.user_id, p.id]));
    const profileIds = Array.from(profileByUser.values()) as string[];
    if (profileIds.length > 0) {
      const { data: accounts } = await admin
        .from('community_profile_science_accounts')
        .select('profile_id, username')
        .in('profile_id', profileIds);
      const aliasesByProfile = new Map<string, Set<string>>();
      (accounts || []).forEach((a: any) => {
        const u = normalize(a.username || '');
        if (!u) return;
        if (!aliasesByProfile.has(a.profile_id)) aliasesByProfile.set(a.profile_id, new Set());
        aliasesByProfile.get(a.profile_id)!.add(u);
      });
      marcheurs.forEach((m) => {
        if (!m.user_id) return;
        const pid = profileByUser.get(m.user_id) as string | undefined;
        if (!pid) return;
        const extra = aliasesByProfile.get(pid);
        if (extra) extra.forEach((a) => m.aliases.add(a));
      });
    }
  }

  return marcheurs;
}

function matchMarcheur(observerName: string, marcheurs: Marcheur[]): Marcheur | null {
  const norm = normalize(observerName);
  if (!norm) return null;
  for (const m of marcheurs) {
    if (m.aliases.has(norm)) return m;
  }
  return null;
}

async function processSnapshot(
  admin: any,
  snapshot: any,
  marcheurs: Marcheur[],
): Promise<{ inserted: number; skipped: number; matched: number }> {
  const speciesData: any[] = Array.isArray(snapshot.species_data) ? snapshot.species_data : [];
  let inserted = 0,
    skipped = 0,
    matched = 0;

  const rows: any[] = [];

  for (const sp of speciesData) {
    const sci = (sp?.scientificName || sp?.scientific_name || '').toString().trim();
    if (!sci) continue;
    const attribs: any[] = Array.isArray(sp?.attributions) ? sp.attributions : [];
    const photos: any[] = Array.isArray(sp?.photos) ? sp.photos : [];

    attribs.forEach((attr: any, idx: number) => {
      const src = (attr?.source || '').toString().toLowerCase();
      if (!src.includes('inat')) return;
      const observerName = (attr?.observerName || '').toString();
      const m = matchMarcheur(observerName, marcheurs);
      if (!m) return;
      matched++;

      // Extraire inaturalist_observation_id depuis originalUrl
      let inatId: number | null = null;
      const url = (attr?.originalUrl || '').toString();
      const idMatch = url.match(/observations\/(\d+)/);
      if (idMatch) inatId = parseInt(idMatch[1], 10);

      const lat =
        typeof attr?.exactLatitude === 'number' ? attr.exactLatitude : null;
      const lng =
        typeof attr?.exactLongitude === 'number' ? attr.exactLongitude : null;
      const obsDate = attr?.date || null;
      const rawPhoto = photos[idx] || photos[0] || null;
      const photoUrl = rawPhoto
        ? String(rawPhoto).replace('/square.', '/medium.').replace('/square.jpg', '/medium.jpg')
        : null;

      rows.push({
        marcheur_id: m.id,
        marche_id: snapshot.marche_id,
        species_scientific_name: sci,
        observation_date: obsDate,
        photo_url: photoUrl,
        latitude: lat,
        longitude: lng,
        inaturalist_observation_id: inatId,
      });
    });
  }

  if (rows.length === 0) return { inserted: 0, skipped: 0, matched: 0 };

  // Upsert sur (marcheur_id, inaturalist_observation_id) — contrainte existante.
  // ignoreDuplicates = ON CONFLICT DO NOTHING : ne touche pas les notes/photos
  // déjà saisies manuellement par les marcheurs.
  const withInat = rows.filter((r) => r.inaturalist_observation_id != null);
  if (withInat.length > 0) {
    const { error, data } = await admin
      .from('marcheur_observations')
      .upsert(withInat, {
        onConflict: 'marcheur_id,inaturalist_observation_id',
        ignoreDuplicates: true,
      })
      .select('id');
    if (error) {
      console.error('upsert with inat error:', error);
      skipped += withInat.length;
    } else {
      inserted += data?.length ?? 0;
      skipped += withInat.length - (data?.length ?? 0);
    }
  }

  return { inserted, skipped, matched };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const body = await req.json().catch(() => ({}));
    const { snapshot_id, marche_id, exploration_id, mode } = body || {};

    // ===== MODE FULL : rejoue tous les snapshots d'une exploration =====
    if (mode === 'full' && exploration_id) {
      const { data: em } = await admin
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', exploration_id);
      const marcheIds = (em || []).map((x: any) => x.marche_id);
      if (marcheIds.length === 0) {
        return new Response(JSON.stringify({ ok: true, processed: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: snaps } = await admin
        .from('biodiversity_snapshots')
        .select('id, marche_id, species_data')
        .in('marche_id', marcheIds);

      let totalInserted = 0,
        totalMatched = 0,
        processed = 0;
      // Cache marcheurs par marche_id pour éviter requêtes redondantes
      const cache = new Map<string, Marcheur[]>();
      for (const snap of snaps || []) {
        let marcheurs = cache.get(snap.marche_id);
        if (!marcheurs) {
          marcheurs = await loadMarcheursForMarche(admin, snap.marche_id);
          cache.set(snap.marche_id, marcheurs);
        }
        const r = await processSnapshot(admin, snap, marcheurs);
        totalInserted += r.inserted;
        totalMatched += r.matched;
        processed++;
      }
      return new Response(
        JSON.stringify({
          ok: true,
          mode: 'full',
          exploration_id,
          processed,
          inserted: totalInserted,
          matched: totalMatched,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ===== MODE NORMAL : un snapshot (depuis trigger) =====
    if (!snapshot_id && !marche_id) {
      return new Response(
        JSON.stringify({ error: 'snapshot_id or marche_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let snapshots: any[] = [];
    if (snapshot_id) {
      const { data } = await admin
        .from('biodiversity_snapshots')
        .select('id, marche_id, species_data')
        .eq('id', snapshot_id)
        .limit(1);
      snapshots = data || [];
    } else if (marche_id) {
      const { data } = await admin
        .from('biodiversity_snapshots')
        .select('id, marche_id, species_data')
        .eq('marche_id', marche_id);
      snapshots = data || [];
    }

    if (snapshots.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const marcheurs = await loadMarcheursForMarche(admin, snapshots[0].marche_id);
    let totalInserted = 0,
      totalMatched = 0;
    for (const snap of snapshots) {
      const r = await processSnapshot(admin, snap, marcheurs);
      totalInserted += r.inserted;
      totalMatched += r.matched;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed: snapshots.length,
        inserted: totalInserted,
        matched: totalMatched,
        marcheurs_count: marcheurs.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error('backfill-snapshot-marcheur-attributions error:', e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
