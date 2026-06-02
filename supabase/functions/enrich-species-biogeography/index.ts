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
  force?: boolean;
}

interface SourceRef {
  name: string;
  url: string;
  field: string;
  accessed_at: string;
}

// ============================================================
// Authors dictionary (kept for describer enrichment)
// ============================================================
const DESCRIBERS_KB: Record<string, { name: string; country: string; birth?: number; bio?: string }> = {
  linnaeus: { name: 'Carl von Linné', country: 'SE', birth: 1707, bio: 'Père de la taxonomie binomiale' },
  linné: { name: 'Carl von Linné', country: 'SE', birth: 1707 },
  l: { name: 'Carl von Linné', country: 'SE', birth: 1707 },
  cuvier: { name: 'Georges Cuvier', country: 'FR', birth: 1769 },
  lamarck: { name: 'Jean-Baptiste de Lamarck', country: 'FR', birth: 1744 },
  buffon: { name: 'Georges-Louis Leclerc, comte de Buffon', country: 'FR', birth: 1707 },
  brongniart: { name: 'Adolphe Brongniart', country: 'FR', birth: 1801 },
  vieillot: { name: 'Louis Pierre Vieillot', country: 'FR', birth: 1748 },
  latreille: { name: 'Pierre André Latreille', country: 'FR', birth: 1762 },
  fabricius: { name: 'Johan Christian Fabricius', country: 'DK', birth: 1745 },
  scopoli: { name: 'Giovanni Antonio Scopoli', country: 'IT', birth: 1723 },
  müller: { name: 'Otto Friedrich Müller', country: 'DK', birth: 1730 },
  muller: { name: 'Otto Friedrich Müller', country: 'DK', birth: 1730 },
  gmelin: { name: 'Johann Friedrich Gmelin', country: 'DE', birth: 1748 },
  pallas: { name: 'Peter Simon Pallas', country: 'DE', birth: 1741 },
  bonaparte: { name: 'Charles Lucien Bonaparte', country: 'FR', birth: 1803 },
  audubon: { name: 'John James Audubon', country: 'US', birth: 1785 },
  temminck: { name: 'Coenraad Jacob Temminck', country: 'NL', birth: 1778 },
  hübner: { name: 'Jacob Hübner', country: 'DE', birth: 1761 },
  hubner: { name: 'Jacob Hübner', country: 'DE', birth: 1761 },
  geoffroy: { name: 'Étienne Geoffroy Saint-Hilaire', country: 'FR', birth: 1772 },
  rafinesque: { name: 'Constantine Samuel Rafinesque', country: 'US', birth: 1783 },
  forster: { name: 'Johann Reinhold Forster', country: 'DE', birth: 1729 },
  swainson: { name: 'William John Swainson', country: 'GB', birth: 1789 },
  gould: { name: 'John Gould', country: 'GB', birth: 1804 },
  sowerby: { name: 'James Sowerby', country: 'GB', birth: 1757 },
  desfontaines: { name: 'René Louiche Desfontaines', country: 'FR', birth: 1750 },
  jussieu: { name: 'Antoine Laurent de Jussieu', country: 'FR', birth: 1748 },
  dc: { name: 'Augustin Pyrame de Candolle', country: 'CH', birth: 1778 },
  candolle: { name: 'Augustin Pyrame de Candolle', country: 'CH', birth: 1778 },
  miller: { name: 'Philip Miller', country: 'GB', birth: 1691 },
  hudson: { name: 'William Hudson', country: 'GB', birth: 1730 },
  willdenow: { name: 'Carl Ludwig Willdenow', country: 'DE', birth: 1765 },
  walter: { name: 'Thomas Walter', country: 'GB', birth: 1740 },
  michaux: { name: 'André Michaux', country: 'FR', birth: 1746 },
  rothschild: { name: 'Walter Rothschild', country: 'GB', birth: 1868 },
};

function parseAuthorship(authorship: string | undefined | null) {
  if (!authorship) return {} as any;
  const cleaned = authorship.replace(/[()]/g, '').trim();
  const m = cleaned.match(/^([A-ZÀ-Ý][\wÀ-ÿ.\-' ]+?)(?:\s*&[^,]*)?,?\s*(\d{4})/);
  let fullName = '', year: number | undefined;
  if (m) { fullName = m[1].trim(); year = parseInt(m[2], 10); }
  else {
    const m2 = cleaned.match(/^([A-ZÀ-Ý][\wÀ-ÿ.\-' ]+?)(?:\s|$)/);
    if (!m2) return {};
    fullName = m2[1].trim();
  }
  const surname = fullName.split(/\s+/).pop()!.toLowerCase().replace(/\W/g, '');
  const entry = DESCRIBERS_KB[surname];
  return entry
    ? { describer_name: entry.name, describer_year: year, describer_country: entry.country, describer_birth_year: entry.birth }
    : { describer_name: fullName, describer_year: year };
}

// ============================================================
// TDWG WGSRPD Level 3 → ISO-2 (most common regions used by POWO)
// Conservative mapping: only when L3 maps unambiguously to ONE country.
// ============================================================
const TDWG_L3_TO_ISO: Record<string, string> = {
  // Europe
  FRA: 'FR', COR: 'FR', GRB: 'GB', IRE: 'IE', NOR: 'NO', SWE: 'SE', FIN: 'FI', DEN: 'DK',
  NTH: 'NL', BGM: 'BE', LUX: 'LU', GER: 'DE', SWI: 'CH', AUT: 'AT', ITA: 'IT', SAR: 'IT',
  SIC: 'IT', SPA: 'ES', BAL: 'ES', POR: 'PT', AZO: 'PT', MDR: 'PT', POL: 'PL', CZE: 'CZ',
  SLO: 'SK', HUN: 'HU', ROM: 'RO', BUL: 'BG', YUG: 'RS', ALB: 'AL', GRC: 'GR', CYP: 'CY',
  TUE: 'TR', EAI: 'EE', LAT: 'LV', LIT: 'LT', BLR: 'BY', UKR: 'UA',
  KRY: 'UA', RUC: 'RU', RUE: 'RU', RUN: 'RU', RUS: 'RU', RUW: 'RU',
  // Asia
  CHC: 'CN', CHN: 'CN', CHS: 'CN', CHM: 'CN', CHI: 'CN', CHQ: 'CN', CHT: 'CN', CHX: 'CN',
  TAI: 'TW', JAP: 'JP', KOR: 'KR', MON: 'MN', AMU: 'RU', PRM: 'RU', KAM: 'RU', KUR: 'RU',
  SAK: 'RU', WSB: 'RU', YAK: 'RU', IND: 'IN', SRL: 'LK', NPL: 'NP', BHU: 'BT', BAN: 'BD',
  PAK: 'PK', ASS: 'IN', MYA: 'MM', THA: 'TH', VIE: 'VN', LAO: 'LA', CBD: 'KH', MLY: 'MY',
  PHI: 'PH', BOR: 'ID', JAW: 'ID', SUM: 'ID', SUL: 'ID', LSI: 'ID', MOL: 'ID', NWG: 'PG',
  IRN: 'IR', IRQ: 'IQ', AFG: 'AF', PAL: 'IL', LBS: 'LB', SYR: 'SY', SIN: 'IL', SAU: 'SA',
  YEM: 'YE', OMA: 'OM', GST: 'AE', KUW: 'KW', QAT: 'QA', TKM: 'TM', UZB: 'UZ', TZK: 'TJ',
  KGZ: 'KG', KAZ: 'KZ',
  // Africa
  ALG: 'DZ', MOR: 'MA', TUN: 'TN', LBY: 'LY', EGY: 'EG', SUD: 'SD', ETH: 'ET', SOM: 'SO',
  KEN: 'KE', TAN: 'TZ', UGA: 'UG', RWA: 'RW', BUR: 'BI', ZAI: 'CD', ZAM: 'ZM', MLW: 'MW',
  MOZ: 'MZ', ZIM: 'ZW', BOT: 'BW', NAM: 'NA', CPP: 'ZA', NAT: 'ZA', OFS: 'ZA', TVL: 'ZA',
  LES: 'LS', SWZ: 'SZ', MDG: 'MG', NGA: 'NG', GHA: 'GH', SEN: 'SN', GUI: 'GN', SIE: 'SL',
  LBR: 'LR', IVO: 'CI', BKN: 'BF', MLI: 'ML', NGR: 'NE', TCD: 'TD', CMN: 'CM', CAF: 'CF',
  GAB: 'GA', CON: 'CG', ANG: 'AO', BEN: 'BJ', TOG: 'TG',
  // Americas
  ASK: 'US', CAL: 'US', NWM: 'US', ARI: 'US', UTA: 'US', NEV: 'US', ORE: 'US', WAS: 'US',
  IDA: 'US', MNT: 'US', WYO: 'US', COL: 'US', NDA: 'US', SDA: 'US', NEB: 'US', KAN: 'US',
  OKL: 'US', TEX: 'US', LOU: 'US', ARK: 'US', MSI: 'US', ALA: 'US', GEO: 'US', FLA: 'US',
  SCA: 'US', NCA: 'US', VRG: 'US', WVA: 'US', KTY: 'US', TEN: 'US', INI: 'US', OHI: 'US',
  ILL: 'US', MIC: 'US', WIS: 'US', MIN: 'US', IOW: 'US', MSO: 'US', PEN: 'US', NWY: 'US',
  NWJ: 'US', MRY: 'US', DEL: 'US', CNT: 'US', RHO: 'US', MAS: 'US', VER: 'US', NWH: 'US',
  MAI: 'US', HAW: 'US',
  ABT: 'CA', BRC: 'CA', MAN: 'CA', NBR: 'CA', NFL: 'CA', NSC: 'CA', NWT: 'CA', ONT: 'CA',
  PEI: 'CA', QUE: 'CA', SAS: 'CA', YUK: 'CA',
  MXC: 'MX', MXE: 'MX', MXG: 'MX', MXI: 'MX', MXN: 'MX', MXS: 'MX', MXT: 'MX',
  CUB: 'CU', JAM: 'JM', HAI: 'HT', DOM: 'DO', PUE: 'PR',
  BLZ: 'BZ', GUA: 'GT', HON: 'HN', NIC: 'NI', COS: 'CR', PAN: 'PA',
  BZL: 'BR', BZC: 'BR', BZE: 'BR', BZN: 'BR', BZS: 'BR',
  ARG: 'AR', CLC: 'CL', CLN: 'CL', CLS: 'CL', PER: 'PE', BOL: 'BO', ECU: 'EC', VEN: 'VE',
  CLM: 'CO', URU: 'UY', PAR: 'PY', GUY: 'GY', SUR: 'SR', FRG: 'GF',
  // Oceania
  NSW: 'AU', NTA: 'AU', QLD: 'AU', SOA: 'AU', TAS: 'AU', VIC: 'AU', WAU: 'AU',
  NZN: 'NZ', NZS: 'NZ', FIJ: 'FJ',
};

const ISO_TO_CONTINENT: Record<string, string> = {
  FR: 'EU', DE: 'EU', ES: 'EU', IT: 'EU', GB: 'EU', PT: 'EU', NL: 'EU', BE: 'EU', CH: 'EU',
  AT: 'EU', SE: 'EU', NO: 'EU', FI: 'EU', DK: 'EU', PL: 'EU', CZ: 'EU', RO: 'EU', GR: 'EU',
  IE: 'EU', HU: 'EU', BG: 'EU', RS: 'EU', HR: 'EU', SK: 'EU', SI: 'EU', LT: 'EU', LV: 'EU',
  EE: 'EU', UA: 'EU', RU: 'EU', TR: 'EU', CY: 'EU', LU: 'EU', AL: 'EU', BY: 'EU',
  CN: 'AS', JP: 'AS', IN: 'AS', KR: 'AS', VN: 'AS', TH: 'AS', ID: 'AS', PH: 'AS', MY: 'AS',
  PK: 'AS', BD: 'AS', IR: 'AS', IQ: 'AS', SA: 'AS', AE: 'AS', IL: 'AS', LB: 'AS', SY: 'AS',
  AF: 'AS', NP: 'AS', LK: 'AS', MM: 'AS', KH: 'AS', LA: 'AS', MN: 'AS', KZ: 'AS', UZ: 'AS',
  TW: 'AS', BT: 'AS', YE: 'AS', OM: 'AS', KW: 'AS', QA: 'AS', TM: 'AS', TJ: 'AS', KG: 'AS',
  ZA: 'AF', EG: 'AF', MA: 'AF', DZ: 'AF', TN: 'AF', LY: 'AF', SD: 'AF', ET: 'AF', KE: 'AF',
  TZ: 'AF', UG: 'AF', NG: 'AF', GH: 'AF', SN: 'AF', CI: 'AF', CM: 'AF', CD: 'AF', AO: 'AF',
  MG: 'AF', ZW: 'AF', MZ: 'AF', NA: 'AF', BW: 'AF', SO: 'AF', RW: 'AF', BI: 'AF', ZM: 'AF',
  MW: 'AF', LS: 'AF', SZ: 'AF', GN: 'AF', SL: 'AF', LR: 'AF', BF: 'AF', ML: 'AF', NE: 'AF',
  TD: 'AF', CF: 'AF', GA: 'AF', CG: 'AF', BJ: 'AF', TG: 'AF',
  US: 'NA', CA: 'NA', MX: 'NA', CU: 'NA', JM: 'NA', HT: 'NA', DO: 'NA', GT: 'NA', HN: 'NA',
  CR: 'NA', PA: 'NA', NI: 'NA', SV: 'NA', BZ: 'NA', PR: 'NA',
  BR: 'SA', AR: 'SA', CL: 'SA', PE: 'SA', CO: 'SA', VE: 'SA', BO: 'SA', PY: 'SA', UY: 'SA',
  EC: 'SA', GY: 'SA', SR: 'SA', GF: 'SA',
  AU: 'OC', NZ: 'OC', PG: 'OC', FJ: 'OC',
};

// ============================================================
// POWO (Plants of the World Online, Kew) — authoritative flora source
// ============================================================
async function powoLookup(sci: string): Promise<{
  iso: string[];
  natives: { name: string; tdwg: string }[];
  fqId?: string;
}> {
  try {
    const sr = await fetch(`https://powo.science.kew.org/api/2/search?q=${encodeURIComponent(sci)}&perPage=1`);
    if (!sr.ok) return { iso: [], natives: [] };
    const sj = await sr.json();
    const first = sj?.results?.[0];
    if (!first?.fqId) return { iso: [], natives: [] };
    const tr = await fetch(`https://powo.science.kew.org/api/2/taxon/${encodeURIComponent(first.fqId)}?fields=distribution`);
    if (!tr.ok) return { iso: [], natives: [], fqId: first.fqId };
    const tj = await tr.json();
    const natives = (tj?.distribution?.natives || []) as any[];
    const iso = new Set<string>();
    const list: { name: string; tdwg: string }[] = [];
    for (const n of natives) {
      const tdwg = (n.tdwgCode || '').slice(0, 3).toUpperCase();
      const code = TDWG_L3_TO_ISO[tdwg];
      if (code) iso.add(code);
      list.push({ name: n.name, tdwg });
    }
    return { iso: Array.from(iso), natives: list, fqId: first.fqId };
  } catch { return { iso: [], natives: [] }; }
}

// ============================================================
// GBIF
// ============================================================
async function gbifMatch(sci: string): Promise<{ usageKey?: number; authorship?: string; kingdom?: string }> {
  try {
    const r = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(sci)}&strict=false`);
    if (!r.ok) return {};
    const j = await r.json();
    return { usageKey: j.usageKey, authorship: j.authorship, kingdom: j.kingdom };
  } catch { return {}; }
}

/** STRICT: only entries explicitly marked NATIVE or ENDEMIC. Rejects empty status. */
async function gbifDistributionsStrict(usageKey: number): Promise<{ native: string[]; introduced: string[] }> {
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
      const status = (d.establishmentMeans || '').toString().toUpperCase().trim();
      if (!c || typeof c !== 'string') continue;
      if (status === 'NATIVE' || status === 'ENDEMIC') {
        if (!seenN.has(c)) { seenN.add(c); native.push(c); }
      } else if (status === 'INTRODUCED' || status === 'NATURALISED' || status === 'NATURALIZED' || status === 'INVASIVE') {
        if (!seenI.has(c)) { seenI.add(c); introduced.push(c); }
      }
      // status '' / UNCERTAIN / CRYPTOGENIC / etc. → discarded
    }
  } catch { /* ignore */ }
  return { native, introduced };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body: BodyIn = await req.json().catch(() => ({}));
    const maxAgeDays = body.maxAgeDays ?? 180;
    const limit = Math.min(body.limit ?? 60, 200);
    const force = body.force === true;

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

    // Cache check (skip if force)
    let fresh = new Set<string>();
    if (!force) {
      const { data: existing } = await supabase
        .from('species_biogeography_kb')
        .select('scientific_name, fetched_at, type_locality_source')
        .in('scientific_name', names);
      const cutoff = Date.now() - maxAgeDays * 24 * 3600 * 1000;
      fresh = new Set(
        (existing || [])
          .filter((r: any) => r.type_locality_source && new Date(r.fetched_at).getTime() > cutoff)
          .map((r: any) => r.scientific_name),
      );
    }
    const toEnrich = names.filter((n) => !fresh.has(n)).slice(0, limit);
    let enriched = 0;
    let failed = 0;

    for (const sci of toEnrich) {
      try {
        const sources: SourceRef[] = [];
        const now = new Date().toISOString();

        // 1. GBIF match (needed for distributions + kingdom)
        const m = await gbifMatch(sci);
        const authorParsed = parseAuthorship(m.authorship);
        sources.push({
          name: 'GBIF Backbone Taxonomy',
          url: m.usageKey ? `https://www.gbif.org/species/${m.usageKey}` : 'https://www.gbif.org',
          field: 'taxonomic match + authorship',
          accessed_at: now,
        });

        // 2. POWO (plants only)
        let powoNative: string[] = [];
        let powoFqId: string | undefined;
        if (m.kingdom === 'Plantae') {
          const powo = await powoLookup(sci);
          powoNative = powo.iso;
          powoFqId = powo.fqId;
          if (powoFqId) {
            sources.push({
              name: 'POWO (Plants of the World Online, RBG Kew)',
              url: `https://powo.science.kew.org/taxon/${encodeURIComponent(powoFqId)}`,
              field: `aire native (${powo.natives.length} régions TDWG)`,
              accessed_at: now,
            });
          }
        }

        // 3. GBIF strict distributions
        let gbifStrict = { native: [] as string[], introduced: [] as string[] };
        if (m.usageKey) {
          gbifStrict = await gbifDistributionsStrict(m.usageKey);
          sources.push({
            name: 'GBIF Species Distributions (statut NATIVE/ENDEMIC)',
            url: `https://www.gbif.org/species/${m.usageKey}#distribution`,
            field: `${gbifStrict.native.length} pays natifs strict`,
            accessed_at: now,
          });
        }

        // 4. Merge native: POWO ∪ GBIF strict
        const verifiedSet = new Set<string>([...powoNative, ...gbifStrict.native]);
        const verified = Array.from(verifiedSet);
        const continents = Array.from(
          new Set(verified.map((c) => ISO_TO_CONTINENT[c]).filter(Boolean)),
        );

        // 5. Type locality cascade (strict)
        let typeLocality: string | null = null;
        let source: string = 'none';
        let confidence: string = 'low';
        if (powoNative.length) {
          typeLocality = powoNative[0];
          source = 'powo';
          confidence = powoNative.length <= 3 ? 'verified' : 'high';
        } else if (gbifStrict.native.length) {
          typeLocality = gbifStrict.native[0];
          source = 'gbif_distribution_strict';
          confidence = gbifStrict.native.length <= 3 ? 'high' : 'medium';
        } else if (authorParsed.describer_country) {
          typeLocality = authorParsed.describer_country;
          source = 'inferred_describer';
          confidence = 'low';
        }

        await supabase.from('species_biogeography_kb').upsert({
          scientific_name: sci,
          // Legacy fields (kept for backward compat)
          native_countries: verified,
          native_continents: continents,
          introduced_countries: gbifStrict.introduced,
          // New strict fields
          native_countries_verified: verified,
          type_locality_country: typeLocality,
          type_locality_source: source,
          type_locality_confidence: confidence,
          sources,
          // Authorship
          authorship: m.authorship ?? null,
          describer_name: authorParsed.describer_name ?? null,
          describer_year: authorParsed.describer_year ?? null,
          describer_country: authorParsed.describer_country ?? null,
          describer_birth_year: authorParsed.describer_birth_year ?? null,
          gbif_usage_key: m.usageKey ?? null,
          fetched_at: now,
        });
        enriched++;
        await new Promise((r) => setTimeout(r, 250)); // ~4 req/s
      } catch (_e) {
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
