// Edge function: proxy + normalisation de l'API Recherche d'entreprises gouv.fr
// Doc: https://recherche-entreprises.api.gouv.fr/docs/
import { validateAuth, corsHeaders } from '../_shared/auth-helper.ts';

const API_BASE = 'https://recherche-entreprises.api.gouv.fr';

interface SearchPayload {
  q?: string;
  page?: number;
  per_page?: number;
  // filtres avancés
  code_postal?: string;
  commune?: string;
  departement?: string;
  region?: string;
  activite_principale?: string; // code NAF
  categorie_juridique?: string;
  tranche_effectif_salarie?: string;
  categorie_entreprise?: string; // PME / ETI / GE
  etat_administratif?: string; // A / C
  nom_personne?: string;
  prenoms_personne?: string;
  ca_min?: number;
  ca_max?: number;
  resultat_net_min?: number;
  resultat_net_max?: number;
  // labels / qualités (booleans)
  est_ess?: boolean;
  est_rge?: boolean;
  est_bio?: boolean;
  est_qualiopi?: boolean;
  est_finess?: boolean;
  est_uai?: boolean;
  est_entrepreneur_spectacle?: boolean;
  est_collectivite_territoriale?: boolean;
  est_societe_mission?: boolean;
  // recherche géographique
  lat?: number;
  long?: number;
  radius?: number; // km, max 50
  // tri
  minimal?: boolean;
}

function buildUrl(payload: SearchPayload): string {
  const isGeo = payload.lat != null && payload.long != null;
  const endpoint = isGeo ? '/near_point' : '/search';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'boolean') {
      if (v) params.set(k, 'true');
      continue;
    }
    params.set(k, String(v));
  }
  if (!params.has('per_page')) params.set('per_page', '20');
  if (!params.has('page')) params.set('page', '1');
  return `${API_BASE}${endpoint}?${params.toString()}`;
}

function normalizeResult(r: any) {
  const siege = r?.siege ?? {};
  const lat = siege.latitude ? parseFloat(siege.latitude) : null;
  const lng = siege.longitude ? parseFloat(siege.longitude) : null;
  return {
    siren: r.siren,
    siret_siege: siege.siret,
    nom_complet: r.nom_complet ?? r.nom_raison_sociale ?? '',
    denomination: r.nom_raison_sociale ?? r.nom_complet ?? '',
    sigle: r.sigle ?? null,
    code_naf: siege.activite_principale ?? r.activite_principale ?? null,
    libelle_naf: r.libelle_activite_principale ?? null,
    forme_juridique: r.nature_juridique ?? null,
    categorie_entreprise: r.categorie_entreprise ?? null,
    tranche_effectif: r.tranche_effectif_salarie ?? siege.tranche_effectif_salarie ?? null,
    etat_administratif: siege.etat_administratif ?? null,
    adresse: siege.adresse ?? siege.geo_adresse ?? null,
    ville: siege.libelle_commune ?? null,
    code_postal: siege.code_postal ?? null,
    departement: siege.departement ?? null,
    region: siege.region ?? null,
    latitude: lat,
    longitude: lng,
    dirigeants: r.dirigeants ?? [],
    finances: r.finances ? Object.entries(r.finances).map(([year, vals]: [string, any]) => ({
      year, ca: vals?.ca ?? null, resultat_net: vals?.resultat_net ?? null,
    })) : [],
    nombre_etablissements: r.nombre_etablissements ?? null,
    complements: r.complements ?? {},
    raw: r,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = (await req.json().catch(() => ({}))) as SearchPayload;
    if (body.per_page && body.per_page > 25) body.per_page = 25;
    if (body.radius && body.radius > 50) body.radius = 50;

    const url = buildUrl(body);
    console.log('[search-french-companies] GET', url);
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    console.log('[search-french-companies] status', resp.status);

    if (!resp.ok) {
      const text = await resp.text();
      console.error('[search-french-companies] API gouv error', resp.status, text.slice(0, 500));
      return new Response(JSON.stringify({ error: `API gouv ${resp.status}`, status: resp.status, detail: text.slice(0, 500) }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await resp.json();
    const results = (data.results ?? []).map(normalizeResult);

    return new Response(JSON.stringify({
      results,
      total: data.total_results ?? results.length,
      page: data.page ?? body.page ?? 1,
      per_page: data.per_page ?? body.per_page ?? 20,
      total_pages: data.total_pages ?? 1,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('search-french-companies error', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
