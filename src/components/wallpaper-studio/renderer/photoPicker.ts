import { supabase } from '@/integrations/supabase/client';

export type Category = 'species' | 'landscape' | 'walkers' | 'territory';
export type Kingdom = 'all' | 'flora' | 'winged' | 'small_fauna' | 'fungi';
export type Ambiance = 'dawn' | 'day' | 'dusk' | 'night' | 'any';

export interface PickedPhoto {
  url: string;
  scientificName?: string;
  attribution?: string;
}

export interface EventSnapshot {
  id: string;
  title: string;
  date: string | null;
  commune: string | null;
  lat: number | null;
  lng: number | null;
  slug: string | null;
  cover: string | null;
}

const AMBIANCE_HOURS: Record<Ambiance, [number, number] | null> = {
  dawn: [5, 8],
  day: [8, 18],
  dusk: [18, 21],
  night: [21, 29], // wraps
  any: null,
};

function inAmbiance(iso: string | null | undefined, amb: Ambiance): boolean {
  if (!iso || amb === 'any') return true;
  const range = AMBIANCE_HOURS[amb];
  if (!range) return true;
  const h = new Date(iso).getHours();
  const [lo, hi] = range;
  if (hi > 24) return h >= lo || h < hi - 24;
  return h >= lo && h < hi;
}

export async function fetchEvents(): Promise<EventSnapshot[]> {
  const { data } = await supabase
    .from('marche_events')
    .select('id,title,date_marche,lieu,latitude,longitude,public_slug,cover_image_url')
    .order('date_marche', { ascending: false })
    .limit(200);
  return (data || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    date: e.date_marche,
    commune: e.lieu,
    lat: e.latitude,
    lng: e.longitude,
    slug: e.public_slug,
    cover: e.cover_image_url,
  }));
}

export async function fetchEventById(id: string): Promise<EventSnapshot | null> {
  const { data } = await supabase
    .from('marche_events')
    .select('id,title,date_marche,lieu,latitude,longitude,public_slug,cover_image_url')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    date: data.date_marche,
    commune: data.lieu,
    lat: data.latitude,
    lng: data.longitude,
    slug: data.public_slug,
    cover: data.cover_image_url,
  };
}

const marcheIdsCache = new Map<string, string[]>();

async function resolveMarcheIds(eventId?: string): Promise<string[]> {
  if (!eventId) return [];
  if (marcheIdsCache.has(eventId)) return marcheIdsCache.get(eventId)!;
  const { data: ev } = await supabase
    .from('marche_events')
    .select('exploration_id')
    .eq('id', eventId)
    .maybeSingle();
  const explorationId = (ev as any)?.exploration_id;
  if (!explorationId) {
    marcheIdsCache.set(eventId, []);
    return [];
  }
  const { data: links } = await supabase
    .from('exploration_marches')
    .select('marche_id')
    .eq('exploration_id', explorationId);
  const ids = (links || []).map((l: any) => l.marche_id).filter(Boolean);
  marcheIdsCache.set(eventId, ids);
  return ids;
}

async function fetchOfficialPhotos(eventId?: string): Promise<PickedPhoto[]> {
  const marcheIds = await resolveMarcheIds(eventId);
  if (eventId && marcheIds.length === 0) return [];
  let q = supabase
    .from('marche_photos')
    .select('url_supabase,url_originale,titre,metadata')
    .order('ordre', { ascending: true })
    .limit(300);
  if (marcheIds.length > 0) q = q.in('marche_id', marcheIds);
  const { data } = await q;
  return (data || [])
    .map((p: any) => ({ url: p.url_supabase || p.url_originale, attribution: p.titre }))
    .filter((p) => !!p.url);
}


async function fetchWalkerPhotos(eventId?: string, amb: Ambiance = 'any'): Promise<PickedPhoto[]> {
  let q = supabase
    .from('marcheur_medias')
    .select('url_fichier,external_url,type_media,is_public,shared_to_web,metadata,created_at,titre')
    .eq('type_media', 'photo')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(400);
  if (eventId) q = q.eq('marche_event_id', eventId);
  const { data } = await q;
  return (data || [])
    .filter((m: any) => inAmbiance(m.metadata?.taken_at || m.created_at, amb))
    .map((m: any) => ({
      url: m.url_fichier || m.external_url,
      attribution: m.titre || 'Marcheur·euse',
    }))
    .filter((p) => !!p.url);
}


const LEPIDOPTERA_FAMILIES = new Set([
  'nymphalidae','pieridae','papilionidae','lycaenidae','hesperiidae',
  'sphingidae','saturniidae','erebidae','noctuidae','geometridae',
  'zygaenidae','riodinidae','crambidae','tortricidae',
]);
const ODONATA_FAMILIES = new Set([
  'libellulidae','aeshnidae','coenagrionidae','calopterygidae',
  'gomphidae','lestidae','platycnemididae','cordulegastridae','corduliidae',
]);
const POLLINATOR_FAMILIES = new Set(['apidae','vespidae','syrphidae','andrenidae','halictidae','megachilidae','bombyliidae']);

const WINGED_NAME_RE = /papillon|lepidopt|azur[ée]|vulcain|belle[- ]?dame|citron|machaon|paon[- ]?du[- ]?jour|tircis|myrtil|pi[ée]ride|nacr[ée]|robert[- ]?le[- ]?diable|amaryllis|demi[- ]?deuil|flamb[ée]|odonat|libellul|agrion|[aæ]schne|calopteryx|abeille|bourdon|syrphe|hym[ée]nopt/i;

function matchKingdom(s: any, kingdom: Kingdom): boolean {
  if (kingdom === 'all') return true;
  const iconic = String(s.iconicTaxon || s.iconic_taxon || s.iconicTaxonName || '').toLowerCase();
  const king = String(s.kingdom || '').toLowerCase();
  const family = String(s.family || '').toLowerCase();
  const order = String(s.taxonOrder || s.order || '').toLowerCase();
  const rank = String(s.taxonClass || s.class || '').toLowerCase();
  const name = String(s.commonName || s.common_name || s.scientificName || '').toLowerCase();

  if (kingdom === 'flora') return iconic === 'plantae' || king === 'plantae';
  if (kingdom === 'fungi') return iconic === 'fungi' || king === 'fungi' || iconic === 'protozoa';
  if (kingdom === 'winged') {
    if (iconic === 'aves' || rank === 'aves') return true;
    if (order === 'lepidoptera' || order === 'odonata') return true;
    if (LEPIDOPTERA_FAMILIES.has(family)) return true;
    if (ODONATA_FAMILIES.has(family)) return true;
    if (POLLINATOR_FAMILIES.has(family)) return true;
    if ((iconic === 'insecta' || rank === 'insecta') && WINGED_NAME_RE.test(name)) return true;
    return false;
  }
  if (kingdom === 'small_fauna') {
    if (['insecta','arachnida','reptilia','amphibia','mollusca','mammalia','actinopterygii'].includes(iconic)) {
      // exclure ce qui appartient à "winged" pour éviter les doublons visuels
      if (iconic === 'insecta' && (LEPIDOPTERA_FAMILIES.has(family) || ODONATA_FAMILIES.has(family) || POLLINATOR_FAMILIES.has(family))) return false;
      if (iconic === 'insecta' && (order === 'lepidoptera' || order === 'odonata')) return false;
      return true;
    }
    return ['reptilia','amphibia','insecta','arachnida'].includes(rank);
  }
  return true;
}


function extractSpeciesUrl(s: any): string | null {
  const raw =
    s.photoData?.url ||
    (Array.isArray(s.photos) ? s.photos[0] : undefined) ||
    s.photoUrl ||
    s.photo_url ||
    null;
  if (!raw) return null;
  return String(raw).replace('/square.', '/medium.').replace('/small.', '/medium.');
}

async function fetchSpeciesPhotos(eventId?: string, kingdom: Kingdom = 'all'): Promise<PickedPhoto[]> {
  const marcheIds = await resolveMarcheIds(eventId);
  if (eventId && marcheIds.length === 0) return [];
  let q = supabase
    .from('biodiversity_snapshots')
    .select('species_data,marche_id')
    .order('snapshot_date', { ascending: false })
    .limit(kingdom === 'all' ? 60 : 250);
  if (marcheIds.length > 0) q = q.in('marche_id', marcheIds);
  const { data } = await q;
  const photos: PickedPhoto[] = [];
  const seenUrl = new Set<string>();
  let scanned = 0;
  let matched = 0;
  let familyLepidoptera = 0;
  let familyOdonata = 0;
  for (const snap of data || []) {
    const species = ((snap as any).species_data as any[]) || [];
    for (const s of species) {
      scanned++;
      const name = s.scientificName || s.scientific_name;
      if (!name) continue;
      const fam = String(s.family || '').toLowerCase();
      if (LEPIDOPTERA_FAMILIES.has(fam)) familyLepidoptera++;
      if (ODONATA_FAMILIES.has(fam)) familyOdonata++;
      if (!matchKingdom(s, kingdom)) continue;
      matched++;
      // Collecte de TOUTES les photos de l'espèce (photoData + photos[])
      const urls: string[] = [];
      if (s.photoData?.url) urls.push(String(s.photoData.url));
      if (Array.isArray(s.photos)) for (const u of s.photos) if (u) urls.push(String(u));
      if (s.photoUrl) urls.push(String(s.photoUrl));
      if (s.photo_url) urls.push(String(s.photo_url));
      for (const raw of urls) {
        const url = raw.replace('/square.', '/medium.').replace('/small.', '/medium.');
        if (seenUrl.has(url)) continue;
        seenUrl.add(url);
        photos.push({
          url,
          scientificName: name,
          attribution: s.commonName || s.common_name,
        });
        if (photos.length >= 400) break;
      }
      if (photos.length >= 400) break;
    }
    if (photos.length >= 400) break;
  }
  console.debug('[wallpaper] species pool', { kingdom, marcheIds: marcheIds.length, scanned, matched, kept: photos.length, familyLepidoptera, familyOdonata });
  return photos;
}


export interface PickResult {
  photos: PickedPhoto[];
  kingdomShortfall: boolean;
  poolSize: number;
}

export async function pickPhotos(opts: {
  category: Category;
  ambiance: Ambiance;
  eventId?: string;
  count?: number;
  kingdom?: Kingdom;
}): Promise<PickedPhoto[]> {
  const result = await pickPhotosDetailed(opts);
  return result.photos;
}

// Mulberry32 — shuffle déterministe par seed
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function pickPhotosDetailed(opts: {
  category: Category;
  ambiance: Ambiance;
  eventId?: string;
  count?: number;
  kingdom?: Kingdom;
  excludeUrls?: Set<string>;
  seed?: number;
}): Promise<PickResult> {
  const count = opts.count ?? 5;
  const kingdom = opts.kingdom ?? 'all';
  const excluded = opts.excludeUrls ?? new Set<string>();
  const seed = opts.seed ?? Date.now();

  const speciesRaw = await fetchSpeciesPhotos(opts.eventId, kingdom);
  const walkerRaw = kingdom === 'all' || opts.category !== 'species'
    ? await fetchWalkerPhotos(opts.eventId, opts.ambiance)
    : [];
  const officialRaw = opts.category !== 'species'
    ? await fetchOfficialPhotos(opts.eventId)
    : [];

  const totalPool = speciesRaw.length + walkerRaw.length + officialRaw.length;

  // Filtre exclusion + shuffle par pool
  const filter = (arr: PickedPhoto[]) => arr.filter((p) => !excluded.has(p.url));
  let speciesPool = seededShuffle(filter(speciesRaw), seed);
  let walkerPool = seededShuffle(filter(walkerRaw), seed + 101);
  let officialPool = seededShuffle(filter(officialRaw), seed + 211);

  // Si l'exclusion vide un pool essentiel, on relâche pour cette catégorie
  if (kingdom !== 'all' && speciesPool.length < 3 && speciesRaw.length >= 3) {
    speciesPool = seededShuffle(speciesRaw, seed);
  }

  // Ordre des pools selon catégorie/règne (priorité au règne quand spécifié)
  const orderedPools: PickedPhoto[][] = [];
  if (kingdom !== 'all') {
    orderedPools.push(speciesPool);
    if (opts.category !== 'species') orderedPools.push(walkerPool, officialPool);
  } else if (opts.category === 'species') {
    orderedPools.push(speciesPool, walkerPool);
  } else if (opts.category === 'landscape' || opts.category === 'territory') {
    orderedPools.push(officialPool, walkerPool, speciesPool);
  } else {
    orderedPools.push(walkerPool, officialPool, speciesPool);
  }

  // Round-robin entre pools : 1 espèce, 1 marcheur, 1 officiel, 1 espèce…
  const merged: PickedPhoto[] = [];
  const seen = new Set<string>();
  const seenSpecies = new Set<string>();
  const cursors = orderedPools.map(() => 0);
  const target = Math.max(count, 6) * 4; // large marge pour dédup + diversité
  let guard = 0;
  while (merged.length < target && guard < 5000) {
    guard++;
    let advanced = false;
    for (let i = 0; i < orderedPools.length; i++) {
      const pool = orderedPools[i];
      while (cursors[i] < pool.length) {
        const p = pool[cursors[i]++];
        if (seen.has(p.url)) continue;
        if (p.scientificName && seenSpecies.has(p.scientificName)) continue;
        seen.add(p.url);
        if (p.scientificName) seenSpecies.add(p.scientificName);
        merged.push(p);
        advanced = true;
        break;
      }
      if (merged.length >= target) break;
    }
    if (!advanced) break;
  }

  const kingdomShortfall = kingdom !== 'all' && speciesPool.length < 3;

  // Fallback si vraiment vide
  if (merged.length < 3 && kingdom !== 'all') {
    const general = seededShuffle(await fetchSpeciesPhotos(opts.eventId, 'all'), seed + 313);
    for (const p of general) {
      if (seen.has(p.url)) continue;
      if (p.scientificName && seenSpecies.has(p.scientificName)) continue;
      seen.add(p.url);
      if (p.scientificName) seenSpecies.add(p.scientificName);
      merged.push(p);
      if (merged.length >= target) break;
    }
  }

  const final = merged.slice(0, Math.max(count, 3));

  console.debug('[wallpaper] pickPhotos', {
    category: opts.category,
    kingdom,
    seed,
    excluded: excluded.size,
    speciesPool: speciesPool.length,
    walkerPool: walkerPool.length,
    officialPool: officialPool.length,
    returned: final.length,
    totalPool,
    kingdomShortfall,
  });

  return { photos: final, kingdomShortfall, poolSize: totalPool };
}



