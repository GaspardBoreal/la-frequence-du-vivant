// Edge function: récupère le détail enrichi d'une entreprise via l'API Recherche Entreprises
// Source: https://recherche-entreprises.api.gouv.fr/docs/
import { validateAuth, corsHeaders } from '../_shared/auth-helper.ts';

const API_BASE = 'https://recherche-entreprises.api.gouv.fr';

function normalizeFull(r: any) {
  const siege = r?.siege ?? {};
  const lat = siege.latitude ? parseFloat(siege.latitude) : null;
  const lng = siege.longitude ? parseFloat(siege.longitude) : null;

  const etablissements = Array.isArray(r.matching_etablissements)
    ? r.matching_etablissements
    : [];

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
    annee_tranche_effectif: r.annee_tranche_effectif_salarie ?? null,
    etat_administratif: r.etat_administratif ?? siege.etat_administratif ?? null,
    date_creation: r.date_creation ?? null,
    date_mise_a_jour: r.date_mise_a_jour ?? null,
    date_cessation: r.date_cessation ?? siege.date_fermeture ?? null,
    tva_intracommunautaire:
      r.tva_intracommunautaire ?? r.complements?.numero_tva_intra ?? null,
    capital_social: r.complements?.capital_social ?? null,
    economie_sociale_solidaire: r.complements?.est_ess ?? false,
    siege: {
      siret: siege.siret ?? null,
      adresse: siege.adresse ?? siege.geo_adresse ?? null,
      code_postal: siege.code_postal ?? null,
      commune: siege.libelle_commune ?? null,
      departement: siege.departement ?? null,
      region: siege.region ?? null,
      latitude: lat,
      longitude: lng,
      activite_principale: siege.activite_principale ?? null,
      libelle_activite_principale: siege.libelle_activite_principale ?? null,
      etat_administratif: siege.etat_administratif ?? null,
      date_creation: siege.date_creation ?? null,
      date_fermeture: siege.date_fermeture ?? null,
      tranche_effectif_salarie: siege.tranche_effectif_salarie ?? null,
      est_siege: true,
    },
    etablissements: etablissements.map((e: any) => ({
      siret: e.siret,
      est_siege: !!e.est_siege,
      adresse: e.adresse ?? e.geo_adresse ?? null,
      code_postal: e.code_postal ?? null,
      commune: e.libelle_commune ?? null,
      departement: e.departement ?? null,
      region: e.region ?? null,
      latitude: e.latitude ? parseFloat(e.latitude) : null,
      longitude: e.longitude ? parseFloat(e.longitude) : null,
      activite_principale: e.activite_principale ?? null,
      libelle_activite_principale: e.libelle_activite_principale ?? null,
      etat_administratif: e.etat_administratif ?? null,
      date_creation: e.date_creation ?? null,
      date_fermeture: e.date_fermeture ?? null,
      tranche_effectif_salarie: e.tranche_effectif_salarie ?? null,
    })),
    nombre_etablissements: r.nombre_etablissements ?? null,
    nombre_etablissements_ouverts: r.nombre_etablissements_ouverts ?? null,
    dirigeants: r.dirigeants ?? [],
    finances: r.finances
      ? Object.entries(r.finances).map(([year, vals]: [string, any]) => ({
          year,
          ca: vals?.ca ?? null,
          resultat_net: vals?.resultat_net ?? null,
        }))
      : [],
    complements: r.complements ?? {},
    liens_externes: {
      annuaire_entreprises: `https://annuaire-entreprises.data.gouv.fr/entreprise/${r.siren}`,
      pappers: `https://www.pappers.fr/entreprise/${r.siren}`,
      societe_com: `https://www.societe.com/cgi-bin/search?champs=${r.siren}`,
      insee: `https://avis-situation-sirene.insee.fr/?siret=${siege.siret ?? ''}`,
    },
    raw: r,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { siren } = (await req.json().catch(() => ({}))) as { siren?: string };
    if (!siren || !/^\d{9}$/.test(siren)) {
      return new Response(JSON.stringify({ error: 'Invalid SIREN (9 digits expected)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `${API_BASE}/search?q=${siren}&per_page=1&page=1`;
    console.log('[get-french-company] GET', url);
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('[get-french-company] API error', resp.status, text.slice(0, 300));
      return new Response(
        JSON.stringify({ error: `API gouv ${resp.status}`, detail: text.slice(0, 300) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const data = await resp.json();
    const first = (data.results ?? [])[0];
    if (!first) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(normalizeFull(first)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[get-french-company] error', e);
    return new Response(JSON.stringify({ error: String((e as any)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
