import JSZip from 'jszip';

export interface TrackStep {
  /** Identifiant local (uniquement pour le rendu / l'édition) */
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
}

export interface TrackPoint {
  lat: number;
  lng: number;
}

export interface ParsedTrack {
  /** Nom du document (KML <Document><name>, GPX <metadata><name>) ou nom du fichier */
  documentName: string;
  /** Points nommés → candidats « marches » */
  steps: TrackStep[];
  /** Tracé continu (LineString / gx:Track / trkpt) */
  track: TrackPoint[];
  format: 'kml' | 'kmz' | 'gpx';
}

export const ACCEPTED_TRACK_EXTENSIONS = ['.kml', '.kmz', '.gpx'];
export const MAX_TRACK_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export class TrackParseError extends Error {}

let seq = 0;
const nextId = () => `step-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const isFiniteCoord = (v: number) => Number.isFinite(v) && Math.abs(v) <= 180;

/** "lon,lat[,alt] lon,lat[,alt] …" → points */
function parseKmlCoordinates(raw: string | null | undefined): TrackPoint[] {
  if (!raw) return [];
  return raw
    .trim()
    .split(/\s+/)
    .map((chunk) => {
      const [lonS, latS] = chunk.split(',');
      const lng = parseFloat(lonS);
      const lat = parseFloat(latS);
      if (!isFiniteCoord(lat) || !isFiniteCoord(lng) || Math.abs(lat) > 90) return null;
      return { lat, lng };
    })
    .filter((p): p is TrackPoint => p !== null);
}

function textOf(el: Element | null | undefined, tag: string): string {
  if (!el) return '';
  const child = Array.from(el.children).find((c) => c.localName === tag);
  return child?.textContent?.trim() || '';
}

function firstDescendant(el: Element | Document, localName: string): Element | null {
  const all = el.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) return all[i];
  }
  return null;
}

function allDescendants(el: Element | Document, localName: string): Element[] {
  const out: Element[] = [];
  const all = el.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) out.push(all[i]);
  }
  return out;
}

function parseXml(text: string): Document {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new TrackParseError("Le fichier n'est pas un XML valide (KML/GPX illisible).");
  }
  return doc;
}

function parseKml(text: string, fallbackName: string, format: 'kml' | 'kmz'): ParsedTrack {
  const doc = parseXml(text);
  const documentEl = firstDescendant(doc, 'Document') || doc.documentElement;
  const documentName = textOf(documentEl, 'name') || fallbackName;

  const steps: TrackStep[] = [];
  const track: TrackPoint[] = [];

  for (const placemark of allDescendants(doc, 'Placemark')) {
    const name = textOf(placemark, 'name');
    const description = textOf(placemark, 'description');

    for (const pointEl of allDescendants(placemark, 'Point')) {
      const [p] = parseKmlCoordinates(textOf(pointEl, 'coordinates'));
      if (p) steps.push({ id: nextId(), name, description, lat: p.lat, lng: p.lng });
    }

    for (const lineEl of allDescendants(placemark, 'LineString')) {
      track.push(...parseKmlCoordinates(textOf(lineEl, 'coordinates')));
    }

    // gx:Track → suite de <gx:coord>lon lat alt</gx:coord>
    for (const coordEl of allDescendants(placemark, 'coord')) {
      const parts = (coordEl.textContent || '').trim().split(/\s+/);
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (isFiniteCoord(lng) && isFiniteCoord(lat) && Math.abs(lat) <= 90) track.push({ lat, lng });
    }
  }

  return { documentName, steps, track, format };
}

function parseGpx(text: string, fallbackName: string): ParsedTrack {
  const doc = parseXml(text);
  const metadata = firstDescendant(doc, 'metadata');
  const documentName = textOf(metadata, 'name') || fallbackName;

  const steps: TrackStep[] = [];
  const track: TrackPoint[] = [];

  const readLatLng = (el: Element): TrackPoint | null => {
    const lat = parseFloat(el.getAttribute('lat') || '');
    const lng = parseFloat(el.getAttribute('lon') || '');
    if (!isFiniteCoord(lat) || !isFiniteCoord(lng) || Math.abs(lat) > 90) return null;
    return { lat, lng };
  };

  for (const wpt of allDescendants(doc, 'wpt')) {
    const p = readLatLng(wpt);
    if (p) {
      steps.push({
        id: nextId(),
        name: textOf(wpt, 'name'),
        description: textOf(wpt, 'desc') || textOf(wpt, 'cmt'),
        ...p,
      });
    }
  }

  for (const trkpt of allDescendants(doc, 'trkpt')) {
    const p = readLatLng(trkpt);
    if (p) track.push(p);
  }
  for (const rtept of allDescendants(doc, 'rtept')) {
    const p = readLatLng(rtept);
    if (p) track.push(p);
  }

  return { documentName, steps, track, format: 'gpx' };
}

async function readKmzText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entry =
    zip.file(/doc\.kml$/i)[0] ||
    zip.file(/\.kml$/i)[0];
  if (!entry) throw new TrackParseError("Cette archive KMZ ne contient aucun fichier KML.");
  return entry.async('string');
}

/**
 * Parse un fichier de tracé (KML / KMZ / GPX) entièrement dans le navigateur.
 * Aucune écriture en base : la sortie alimente l'écran d'aperçu.
 */
export async function parseTrackFile(file: File): Promise<ParsedTrack> {
  if (file.size > MAX_TRACK_FILE_SIZE) {
    throw new TrackParseError('Le fichier dépasse la limite de 10 Mo.');
  }

  const lower = file.name.toLowerCase();
  const ext = ACCEPTED_TRACK_EXTENSIONS.find((e) => lower.endsWith(e));
  if (!ext) {
    throw new TrackParseError('Format non supporté. Utilisez un fichier KML, KMZ ou GPX.');
  }

  const fallbackName = file.name.replace(/\.[^.]+$/, '');
  let parsed: ParsedTrack;

  if (ext === '.kmz') {
    parsed = parseKml(await readKmzText(file), fallbackName, 'kmz');
  } else if (ext === '.kml') {
    parsed = parseKml(await file.text(), fallbackName, 'kml');
  } else {
    parsed = parseGpx(await file.text(), fallbackName);
  }

  // Nommage par défaut des points anonymes
  parsed.steps = parsed.steps.map((s, i) => ({
    ...s,
    name: s.name?.trim() || `Étape ${i + 1}`,
  }));

  if (parsed.steps.length === 0 && parsed.track.length === 0) {
    throw new TrackParseError("Aucun point géographique n'a été trouvé dans ce fichier.");
  }

  return parsed;
}

/** Barycentre d'une liste de points (pour centrer l'événement). */
export function centroidOf(points: TrackPoint[]): TrackPoint | null {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}
