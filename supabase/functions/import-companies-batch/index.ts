// Edge function: import en masse d'entreprises depuis l'API gouv vers crm_companies
import { validateAuth, corsHeaders, createServiceClient } from '../_shared/auth-helper.ts';

const API_BASE = 'https://recherche-entreprises.api.gouv.fr';

interface ImportPayload {
  sirens: string[];
  assigned_to?: string | null;
  tags?: string[];
}

async function fetchOne(siren: string) {
  const url = `${API_BASE}/search?q=${encodeURIComponent(siren)}&per_page=1`;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.results?.[0] ?? null;
}

async function geocodeBAN(addr: string, postal: string, ville: string): Promise<{ lat: number; lng: number } | null> {
  const tryQ = async (q: string, type?: string) => {
    if (!q.trim()) return null;
    try {
      const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1${type ? `&type=${type}` : ''}`, { headers: { Accept: 'application/json' } });
      if (!r.ok) return null;
      const j = await r.json();
      const f = j?.features?.[0];
      const [lng, lat] = f?.geometry?.coordinates ?? [];
      return (typeof lat === 'number' && typeof lng === 'number') ? { lat, lng } : null;
    } catch { return null; }
  };
  return (await tryQ([addr, postal, ville].filter(Boolean).join(' '))) ?? (await tryQ([postal, ville].filter(Boolean).join(' '), 'municipality'));
}


function toRow(raw: any, opts: { assigned_to?: string | null; tags?: string[]; created_by: string }) {
  const siege = raw?.siege ?? {};
  return {
    siren: raw.siren,
    siret_siege: siege.siret ?? null,
    denomination: raw.nom_raison_sociale ?? raw.nom_complet ?? null,
    nom_complet: raw.nom_complet ?? null,
    code_naf: siege.activite_principale ?? raw.activite_principale ?? null,
    libelle_naf: raw.libelle_activite_principale ?? null,
    forme_juridique: raw.nature_juridique ?? null,
    tranche_effectif: raw.tranche_effectif_salarie ?? null,
    categorie_entreprise: raw.categorie_entreprise ?? null,
    etat_administratif: siege.etat_administratif ?? null,
    adresse: siege.adresse ?? siege.geo_adresse ?? null,
    ville: siege.libelle_commune ?? null,
    code_postal: siege.code_postal ?? null,
    departement: siege.departement ?? null,
    region: siege.region ?? null,
    latitude: siege.latitude ? parseFloat(siege.latitude) : null,
    longitude: siege.longitude ? parseFloat(siege.longitude) : null,
    dirigeants: raw.dirigeants ?? [],
    qualites_labels: raw.complements ?? {},
    finances: raw.finances ?? [],
    raw_payload: raw,
    api_synced_at: new Date().toISOString(),
    assigned_to: opts.assigned_to ?? null,
    tags: opts.tags ?? [],
    source: 'api_gouv',
    created_by: opts.created_by,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { user, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { sirens, assigned_to, tags } = (await req.json()) as ImportPayload;
    if (!Array.isArray(sirens) || sirens.length === 0) {
      return new Response(JSON.stringify({ error: 'sirens[] required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const cleaned = Array.from(new Set(sirens.map(s => String(s).replace(/\D/g, '')).filter(s => s.length === 9))).slice(0, 100);

    const service = createServiceClient();
    const rows: any[] = [];
    for (const siren of cleaned) {
      const raw = await fetchOne(siren);
      if (!raw) continue;
      const row = toRow(raw, { assigned_to: assigned_to ?? null, tags: tags ?? [], created_by: user.id });
      if (row.latitude == null || row.longitude == null) {
        const geo = await geocodeBAN(row.adresse ?? '', row.code_postal ?? '', row.ville ?? '');
        if (geo) { row.latitude = geo.lat; row.longitude = geo.lng; }
      }
      rows.push(row);
    }


    if (rows.length === 0) {
      return new Response(JSON.stringify({ imported: 0, results: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Upsert sur siren. Ne pas écraser lifecycle_stage existant : on retire la colonne du payload upsert et
    // on insère via INSERT ... ON CONFLICT DO UPDATE en préservant le stage.
    const { data, error } = await service
      .from('crm_companies')
      .upsert(rows, { onConflict: 'siren', ignoreDuplicates: false })
      .select('id, siren, lifecycle_stage');

    if (error) {
      console.error('upsert error', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Log import activity
    const activities = (data ?? []).map((c: any) => ({
      company_id: c.id, performed_by: user.id, type: 'import',
      summary: `Importé depuis annuaire (SIREN ${c.siren})`,
    }));
    if (activities.length > 0) await service.from('crm_company_activities').insert(activities);

    return new Response(JSON.stringify({ imported: data?.length ?? 0, results: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('import-companies-batch error', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
