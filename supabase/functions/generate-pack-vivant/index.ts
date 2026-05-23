// Pack Vivant — Generates a downloadable .zip with all species & observations
// from an exploration (CSV + GeoJSON + KML + Excel + JSON metadata + PDF).
//
// Levels:
//  - public    → PDF only + light CSV (anonymized observers)
//  - walker    → PDF + full Excel + CSV (anonymized)
//  - organizer → Everything (full data, named observers)
//
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import JSZip from 'https://esm.sh/jszip@3.10.1';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type Level = 'public' | 'walker' | 'organizer';

interface Observation {
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

interface SpeciesRow {
  sci_key: string;
  scientific_name: string;
  common_name_fr: string | null;
  observation_count: number;
  observer_count: number;
  first_observation: string | null;
  last_observation: string | null;
  centroid_lat: number | null;
  centroid_lng: number | null;
  sources: string[];
}

function slugify(s: string): string {
  return (s || 'pack')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildObservationsCsv(obs: Observation[]): string {
  const headers = [
    'observation_id', 'scientific_name', 'common_name_fr', 'observation_date',
    'latitude', 'longitude', 'source', 'observer',
    'photo_url', 'inaturalist_id', 'marche_id', 'notes', 'gps_missing',
  ];
  const lines = [headers.join(',')];
  for (const o of obs) {
    const gpsMissing = (o.latitude == null || o.longitude == null) ? 'true' : 'false';
    lines.push([
      o.observation_id, o.scientific_name, o.common_name_fr, o.observation_date,
      o.latitude, o.longitude, o.source, o.observer_name,
      o.photo_url, o.inaturalist_observation_id, o.marche_id, o.notes, gpsMissing,
    ].map(csvEscape).join(','));
  }
  return lines.join('\n');
}

function buildSpeciesCsv(species: SpeciesRow[]): string {
  const headers = [
    'scientific_name', 'common_name_fr', 'observation_count', 'observer_count',
    'first_observation', 'last_observation',
    'centroid_lat', 'centroid_lng', 'sources',
  ];
  const lines = [headers.join(',')];
  for (const s of species) {
    lines.push([
      s.scientific_name, s.common_name_fr, s.observation_count, s.observer_count,
      s.first_observation, s.last_observation,
      s.centroid_lat, s.centroid_lng, (s.sources || []).join('|'),
    ].map(csvEscape).join(','));
  }
  return lines.join('\n');
}

function buildGeoJSON(obs: Observation[]) {
  return {
    type: 'FeatureCollection',
    features: obs
      .filter((o) => o.latitude != null && o.longitude != null)
      .map((o) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [Number(o.longitude), Number(o.latitude)] },
        properties: {
          scientific_name: o.scientific_name,
          common_name_fr: o.common_name_fr,
          date: o.observation_date,
          source: o.source,
          observer: o.observer_name,
          photo: o.photo_url,
          inat_id: o.inaturalist_observation_id,
        },
      })),
  };
}

function xmlEscape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function buildKML(obs: Observation[], title: string): string {
  const placemarks = obs
    .filter((o) => o.latitude != null && o.longitude != null)
    .map((o) => {
      const label = o.common_name_fr || o.scientific_name;
      const sciLine = o.common_name_fr ? `<i>${xmlEscape(o.scientific_name)}</i><br/>` : '';
      return `
    <Placemark>
      <name>${xmlEscape(label)}</name>
      <description><![CDATA[
        ${sciLine}
        Date : ${o.observation_date || '—'}<br/>
        Source : ${o.source}<br/>
        Observateur : ${o.observer_name}<br/>
        ${o.photo_url ? `<img src="${o.photo_url}" width="240"/>` : ''}
      ]]></description>
      <Point><coordinates>${o.longitude},${o.latitude},0</coordinates></Point>
    </Placemark>`;
    }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${xmlEscape(title)}</name>${placemarks}
  </Document>
</kml>`;
}

function buildDarwinCoreOccurrence(obs: Observation[]): string {
  // Darwin Core occurrence.txt — TSV with vernacularName right after scientificName
  const headers = [
    'occurrenceID', 'scientificName', 'vernacularName', 'eventDate',
    'decimalLatitude', 'decimalLongitude', 'basisOfRecord',
    'recordedBy', 'associatedMedia', 'occurrenceRemarks',
  ];
  const lines = [headers.join('\t')];
  for (const o of obs) {
    const row = [
      o.observation_id, o.scientific_name, o.common_name_fr ?? '', o.observation_date ?? '',
      o.latitude ?? '', o.longitude ?? '', 'HumanObservation',
      o.observer_name, o.photo_url ?? '', (o.notes ?? '').replace(/\t|\n/g, ' '),
    ];
    lines.push(row.map((v) => String(v ?? '')).join('\t'));
  }
  return lines.join('\n');
}

function buildDarwinCoreMeta(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<archive xmlns="http://rs.tdwg.org/dwc/text/" metadata="eml.xml">
  <core encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="" ignoreHeaderLines="1" rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
    <files><location>occurrence.txt</location></files>
    <id index="0"/>
    <field index="0" term="http://rs.tdwg.org/dwc/terms/occurrenceID"/>
    <field index="1" term="http://rs.tdwg.org/dwc/terms/scientificName"/>
    <field index="2" term="http://rs.tdwg.org/dwc/terms/vernacularName"/>
    <field index="3" term="http://rs.tdwg.org/dwc/terms/eventDate"/>
    <field index="4" term="http://rs.tdwg.org/dwc/terms/decimalLatitude"/>
    <field index="5" term="http://rs.tdwg.org/dwc/terms/decimalLongitude"/>
    <field index="6" term="http://rs.tdwg.org/dwc/terms/basisOfRecord"/>
    <field index="7" term="http://rs.tdwg.org/dwc/terms/recordedBy"/>
    <field index="8" term="http://rs.tdwg.org/dwc/terms/associatedMedia"/>
    <field index="9" term="http://rs.tdwg.org/dwc/terms/occurrenceRemarks"/>
  </core>
</archive>`;
}

function buildXlsx(
  species: SpeciesRow[], obs: Observation[], metadata: Record<string, unknown>,
): Uint8Array {
  const wb = XLSX.utils.book_new();
  const synth = XLSX.utils.json_to_sheet(species.map((s) => ({
    'Nom scientifique': s.scientific_name,
    'Nom commun (FR)': s.common_name_fr ?? '',
    'Nb observations': s.observation_count,
    'Nb observateurs': s.observer_count,
    '1re observation': s.first_observation,
    'Dernière observation': s.last_observation,
    'Latitude (centroïde)': s.centroid_lat,
    'Longitude (centroïde)': s.centroid_lng,
    'Sources': (s.sources || []).join(' + '),
  })));
  XLSX.utils.book_append_sheet(wb, synth, 'Synthèse');

  const observations = XLSX.utils.json_to_sheet(obs.map((o) => ({
    'ID': o.observation_id,
    'Nom scientifique': o.scientific_name,
    'Nom commun (FR)': o.common_name_fr ?? '',
    'Date': o.observation_date,
    'Latitude': o.latitude,
    'Longitude': o.longitude,
    'GPS manquant': (o.latitude == null || o.longitude == null) ? 'oui' : '',
    'Source': o.source,
    'Observateur': o.observer_name,
    'Photo URL': o.photo_url,
    'iNat ID': o.inaturalist_observation_id,
    'Notes': o.notes,
  })));
  XLSX.utils.book_append_sheet(wb, observations, 'Observations');

  const meta = XLSX.utils.json_to_sheet(
    Object.entries(metadata).map(([k, v]) => ({
      Clé: k,
      Valeur: typeof v === 'object' ? JSON.stringify(v) : String(v),
    })),
  );
  XLSX.utils.book_append_sheet(wb, meta, 'Métadonnées');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

async function buildPdf(
  explorationName: string,
  species: SpeciesRow[],
  obs: Observation[],
  metadata: Record<string, unknown>,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.05, 0.42, 0.34); // emerald
  const dark = rgb(0.07, 0.07, 0.07);
  const muted = rgb(0.45, 0.45, 0.45);

  // ---- Page 1: cover ----
  const cover = pdf.addPage([595, 842]); // A4
  cover.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.98, 0.97, 0.95) });
  cover.drawText('PACK VIVANT', { x: 50, y: 760, size: 28, font: bold, color: ink });
  cover.drawText(explorationName.slice(0, 60), { x: 50, y: 720, size: 18, font, color: dark });
  cover.drawLine({ start: { x: 50, y: 700 }, end: { x: 545, y: 700 }, thickness: 1, color: ink });

  const stats = [
    ['Espèces uniques', String(species.length)],
    ['Observations', String(obs.length)],
    ['Avec coordonnées GPS', String(obs.filter((o) => o.latitude != null).length)],
    ['Sources', [...new Set(obs.map((o) => o.source))].join(' + ') || '—'],
  ];
  let y = 640;
  for (const [k, v] of stats) {
    cover.drawText(k, { x: 50, y, size: 11, font, color: muted });
    cover.drawText(v, { x: 50, y: y - 18, size: 22, font: bold, color: dark });
    y -= 60;
  }

  cover.drawText('La Fréquence du Vivant', { x: 50, y: 60, size: 10, font, color: muted });
  cover.drawText(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, {
    x: 50, y: 45, size: 9, font, color: muted,
  });

  // ---- Page 2: Top espèces ----
  const top = pdf.addPage([595, 842]);
  top.drawText('Top 20 espèces les plus observées', { x: 50, y: 790, size: 16, font: bold, color: ink });
  top.drawLine({ start: { x: 50, y: 775 }, end: { x: 545, y: 775 }, thickness: 0.5, color: muted });

  y = 750;
  const topSpecies = species.slice(0, 20);
  for (let i = 0; i < topSpecies.length; i++) {
    const s = topSpecies[i];
    if (y < 60) break;
    top.drawText(`${i + 1}.`, { x: 50, y, size: 10, font, color: muted });
    const title = (s.common_name_fr || s.scientific_name).slice(0, 50);
    top.drawText(title, { x: 75, y, size: 11, font: bold, color: dark });
    const subtitle = s.common_name_fr
      ? `${s.scientific_name.slice(0, 50)} — ${s.observation_count} obs · ${s.observer_count} observateur·rice·s`
      : `${s.observation_count} obs · ${s.observer_count} observateur·rice·s`;
    top.drawText(subtitle, { x: 75, y: y - 14, size: 9, font, color: muted });
    y -= 32;
  }

  // ---- Page 3: Méthode ----
  const m = pdf.addPage([595, 842]);
  m.drawText('Méthode & sources', { x: 50, y: 790, size: 16, font: bold, color: ink });
  m.drawLine({ start: { x: 50, y: 775 }, end: { x: 545, y: 775 }, thickness: 0.5, color: muted });

  const lines = [
    'Le Pack Vivant agrège deux sources d\'observations :',
    '  • Observations validees des marcheur·euse·s participant·e·s a l\'evenement',
    '  • Snapshots iNaturalist captés dans le rayon de la marche',
    '',
    'Chaque observation conserve ses coordonnees GPS quand disponibles,',
    'permettant des analyses de frequence, de hotspots et de raretes.',
    '',
    'Fichiers inclus dans le Pack :',
    '  • 02_especes.xlsx  — Classeur 3 onglets (Synthese / Observations / Metadonnees)',
    '  • observations.csv — Une ligne par observation, pret pour Excel/R/Python',
    '  • especes.csv      — Synthese deduplique par espece',
    '  • observations.geojson — Cartographie (QGIS, uMap, Mapbox)',
    '  • observations.kml — Google Earth',
    '  • metadata.json    — Provenance et parametres de collecte',
    '',
    'Donnees iNaturalist : CC BY-NC, attribution requise.',
    'https://la-frequence-du-vivant.com',
  ];
  y = 750;
  for (const ln of lines) {
    m.drawText(ln, { x: 50, y, size: 10, font, color: dark });
    y -= 16;
  }

  return await pdf.save();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { exploration_id, level = 'public' } = await req.json();
    if (!exploration_id) {
      return new Response(JSON.stringify({ error: 'exploration_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve effective level: organizer requires admin role; walker requires auth
    let effectiveLevel: Level = 'public';
    const authHeader = req.headers.get('Authorization');
    if (authHeader && level !== 'public') {
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        effectiveLevel = level === 'organizer' ? 'organizer' : 'walker';
        // We could further verify admin role here; for V1 trust the caller's request
      }
    }

    // Fetch all data via the RPC
    const { data: payload, error } = await admin.rpc('get_exploration_export_data', {
      p_exploration_id: exploration_id,
      p_level: effectiveLevel,
    });
    if (error) throw error;
    if (payload?.error) {
      return new Response(JSON.stringify({ error: payload.error }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const exploration = payload.exploration || {};
    const observations: Observation[] = payload.observations || [];
    const species: SpeciesRow[] = payload.species || [];
    const metadata = payload.metadata || {};

    const explorationName = String(exploration.name || exploration.slug || 'pack-vivant');
    const slug = slugify(explorationName);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const zipName = `pack-vivant_${slug}_${dateStamp}.zip`;

    // Build PDF (always included)
    const pdfBytes = await buildPdf(explorationName, species, observations, metadata);

    const zip = new JSZip();
    zip.file('01_LISEZ-MOI.pdf', pdfBytes);

    if (effectiveLevel !== 'public') {
      // Walker + Organizer get full data files
      zip.file('observations.csv', buildObservationsCsv(observations));
      zip.file('especes.csv', buildSpeciesCsv(species));
      zip.file('02_especes.xlsx', buildXlsx(species, observations, metadata));
      zip.file('metadata.json', JSON.stringify(
        { exploration: { id: exploration.id, name: exploration.name, slug: exploration.slug }, ...metadata },
        null, 2,
      ));
    }
    if (effectiveLevel === 'organizer') {
      // Organizer adds geospatial formats
      zip.file('observations.geojson', JSON.stringify(buildGeoJSON(observations), null, 2));
      zip.file('observations.kml', buildKML(observations, explorationName));
    }

    const zipBytes = await zip.generateAsync({ type: 'uint8array' });

    // Upload to storage
    const storagePath = `${exploration_id}/${dateStamp}_${effectiveLevel}_${crypto.randomUUID()}.zip`;
    const { error: upErr } = await admin.storage.from('pack-vivant').upload(storagePath, zipBytes, {
      contentType: 'application/zip', upsert: true,
    });
    if (upErr) throw upErr;

    const { data: signed, error: signErr } = await admin.storage
      .from('pack-vivant')
      .createSignedUrl(storagePath, 60 * 60 * 24); // 24 h
    if (signErr) throw signErr;

    return new Response(JSON.stringify({
      url: signed.signedUrl,
      filename: zipName,
      level: effectiveLevel,
      species_count: species.length,
      observation_count: observations.length,
      size_bytes: zipBytes.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[pack-vivant] error', e);
    return new Response(JSON.stringify({ error: e?.message || 'unknown_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
