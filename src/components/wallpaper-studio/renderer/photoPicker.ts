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

async function fetchOfficialPhotos(eventId?: string): Promise<PickedPhoto[]> {
  let marcheId: string | null = null;
  if (eventId) {
    const { data: ev } = await supabase.from('marche_events').select('marche_id').eq('id', eventId).maybeSingle();
    marcheId = (ev as any)?.marche_id || null;
  }
  let q = supabase
    .from('marche_photos')
    .select('url_supabase,url_originale,titre,metadata')
    .order('ordre', { ascending: true })
    .limit(300);
  if (marcheId) q = q.eq('marche_id', marcheId);
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

function matchKingdom(s: any, kingdom: Kingdom): boolean {
  if (kingdom === 'all') return true;
  const iconic = String(s.iconicTaxon || s.iconic_taxon || s.iconicTaxonName || '').toLowerCase();
  const king = String(s.kingdom || '').toLowerCase();
  const family = String(s.family || '').toLowerCase();
  const rank = String(s.taxonClass || s.class || '').toLowerCase();
  const name = String(s.commonName || s.common_name || s.scientificName || '').toLowerCase();

  if (kingdom === 'flora') return iconic === 'plantae' || king === 'plantae';
  if (kingdom === 'fungi') return iconic === 'fungi' || king === 'fungi' || iconic === 'protozoa';
  if (kingdom === 'winged') {
    if (iconic === 'aves' || rank === 'aves') return true;
    if (LEPIDOPTERA_FAMILIES.has(family)) return true;
    if (ODONATA_FAMILIES.has(family)) return true;
    if (POLLINATOR_FAMILIES.has(family)) return true;
    if (iconic === 'insecta' && /papillon|lepidopt|odonat|libellul|abeille|bourdon|syrphe|hymenopt/i.test(name)) return true;
    return false;
  }
  if (kingdom === 'small_fauna') {
    if (['insecta','arachnida','reptilia','amphibia','mollusca','mammalia','actinopterygii'].includes(iconic)) {
      // exclure ce qui appartient à "winged" pour éviter les doublons visuels
      if (iconic === 'insecta' && (LEPIDOPTERA_FAMILIES.has(family) || ODONATA_FAMILIES.has(family) || POLLINATOR_FAMILIES.has(family))) return false;
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
  let q = supabase
    .from('biodiversity_snapshots')
    .select('species_data,marche_id')
    .order('snapshot_date', { ascending: false })
    .limit(20);
  if (eventId) {
    const { data: ev } = await supabase.from('marche_events').select('marche_id').eq('id', eventId).maybeSingle();
    const mid = (ev as any)?.marche_id;
    if (mid) q = q.eq('marche_id', mid);
  }
  const { data } = await q;
  const photos: PickedPhoto[] = [];
  const seen = new Set<string>();
  let scanned = 0;
  let matched = 0;
  for (const snap of data || []) {
    const species = ((snap as any).species_data as any[]) || [];
    for (const s of species) {
      scanned++;
      const name = s.scientificName || s.scientific_name;
      const url = extractSpeciesUrl(s);
      if (!name || !url || seen.has(name)) continue;
      if (!matchKingdom(s, kingdom)) continue;
      matched++;
      seen.add(name);
      photos.push({
        url,
        scientificName: name,
        attribution: s.commonName || s.common_name,
      });
      if (photos.length >= 80) break;
    }
    if (photos.length >= 80) break;
  }
  console.debug('[wallpaper] species pool', { kingdom, scanned, matched, kept: photos.length });
  return photos;
}

export interface PickResult {
  photos: PickedPhoto[];
  kingdomShortfall: boolean;
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

export async function pickPhotosDetailed(opts: {
  category: Category;
  ambiance: Ambiance;
  eventId?: string;
  count?: number;
  kingdom?: Kingdom;
}): Promise<PickResult> {
  const count = opts.count ?? 5;
  const kingdom = opts.kingdom ?? 'all';

  const speciesPool = await fetchSpeciesPhotos(opts.eventId, kingdom);
  const walkerPool = kingdom === 'all' || opts.category !== 'species'
    ? await fetchWalkerPhotos(opts.eventId, opts.ambiance)
    : [];
  const officialPool = opts.category !== 'species'
    ? await fetchOfficialPhotos(opts.eventId)
    : [];

  // Ordre de priorité selon la catégorie ET le règne
  const pools: PickedPhoto[][] = [];
  if (kingdom !== 'all') {
    // Le règne domine : les espèces filtrées passent d'abord
    pools.push(speciesPool);
    if (opts.category !== 'species') {
      pools.push(walkerPool, officialPool);
    }
  } else if (opts.category === 'species') {
    pools.push(speciesPool, walkerPool);
  } else if (opts.category === 'landscape' || opts.category === 'territory') {
    pools.push(officialPool, walkerPool);
  } else {
    pools.push(walkerPool, officialPool);
  }

  const merged: PickedPhoto[] = [];
  const seen = new Set<string>();
  for (const pool of pools) {
    for (const p of pool) {
      if (seen.has(p.url)) continue;
      seen.add(p.url);
      merged.push(p);
    }
  }

  // Détection de pénurie sur le règne demandé
  const kingdomShortfall = kingdom !== 'all' && speciesPool.length < 3;

  if (kingdomShortfall) {
    // Compléter avec un pool général pour ne pas laisser un canvas vide,
    // mais on remonte le flag pour prévenir l'utilisateur.
    const general = await fetchSpeciesPhotos(opts.eventId, 'all');
    for (const p of general) {
      if (seen.has(p.url)) continue;
      seen.add(p.url);
      merged.push(p);
    }
    if (walkerPool.length === 0) {
      const w = await fetchWalkerPhotos(opts.eventId, opts.ambiance);
      for (const p of w) {
        if (seen.has(p.url)) continue;
        seen.add(p.url);
        merged.push(p);
      }
    }
  }

  // Mélange léger tout en gardant les premières photos "règne" en tête
  const head = merged.slice(0, Math.min(speciesPool.length, count));
  const tail = merged.slice(head.length).sort(() => Math.random() - 0.5);
  const final = [...head.sort(() => Math.random() - 0.5), ...tail].slice(0, Math.max(count, 3));

  console.debug('[wallpaper] pickPhotos', {
    category: opts.category,
    kingdom,
    speciesPool: speciesPool.length,
    walkerPool: walkerPool.length,
    officialPool: officialPool.length,
    returned: final.length,
    kingdomShortfall,
  });

  return { photos: final, kingdomShortfall };
}


