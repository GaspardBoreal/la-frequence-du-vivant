/**
 * Sonde de couverture des fonds satellite.
 *
 * Un fournisseur qui n'a pas d'imagerie ne renvoie pas toujours une erreur :
 * Esri sert une tuile valide (HTTP 200) portant la pancarte « Map data not yet
 * available ». On ne peut donc pas se fier à `tileerror`. On mesure ici la
 * couverture réelle :
 *  - Esri expose un inventaire officiel (`/tilemap/{z}/{y}/{x}/1/1`) ;
 *  - l'IGN est sondé par une requête de tuile réelle (404 / tuile vide).
 */

export type ProbeSource = 'esri' | 'ign';

const ESRI_TILEMAP =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tilemap';

const IGN_TILE =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

/** Cache mémoire : clé `source:z:x:y` → tuile réellement disponible ? */
const cache = new Map<string, boolean>();
/** Requêtes en vol, dédupliquées. */
const inflight = new Map<string, Promise<boolean>>();

export const lngLatToTile = (lat: number, lng: number, z: number) => {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
};

const probeEsri = async (z: number, x: number, y: number): Promise<boolean> => {
  try {
    const res = await fetch(`${ESRI_TILEMAP}/${z}/${y}/${x}/1/1`, { cache: 'force-cache' });
    if (!res.ok) return false;
    const json = await res.json();
    if (Array.isArray(json?.data)) return json.data[0] === 1;
    // Réponse « valid: false » ou format inattendu : on considère non couvert.
    return json?.valid !== false;
  } catch {
    // Réseau indisponible : ne pas dégrader inutilement.
    return true;
  }
};

const probeIgn = async (z: number, x: number, y: number): Promise<boolean> => {
  try {
    const url = IGN_TILE.replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y));
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    if (type.includes('xml')) return false; // ExceptionReport WMTS
    const blob = await res.blob();
    // Une tuile « vide » IGN pèse quelques centaines d'octets.
    return blob.size > 1200;
  } catch {
    return true;
  }
};

const probeOne = (source: ProbeSource, z: number, x: number, y: number) => {
  const key = `${source}:${z}:${x}:${y}`;
  const hit = cache.get(key);
  if (hit !== undefined) return Promise.resolve(hit);
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = (source === 'esri' ? probeEsri(z, x, y) : probeIgn(z, x, y)).then((ok) => {
    cache.set(key, ok);
    inflight.delete(key);
    return ok;
  });
  inflight.set(key, p);
  return p;
};

/**
 * Premier niveau de zoom réellement couvert au point donné, en descendant
 * depuis `fromZoom` (borné par `floorZoom`).
 */
export const probeNativeZoom = async (
  source: ProbeSource,
  lat: number,
  lng: number,
  fromZoom: number,
  floorZoom = 15,
): Promise<number> => {
  for (let z = Math.min(fromZoom, 23); z >= floorZoom; z--) {
    const { x, y } = lngLatToTile(lat, lng, z);
    // eslint-disable-next-line no-await-in-loop
    const ok = await probeOne(source, z, x, y);
    if (ok) return z;
  }
  return floorZoom;
};
