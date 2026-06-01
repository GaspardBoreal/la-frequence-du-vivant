import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BodyIn {
  explorationId?: string;
  scientificNames?: string[];
  maxAgeDays?: number;
  limit?: number;
}

// Mini-dictionary of historical describers (FR). Keys are surname-lowercased.
const DESCRIBERS_KB: Record<string, { name: string; country: string; birth?: number; bio?: string }> = {
  linnaeus: { name: 'Carl von Linné', country: 'SE', birth: 1707, bio: 'Père de la taxonomie binomiale' },
  linné: { name: 'Carl von Linné', country: 'SE', birth: 1707 },
  l: { name: 'Carl von Linné', country: 'SE', birth: 1707 },
  cuvier: { name: 'Georges Cuvier', country: 'FR', birth: 1769, bio: 'Anatomiste comparé, fondateur de la paléontologie' },
  lamarck: { name: 'Jean-Baptiste de Lamarck', country: 'FR', birth: 1744, bio: 'Naturaliste, théoricien du transformisme' },
  buffon: { name: 'Georges-Louis Leclerc, comte de Buffon', country: 'FR', birth: 1707 },
  brongniart: { name: 'Adolphe Brongniart', country: 'FR', birth: 1801 },
  vieillot: { name: 'Louis Pierre Vieillot', country: 'FR', birth: 1748, bio: 'Ornithologue français' },
  latreille: { name: 'Pierre André Latreille', country: 'FR', birth: 1762, bio: 'Entomologiste, prince des entomologistes' },
  fabricius: { name: 'Johan Christian Fabricius', country: 'DK', birth: 1745, bio: 'Entomologiste danois, élève de Linné' },
  scopoli: { name: 'Giovanni Antonio Scopoli', country: 'IT', birth: 1723 },
  müller: { name: 'Otto Friedrich Müller', country: 'DK', birth: 1730 },
  muller: { name: 'Otto Friedrich Müller', country: 'DK', birth: 1730 },
  gmelin: { name: 'Johann Friedrich Gmelin', country: 'DE', birth: 1748 },
  pallas: { name: 'Peter Simon Pallas', country: 'DE', birth: 1741, bio: 'Naturaliste-explorateur de Sibérie' },
  bonaparte: { name: 'Charles Lucien Bonaparte', country: 'FR', birth: 1803, bio: 'Ornithologue, neveu de Napoléon' },
  audubon: { name: 'John James Audubon', country: 'US', birth: 1785, bio: 'Ornithologue, peintre des oiseaux d\'Amérique' },
  temminck: { name: 'Coenraad Jacob Temminck', country: 'NL', birth: 1778 },
  hübner: { name: 'Jacob Hübner', country: 'DE', birth: 1761 },
  hubner: { name: 'Jacob Hübner', country: 'DE', birth: 1761 },
  geoffroy: { name: 'Étienne Geoffroy Saint-Hilaire', country: 'FR', birth: 1772 },
  saintHilaire: { name: 'Étienne Geoffroy Saint-Hilaire', country: 'FR', birth: 1772 },
  rafinesque: { name: 'Constantine Samuel Rafinesque', country: 'US', birth: 1783 },
  forster: { name: 'Johann Reinhold Forster', country: 'DE', birth: 1729 },
  swainson: { name: 'William John Swainson', country: 'GB', birth: 1789 },
  gould: { name: 'John Gould', country: 'GB', birth: 1804, bio: 'Ornithologue britannique' },
  sowerby: { name: 'James Sowerby', country: 'GB', birth: 1757 },
  desfontaines: { name: 'René Louiche Desfontaines', country: 'FR', birth: 1750 },
  jussieu: { name: 'Antoine Laurent de Jussieu', country: 'FR', birth: 1748 },
  dc: { name: 'Augustin Pyrame de Candolle', country: 'CH', birth: 1778 },
  candolle: { name: 'Augustin Pyrame de Candolle', country: 'CH', birth: 1778 },
  miller: { name: 'Philip Miller', country: 'GB', birth: 1691, bio: 'Botaniste-jardinier, Chelsea Physic Garden' },
  hudson: { name: 'William Hudson', country: 'GB', birth: 1730 },
  willdenow: { name: 'Carl Ludwig Willdenow', country: 'DE', birth: 1765 },
  walter: { name: 'Thomas Walter', country: 'GB', birth: 1740 },
  michaux: { name: 'André Michaux', country: 'FR', birth: 1746, bio: 'Botaniste-explorateur de l\'Amérique du Nord' },
  rothschild: { name: 'Walter Rothschild', country: 'GB', birth: 1868 },
};

function parseAuthorship(authorship: string | undefined | null): {
  describer_name?: string;
  describer_year?: number;
  describer_country?: string;
  describer_birth_year?: number;
} {
  if (!authorship) return {};
  // Strip parentheses (combinator authorship)
  const cleaned = authorship.replace(/[()]/g, '').trim();
  // Match "Surname, 1758" or "(Surname, 1758)" or "Surname & Other, 1758"
  const m = cleaned.match(/^([A-ZÀ-Ý][\wÀ-ÿ.\-' ]+?)(?:\s*&[^,]*)?,?\s*(\d{4})/);
  if (!m) {
    // Try without year
    const m2 = cleaned.match(/^([A-ZÀ-Ý][\wÀ-ÿ.\-' ]+?)(?:\s|$)/);
    if (!m2) return {};
    const surname = m2[1].split(/\s+/).pop()!.toLowerCase().replace(/\W/g, '');
    const entry = DESCRIBERS_KB[surname];
    return entry ? { describer_name: entry.name, describer_country: entry.country, describer_birth_year: entry.birth } : { describer_name: m2[1] };
  }
  const fullName = m[1].trim();
  const year = parseInt(m[2], 10);
  const surname = fullName.split(/\s+/).pop()!.toLowerCase().replace(/\W/g, '');
  const entry = DESCRIBERS_KB[surname];
  if (entry) {
    return {
      describer_name: entry.name,
      describer_year: year,
      describer_country: entry.country,
      describer_birth_year: entry.birth,
    };
  }
  return { describer_name: fullName, describer_year: year };
}

async function gbifMatch(sci: string): Promise<{ usageKey?: number; authorship?: string }> {
  const r = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(sci)}&strict=false`);
  if (!r.ok) return {};
  const j = await r.json();
  return { usageKey: j.usageKey, authorship: j.authorship };
}

async function gbifDistributions(usageKey: number): Promise<{ native: string[]; introduced: string[] }> {
  const native: string[] = [];
  const introduced: string[] = [];
  try {
    const r = await fetch(`https://api.gbif.org/v1/species/${usageKey}/distributions?limit=300`);
    if (!r.ok) return { native, introduced };
    const j = await r.json();
    const seenN = new Set<string>();
    const seenI = new Set<string>();
    for (const d of j.results || []) {
      const c = d.country;
      const status = (d.establishmentMeans || d.status || '').toString().toUpperCase();
      if (!c || typeof c !== 'string') continue;
      if (status.includes('NATIVE') || status === '' || status.includes('ENDEMIC')) {
        if (!seenN.has(c)) { seenN.add(c); native.push(c); }
      } else if (status.includes('INTRODUCED') || status.includes('NATURALISED') || status.includes('INVASIVE')) {
        if (!seenI.has(c)) { seenI.add(c); introduced.push(c); }
      }
    }
  } catch (_) { /* ignore */ }
  return { native, introduced };
}

// Continent mapping (rough) by ISO-2
const ISO_TO_CONTINENT: Record<string, string> = {
  // EU
  FR: 'EU', DE: 'EU', ES: 'EU', IT: 'EU', GB: 'EU', PT: 'EU', NL: 'EU', BE: 'EU', CH: 'EU', AT: 'EU', SE: 'EU', NO: 'EU', FI: 'EU', DK: 'EU', PL: 'EU', CZ: 'EU', RO: 'EU', GR: 'EU', IE: 'EU', HU: 'EU', BG: 'EU', RS: 'EU', HR: 'EU', SK: 'EU', SI: 'EU', LT: 'EU', LV: 'EU', EE: 'EU', UA: 'EU', RU: 'EU', TR: 'EU',
  // AS
  CN: 'AS', JP: 'AS', IN: 'AS', KR: 'AS', VN: 'AS', TH: 'AS', ID: 'AS', PH: 'AS', MY: 'AS', SG: 'AS', PK: 'AS', BD: 'AS', IR: 'AS', IQ: 'AS', SA: 'AS', AE: 'AS', IL: 'AS', LB: 'AS', SY: 'AS', JO: 'AS', AF: 'AS', NP: 'AS', LK: 'AS', MM: 'AS', KH: 'AS', LA: 'AS', MN: 'AS', KZ: 'AS', UZ: 'AS',
  // AF
  ZA: 'AF', EG: 'AF', MA: 'AF', DZ: 'AF', TN: 'AF', LY: 'AF', SD: 'AF', ET: 'AF', KE: 'AF', TZ: 'AF', UG: 'AF', NG: 'AF', GH: 'AF', SN: 'AF', CI: 'AF', CM: 'AF', CD: 'AF', AO: 'AF', MG: 'AF', ZW: 'AF', MZ: 'AF', NA: 'AF', BW: 'AF',
  // NA
  US: 'NA', CA: 'NA', MX: 'NA', CU: 'NA', JM: 'NA', HT: 'NA', DO: 'NA', GT: 'NA', HN: 'NA', CR: 'NA', PA: 'NA', NI: 'NA', SV: 'NA', BZ: 'NA',
  // SA
  BR: 'SA', AR: 'SA', CL: 'SA', PE: 'SA', CO: 'SA', VE: 'SA', BO: 'SA', PY: 'SA', UY: 'SA', EC: 'SA', GY: 'SA', SR: 'SA',
  // OC
  AU: 'OC', NZ: 'OC', PG: 'OC', FJ: 'OC',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body: BodyIn = await req.json().catch(() => ({}));
    const maxAgeDays = body.maxAgeDays ?? 180;
    const limit = Math.min(body.limit ?? 80, 200);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Resolve scientific names
    let names: string[] = body.scientificNames || [];
    if (!names.length && body.explorationId) {
      const { data: em } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', body.explorationId);
      const marcheIds = (em || []).map((x: any) => x.marche_id);
      if (marcheIds.length) {
        const { data: snaps } = await supabase
          .from('biodiversity_snapshots')
          .select('species_data')
          .in('marche_id', marcheIds);
        const set = new Set<string>();
        (snaps || []).forEach((s: any) => {
          (Array.isArray(s.species_data) ? s.species_data : []).forEach((sp: any) => {
            const n = (sp.scientificName || sp.scientific_name || '').toString().trim();
            if (n) set.add(n);
          });
        });
        names = Array.from(set);
      }
    }
    if (!names.length) {
      return new Response(JSON.stringify({ enriched: 0, cached: 0, failed: 0, message: 'no species' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check what's already cached
    const { data: existing } = await supabase
      .from('species_biogeography_kb')
      .select('scientific_name, fetched_at')
      .in('scientific_name', names);
    const cutoff = Date.now() - maxAgeDays * 24 * 3600 * 1000;
    const fresh = new Set(
      (existing || []).filter((r: any) => new Date(r.fetched_at).getTime() > cutoff).map((r: any) => r.scientific_name),
    );
    const toEnrich = names.filter((n) => !fresh.has(n)).slice(0, limit);
    let enriched = 0;
    let failed = 0;

    for (const sci of toEnrich) {
      try {
        const m = await gbifMatch(sci);
        const authorParsed = parseAuthorship(m.authorship);
        let dist = { native: [] as string[], introduced: [] as string[] };
        if (m.usageKey) {
          dist = await gbifDistributions(m.usageKey);
        }
        const continents = Array.from(new Set(dist.native.map((c) => ISO_TO_CONTINENT[c]).filter(Boolean)));
        await supabase.from('species_biogeography_kb').upsert({
          scientific_name: sci,
          native_countries: dist.native,
          native_continents: continents,
          introduced_countries: dist.introduced,
          authorship: m.authorship ?? null,
          describer_name: authorParsed.describer_name ?? null,
          describer_year: authorParsed.describer_year ?? null,
          describer_country: authorParsed.describer_country ?? null,
          describer_birth_year: authorParsed.describer_birth_year ?? null,
          gbif_usage_key: m.usageKey ?? null,
          fetched_at: new Date().toISOString(),
        });
        enriched++;
        // throttle ~5 req/s
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        enriched,
        cached: fresh.size,
        failed,
        total: names.length,
        remaining: Math.max(0, names.length - fresh.size - enriched),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
