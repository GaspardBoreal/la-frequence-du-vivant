// Pack Vivant Propriété — exporte toutes les données biodiversité de TOUS les
// événements rattachés à une propriété, avec les colonnes de nettoyage
// (clé de dédoublonnage, doublons, événements associés, statut GPS).
//
// Accès : admin, ou personne ayant accès à la propriété (can_access_propriete).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import JSZip from 'https://esm.sh/jszip@3.10.1';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RawObs {
  source: 'marcheur' | 'inaturalist';
  observation_id: string;
  sci_key: string;
  scientific_name: string;
  common_name_fr: string | null;
  observation_date: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  notes: string | null;
  inaturalist_observation_id: number | null;
  marche_id: string;
  observer_name: string;
  observer_id: string | null;
}

interface Row extends RawObs {
  exploration_id: string;
  exploration_nom: string;
  evenements: string; // titres des événements de l'exploration
  cle_dedup: string;
  statut_gps: 'précis' | 'manquant';
}

interface CleanRow extends Row {
  nb_occurrences: number;
  est_doublon: boolean;
  sources_fusionnees: string;
  explorations_associees: string;
  evenements_associes: string;
  ids_fusionnes: string;
}

const norm = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const slugify = (s: string) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'propriete';
const csvEscape = (v: unknown) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return '';
  const h = Object.keys(rows[0]);
  return [h.join(','), ...rows.map((r) => h.map((k) => csvEscape(r[k])).join(','))].join('\n');
};
const xml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const day = (d: string | null) => (d ? String(d).slice(0, 10) : '');

/** Clé d'identité : id iNaturalist, sinon espèce + jour + position arrondie (~10 m) + observateur. */
function dedupKey(o: RawObs): string {
  if (o.inaturalist_observation_id) return `inat:${o.inaturalist_observation_id}`;
  if (o.source === 'marcheur') return `marcheur:${o.observation_id}`;
  const lat = o.latitude != null ? Number(o.latitude).toFixed(4) : '-';
  const lng = o.longitude != null ? Number(o.longitude).toFixed(4) : '-';
  return `approx:${o.sci_key}|${day(o.observation_date)}|${lat},${lng}|${norm(o.observer_name)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const proprieteId = body?.propriete_id;
    if (typeof proprieteId !== 'string' || !UUID.test(proprieteId)) return json({ error: 'propriete_id invalide' }, 400);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'auth_required' }, 401);
    const url = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'auth_required' }, 401);

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const [{ data: isAdmin }, { data: canAccess }] = await Promise.all([
      admin.rpc('check_is_admin_user', { check_user_id: user.id }),
      userClient.rpc('can_access_propriete', { _propriete_id: proprieteId }),
    ]);
    if (!isAdmin && !canAccess) return json({ error: 'forbidden' }, 403);

    const { data: prop, error: pErr } = await admin.from('proprietes').select('id, nom, ville').eq('id', proprieteId).single();
    if (pErr || !prop) return json({ error: 'propriete_not_found' }, 404);

    const { data: links, error: lErr } = await admin
      .from('propriete_marche_events')
      .select('marche_events(id, title, date_marche, exploration_id)')
      .eq('propriete_id', proprieteId);
    if (lErr) throw lErr;
    const events = (links || []).map((l: any) => l.marche_events).filter(Boolean);

    // Événements regroupés par exploration (plusieurs événements peuvent partager une exploration)
    const byExplo = new Map<string, { titles: string[] }>();
    for (const e of events) {
      if (!e.exploration_id) continue;
      const g = byExplo.get(e.exploration_id) || { titles: [] };
      g.titles.push(`${e.title ?? '(sans titre)'}${e.date_marche ? ` (${day(e.date_marche)})` : ''}`);
      byExplo.set(e.exploration_id, g);
    }

    const raw: Row[] = [];
    const exploSummary: { exploration_id: string; nom: string; evenements: string; observations_brutes: number }[] = [];
    for (const [exploId, g] of byExplo) {
      const { data: payload, error } = await admin.rpc('get_exploration_export_data', {
        p_exploration_id: exploId, p_level: 'organizer',
      });
      if (error) throw error;
      const nom = String(payload?.exploration?.name || payload?.exploration?.slug || exploId);
      const obs: RawObs[] = payload?.observations || [];
      const evts = g.titles.join(' | ');
      exploSummary.push({ exploration_id: exploId, nom, evenements: evts, observations_brutes: obs.length });
      for (const o of obs) {
        raw.push({
          ...o,
          exploration_id: exploId,
          exploration_nom: nom,
          evenements: evts,
          cle_dedup: dedupKey(o),
          statut_gps: o.latitude == null || o.longitude == null ? 'manquant' : 'précis',
        });
      }
    }

    // Dédoublonnage : la ligne marcheur prime, puis celle qui a un GPS, puis une photo.
    const score = (r: Row) => (r.source === 'marcheur' ? 4 : 0) + (r.statut_gps === 'précis' ? 2 : 0) + (r.photo_url ? 1 : 0);
    const groups = new Map<string, Row[]>();
    for (const r of raw) {
      const arr = groups.get(r.cle_dedup) || [];
      arr.push(r);
      groups.set(r.cle_dedup, arr);
    }
    const keptIds = new Set<Row>();
    const clean: CleanRow[] = [];
    for (const arr of groups.values()) {
      const best = [...arr].sort((a, b) => score(b) - score(a))[0];
      keptIds.add(best);
      const uniq = (f: (r: Row) => string) => [...new Set(arr.map(f).filter(Boolean))].join(' | ');
      clean.push({
        ...best,
        nb_occurrences: arr.length,
        est_doublon: arr.length > 1,
        sources_fusionnees: uniq((r) => r.source),
        explorations_associees: uniq((r) => r.exploration_nom),
        evenements_associes: uniq((r) => r.evenements),
        ids_fusionnes: uniq((r) => r.observation_id),
      });
    }
    clean.sort((a, b) => (b.observation_date || '').localeCompare(a.observation_date || ''));

    // Synthèse espèces (sur les observations nettoyées)
    const sp = new Map<string, any>();
    for (const o of clean) {
      if (!o.sci_key) continue;
      const s = sp.get(o.sci_key) || {
        nom_scientifique: o.scientific_name, nom_francais: o.common_name_fr || '',
        nb_observations: 0, observateurs: new Set<string>(), sources: new Set<string>(),
        explorations: new Set<string>(), premiere: '', derniere: '',
      };
      s.nb_observations++;
      s.observateurs.add(o.observer_name);
      o.sources_fusionnees.split(' | ').forEach((x) => s.sources.add(x));
      o.explorations_associees.split(' | ').forEach((x) => s.explorations.add(x));
      if (!s.nom_francais && o.common_name_fr) s.nom_francais = o.common_name_fr;
      const d = day(o.observation_date);
      if (d && (!s.premiere || d < s.premiere)) s.premiere = d;
      if (d && d > s.derniere) s.derniere = d;
      sp.set(o.sci_key, s);
    }
    const species = [...sp.values()]
      .map((s) => ({
        nom_scientifique: s.nom_scientifique, nom_francais: s.nom_francais,
        nb_observations: s.nb_observations, nb_observateurs: s.observateurs.size,
        premiere_observation: s.premiere, derniere_observation: s.derniere,
        sources: [...s.sources].join(' | '), explorations: [...s.explorations].join(' | '),
      }))
      .sort((a, b) => b.nb_observations - a.nb_observations);

    const cleanCsvRows = clean.map((o) => ({
      cle_dedup: o.cle_dedup, nom_scientifique: o.scientific_name, nom_francais: o.common_name_fr ?? '',
      date_observation: o.observation_date, latitude: o.latitude, longitude: o.longitude, statut_gps: o.statut_gps,
      source_retenue: o.source, sources_fusionnees: o.sources_fusionnees, observateur: o.observer_name,
      inaturalist_id: o.inaturalist_observation_id, photo_url: o.photo_url, nb_occurrences: o.nb_occurrences,
      est_doublon: o.est_doublon ? 'oui' : 'non', explorations_associees: o.explorations_associees,
      evenements_associes: o.evenements_associes, ids_fusionnes: o.ids_fusionnes, marche_id: o.marche_id, notes: o.notes,
    }));
    const rawCsvRows = raw.map((o) => ({
      cle_dedup: o.cle_dedup, ligne_conservee: keptIds.has(o) ? 'oui' : 'non', observation_id: o.observation_id,
      source: o.source, nom_scientifique: o.scientific_name, nom_francais: o.common_name_fr ?? '',
      date_observation: o.observation_date, latitude: o.latitude, longitude: o.longitude, statut_gps: o.statut_gps,
      observateur: o.observer_name, inaturalist_id: o.inaturalist_observation_id, photo_url: o.photo_url,
      exploration_id: o.exploration_id, exploration: o.exploration_nom, evenements: o.evenements, marche_id: o.marche_id,
    }));

    const generatedAt = new Date();
    const metadata = {
      propriete: { id: prop.id, nom: prop.nom, ville: prop.ville },
      generated_at: generatedAt.toISOString(),
      evenements_rattaches: events.length,
      explorations: exploSummary,
      observations_brutes: raw.length,
      observations_nettoyees: clean.length,
      doublons_retires: raw.length - clean.length,
      especes_uniques: species.length,
      regles_dedup: [
        "1. Même identifiant iNaturalist = même observation (quelle que soit l'exploration ou la source).",
        '2. Observation marcheur sans identifiant iNaturalist : unique par son identifiant interne.',
        '3. Snapshot sans identifiant : espèce + jour + position arrondie à 4 décimales (~10 m) + observateur.',
        '4. Ligne conservée : marcheur > avec GPS > avec photo.',
      ],
      pack_version: 'propriete-1.0',
    };

    // GeoJSON / KML
    const geo = clean.filter((o) => o.statut_gps === 'précis');
    const geojson = {
      type: 'FeatureCollection',
      features: geo.map((o) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [Number(o.longitude), Number(o.latitude)] },
        properties: {
          nom_scientifique: o.scientific_name, nom_francais: o.common_name_fr, date: o.observation_date,
          source: o.sources_fusionnees, observateur: o.observer_name, inat_id: o.inaturalist_observation_id,
          evenements: o.evenements_associes, photo: o.photo_url,
        },
      })),
    };
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml(prop.nom)}</name>${geo.map((o) => `
<Placemark><name>${xml(o.common_name_fr || o.scientific_name)}</name><description><![CDATA[<i>${o.scientific_name}</i><br/>Date : ${o.observation_date || '—'}<br/>Observateur : ${o.observer_name}<br/>Événements : ${o.evenements_associes}]]></description><Point><coordinates>${o.longitude},${o.latitude},0</coordinates></Point></Placemark>`).join('')}
</Document></kml>`;

    // Excel
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(species), 'Espèces');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cleanCsvRows), 'Observations nettoyées');
    // Les observations brutes restent en CSV seulement : en Excel elles dépassent la mémoire disponible.
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exploSummary), 'Explorations');
    const xlsx = XLSX.write(wb, { type: 'array', bookType: 'xlsx', compression: true }) as Uint8Array;

    // PDF récapitulatif
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.05, 0.42, 0.34), dark = rgb(0.07, 0.07, 0.07), muted = rgb(0.45, 0.45, 0.45);
    const safe = (s: string) => String(s ?? '').replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '?');
    const page = pdf.addPage([595, 842]);
    page.drawText('PACK VIVANT - PROPRIETE', { x: 50, y: 780, size: 22, font: bold, color: ink });
    page.drawText(safe(prop.nom).slice(0, 60), { x: 50, y: 750, size: 16, font, color: dark });
    page.drawText(safe(`Genere le ${generatedAt.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`), { x: 50, y: 730, size: 10, font, color: muted });
    let y = 690;
    for (const [k, v] of [
      ['Evenements rattaches', events.length], ['Explorations', exploSummary.length],
      ['Observations brutes', raw.length], ['Doublons retires', raw.length - clean.length],
      ['Observations nettoyees', clean.length], ['Especes uniques', species.length],
    ] as const) {
      page.drawText(safe(k), { x: 50, y, size: 10, font, color: muted });
      page.drawText(String(v), { x: 260, y, size: 12, font: bold, color: dark });
      y -= 22;
    }
    y -= 10;
    page.drawText('Explorations incluses', { x: 50, y, size: 12, font: bold, color: ink });
    y -= 18;
    for (const e of exploSummary) {
      if (y < 80) break;
      page.drawText(safe(`- ${e.nom} : ${e.observations_brutes} obs. brutes`).slice(0, 95), { x: 50, y, size: 9, font, color: dark });
      y -= 12;
      page.drawText(safe(`  ${e.evenements}`).slice(0, 100), { x: 50, y, size: 8, font, color: muted });
      y -= 16;
    }
    page.drawText('Donnees iNaturalist : CC BY-NC, attribution requise. la-frequence-du-vivant.com', { x: 50, y: 40, size: 8, font, color: muted });
    const pdfBytes = await pdf.save();

    const rawCsv = toCsv(rawCsvRows);
    rawCsvRows.length = 0;
    raw.length = 0;
    const zip = new JSZip();
    zip.file('01_LISEZ-MOI.pdf', pdfBytes);
    zip.file('02_biodiversite.xlsx', xlsx);
    zip.file('especes.csv', toCsv(species));
    zip.file('observations_nettoyees.csv', toCsv(cleanCsvRows));
    zip.file('observations_brutes.csv', rawCsv);
    zip.file('observations.geojson', JSON.stringify(geojson));
    zip.file('observations.kml', kml);
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    const zipBytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });

    const stamp = generatedAt.toISOString().slice(0, 10);
    const path = `proprietes/${proprieteId}/${stamp}_${crypto.randomUUID()}.zip`;
    const { error: upErr } = await admin.storage.from('pack-vivant').upload(path, zipBytes, { contentType: 'application/zip', upsert: true });
    if (upErr) throw upErr;
    const { data: signed, error: sErr } = await admin.storage.from('pack-vivant').createSignedUrl(path, 60 * 60 * 24);
    if (sErr) throw sErr;

    return json({
      url: signed.signedUrl,
      filename: `pack-vivant-propriete_${slugify(prop.nom)}_${stamp}.zip`,
      events: events.length, explorations: exploSummary.length,
      raw_count: raw.length, clean_count: clean.length, species_count: species.length,
    });
  } catch (e: any) {
    console.error('[pack-vivant-propriete]', e);
    return json({ error: e?.message || 'unknown_error' }, 500);
  }
});
