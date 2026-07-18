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
    .limit(80);
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
    .limit(150);
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

function matchKingdom(s: any, kingdom: Kingdom): boolean {
  if (kingdom === 'all') return true;
  const iconic = String(s.iconicTaxon || s.iconic_taxon || s.iconicTaxonName || '').toLowerCase();
  const king = String(s.kingdom || '').toLowerCase();
  const rank = String(s.taxonClass || s.class || '').toLowerCase();
  if (kingdom === 'flora') return iconic === 'plantae' || king === 'plantae';
  if (kingdom === 'fungi') return iconic === 'fungi' || king === 'fungi' || iconic === 'protozoa';
  if (kingdom === 'winged') return iconic === 'aves' || rank === 'aves' || iconic === 'insecta' && /papillon|lepidopt|odonat|hymenopt/i.test(String(s.commonName || s.common_name || s.scientificName || ''));
  if (kingdom === 'small_fauna') return ['insecta','arachnida','reptilia','amphibia','mollusca','mammalia','actinopterygii'].includes(iconic) || ['reptilia','amphibia','insecta','arachnida'].includes(rank);
  return true;
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
  for (const snap of data || []) {
    const species = ((snap as any).species_data as any[]) || [];
    for (const s of species) {
      const name = s.scientificName || s.scientific_name;
      const url = s.photoUrl || s.photo_url;
      if (!name || !url || seen.has(name)) continue;
      if (!matchKingdom(s, kingdom)) continue;
      seen.add(name);
      photos.push({
        url: String(url).replace('/square.', '/medium.').replace('/small.', '/medium.'),
        scientificName: name,
        attribution: s.commonName || s.common_name,
      });
      if (photos.length >= 60) break;
    }
    if (photos.length >= 60) break;
  }
  return photos;
}

export async function pickPhotos(opts: {
  category: Category;
  ambiance: Ambiance;
  eventId?: string;
  count?: number;
  kingdom?: Kingdom;
}): Promise<PickedPhoto[]> {
  const count = opts.count ?? 5;
  const kingdom = opts.kingdom ?? 'all';
  const pools: PickedPhoto[][] = [];
  if (opts.category === 'species') {
    pools.push(await fetchSpeciesPhotos(opts.eventId, kingdom));
    if (kingdom === 'all') pools.push(await fetchWalkerPhotos(opts.eventId, opts.ambiance));
  } else if (opts.category === 'landscape' || opts.category === 'territory') {
    pools.push(await fetchOfficialPhotos(opts.eventId));
    pools.push(await fetchWalkerPhotos(opts.eventId, opts.ambiance));
    if (kingdom !== 'all') pools.push(await fetchSpeciesPhotos(opts.eventId, kingdom));
  } else {
    pools.push(await fetchWalkerPhotos(opts.eventId, opts.ambiance));
    pools.push(await fetchOfficialPhotos(opts.eventId));
    if (kingdom !== 'all') pools.push(await fetchSpeciesPhotos(opts.eventId, kingdom));
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
  // Fallback: si le filtre règne renvoie < 3, compléter avec le pool général
  if (merged.length < 3 && kingdom !== 'all') {
    const general = await fetchSpeciesPhotos(opts.eventId, 'all');
    for (const p of general) {
      if (seen.has(p.url)) continue;
      seen.add(p.url);
      merged.push(p);
    }
  }
  merged.sort(() => Math.random() - 0.5);
  return merged.slice(0, Math.max(count, 3));
}

