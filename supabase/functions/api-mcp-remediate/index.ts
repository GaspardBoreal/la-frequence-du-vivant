// Relance manuelle d'une collecte de données pour une API du registre API & MCP.
// Réservée aux admins. Journalise chaque tentative dans public.api_mcp_incidents.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { validateAuth, corsHeaders, forbiddenResponse } from '../_shared/auth-helper.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Liste fermée des relances possibles, côté serveur uniquement.
const FRESHNESS: Record<string, { table: string; column: string }> = {
  'inaturalist': { table: 'biodiversity_snapshots', column: 'updated_at' },
  'gbif': { table: 'biodiversity_snapshots', column: 'updated_at' },
  'lovable-ai': { table: 'species_eco_tags_kb', column: 'last_validated_at' },
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

async function invokeFunction(name: string, body: unknown, authHeader: string) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
      apikey: Deno.env.get('SUPABASE_ANON_KEY')!,
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await resp.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { /* texte brut */ }
  return { ok: resp.ok, status: resp.status, parsed, text };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('authorization') ?? '';

  try {
    const { user, isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!isAdmin) return forbiddenResponse('Action réservée aux administrateurs');

    let body: any = {};
    try { body = await req.json(); } catch { /* corps vide */ }
    const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';

    if (!slug || !(slug in FRESHNESS)) {
      return new Response(
        JSON.stringify({ error: "Aucune relance automatique n'est disponible pour cette API." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fraîcheur avant relance
    const meta = FRESHNESS[slug];
    let freshnessBefore: string | null = null;
    const { data: freshRow } = await admin
      .from(meta.table)
      .select(meta.column)
      .order(meta.column, { ascending: false })
      .limit(1)
      .maybeSingle();
    if (freshRow) freshnessBefore = (freshRow as any)[meta.column] ?? null;

    let ok = false;
    let detail = '';

    if (slug === 'inaturalist' || slug === 'gbif') {
      const res = await invokeFunction(
        'batch-data-collector',
        { collectionTypes: ['biodiversity'], mode: 'manual', batchMode: true },
        authHeader,
      );
      ok = res.ok;
      if (ok) {
        const processed = res.parsed?.results?.length ?? res.parsed?.processed ?? null;
        detail = processed !== null
          ? `Collecte biodiversité relancée (${processed} marche(s) traitée(s)).`
          : 'Collecte biodiversité relancée.';
      } else {
        detail = res.parsed?.error ?? res.text?.slice(0, 400) ?? `Erreur ${res.status}`;
      }
    } else {
      // lovable-ai : classifier les espèces observées encore absentes de la base de connaissances
      const { data: backlogBefore } = await admin.rpc('count_species_awaiting_eco_tags');
      backlog = typeof backlogBefore === 'number' ? backlogBefore : Number(backlogBefore ?? 0);

      const { data: awaiting, error: awaitingErr } = await admin
        .rpc('list_species_awaiting_eco_tags', { _limit: 60 });

      if (awaitingErr) {
        ok = false;
        detail = `Vérification impossible : ${awaitingErr.message}`;
      } else {
        const species = (awaiting ?? []).map((r: any) => ({
          scientific_name: r.scientific_name,
          common_name: r.common_name ?? null,
          iconic_taxon: r.iconic_taxon ?? null,
        }));

        if (species.length === 0) {
          ok = true;
          detail = 'Vérification effectuée : 0 espèce en attente, la base de connaissances est à jour.';
        } else {
          const res = await invokeFunction('classify-species-eco-tags', { species }, authHeader);
          ok = res.ok;
          if (ok) {
            const auto = res.parsed?.auto_validated ?? 0;
            const { data: after } = await admin.rpc('count_species_awaiting_eco_tags');
            const rest = typeof after === 'number' ? after : Number(after ?? 0);
            detail = `${backlog} espèce(s) en attente avant relance — ${species.length} soumises, ${auto} étiquette(s) validée(s) automatiquement, ${rest} restante(s).`;
            backlog = rest;
          } else {
            detail = res.parsed?.error ?? res.text?.slice(0, 400) ?? `Erreur ${res.status}`;
          }
        }
      }

      await admin.from('api_mcp_checks').insert({
        slug,
        backlog,
        note: detail.slice(0, 500),
      });
    }

    // Statut au moment de l'action (mêmes règles que la santé live)
    let statusAtAction = 'unknown';
    if (slug === 'lovable-ai') {
      statusAtAction = backlog === null ? 'red' : backlog === 0 ? 'green' : backlog <= 30 ? 'orange' : 'red';
    } else if (freshnessBefore) {
      const ageH = (Date.now() - new Date(freshnessBefore).getTime()) / 36e5;
      statusAtAction = ageH > 72 ? 'red' : ageH > 24 ? 'orange' : 'green';
    }

    await admin.from('api_mcp_incidents').insert({
      slug,
      status_at_action: statusAtAction,
      action: 'relance',
      outcome: ok ? 'success' : 'error',
      detail: detail.slice(0, 1000),
      freshness_before: freshnessBefore,
      triggered_by: user?.id ?? null,
    });

    return new Response(JSON.stringify({ ok, detail }), {
      status: ok ? 200 : 502,
      headers: jsonHeaders,
    });
  } catch (e) {
    console.error('api-mcp-remediate error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erreur inconnue' }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
